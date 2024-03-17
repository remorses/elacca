# elacca

## 0.5.1

### Patch Changes

-   Added missing dep dedent

## 0.5.0

### Minor Changes

-   Use useSyncExternalStore to track if isClient or isServer

## 0.4.1

### Patch Changes

-   Support multiple loaders, chain plugins

## 0.4.0

### Minor Changes

-   Added support for --turbo, requires latest next canary

## 0.3.4

### Patch Changes

-   Fix page mutations

## 0.3.3

### Patch Changes

-   Fix runtime error on log

## 0.3.2

### Patch Changes

-   Fix assignments to page, `Page.isLayout = true` now works

## 0.3.1

### Patch Changes

-   Don't run debug plugin if not necessary

## 0.3.0

### Minor Changes

-   Don't process all files, fix bug uing both webpack include and exclude

## 0.2.1

### Patch Changes

-   Stop dead code elimination after 50 iterations

## 0.2.0

### Minor Changes

-   Added elacca-outputs folder in debug mode, removed a log, resolve babel-loader from plugin node_modules

## 0.1.1

### Patch Changes

-   Faster plugin, ignore api dir

## 0.1.0

### Minor Changes

-   Remove dead code in server pass

## 0.0.2

### Patch Changes

-   remove unused functions when in server
-   annotate functions as pure

## 0.0.1

### Patch Changes

-   Initial publish
