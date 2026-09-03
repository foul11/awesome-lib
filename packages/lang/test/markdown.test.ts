/*
Disabled because jest run error:

    FAIL  test/markdown.test.ts
    ● Test suite failed to run
    
        Jest encountered an unexpected token
    
        Jest failed to parse a file. This happens e.g. when your code or its dependencies use non-standard JavaScript syntax, or when Jest is not configured to support such syntax.
    
        Out of the box Jest supports Babel, which will be used to transform your files into valid JS based on your Babel configuration.
    
        By default "node_modules" folder is ignored by transformers.
    
        Here's what you can do:
        • If you are trying to use ECMAScript Modules, see https://jestjs.io/docs/ecmascript-modules for how to enable it.
        • If you are trying to use TypeScript, see https://jestjs.io/docs/getting-started#using-typescript
        • To have some of your "node_modules" files transformed, you can specify a custom "transformIgnorePatterns" in your config.
        • If you need a custom transformation, specify a "transform" option in your config.
        • If you simply want to mock your non-JS modules (e.g. binary assets) you can stub them out with the "moduleNameMapper" config option.
    
        You'll find more details and examples of these config options in the docs:
        https://jestjs.io/docs/configuration
        For information about custom transformations, see:
        https://jestjs.io/docs/code-transformation
    
        Details:
    
        /mnt/medusa/awesome-lib/node_modules/.pnpm/mdast-util-gfm-strikethrough@2.0.0/node_modules/mdast-util-gfm-strikethrough/index.js:2
        export {
        ^^^^^^
    
        SyntaxError: Unexpected token 'export'
    
        > 1 | import { gfmStrikethroughFromMarkdown } from 'mdast-util-gfm-strikethrough';
            | ^
        2 | import { gfmStrikethrough } from 'micromark-extension-gfm-strikethrough';
        3 | import { spoilerSyntax } from 'micromark-extension-inline-spoiler';
        4 | import { spoilerFromMarkdown } from 'mdast-util-inline-spoiler';
    
        at Runtime.createScriptFromCode (../../node_modules/.pnpm/jest-runtime@30.3.0/node_modules/jest-runtime/build/index.js:1314:40)
        at Object.<anonymous> (src/utils.ts:1:1)
        at Object.<anonymous> (test/markdown.test.ts:1:1)
    
    Test Suites: 1 failed, 1 total
    Tests:       0 total
    Snapshots:   0 total
    Time:        1.95 s
*/

// import { md } from '../src/utils';

// describe('Markdown', () => {
//     it('md_transform: inlineCode', () => {
//         const text = md`
//             ${'`'}test${'`'}
//         `;
        
//         expect(text).toEqual('`test`');
//     });
// });