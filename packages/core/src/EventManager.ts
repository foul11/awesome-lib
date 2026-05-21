export type EventMap = {
    [key: string]: (...args: any[]) => any
};

type disposeFn<T extends EventMap> = (() => void) & {
    on: EventManager<T>['on']
};

export class EventManager<T extends EventMap> {
    private events:     { [K in keyof T]?: T[K][] } = {};
    
    on<K extends keyof T>(event: K, callback: T[K]) {
        if (!this.events[event]) {
            this.events[event] = [];
        }
        
        this.events[event].push(callback);
        const dispose = (() => this.off(event, callback)) as disposeFn<T>;
        
        dispose.on = (...args) => {
            const nDispose = this.on(...args);
            const mixDispose = () => {
                dispose();
                nDispose();
            };
            
            mixDispose.on = nDispose.on;
            return mixDispose;
        };

        return dispose;
    }
    
    off<K extends keyof T>(event: K, callback: T[K]) {
        const callbacks = this.events[event];
        if (!callbacks)
            return;
        
        const index = callbacks.indexOf(callback);
        if (index !== -1) {
            callbacks.splice(index, 1);
        }
    }
    
    once<K extends keyof T>(event: K, callback: T[K]) {
        const off = this.on(event, ((...args: unknown[]) => {
            off(); return (callback as any)(...args);
        }) as T[K]);
        
        return off;
    }
    
    #emitWorker<P>(cbs: T[keyof T][], args: P[]): any {
        const cb = cbs.pop();
        
        if (!cb)
            return undefined;
        
        const retVal = cb(...args);
        
        if (retVal instanceof Promise) {
            return retVal.then(val => (
                val !== undefined
                    ? val
                    : this.#emitWorker(cbs, args)
            ));
        }
        
        return (
            retVal !== undefined
                ? retVal
                : this.#emitWorker(cbs, args)
        );
    }
    
    emit<K extends keyof T>(
        event: K,
        ...args: Parameters<T[K]>
    ): ReturnType<T[K]> | void {
        if (!this.events[event])
            return;
        
        return this.#emitWorker(
            this.events[event]
                .toReversed(),
            args,
        );
    }
}