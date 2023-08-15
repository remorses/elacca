// https://github.com/umijs/umi/blob/3.x/packages/babel-plugin-no-anonymous-default-export/src/index.test.ts
import { transform } from '@babel/core'

import { test, expect } from 'vitest'
import dedent from 'dedent'

function runPlugin(
    code: string,
    opts?: { cwd: string; plugins?: any[]; filename: string },
) {
    const res = transform(dedent`${code}`, {
        babelrc: false,
        sourceType: 'module',
        presets: [],
        plugins: [
            require.resolve('@babel/plugin-syntax-jsx'),
            [
                require.resolve('../dist/babelTransformPages'),
                {
                    testing: true, //
                    isServer: false,
                },
            ],
        ],
        ...opts,
    })

    if (!res) {
        throw new Error('plugin failed')
    }

    return res
}

test('normal arrow function, export default later', () => {
    const opts = {
        cwd: '/a/b/c',
        filename: '/pages/index.tsx',
    }
    expect(
        runPlugin(
            `
            "skip ssr"
            const SrcPagesId = () => {
                return <p>Hello</p>;
            };
            export default SrcPagesId;
  `,
            opts,
        ).code,
    ).toMatchInlineSnapshot(`
      "\\"skip ssr\\";

      import _default from \\"react\\";
      const SrcPagesId = () => {
        return <p>Hello</p>;
      };
      function DefaultExportRenamedByElacca() {
        const [isMounted, setIsMounted] = _default.useState(false);
        _default.useEffect(() => {
          setIsMounted(true);
        }, []);
        return isMounted ? _default.createElement(SrcPagesId) : null;
      }
      export default DefaultExportRenamedByElacca;"
    `)
})

test('normal arrow function, already imports react', () => {
    const opts = {
        cwd: '/a/b/c',
        filename: '/pages/index.tsx',
    }
    expect(
        runPlugin(
            `
        "skip ssr"
        import React from 'react'
        const SrcPagesId = () => {
            return <p>Hello</p>;
        };
        export default SrcPagesId;
  `,
            opts,
        ).code,
    ).toMatchInlineSnapshot(`
      "\\"skip ssr\\";

      import _default from \\"react\\";
      import React from 'react';
      const SrcPagesId = () => {
        return <p>Hello</p>;
      };
      function DefaultExportRenamedByElacca() {
        const [isMounted, setIsMounted] = _default.useState(false);
        _default.useEffect(() => {
          setIsMounted(true);
        }, []);
        return isMounted ? _default.createElement(SrcPagesId) : null;
      }
      export default DefaultExportRenamedByElacca;"
    `)
})
test('function declaration, export later', () => {
    const opts = {
        cwd: '/a/b/c',
        filename: '/pages/index.tsx',
    }
    expect(
        runPlugin(
            `
            "skip ssr"
            function SrcPagesId() {
                return <p>Hello</p>;
            };
            export default SrcPagesId;
  `,
            opts,
        ).code,
    ).toMatchInlineSnapshot(`
      "\\"skip ssr\\";

      import _default from \\"react\\";
      function SrcPagesId() {
        return <p>Hello</p>;
      }
      ;
      function DefaultExportRenamedByElacca() {
        const [isMounted, setIsMounted] = _default.useState(false);
        _default.useEffect(() => {
          setIsMounted(true);
        }, []);
        return isMounted ? _default.createElement(SrcPagesId) : null;
      }
      export default DefaultExportRenamedByElacca;"
    `)
})
test('export default function declaration', () => {
    const opts = {
        cwd: '/a/b/c',
        filename: '/pages/index.tsx',
    }
    expect(
        runPlugin(
            `
            "skip ssr"
            export default function SrcPagesId() {
                return <p>Hello</p>;
            };
  `,
            opts,
        ).code,
    ).toMatchInlineSnapshot(`
      "\\"skip ssr\\";

      import _default from \\"react\\";
      function SrcPagesId() {
        return <p>Hello</p>;
      }
      ;
      function DefaultExportRenamedByElacca() {
        const [isMounted, setIsMounted] = _default.useState(false);
        _default.useEffect(() => {
          setIsMounted(true);
        }, []);
        return isMounted ? _default.createElement(SrcPagesId) : null;
      }
      export default DefaultExportRenamedByElacca;"
    `)
})
test('export named default', () => {
    const opts = {
        cwd: '/a/b/c',
        filename: '/pages/index.tsx',
    }
    expect(
        runPlugin(
            `
            "skip ssr"
            function SrcPagesId() {
                return <p>Hello</p>;
            };
            export { SrcPagesId as default };
  `,
            opts,
        ).code,
    ).toMatchInlineSnapshot(`
      "\\"skip ssr\\";

      import _default from \\"react\\";
      function SrcPagesId() {
        return <p>Hello</p>;
      }
      ;
      function DefaultExportRenamedByElacca() {
        const [isMounted, setIsMounted] = _default.useState(false);
        _default.useEffect(() => {
          setIsMounted(true);
        }, []);
        return isMounted ? _default.createElement(SrcPagesId) : null;
      }
      export default DefaultExportRenamedByElacca;"
    `)
})
test('export named class', () => {
    const opts = {
        cwd: '/a/b/c',
        filename: '/pages/index.tsx',
    }
    expect(
        runPlugin(
            `
            "skip ssr"
            export class Page extends React.Component {
            }
  `,
            opts,
        ).code,
    ).toMatchInlineSnapshot(`
      "\\"skip ssr\\";

      export class Page extends React.Component {}"
    `)
})
test('export class after', () => {
    const opts = {
        cwd: '/a/b/c',
        filename: '/pages/index.tsx',
    }
    expect(
        runPlugin(
            `
            "skip ssr"
            class Page extends React.Component {
            }
            export default Page
  `,
            opts,
        ).code,
    ).toMatchInlineSnapshot(`
      "\\"skip ssr\\";

      import _default from \\"react\\";
      class Page extends React.Component {}
      function DefaultExportRenamedByElacca() {
        const [isMounted, setIsMounted] = _default.useState(false);
        _default.useEffect(() => {
          setIsMounted(true);
        }, []);
        return isMounted ? _default.createElement(Page) : null;
      }
      export default DefaultExportRenamedByElacca;"
    `)
})
