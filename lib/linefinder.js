(function() {
  'use strict';
  var Column, Distributor, Finder, Iframe_walker, Node_walker, Slug, Slug_walker, TU, Walker, after, defaults, defer, every, sleep;

  TU = require('../deps/traverse_util.js');

  //===========================================================================================================
  every = (dts, f) => {
    return setInterval(f, dts * 1000);
  };

  after = (dts, f) => {
    return new Promise((resolve) => {
      return setTimeout((function() {
        return resolve(f());
      }), dts * 1000);
    });
  };

  sleep = (dts) => {
    return new Promise((resolve) => {
      return setTimeout(resolve, dts * 1000);
    });
  };

  defer = async(f = function() {}) => {
    await sleep(0);
    return (await f());
  };

  //===========================================================================================================
  /* TAINT to be integrated with types */
  defaults = {};

  //...........................................................................................................
  defaults.finder_cfg = {
    /* TAINT inconsistent naming */
    box_element_name: 'div',
    box_class_name: 'box',
    cover_class_name: 'cover',
    xxx_height_factor: 1 / 2
  };

  //...........................................................................................................
  /* relative minimum height to recognize line step */  defaults.distributor_cfg = {
    paragraph_selector: 'galley > p',
    iframe_selector: 'iframe'
  };

  defaults.distributor_cfg = {...defaults.finder_cfg, ...defaults.distributor_cfg};

  //===========================================================================================================
  Slug = class Slug {
    constructor({llnr, rlnr, node, rectangle}) {
      this.llnr = llnr;
      this.rlnr = rlnr;
      this.node = node;
      this.rectangle = rectangle;
      return void 0;
    }

  };

  //===========================================================================================================
  Finder = class Finder {
    //---------------------------------------------------------------------------------------------------------
    constructor(cfg) {
      /* TAINT use intertype */
      this.cfg = Object.freeze({...defaults.finder_cfg, ...cfg});
      return void 0;
    }

    //---------------------------------------------------------------------------------------------------------
    draw_box(rectangle) {
      var box;
      box = document.createElement(this.cfg.box_element_name);
      box.style.top = rectangle.top + 'px';
      box.style.left = rectangle.left + 'px';
      box.style.width = rectangle.width - 1 + 'px'; // collapse borders
      box.style.height = rectangle.height + 'px';
      box.classList.add(this.cfg.box_class_name);
      document.body.appendChild(box);
      return box;
    }

    //---------------------------------------------------------------------------------------------------------
    /* TAINT to be merged with `draw_box()` in new method */
    xxx_draw_line_cover(rectangle) {
      var box;
      box = document.createElement(this.cfg.box_element_name);
      box.style.top = rectangle.top + 'px';
      box.style.left = rectangle.left + 'px';
      box.style.width = rectangle.width - 1 + 'px'; // collapse borders
      box.style.height = rectangle.height + 'px';
      box.classList.add(this.cfg.box_class_name);
      box.classList.add(this.cfg.cover_class_name);
      document.body.appendChild(box);
      return box;
    }

    //---------------------------------------------------------------------------------------------------------
    _get_next_chr_rectangles(node, c1, c2) {
      var range, selection;
      TU.TraverseUtil.getNextChar(c1, c2, [], false);
      selection = TU.TraverseUtil.setSelection(c1, c2);
      range = selection.getRangeAt(0);
      if (!node.contains(range.startContainer.parentNode)) {
        return null;
      }
      if (!node.contains(range.endContainer.parentNode)) {
        return null;
      }
      return range.getClientRects();
    }

    //---------------------------------------------------------------------------------------------------------
    * walk_chr_rectangles_of_node(node) {
      var c1, c2, rectangle, rectangles, text_node;
      text_node = node.childNodes[0];
      c1 = new TU.Cursor(text_node, 0, text_node.data);
      c2 = new TU.Cursor(text_node, 0, text_node.data);
      TU.TraverseUtil.setSelection(c1, c2);
      while (true) {
        rectangles = this._get_next_chr_rectangles(node, c1, c2);
        if (rectangles == null) {
          break;
        }
        for (rectangle of rectangles) {
          yield new DOMRect(rectangle.left + document.documentElement.scrollLeft, rectangle.top + document.documentElement.scrollTop, rectangle.width, rectangle.height); // left // top // width // height
        }
      }
      return null;
    }

    //---------------------------------------------------------------------------------------------------------
    _reset_line_walker(s) {
      s.min_top = +2e308;
      s.max_bottom = -2e308;
      s.min_left = +2e308;
      s.max_right = -2e308;
      s.avg_height = 0;
      s.avg_bottom = 0;
      s.count = 0;
      return null;
    }

    //---------------------------------------------------------------------------------------------------------
    * walk_line_rectangles_of_node(node) {
      var rectangle, ref, s;
      this._reset_line_walker(s = {});
      ref = this.walk_chr_rectangles_of_node(node);
      for (rectangle of ref) {
        if (s.count > 0 && rectangle.bottom - s.avg_bottom > s.avg_height * this.cfg.xxx_height_factor) {
          yield new DOMRect(s.min_left, s.min_top, s.max_right - s.min_left, s.max_bottom - s.min_top); // left // top // width // height
          this._reset_line_walker(s);
        }
        //.......................................................................................................
        // draw_box rectangle
        s.count++;
        s.min_top = Math.min(s.min_top, rectangle.top);
        s.max_bottom = Math.max(s.max_bottom, rectangle.bottom);
        s.min_left = Math.min(s.min_left, rectangle.left);
        s.max_right = Math.max(s.max_right, rectangle.right);
        s.avg_height = (s.avg_height * (s.count - 1) / s.count) + (rectangle.height * 1 / s.count);
        s.avg_bottom = (s.avg_bottom * (s.count - 1) / s.count) + (rectangle.bottom * 1 / s.count);
      }
      //.........................................................................................................
      if (s.count > 0) {
        yield new DOMRect(s.min_left, s.min_top, s.max_right - s.min_left, s.max_bottom - s.min_top); // left // top // width // height
      }
      return null;
    }

    //---------------------------------------------------------------------------------------------------------
    * walk_slugs_of_node(node) {
      var i, idx, len, line_count, llnr, rectangle, rectangles, rlnr;
      rectangles = [...(this.walk_line_rectangles_of_node(node))];
      line_count = rectangles.length;
      for (idx = i = 0, len = rectangles.length; i < len; idx = ++i) {
        rectangle = rectangles[idx];
        llnr = idx + 1;
        rlnr = line_count - idx;
        yield new Slug({llnr, rlnr, node, rectangle});
      }
      return null;
    }

  };

  //===========================================================================================================
  Column = class Column {
    //---------------------------------------------------------------------------------------------------------
    constructor(ø_iframe, ø_slug) {
      this._ø_iframe = ø_iframe;
      this.first_slug = ø_slug.value;
      this.top = ø_slug.value.rectangle.top;
      this.height = 0;
      return void 0;
    }

    //---------------------------------------------------------------------------------------------------------
    scroll_to_first_line() {
      this._ø_iframe.window.scrollTo({
        top: this.top
      });
      return null;
    }

    //---------------------------------------------------------------------------------------------------------
    set_height_from_slug(ø_slug) {
      this.height = ø_slug.value.rectangle.bottom - this.top;
      return this.height;
    }

  };

  //===========================================================================================================
  Walker = class Walker {
    //---------------------------------------------------------------------------------------------------------
    constructor(iterator, stop = null) {
      this._iterator = iterator;
      this._stop = stop;
      this.done = false;
      this.value = stop;
      return void 0;
    }

    //---------------------------------------------------------------------------------------------------------
    step() {
      var done, value;
      ({value, done} = this._iterator.next());
      if (done) {
        this.done = true;
        this.value = this._stop;
        return this._stop;
      }
      this.value = value;
      return value;
    }

  };

  //===========================================================================================================
  Node_walker = class Node_walker extends Walker {};

  Slug_walker = class Slug_walker extends Walker {};

  //===========================================================================================================
  Iframe_walker = class Iframe_walker extends Walker {
    //---------------------------------------------------------------------------------------------------------
    constructor(iterator, stop = null, cfg) {
      super(iterator, stop);
      this.height = null;
      // @galley_document        = null
      this.window = null;
      this.draw_box = null;
      this.draw_line_cover = null;
      this.cfg = cfg;
      return void 0;
    }

    //---------------------------------------------------------------------------------------------------------
    step() {
      /* TAINT may want to return `linefinder` itself */
      var local_linefinder;
      super.step();
      if (this.done) {
        return this._stop;
      }
      this.height = µ.DOM.get_height(this.value);
      // @galley_document        = @value.contentDocument
      this.window = this.value.contentWindow;
      local_linefinder = new this.window.µ.LINE.Finder(this.cfg);
      this.draw_box = local_linefinder.draw_box.bind(local_linefinder);
      this.draw_line_cover = local_linefinder.xxx_draw_line_cover.bind(local_linefinder);
      return this.value;
    }

  };

  //===========================================================================================================
  Distributor = class Distributor {
    //---------------------------------------------------------------------------------------------------------
    static is_galley_document() {
      return (µ.DOM.page_is_inside_iframe()) && ((µ.DOM.select_first('galley', null)) != null);
    }

    static is_main_document() {
      return (!µ.DOM.page_is_inside_iframe()) && ((µ.DOM.select_first('iframe', null)) != null);
    }

    //---------------------------------------------------------------------------------------------------------
    constructor(cfg) {
      /* TAINT use `intertype` */
      this.cfg = Object.freeze({...defaults.distributor_cfg, ...cfg});
      return void 0;
    }

    //---------------------------------------------------------------------------------------------------------
    async distribute_lines() {
      var column, linefinder, ø_iframe, ø_node, ø_slug;
      //.......................................................................................................
      /* Allow user-scrolling for demo */
      // µ.DOM.set ø_iframe.value, 'scrolling', 'true' for ø_iframe.value in µ.DOM.select_all 'ø_iframe.value'
      //.......................................................................................................
      ø_iframe = new Iframe_walker((µ.DOM.select_all(this.cfg.iframe_selector)).values(), null, this.cfg);
      ø_iframe.step();
      ø_node = new Node_walker((ø_iframe.window.µ.DOM.select_all(this.cfg.paragraph_selector)).values());
      linefinder = new ø_iframe.window.µ.LINE.Finder(this.cfg);
      column = null;
      while (true) {
        if (ø_iframe.done) {
          //.......................................................................................................
          break;
        }
        //.....................................................................................................
        if (ø_node.step() == null) {
          log('^123-1^', "nodes done");
          break; // might want to mark galleys without content at this point
        }
        //.....................................................................................................
        await defer();
        ø_slug = new Slug_walker(linefinder.walk_slugs_of_node(ø_node.value));
        while (true) {
          if (ø_slug.step() == null) {
            log('^123-1^', "slugs done");
            break;
          }
          await defer();
          //...................................................................................................
          if ((column != null ? column.first_slug : void 0) == null) {
            column = new Column(ø_iframe, ø_slug);
            column.scroll_to_first_line();
          }
          //...................................................................................................
          column.set_height_from_slug(ø_slug);
          if (ø_iframe.height > column.height) {
            ø_iframe.draw_box(ø_slug.value.rectangle);
            continue;
          }
          //...................................................................................................
          ø_iframe.draw_line_cover(ø_slug.value.rectangle);
          column = null;
          if (ø_iframe.step() == null) {
            log('^123-1^', "iframes done");
            break;
          }
          ø_iframe.draw_box(ø_slug.value.rectangle);
          column = new Column(ø_iframe, ø_slug);
          column.scroll_to_first_line();
        }
      }
      //.......................................................................................................
      return null;
    }

  };

  module.exports = {Finder, Distributor};

}).call(this);

//# sourceMappingURL=linefinder.js.map