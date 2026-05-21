import { EventManager, type EventMap } from '../src/EventManager';

interface Actions extends EventMap {
    a: () => void
    b: () => Promise<void>
    c: () => void
    d: () => number
    e: () => Promise<number | void>
}

async function delay(ms: number): Promise<void> {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

describe('EventManager call order', () => {
    it('async events', async () => {
        const execOrder: number[] = [];
        const events = new EventManager<Actions>();
        
        events.on('b', async () => {
            execOrder.push(1);
        });
        
        events.on('b', async () => {
            await delay(100);
            execOrder.push(2);
        })
        .on('b', async () => {
            await delay(0);
            execOrder.push(3);
        });
        
        events.on('b', async () => {
            await delay(50);
            execOrder.push(4);
        });
        
        events.on('b', async () => {
            execOrder.push(5);
        });
        
        await events.emit('b');
        
        expect(execOrder).toEqual([ 1, 2, 3, 4, 5 ]);
    });
    
    it('sync events', () => {
        const execOrder: number[] = [];
        const events = new EventManager<Actions>();
        
        events.on('a', () => {
            execOrder.push(1);
        });
        
        events.on('a', () => {
            execOrder.push(2);
        });
        
        events.emit('a');
        
        expect(execOrder).toEqual([ 1, 2 ]);
    });
});

describe('EventManager return type', () => {
    it('sync', () => {
        const events = new EventManager<Actions>();
        
        events.on('d', () => 1);
        events.on('d', () => 2);
        
        expect(events.emit('d')).toBe(1);
    });
    
    it('async', async () => {
        const events = new EventManager<Actions>();
        
        events.on('e', async () => await delay(10));
        events.on('e', async () => 2);
        events.on('e', async () => 3);
        
        await expect(events.emit('e')).resolves.toBe(2);
    });
    
    it('once sync', () => {
        const events = new EventManager<Actions>();
        
        events.once('d', () => 1);
        events.once('d', () => 2);
        
        expect(events.emit('d')).toBe(1);
        expect(events.emit('d')).toBe(2);
    });
    
    it('dispose', async () => {
        const events = new EventManager<Actions>();
        
        events.on('e', async () => await delay(10));
        const dispose = events.on('e', async () => 2);
        events.on('e', async () => 3);
        
        dispose();
        
        await expect(events.emit('e')).resolves.toBe(3);
    });
});

describe('EventManager disposing', () => {
    it('dispose all', () => {
        const events = new EventManager<Actions>();
        
        events.on('e', async () => await delay(10))();
        events.on('e', async () => 3)();
        
        expect(events.emit('e')).toBe(undefined);
    });
    
    it('mix dispose', () => {
        const events = new EventManager<Actions>();
        
        const dispose = events
            .on('e', async () => await delay(10))
            .on('e', async () => 3);
        
        dispose();
        
        expect(events.emit('e')).toBe(undefined);
    });
    
    it('nothing', () => {
        const events = new EventManager<Actions>();
        
        expect(events.emit('e')).toBe(undefined);
    });
    
    it('nothing off', () => {
        const events = new EventManager<Actions>();
        
        events.off('e', async () => await delay(10));
        
        expect(events.emit('e')).toBe(undefined);
    });
    
    it('off', () => {
        const events = new EventManager<Actions>();
        
        events.on('e', async () => await delay(10))();
        events.off('e', async () => await delay(10));
        
        expect(events.emit('e')).toBe(undefined);
    });
});
