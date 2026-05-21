// https://stackoverflow.com/a/42019773
/* eslint-disable @typescript-eslint/ban-ts-comment, prefer-spread */
// @ts-nocheck

import fs from 'node:fs';
import net from 'node:net';
import http from 'node:http';
import https from 'node:https';
import selfsigned from 'selfsigned';

function selfcert() {
    const attributes = [{ name: 'commonName', value: 'localhost' }];
    
    return selfsigned.generate(attributes, {
        algorithm: 'sha256',
        days: 30,
        keySize: 2048,
        extensions: [{
            name: 'basicConstraints',
            cA: true,
        }, {
            name: 'keyUsage',
            keyCertSign: true,
            digitalSignature: true,
            nonRepudiation: true,
            keyEncipherment: true,
            dataEncipherment: true,
        }, {
            name: 'extKeyUsage',
            serverAuth: true,
            clientAuth: true,
            codeSigning: true,
            timeStamping: true,
        }, {
            name: 'subjectAltName',
            altNames: [{
                // type 2 is DNS
                type: 2,
                value: 'localhost',
            }, {
                type: 2,
                value: 'localhost.localdomain',
            }, {
                type: 2,
                value: '[::1]',
            }, {
                // type 7 is IP
                type: 7,
                ip: '127.0.0.1',
            }, {
                type: 7,
                ip: 'fe80::1',
            }],
        }],
    });
}

/**
 * @param {https.ServerOptions<typeof http.IncomingMessage, typeof http.ServerResponse>} opts
 * @param {http.RequestListener<typeof http.IncomingMessage, typeof http.ServerResponse> | undefined} handler
 */
export default function (opts, handler) {
    /** @type {net.Server & { http?: http.Server, https?: https.Server }} */
    const server = net.createServer((socket) => {
        socket.once('data', (buffer) => {
            // Pause the socket
            socket.pause();
            
            // Determine if this is an HTTP(s) request
            const byte = buffer[0];
            
            /** @type {'http' | 'https'} */
            let protocol = 'http';
            if (byte === 22) {
                protocol = 'https';
            // eslint-disable-next-line yoda
            } else if (32 < byte && byte < 127) {
                protocol = 'http';
            }
            
            const proxy = server[protocol];
            if (proxy) {
                // Push the buffer back onto the front of the data stream
                socket.unshift(buffer);
                
                // Emit the socket to the HTTP(s) server
                proxy.emit('connection', socket);
            }
            
            // As of NodeJS 10.x the socket must be 
            // resumed asynchronously or the socket
            // connection hangs, potentially crashing
            // the process. Prior to NodeJS 10.x
            // the socket may be resumed synchronously.
            process.nextTick(() => socket.resume());
        });
    });
    
    if (!opts.key || !opts.cert) {
        const dirs = [
            [ '/root/cert_arturka_net/fullchain.pem', '/root/cert_arturka_net/privkey.pem' ],
        ];
        
        for (const [ cert, key ] of dirs) {
            if (fs.existsSync(cert) && fs.existsSync(key)) {
                opts.key = fs.readFileSync(key);
                opts.cert = fs.readFileSync(cert);
                break;
            }
        }
    }
    
    if (!opts.key || !opts.cert) {
        const { private: key, cert } = selfcert();
        
        opts.key = key;
        opts.cert = cert;
    }
    
    server.http = http.createServer(handler);
    server.https = https.createServer(opts, handler);
    
    const excludeProps = new Set([
        'http',
        'https',
        'then',
        'listen',
        'close',
        'address',
        'getConnections',
        'listening',
    ]);
    
    return new Proxy(server, {
        get(target, prop) {
            if (excludeProps.has(prop)) {
                return typeof target[prop] == 'function'
                    ? target[prop].bind(target)
                    : target[prop];
            }
            
            if (typeof target.http[prop] == 'function') {
                return (...args) => {
                    target.http [prop].apply(target.http,  args);
                    target.https[prop].apply(target.https, args);
                    
                    return this;
                };
            }
            
            return target.http[prop];
        },
        
        set(target, prop, value) {
            if (excludeProps.has(prop)) {
                target[prop] = value;
                
                return true;
            }
            
            target.http [prop] = value;
            target.https[prop] = value;
            
            return true;
        },
    });
}