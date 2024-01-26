<div align='center'>
    <br/>
    <br/>
    <br/>
    <h3>elacca</h3>
    <p>Improve your Next.js app cold start time and server load</p>
    <br/>
    <br/>
</div>

Reduce your Next.js app server code size by disabling SSR for specific pages.

## Why

-   Improve cold start times in serverless environments
-   Improve rendering times, since the server no longer needs to render the page to html
-   Improve memory usage on the server (your pages no longer load React components code in memory)
-   Makes `edge` Vercel deploy possible if your current bundle size is more than 2Mb compressed
-   When SSR is not very useful, for example when making dashboards, where SEO is not important

## Install

```
npm i -D elacca
```

## Usage

Full application example in the [example-app](./example-app) folder.

```js
// next.config.js
const { withElacca } = require('elacca')

/** @type {import('next').NextConfig} */
const config = {}

const elacca = withElacca({})

const nextConfig = elacca(config) // notice the double invocation

module.exports = nextConfig
```

When using the `pages` directory, you can add a directive to disable SSR for a specific page:

```js
// pages/index.js
'skip ssr'

export default function Home() {
    return <div>hello world</div>
}
```

## How It Works

To have an intuitive understanding of how this works, you can check out how this plugin transforms pages in the [example-app/elacca-outputs](./example-app/elacca-outputs) folder.

-   When a page has a "skip ssr" directive, this plugin will transform the page code so that
-   On the server the page renders a component that returns `null`
-   On the client the page renders null until the component mounts, removing the need to hydrate the page
-   This is implemented as a babel plugin that only runs on pages files, so your build should remain fast (all other files are not parsed by babel, usually the code inside the pages folder is not much)

## Why The Name

From the [Dune wiki](https://dune.fandom.com/wiki/Elacca_drug):

> The Elacca drug is a narcotic that was formed by the burning of Elacca Wood of the planet Ecaz. Its main characteristic when administered was that it would eliminate the user's will for self-preservation
