

# µDOM



<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table of Contents**  *generated with [DocToc](https://github.com/thlorenz/doctoc)*

- [What it Is](#what-it-is)
- [Installation](#installation)
- [API](#api)
  - [DOM](#dom)
  - [TEXT](#text)
  - [KB](#kb)
- [How to Use It](#how-to-use-it)
- [To Do](#to-do)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->


## What it Is

utilities to handle DOM-related tasks

## Installation

```bash
npm install -g mudom
browserify -r mudom -o app/static/browserified/mudom.js
```

## API

### DOM
### TEXT
### KB

Demo on https://loveencounterflow.github.io/hengist/dev/mudom/static/index.html

## How to Use It

* runs in the browser using [`browserify`](https://github.com/browserify/browserify)

## To Do

* [ ] absorb `µ.keyboard-modifier-emitter.js` (svelte app2)
* [ ] absorb `src/components/Toolbox/index.svelte#µ_DOM_detect_doublekey_events()`
* [ ] documentation
* [ ] offer browserified builds
* [ ] allow lists of elements with event binding
* [ ] include things like `computedStyleMap()`, `attributeStyleMap`, `computedStyleMap()` from CSS Houdini
  * https://www.smashingmagazine.com/2020/03/practical-overview-css-houdini/
  * https://web.dev/houdini-how/?utm_campaign=CSS%2BLayout%2BNews&utm_medium=web&utm_source=CSS_Layout_News_281
  * https://web.dev/css-props-and-vals/
  * https://houdini.how/
* [ ] allow to instantiate with virtual DOM object so µDOM can be used outside the browser




