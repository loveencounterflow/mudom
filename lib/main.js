(function() {
  'use strict';
  var Dom, INTERTEXT, Text, debug, isa, loupe, misfit, validate;

  loupe = require('../loupe.js');

  misfit = Symbol('misfit');

  debug = console.debug;

  ({isa, validate} = require('./types'));

  //-----------------------------------------------------------------------------------------------------------
  INTERTEXT = {
    camelize: function(text) {
      /* thx to https://github.com/lodash/lodash/blob/master/camelCase.js */
      var i, idx, ref, word, words;
      words = text.split('-');
      for (idx = i = 1, ref = words.length; i < ref; idx = i += +1) {
        word = words[idx];
        if (word === '') {
          continue;
        }
        words[idx] = word[0].toUpperCase() + word.slice(1);
      }
      return words.join('');
    }
  };

  //===========================================================================================================

  //-----------------------------------------------------------------------------------------------------------
  Text = class Text {
    //---------------------------------------------------------------------------------------------------------
    rpr(x) {
      return loupe.inspect(x);
    }

    _pen1(x) {
      if (isa.text(x)) {
        return x;
      } else {
        return this.rpr(x);
      }
    }

    pen(...P) {
      return (P.map((x) => {
        return this._pen1(x);
      })).join(' ');
    }

    pen_escape(...P) {
      return (P.map((x) => {
        return this._pen_escape1(x);
      })).join(' ');
    }

    log(...P) {
      return console.log(this.pen(...P));
    }

    //---------------------------------------------------------------------------------------------------------
    _pen_escape1(x) {
      if (isa.text(x)) {
        return this._escape(x);
      }
      if (isa.element(x)) {
        return this._escape(x.outerHTML);
      }
      return this.rpr(x);
    }

    //---------------------------------------------------------------------------------------------------------
    _escape(x) {
      return x.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

  };

  Dom = (function() {
    //===========================================================================================================

    //-----------------------------------------------------------------------------------------------------------
    class Dom { // extends Multimix
      /* inspired by http://youmightnotneedjquery.com
       and https://blog.garstasio.com/you-dont-need-jquery */
      //=========================================================================================================

      //---------------------------------------------------------------------------------------------------------
      ready(f) {
        // thx to https://stackoverflow.com/a/7053197/7568091
        // function r(f){/in/.test(document.readyState)?setTimeout(r,9,f):f()}
        validate.ready_callable(f);
        if (/in/.test(document.readyState)) {
          return setTimeout((() => {
            return this.ready(f);
          }), 9);
        }
        return f();
      }

      //=========================================================================================================
      // WARNINGS, NOTIFICATIONS
      //---------------------------------------------------------------------------------------------------------
      _notify(message) {
        var body, id, message_box, message_p, style;
        id = 'msgbx49573';
        message_box = this.select(`${id}`, null);
        if (message_box === null) {
          body = this.select('body', null);
          /* TAINT body element cannot be found when method is called before document ready, but we could still
               construct element immediately, append it on document ready */
          if (body == null) {
            return;
          }
          style = "background:#18171d;";
          style += "position:fixed;";
          style += "bottom:0mm;";
          style += "border:1mm dashed #e2ff00;";
          style += "padding-left:3mm;";
          style += "padding-right:3mm;";
          style += "padding-bottom:3mm;";
          style += "font-family:sans-serif;";
          style += "font-weight:bold !important;";
          style += "font-size:3mm;";
          style += "color:#e2ff00;";
          style += "width:100%;";
          style += "max-height:30mm;";
          style += "overflow-y:scroll;";
          message_box = this.parse_one(`<div id=${id} style='${style}'></div>`);
          this.append(body, message_box);
        }
        message_p = "<p style='padding-top:3mm;'>";
        message_p += "⚠️&nbsp;<strong>";
        message_p += µ.TEXT.pen_escape(message);
        message_p += "</strong></p>";
        message_p = this.parse_one(message_p);
        this.insert_as_last(message_box, message_p);
        return null;
      }

      //---------------------------------------------------------------------------------------------------------
      warn(...P) {
        /* Construct a text message for display in console and in notification box, alongside with a stack trace
           to be shown only in the console, preced by the original arguments as passed into this function,
           meaning that any DOM elements will be expandable links to their visible representations on the HTML
           page. */
        var error, message;
        message = µ.TEXT.pen(...P);
        error = new Error(message);
        console.groupCollapsed(P[0]);
        console.warn(...P);
        console.groupEnd();
        return this._notify(message);
      }

      //=========================================================================================================

      //---------------------------------------------------------------------------------------------------------
      /* NOTE `µ.DOM.select()` to be deprecated in favor of `µ.DOM.select_first()` */
      select(selector, fallback = misfit) {
        return this.select_first(document, selector, fallback);
      }

      select_first(selector, fallback = misfit) {
        return this.select_from(document, selector, fallback);
      }

      select_all(selector) {
        return this.select_all_from(document, selector);
      }

      //---------------------------------------------------------------------------------------------------------
      /* NOTE `µ.DOM.select_from()` to be deprecated in favor of `µ.DOM.select_first_from()` */
      select_from(element, selector, fallback = misfit) {
        return this.select_first_from(element, selector, fallback);
      }

      select_first_from(element, selector, fallback = misfit) {
        var R;
        validate.delement(element);
        validate.nonempty_text(selector);
        if ((R = element.querySelector(selector)) == null) {
          if (fallback === misfit) {
            throw new Error(`^µDOM/select_from@7758^ no such element: ${µ.TEXT.rpr(selector)}`);
          }
          return fallback;
        }
        return R;
      }

      //---------------------------------------------------------------------------------------------------------
      select_all_from(element, selector) {
        validate.delement(element);
        validate.nonempty_text(selector);
        return element.querySelectorAll(selector);
      }

      // Array.from element.querySelectorAll selector

        //---------------------------------------------------------------------------------------------------------
      select_id(id, fallback = misfit) {
        var R;
        validate.nonempty_text(id);
        if ((R = document.getElementById(id)) == null) {
          if (fallback === misfit) {
            throw new Error(`^µDOM/select_id@7758^ no element with ID: ${µ.TEXT.rpr(id)}`);
          }
          return fallback;
        }
        return R;
      }

      //---------------------------------------------------------------------------------------------------------
      matches_selector(element, selector) {
        if (!isa.function(element != null ? element.matches : void 0)) {
          throw new Error(`^µDOM/select_id@77581^ expected element with \`match()\` method, got ${µ.TEXT.rpr(element)}`);
        }
        return element.matches(selector);
      }

      //---------------------------------------------------------------------------------------------------------
      get(element, name) {
        validate.element(element);
        return element.getAttribute(name);
      }

      get_numeric(element, name) {
        return parseFloat(this.get(element, name));
      }

      // When called with two arguments as in `set div, 'bar'`, will set values-less attribute (`<div bar>`)
      set(element, name, value = '') {
        validate.element(element);
        return element.setAttribute(name, value);
      }

      //---------------------------------------------------------------------------------------------------------
      get_classes(element) {
        validate.element(element);
        return element.classList;
      }

      add_class(element, name) {
        validate.element(element);
        return element.classList.add(name);
      }

      has_class(element, name) {
        validate.element(element);
        return element.classList.contains(name);
      }

      remove_class(element, name) {
        validate.element(element);
        return element.classList.remove(name);
      }

      toggle_class(element, name) {
        validate.element(element);
        return element.classList.toggle(name);
      }

      //---------------------------------------------------------------------------------------------------------
      swap_class(element, old_name, new_name) {
        element.classList.remove(old_name);
        return element.classList.add(new_name);
      }

      //---------------------------------------------------------------------------------------------------------
      hide(element) {
        validate.element(element);
        return element.style.display = 'none';
      }

      show(element) {
        validate.element(element);
        return element.style.display = '';
      }

      //---------------------------------------------------------------------------------------------------------
      get_live_styles(element) {
        return getComputedStyle(element);
      }

      /*
      globalThis.get_style = ( element, pseudo_selector, attribute_name ) ->
        unless attribute_name?
          [ pseudo_selector, attribute_name, ] = [ undefined, pseudo_selector, ]
        style = window.getComputedStyle element, pseudo_selector
        return style.getPropertyValue attribute_name
      */
      /* TAINT also use pseudo_selector, see above */
      /* validation done by method */
      /* validation done by method */      get_style_value(element, name) {
        return (getComputedStyle(element))[name];
      }

      get_numeric_style_value(element, name) {
        return parseFloat((getComputedStyle(element))[name]);
      }

      /* thx to https://davidwalsh.name/css-variables-javascript */
      get_prop_value(element, name) {
        return (getComputedStyle(element)).getPropertyValue(name);
      }

      get_numeric_prop_value(element, name) {
        return parseFloat((getComputedStyle(element)).getPropertyValue(name));
      }

      /* thx to https://davidwalsh.name/css-variables-javascript */
      get_global_prop_value(name) {
        return (getComputedStyle(document)).getPropertyValue(name);
      }

      get_numeric_global_prop_value(name) {
        return parseFloat((getComputedStyle(document)).getPropertyValue(name));
      }

      set_global_prop_value(name, value) {
        return document.documentElement.style.setProperty(name, value);
      }

      // #-----------------------------------------------------------------------------------------------------------
      // set_prop_defaults = ->
      //   ### There shoud be a better way to inject styles ###
      //   return null if _set_prop_defaults
      //   # head_dom = µ.DOM.select_first 'head'
      //   # style_txt = """
      //   # <style>
      //   #   * {
      //   #     outline:       2px solid yellow; }
      //   #   </style>
      //   # """
      //   # head_dom.innerHTML = style_txt + head_dom.innerHTML
      //   tophat_dom = µ.DOM.select_first '#tophat'
      //   µ.DOM.insert_before tophat_dom, µ.DOM.parse_one """
      //   <style>
      //     * {
      //       outline:       2px solid yellow; }
      //     :root {
      //       --hstn-slider-track-bgcolor:    lime; }
      //     </style>
      //   """
      //   return null

        //---------------------------------------------------------------------------------------------------------
      set_style_rule(element, name, value) {
        /* see https://developer.mozilla.org/en-US/docs/Web/API/ElementCSSInlineStyle/style */
        validate.element(element);
        validate.nonempty_text(name);
        return element.style[INTERTEXT.camelize(name)] = value;
      }

      //---------------------------------------------------------------------------------------------------------
      new_stylesheet(text = '') {
        var R;
        R = document.createElement('style');
        R.appendChild(document.createTextNode(text));
        return R;
      }

      //=========================================================================================================
      // ELEMENT CREATION
      //---------------------------------------------------------------------------------------------------------
      parse_one(element_html) {
        var R, length;
        R = this.parse_all(element_html);
        if ((length = R.length) !== 1) {
          throw new Error(`^µDOM/parse_one@7558^ expected HTML for 1 element but got ${length}`);
        }
        return R[0];
      }

      //---------------------------------------------------------------------------------------------------------
      parse_all(html) {
        var R;
        /* TAINT return Array or HTMLCollection? */
        validate.nonempty_text(html);
        R = document.implementation.createHTMLDocument();
        R.body.innerHTML = html;
        return R.body.children;
      }

      //---------------------------------------------------------------------------------------------------------
      new_element(xname, ...P) {
        /* TAINT analyze xname (a la `div#id42.foo.bar`) as done in Intertext.Cupofhtml */
        /* TAINT in some cases using innerHTML, documentFragment may be advantageous */
        var R, attributes, i, k, len, p, text, v;
        R = document.createElement(xname);
        attributes = {};
        text = null;
        for (i = 0, len = P.length; i < len; i++) {
          p = P[i];
          if (isa.text(p)) {
            text = p;
            continue;
          }
          attributes = Object.assign(attributes, p);
        }
        if (text != null) {
          /* TAINT check type? */          R.textContent = text;
        }
        for (k in attributes) {
          v = attributes[k];
          R.setAttribute(k, v);
        }
        return R;
      }

      //---------------------------------------------------------------------------------------------------------
      deep_copy(element) {
        return element.cloneNode(true);
      }

      //=========================================================================================================
      // OUTER, INNER HTML
      //---------------------------------------------------------------------------------------------------------
      get_inner_html(element) {
        validate.element(element);
        return element.innerHTML;
      }

      get_outer_html(element) {
        validate.element(element);
        return element.outerHTML;
      }

      //=========================================================================================================
      // INSERTION
      //---------------------------------------------------------------------------------------------------------
      insert(position, target, x) {
        switch (position) {
          case 'before':
          case 'beforebegin':
            return this.insert_before(target, x);
          case 'as_first':
          case 'afterbegin':
            return this.insert_as_first(target, x);
          case 'as_last':
          case 'beforeend':
            return this.insert_as_last(target, x);
          case 'after':
          case 'afterend':
            return this.insert_after(target, x);
        }
        throw new Error(`^µDOM/insert@7758^ not a valid position: ${µ.TEXT.rpr(position)}`);
      }

      //---------------------------------------------------------------------------------------------------------
      /* NOTE pending practical considerations and benchmarks we will probably remove one of the two sets
       of insertion methods */
      insert_before(target, x) {
        validate.element(target);
        return target.insertAdjacentElement('beforebegin', x);
      }

      insert_as_first(target, x) {
        validate.element(target);
        return target.insertAdjacentElement('afterbegin', x);
      }

      insert_as_last(target, x) {
        validate.element(target);
        return target.insertAdjacentElement('beforeend', x);
      }

      insert_after(target, x) {
        validate.element(target);
        return target.insertAdjacentElement('afterend', x);
      }

      //---------------------------------------------------------------------------------------------------------
      before(target, ...x) {
        validate.element(target);
        return target.before(...x);
      }

      prepend(target, ...x) {
        validate.element(target);
        return target.prepend(...x);
      }

      append(target, ...x) {
        validate.element(target);
        return target.append(...x);
      }

      after(target, ...x) {
        validate.element(target);
        return target.after(...x);
      }

      //=========================================================================================================
      // REMOVAL
      //---------------------------------------------------------------------------------------------------------
      remove(element) {
        /* see http://youmightnotneedjquery.com/#remove */
        validate.element(element);
        return element.parentNode.removeChild(element);
      }

      //=========================================================================================================
      // GEOMETRY
      //---------------------------------------------------------------------------------------------------------
      /* NOTE observe that `DOM.get_offset_top()` and `element.offsetTop` are two different things; terminology
       is confusing here, so consider renaming to avoid `offset` altogether */
      get_offset_top(element) {
        return (this.get_offset(element)).top;
      }

      get_offset_left(element) {
        return (this.get_offset(element)).left;
      }

      //---------------------------------------------------------------------------------------------------------
      get_offset(element) {
        var rectangle;
        /* see http://youmightnotneedjquery.com/#offset */
        validate.element(element);
        rectangle = element.getBoundingClientRect();
        return {
          top: rectangle.top + document.body.scrollTop,
          left: rectangle.left + document.body.scrollLeft
        };
      }

      //---------------------------------------------------------------------------------------------------------
      /* see http://youmightnotneedjquery.com/#get_width */
      get_width(element) {
        return this.get_numeric_style_value(element, 'width');
      }

      get_height(element) {
        return this.get_numeric_style_value(element, 'height');
      }

      //=========================================================================================================
      // EVENTS
      //---------------------------------------------------------------------------------------------------------
      on(element, name, handler) {
        /* TAINT add options */
        /* see http://youmightnotneedjquery.com/#on, http://youmightnotneedjquery.com/#delegate */
        /* Also note the addition of a `passive: false` parameter (as in `html_dom.addEventListener 'wheel', f,
           { passive: false, }`); see https://stackoverflow.com/a/55461632/256361; apparently it is a recently
           introduced feature of browser event processing; see also [JQuery issue #2871 *Add support for passive
           event listeners*](https://github.com/jquery/jquery/issues/2871), open as of Dec 2020 */
        validate.delement(element);
        validate.nonempty_text(name);
        validate.function(handler);
        return element.addEventListener(name, handler, false);
      }

      //---------------------------------------------------------------------------------------------------------
      emit_custom_event(name, options) {
        // thx to https://www.javascripttutorial.net/javascript-dom/javascript-custom-events/
        /* Acc. to https://developer.mozilla.org/en-US/docs/Web/API/Event/Event,
           https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent/CustomEvent, allowable fields for `options`
           include `bubbles`, `cancelable`, `composed`, `detail`; the last one may contain arbitrary data and can
           be retrieved as `event.detail`. */
        validate.nonempty_text(name);
        return document.dispatchEvent(new CustomEvent(name, options));
      }

      //=========================================================================================================
      // DRAGGABLES
      //---------------------------------------------------------------------------------------------------------
      make_draggable(element) {
        var id, on_drag_start, on_drop;
        /* thx to http://jsfiddle.net/robertc/kKuqH/
           https://stackoverflow.com/a/6239882/7568091 */
        this._attach_dragover();
        this._prv_draggable_id++;
        id = this._prv_draggable_id;
        this.set(element, 'draggable', true);
        //.......................................................................................................
        this.on(element, 'dragstart', on_drag_start = function(event) {
          var style, x, y;
          style = µ.DOM.get_live_styles(event.target);
          x = (parseInt(style.left, 10)) - event.clientX;
          y = (parseInt(style.top, 10)) - event.clientY;
          return event.dataTransfer.setData('application/json', JSON.stringify({x, y, id}));
        });
        //.......................................................................................................
        this.on(document.body, 'drop', on_drop = function(event) {
          var left, top, transfer;
          transfer = JSON.parse(event.dataTransfer.getData('application/json'));
          if (id !== transfer.id) {
            return;
          }
          left = event.clientX + transfer.x + 'px';
          top = event.clientY + transfer.y + 'px';
          µ.DOM.set_style_rule(element, 'left', left);
          µ.DOM.set_style_rule(element, 'top', top);
          event.preventDefault();
          return false;
        });
        //.......................................................................................................
        return null;
      }

      //---------------------------------------------------------------------------------------------------------
      _attach_dragover() {
        var on_dragover;
        /* TAINT Apparently need for correct dragging behavior, but what if we wanted to handle this event? */
        this.on(document.body, 'dragover', on_dragover = function(event) {
          event.preventDefault();
          return false;
        });
        this._attach_dragover = function() {};
        return null;
      }

      //=========================================================================================================

      //---------------------------------------------------------------------------------------------------------
      * _walk_xpath(root, path) {
        var iterator, node;
        if (path == null) {
          // thx to https://denizaksimsek.com/2023/xpath/
          [root, path] = [document, root];
        }
        iterator = document.evaluate(path, root, null, XPathResult.UNORDERED_NODE_ITERATOR_TYPE, null);
        while (true) {
          if ((node = iterator.iterateNext()) == null) {
            break;
          }
          yield node;
        }
        return null;
      }

      //---------------------------------------------------------------------------------------------------------
      get_document_scroll_top() {
        return document.documentElement.scrollTop;
      }

      get_document_scroll_left() {
        return document.documentElement.scrollLeft;
      }

      //---------------------------------------------------------------------------------------------------------
      wrap_inner(element, wrapper) {
        element.appendChild(wrapper);
        while (element.firstChild !== wrapper) {
          wrapper.appendChild(element.firstChild);
        }
        return null;
      }

      //---------------------------------------------------------------------------------------------------------
      _XXX_set_iframe_scroll_top(iframe, y) {
        /* thx to https://stackoverflow.com/a/1229832/7568091 */
        /* Set vertical scroll amount of content shown in an `<iframe>`. */
        // ### TAINT API TBD
        iframe.contentWindow.document.documentElement.scrollTop = y;
        return null;
      }

      //---------------------------------------------------------------------------------------------------------
      select_first_xpath(...P) {
        var R, ref;
        ref = this._walk_xpath(...P);
        for (R of ref) {
          return R;
        }
      }

      select_all_xpath(...P) {
        var R, ref, results;
        ref = this._walk_xpath(...P);
        results = [];
        for (R of ref) {
          results.push(R);
        }
        return results;
      }

      //---------------------------------------------------------------------------------------------------------
      page_is_inside_iframe() {
        return window.location !== window.parent.location;
      }

    };

    //.........................................................................................................
    Dom.prototype._prv_draggable_id = 0;

    return Dom;

  }).call(this);

  //===========================================================================================================
  // MAGIC
  //-----------------------------------------------------------------------------------------------------------
  this._magic = Symbol.for('µDOM');

  this.TEXT = new Text();

  this.DOM = new Dom();

  this.KB = new (require('./kb')).Kb();

  // module.exports.rpr     ?= module.exports.µ.TEXT.rpr.bind( µ.TEXT )
// module.exports.log     ?= module.exports.µ.TEXT.log.bind( µ.TEXT )
/*

https://stackoverflow.com/a/117988/7568091

innerHTML is remarkably fast, and in many cases you will get the best results just setting that (I would
just use append).

However, if there is much already in "mydiv" then you are forcing the browser to parse and render all of
that content again (everything that was there before, plus all of your new content). You can avoid this by
appending a document fragment onto "mydiv" instead:

var frag = document.createDocumentFragment();
frag.innerHTML = html;
$("#mydiv").append(frag);
In this way, only your new content gets parsed (unavoidable) and the existing content does not.

EDIT: My bad... I've discovered that innerHTML isn't well supported on document fragments. You can use the
same technique with any node type. For your example, you could create the root table node and insert the
innerHTML into that:

var frag = document.createElement('table');
frag.innerHTML = tableInnerHtml;
$("#mydiv").append(frag);

*/

}).call(this);

//# sourceMappingURL=main.js.map