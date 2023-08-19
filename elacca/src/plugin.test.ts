// https://github.com/umijs/umi/blob/3.x/packages/babel-plugin-no-anonymous-default-export/src/index.test.ts
import { transform } from '@babel/core'
import { format } from 'prettier'
import synchronizedPrettier from '@prettier/sync'

import { test, expect } from 'vitest'
import dedent from 'dedent'

function runPlugin(
    code: string,
    opts?: { cwd: string; plugins?: any[]; filename: string },
) {
    const client = transform(dedent`${code}`, {
        babelrc: false,
        sourceType: 'module',
        plugins: [
            require.resolve('@babel/plugin-syntax-jsx'),
            [
                require.resolve('../dist/babelTransformPages'),
                {
                    isServer: false,
                },
            ],
        ],
        ...opts,
    })?.code
    const server = transform(dedent`${code}`, {
        babelrc: false,
        sourceType: 'module',
        plugins: [
            require.resolve('@babel/plugin-syntax-jsx'),
            [
                require.resolve('../dist/babelTransformPages'),
                {
                    isServer: true,
                },
            ],
        ],
        ...opts,
    })?.code

    return [server, client].map((x) =>
        synchronizedPrettier.format(x || '', { parser: 'acorn' }),
    )
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
        ),
    ).toMatchInlineSnapshot(`
      [
        "\\"skip ssr\\";

      function DefaultExportRenamedByElacca() {
        return null;
      }
      export default DefaultExportRenamedByElacca;
      ",
        "\\"skip ssr\\";

      import _default from \\"react\\";
      const SrcPagesId = () => {
        return <p>Hello</p>;
      };
      function DefaultExportRenamedByElacca(props) {
        const [isMounted, setIsMounted] = _default.useState(false);
        _default.useEffect(() => {
          setIsMounted(true);
        }, []);
        return isMounted ? _default.createElement(SrcPagesId, props) : null;
      }
      export default DefaultExportRenamedByElacca;
      ",
      ]
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
        ),
    ).toMatchInlineSnapshot(`
      [
        "\\"skip ssr\\";

      import React from \\"react\\";
      function DefaultExportRenamedByElacca() {
        return null;
      }
      export default DefaultExportRenamedByElacca;
      ",
        "\\"skip ssr\\";

      import _default from \\"react\\";
      import React from \\"react\\";
      const SrcPagesId = () => {
        return <p>Hello</p>;
      };
      function DefaultExportRenamedByElacca(props) {
        const [isMounted, setIsMounted] = _default.useState(false);
        _default.useEffect(() => {
          setIsMounted(true);
        }, []);
        return isMounted ? _default.createElement(SrcPagesId, props) : null;
      }
      export default DefaultExportRenamedByElacca;
      ",
      ]
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
        ),
    ).toMatchInlineSnapshot(`
      [
        "\\"skip ssr\\";

      function DefaultExportRenamedByElacca() {
        return null;
      }
      export default DefaultExportRenamedByElacca;
      ",
        "\\"skip ssr\\";

      import _default from \\"react\\";
      function SrcPagesId() {
        return <p>Hello</p>;
      }
      function DefaultExportRenamedByElacca(props) {
        const [isMounted, setIsMounted] = _default.useState(false);
        _default.useEffect(() => {
          setIsMounted(true);
        }, []);
        return isMounted ? _default.createElement(SrcPagesId, props) : null;
      }
      export default DefaultExportRenamedByElacca;
      ",
      ]
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
        ),
    ).toMatchInlineSnapshot(`
      [
        "\\"skip ssr\\";

      function DefaultExportRenamedByElacca() {
        return null;
      }
      export default DefaultExportRenamedByElacca;
      ",
        "\\"skip ssr\\";

      import _default from \\"react\\";
      function SrcPagesId() {
        return <p>Hello</p>;
      }
      function DefaultExportRenamedByElacca(props) {
        const [isMounted, setIsMounted] = _default.useState(false);
        _default.useEffect(() => {
          setIsMounted(true);
        }, []);
        return isMounted ? _default.createElement(SrcPagesId, props) : null;
      }
      export default DefaultExportRenamedByElacca;
      ",
      ]
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
        ),
    ).toMatchInlineSnapshot(`
      [
        "\\"skip ssr\\";

      function DefaultExportRenamedByElacca() {
        return null;
      }
      export default DefaultExportRenamedByElacca;
      ",
        "\\"skip ssr\\";

      import _default from \\"react\\";
      function SrcPagesId() {
        return <p>Hello</p>;
      }
      function DefaultExportRenamedByElacca(props) {
        const [isMounted, setIsMounted] = _default.useState(false);
        _default.useEffect(() => {
          setIsMounted(true);
        }, []);
        return isMounted ? _default.createElement(SrcPagesId, props) : null;
      }
      export default DefaultExportRenamedByElacca;
      ",
      ]
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
        ),
    ).toMatchInlineSnapshot(`
      [
        "\\"skip ssr\\";

      export class Page extends React.Component {}
      ",
        "\\"skip ssr\\";

      export class Page extends React.Component {}
      ",
      ]
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
        ),
    ).toMatchInlineSnapshot(`
      [
        "\\"skip ssr\\";

      class Page extends React.Component {}
      function DefaultExportRenamedByElacca() {
        return null;
      }
      export default DefaultExportRenamedByElacca;
      ",
        "\\"skip ssr\\";

      import _default from \\"react\\";
      class Page extends React.Component {}
      function DefaultExportRenamedByElacca(props) {
        const [isMounted, setIsMounted] = _default.useState(false);
        _default.useEffect(() => {
          setIsMounted(true);
        }, []);
        return isMounted ? _default.createElement(Page, props) : null;
      }
      export default DefaultExportRenamedByElacca;
      ",
      ]
    `)
})
