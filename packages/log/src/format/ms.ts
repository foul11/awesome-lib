import winston from 'winston';
import prettyMs from 'pretty-ms';

// переписал winston.format.ms из-за бага в веб версии
function new_ms() {
    let diff = 0;
    let prevTime = 0;
    
    return winston.format<undefined>((info) => {
        const curr = Date.now();
        
        diff = curr - (prevTime || curr);
        prevTime = curr;
        info.ms = `+${prettyMs(diff)}`;
        
        return info;
    });
}

const f_ms = new_ms();
export default f_ms;