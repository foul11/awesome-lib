/* eslint-disable @typescript-eslint/ban-ts-comment, prefer-rest-params */
// @ts-nocheck

import { IncomingMessage, ServerResponse } from 'http';

import { createHash } from 'crypto';
import fresh from 'fresh';

const NULL = Buffer.alloc(1);
NULL.writeUInt8(0x0, 0);

export default function () {
    // A data structure that holds runtime calculated content hashes.
    // Example:
    // {
    //   '/path/to/resource/with/vary/headers': {
    //     vary: [ 'Accept-Encoding', 'Accept-Language' ],
    //     md5s: {
    //       <binary hash of variable header values>: <md5 of content>,
    //       <another binary hash of variable header values>: <another md5 of content>
    //     }
    //   },
    //   '/path/to/resource/without/vary/headers': {
    //     md5: <md5 of content>
    //   }
    // }
    const etags = {};
    
    // given a request, and a set of vary headers, generate a hash representing
    // the headers.
    function hashVaryHeaders(vary, req) {
        const hash = createHash('md5');
        
        vary.forEach(function (header) {
            hash.update(req.headers[header] !== undefined ? req.headers[header] : NULL);
            hash.update(NULL);
        });
        
        return hash.digest(); // yes sir, we are using binary keys.
    }
    
    // given a request, see if we have an etag for it
    function getETag(r) {
        let etag;
        
        if (Object.prototype.hasOwnProperty.call(etags, r.path)) {
            if (etags[r.path].vary) {
                const hash = hashVaryHeaders(etags[r.path].vary, r);
                etag = etags[r.path].md5s[hash];
            } else {
                etag = etags[r.path].md5;
            }
        }
        
        return etag;
    }
    
    function isFresh(req, res) {
        return fresh(req.headers, {
            etag: res.getHeader('ETag'),
            'last-modified': res.getHeader('Last-Modified'),
        });
    }
    
    return function (/** @type {IncomingMessage} */ req, /** @type {ServerResponse} */ res, next) {
        res.etagify = function () {
            // if there's an ETag already on the response, do nothing
            if (res.getHeader('ETag'))
                return;
            
            // otherwise, eavesdrop on the outbound response and generate a
            // content-based hash.
            const buff = [];
            const hash = createHash('md5');
            
            const write = res.write;
            res.write = function (chunk) {
                hash.update(chunk);
                buff.push(chunk);
                // write.call(res, chunk);
            };
            
            const end = res.end;
            res.end = function (body) {
                if (body)
                    hash.update(body);
                
                const actual_hash = hash.digest('hex');
                const vary = res.getHeader('vary');
                if (vary) {
                    if (!etags[req.path]) {
                        etags[req.path] = {
                            vary: vary.split(',').map(function (x) { return x.trim().toLowerCase(); }),
                            md5s: {},
                        };
                    }
                    const headers_hash = hashVaryHeaders(etags[req.path].vary, req);
                    etags[req.path].md5s[headers_hash] = actual_hash;
                } else {
                    etags[req.path] = { md5: actual_hash };
                }
                
                const etag = getETag(req);
                
                if (etag) {
                    res.setHeader('ETag', '"' + etag + '"');
                    
                    if (/^GET$/i.test(req.method) && isFresh(req, res)) {
                        res.removeHeader('ETag');
                        res.statusCode = 304;
                        return end.apply(res, arguments);
                    }
                }
                
                for (const chunk of buff) {
                    write.call(res, chunk);
                }
                
                return end.apply(res, arguments);
            };
        };
        
        next();
    };
}