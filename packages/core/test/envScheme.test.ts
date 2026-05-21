import z from 'zod';
import { envSchema } from '../src/envSchema';

describe('if empty string then return null', () => {
    it('object fail', () => {
        const schema = envSchema({
            foo: z.string(),
            bar: z.string(),
        });
        
        expect(() => (
            schema.parse({
                foo: '',
                bar: 'bar',
            })
        )).toThrow('Invalid input: Expected string, received null or empty string');
    });
    
    it('object as type fail', () => {
        const schema = envSchema(z.object({
            foo: z.string(),
            bar: z.string(),
        }));
        
        expect(() => (
            schema.parse({
                foo: '',
                bar: 'bar',
            })
        )).toThrow('Invalid input: Expected string, received null or empty string');
    });
    
    it('object one field as nullable: success', () => {
        const schema = envSchema({
            foo: z.string().nullable(),
            bar: z.string(),
        });
        
        expect(
            schema.parse({
                foo: '',
                bar: 'bar',
            })
        ).toEqual({
            foo: null,
            bar: 'bar',
        });
    });
});