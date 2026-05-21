import winston from 'winston';

type TransformableInfo = winston.Logform.TransformableInfo;

interface FLabelsOptions {
    label?: string
}

export const labels = Array.from({ length: 6 }, (_, i) => `label${i || ''}`);
export const combine_label = (p: TransformableInfo) => labels.map(l => p[l]).filter(Boolean).join(':');

const f_labels = winston.format<FLabelsOptions>((info, opts) => {
    if (info?.label === undefined) {
        info.label = opts?.label;
    }
    
    if (info._label) {
        return info;
    }
    
    info._label = info.label;
    info.label = combine_label(info);
    
    return info;
});

export default f_labels;