<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table of Contents**  *generated with [DocToc](https://github.com/thlorenz/doctoc)*

- [`µ.LINE`: Distribute Lines across HTML IFrames](#%C2%B5line-distribute-lines-across-html-iframes)
  - [How it Works and What it Does](#how-it-works-and-what-it-does)
  - [`µ.LINE.Finder`](#%C2%B5linefinder)
    - [Configuration](#configuration)
  - [`µ.LINE.Distributor`](#%C2%B5linedistributor)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->



# `µ.LINE`: Distribute Lines across HTML IFrames

## How it Works and What it Does



## `µ.LINE.Finder`

### Configuration

* **`linemarker_tagname`** (`'pl-linemarker'`): Which HTML tag name to use when drawing a rectangle for each
  line of text. These are normally transparent (hence invisible) but can be made visible for debugging.

* **`linecover_tagname`** (`'pl-linecover'`): Which HTML tag name to use for the rectangles that are used to
  cover the first line of text in an `iframe` that is only partially visible. This will normally be without
  outline and opaque white to 'erase' the line in question, but can be made visible for debugging.

* **`debug_class_name`** (`'debug'`): Which CSS class name to use on the `body` element for debugging.

* **`line_step_factor`** (`1 / 2 `): The relative minimum height to recognize a line step. When iterating
  over single characters in the text, the distance `d = cy - ay` from the bottom of the character `cy` and
  the average bottom of the line rectangle `ay` is compared with the average character height `ch`; if
  distance `d` is found to exceed the product `ch * line_step_factor`, then it is assumed the current
  character is the first one of the next line.

* **`inject_stylesheet_after`** (`null`), **`inject_stylesheet_before`** (`null`): A prebuilt stylesheet can
  be injected into the current document. Since relative order of stylesheets is essential, two convenient
  methods are provided that accept either a CSS selector or a DOM element to determine the insertion point.
  For example, if you have a linked CSS-Reset stylesheet, you typically want to have that to be the first
  stylesheet with all the defaults; it would then be appropriate to call `finder.inject_stylesheet_after
  'link[href$="reset.css"]'` with the default styles for the `pl-linemarker` and `pl-linecover` elements.
  *Note* that the selector can match one or more elements; only the first match will be considered.

The CSS rules defined in the injected stylesheet are:

```css
/* for normal look: */
${linemarker_tagname} { ... }
${linecover_tagname} { ... }

/* for debugging: */
.${debug_class_name} iframe { ... }
.${debug_class_name} ${linemarker_tagname} { ... }
.${debug_class_name} ${linecover_tagname} { ... }
```

The debug button has these style selectors:

```css
button#${debug_button_id} { ... }
@media print { button#${debug_button_id} { ... } }
```



## `µ.LINE.Distributor`




