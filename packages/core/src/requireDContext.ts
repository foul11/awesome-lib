import fs from 'fs';
import path from 'path';

function isRegExp(regExp: RegExp) {
    return Object.prototype.toString.call(regExp) === '[object RegExp]';
}

function isString(str: string) {
    return typeof str === 'string';
}

class RequireContext {
    directory: string;
    useSubdirectories: boolean;
    regExp: RegExp;
    modules: string[];
    
    constructor(directory: string, useSubdirectories: boolean, regExp: RegExp) {
        this.useSubdirectories = useSubdirectories;
        this.directory = this.__findDirectory(directory);
        this.regExp = regExp;
        this.modules = [];
        
        this.__findModules(this.directory);
    }
    
    __findDirectory(directory: string) {
        if (path.isAbsolute(directory)) {
            return directory;
        }
        
        return path.normalize(path.join(process.cwd(), directory));
    }
    
    __findModules(directory: string) {
        if (fs.existsSync(directory)) {
            fs.readdirSync(directory).forEach((file) => {
                if (file == '.' || file == '..') {
                    return;
                }
                
                const modulePath = path.join(directory, file);
                const moduleId = `./${path.relative(this.directory, modulePath)}`;
                
                if (fs.statSync(modulePath).isDirectory() && this.useSubdirectories) {
                    this.__findModules(modulePath);
                    return;
                }
                
                if (this.regExp && !this.regExp.test(moduleId)) {
                    return;
                }
                
                this.modules.push(moduleId);
            });
        } else throw new Error(`Can't Found Module ${directory}`);
    }
}

export async function requireDContext(directory = '.', useSubdirectories = false, regExp = /(?:)/) {
    if (!isString(directory))
        throw new Error('Argument [directory] must be String');
    
    if (!isRegExp(regExp))
        throw new Error('Argument [regExp] must be RegExp');
    
    const require_ctx = new RequireContext(directory, useSubdirectories, regExp);
    const require_ = (await import('module')).createRequire(require_ctx.directory);
    const ModuleRequire = (moduleId: string) => require_(moduleId);
    ModuleRequire.keys = () => [ ...require_ctx.modules ];
    
    return ModuleRequire;
}