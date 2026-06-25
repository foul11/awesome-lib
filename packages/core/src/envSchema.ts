import { z } from 'zod';

export function envSchema<
    T extends z.ZodTypeAny | z.core.$ZodLooseShape,
>(schema: T): T extends z.core.$ZodLooseShape ? z.ZodObject<z.util.Writeable<T>, z.core.$strip> : T {
    if (schema instanceof z.ZodType) {
        return z.preprocess(
            v => (v === '' ? undefined : v),
            (() => {
                switch (true) {
                    case schema instanceof z.ZodString:
                        return z.string({ error: iss => `Invalid input: Expected ${iss.expected}, received ${iss.input} or empty string` });
                    
                    case schema instanceof z.ZodURL:
                    case schema instanceof z.ZodDefault:
                    case schema instanceof z.ZodNumber:
                    case schema instanceof z.ZodBoolean:
                    case schema instanceof z.ZodDate:
                        return schema;
                    
                    case schema instanceof z.ZodNullable:
                        return z.nullable(envSchema(schema.unwrap() as any));
                    
                    case schema instanceof z.ZodOptional:
                        return z.optional(envSchema(schema.unwrap() as any));
                    
                    case schema instanceof z.ZodObject: {
                        const shape = schema.shape;
                        const newShape = Object.fromEntries(
                            Object.entries(shape).map(([ k, v ]) => [ k, envSchema(v) ])
                        );
                        
                        return z.object(newShape);
                    }
                    
                    case schema instanceof z.ZodArray:
                        return z.array(envSchema(schema.unwrap() as any));
                    
                    case schema instanceof z.ZodUnion:
                        return z.union(schema.options.map(opt => envSchema(opt as any)));
                        
                    default:
                        throw new Error(`Unknown type ${schema}`);
                }
            })(),
        ) as any;
    }
    
    return envSchema(z.object(schema)) as any;
}