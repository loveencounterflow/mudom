(function() {
  //-----------------------------------------------------------------------------------------------------------

  //===========================================================================================================
  'use strict';
  var debug, defaults, freeze, isa, log, types, validate, validate_optional, µ;

  µ = require('./main');

  log = console.log;

  debug = console.debug;

  freeze = Object.freeze;

  ({types, isa, validate, validate_optional} = require('./types'));

  //-----------------------------------------------------------------------------------------------------------
  defaults = {
    //---------------------------------------------------------------------------------------------------------
    kblike_eventnames: [
      // ### TAINT not all of these events are needed
      'click',
      // 'dblclick', # implied / preceded by `click` event
      // 'drag', 'dragend', 'dragenter', 'dragleave', 'dragover', 'dragstart',
      // 'mousedown', 'mouseenter', 'mouseleave', 'mousemove', 'mouseout', 'mouseover', 'mouseup',
      // 'pointercancel',
      'wheel',
      'pointermove',
      'pointerout',
      'pointerover'
    ],
    //---------------------------------------------------------------------------------------------------------
    // 'pointerdown',
    // 'pointerenter',
    // 'pointerleave',
    // 'pointerup',
    // ------------- Tier A: ubiquitous, unequivocal
    modifier_names: ['Alt', 'AltGraph', 'Control', 'Meta', 'Shift', 'CapsLock']
  };

  //-----------------------------------------------------------------------------------------------------------

  //===========================================================================================================
  // ------------- Tier B: status doubtful
  // 'Hyper',
  // 'OS',
  // 'Super',
  // 'Symbol',
  // ------------- Tier C: rare, not needed, or not sensed by JS
  // 'Fn',
  // 'FnLock',
  // 'NumLock',
  // 'ScrollLock',
  // 'SymbolLock',
  this.Kb = (function() {
    class Kb {
      //---------------------------------------------------------------------------------------------------------
      constructor(cfg) {
        var i, len, modifier_name, ref;
        //---------------------------------------------------------------------------------------------------------
        /* Get the last known keyboard modifier state. NOTE may be extended with `event` argument ITF. */
        // µ.DOM.get_kb_modifier_state = () => return { ...prv, }

        //---------------------------------------------------------------------------------------------------------
        this.get_changed_kb_modifier_state = this.get_changed_kb_modifier_state.bind(this);
        //-----------------------------------------------------------------------------------------------------------
        // get_kb_modifier_state = ( event, value ) =>
        //   @_prv_modifiers = {}
        //   for ( modifier_name of @cfg.modifier_names ) {
        //     @_prv_modifiers[ modifier_name ] = null
        //   freeze( @_prv_modifiers )

        //---------------------------------------------------------------------------------------------------------
        this._set_capslock_state = this._set_capslock_state.bind(this);
        // #---------------------------------------------------------------------------------------------------------
        // on_push: ( keynames, handler ) =>
        // keynames  = [ keynames, ] unless isa.list keynames
        // types     = [ types,    ] unless isa.list types
        // validate.keywatch_keynames  keynames
        // validate.keywatch_types     types

        //---------------------------------------------------------------------------------------------------------
        this.XXXXXXXXXXXX_foobar = this.XXXXXXXXXXXX_foobar.bind(this);
        //---------------------------------------------------------------------------------------------------------
        // µ_DOM_detect_doublekey_events { event_name: 'µKB_doublekey', dt: 350, }
        this._detect_doublekey_events = this._detect_doublekey_events.bind(this);
        //---------------------------------------------------------------------------------------------------------
        this._listen_to_key = this._listen_to_key.bind(this);
        //---------------------------------------------------------------------------------------------------------
        this._call_handlers = this._call_handlers.bind(this);
        this.cfg = {...defaults, ...cfg};
        ref = this.cfg.modifier_names;
        for (i = 0, len = ref.length; i < len; i++) {
          modifier_name = ref[i];
          this._prv_modifiers[modifier_name] = null;
        }
        freeze(this._prv_modifiers);
        return null;
      }

      get_changed_kb_modifier_state() {
        var crt_modifiers, has_changed, i, len, modifier_name, ref, state;
        /* Return keyboard modifier state if it has changed since the last call, or `null` if it hasn't changed. */
        // log( '^33988^', { event, } )
        crt_modifiers = {
          _type: event.type
        };
        has_changed = false;
        ref = this.cfg.modifier_names;
        for (i = 0, len = ref.length; i < len; i++) {
          modifier_name = ref[i];
          state = event.getModifierState(modifier_name);
          has_changed = has_changed || (this._prv_modifiers[modifier_name] !== state);
          crt_modifiers[modifier_name] = state;
        }
        if (has_changed) {
          return this._prv_modifiers = freeze(crt_modifiers);
        }
        return null;
      }

      _set_capslock_state(capslock_active) {
        if (capslock_active === this._capslock_active) {
          return null;
        }
        this._capslock_active = capslock_active;
        µ.DOM.emit_custom_event('µ_kb_capslock_changed', {
          detail: {
            CapsLock: capslock_active
          }
        });
        return null;
      }

      XXXXXXXXXXXX_foobar() {
        var event_name, handle_kblike_event, i, len, ref;
        //.......................................................................................................
        handle_kblike_event = (event) => {
          var modifier_state;
          modifier_state = this.get_changed_kb_modifier_state(event);
          if (modifier_state !== null) {
            µ.DOM.emit_custom_event('µ_kb_modifier_changed', {
              detail: modifier_state
            });
          }
          this._set_capslock_state(event.getModifierState('CapsLock'));
          return null;
        };
        ref = this.cfg.kblike_eventnames;
        //.......................................................................................................
        for (i = 0, len = ref.length; i < len; i++) {
          event_name = ref[i];
          µ.DOM.on(document, event_name, handle_kblike_event);
        }
        //.......................................................................................................
        µ.DOM.on(document, 'keydown', (event) => {
          handle_kblike_event(event);
          /* TAINT logic is questionable */
          if (/* !!!!!!!!!!!!!!!!!!!!!! */event.key === 'CapsLock') {
            this._set_capslock_state(!this._capslock_active);
          } else {
            this._set_capslock_state(event.getModifierState('CapsLock'));
          }
          return null;
        });
        //.......................................................................................................
        µ.DOM.on(document, 'keyup', (event) => {
          handle_kblike_event(event);
          if (event.key === 'CapsLock') {
/* TAINT logic is questionable */
/* !!!!!!!!!!!!!!!!!!!!!! */            return null;
          }
          this._set_capslock_state(event.getModifierState('CapsLock'));
          return null;
        });
        return null;
      }

      _detect_doublekey_events(cfg, handler) {
        var get_double_key, push, shift, shreg;
        defaults = {
          dt: 350
        };
        cfg = {...defaults, ...cfg};
        shreg = [];
        //.......................................................................................................
        get_double_key = function() {
          var R, ref, ref1, ref10, ref11, ref2, ref3, ref4, ref5, ref6, ref7, ref8, ref9;
          if (!((Date.now() - ((ref = (ref1 = shreg[0]) != null ? ref1.t : void 0) != null ? ref : 0)) < cfg.dt)) {
            return false;
          }
          if (((ref2 = shreg[0]) != null ? ref2.dir : void 0) !== 'down') {
            return false;
          }
          if (((ref3 = shreg[1]) != null ? ref3.dir : void 0) !== 'up') {
            return false;
          }
          if (((ref4 = shreg[2]) != null ? ref4.dir : void 0) !== 'down') {
            return false;
          }
          if (((ref5 = shreg[3]) != null ? ref5.dir : void 0) !== 'up') {
            return false;
          }
          if (((((ref8 = shreg[0]) != null ? ref8.name : void 0) !== (ref7 = (ref9 = shreg[1]) != null ? ref9.name : void 0) || ref7 !== (ref6 = (ref10 = shreg[2]) != null ? ref10.name : void 0)) || ref6 !== ((ref11 = shreg[3]) != null ? ref11.name : void 0))) {
            return false;
          }
          R = shreg[3].name;
          shreg.length = 0;
          return R;
        };
        //.......................................................................................................
        shift = function() {
          return shreg.shift();
        };
        push = function(dir, event) {
          var name;
          name = event.key;
          shreg.push({
            dir,
            name,
            t: Date.now()
          });
          while (shreg.length > 4) {
            shreg.shift();
          }
          if (name = get_double_key()) {
            handler(event);
          }
          return null;
        };
        //.......................................................................................................
        µ.DOM.on(document, 'keydown', (event) => {
          return push('down', event);
        });
        µ.DOM.on(document, 'keyup', (event) => {
          return push('up', event);
        });
        return null;
      }

      _listen_to_key(name, type, handler) {
        var base, behaviors, entry, handlers;
        /* NOTE catch-all bindings to be implemented later */
        // if name? then validate.keywatch_keyname name else name = ''
        // if type? then validate.keywatch_keytype type else type = ''
        validate.keywatch_keyname(name);
        validate.keywatch_keytype(type);
        behaviors = (base = this._registry)[name] != null ? base[name] : base[name] = {};
        entry = behaviors[type] != null ? behaviors[type] : behaviors[type] = {};
        handlers = entry.handlers != null ? entry.handlers : entry.handlers = [];
        handlers.push(handler);
        this._add_listener_for_type(type);
        //.......................................................................................................
        return null/* NOTE may return a `remove_listener` method ITF */;
      }

      _call_handlers(type, event) {
        /* TAINT also call catchall handlers */
        /* TAINT consider to use method to retrieve handlers */
        var d, handler, handlers, i, len, name, ref, ref1, ref2;
        name = event.key;
        d = freeze({name, type, event});
        handlers = (ref = (ref1 = this._registry[name]) != null ? (ref2 = ref1[type]) != null ? ref2.handlers : void 0 : void 0) != null ? ref : null;
        if (handlers != null) {
          for (i = 0, len = handlers.length; i < len; i++) {
            handler = handlers[i];
            handler(d);
          }
        }
        return null;
      }

      //---------------------------------------------------------------------------------------------------------
      _add_listener_for_type(type) {
        var event_name;
        if (this._initialized_types[type]) {
          return null;
        }
        this._initialized_types[type] = true;
        debug('^2252^', `binding type ${type}`);
        //.......................................................................................................
        switch (type) {
          case 'up':
          case 'down':
            event_name = `key${type}`;
            µ.DOM.on(document, event_name, (event) => {
              return this._call_handlers(type, event);
            });
            break;
          case 'double':
            this._detect_doublekey_events(null, (event) => {
              return this._call_handlers(type, event);
            });
            break;
          default:
            µ.DOM.warn(`^4453^ unknown key event type: ${µ.TEXT.rpr(type)}`);
        }
        return null/* NOTE may return a `remove_listener` method ITF */;
      }

    };

    Kb.prototype._prv_modifiers = {};

    Kb.prototype._capslock_active = false;

    //#########################################################################################################
    //#########################################################################################################
    //#########################################################################################################
    //#########################################################################################################
    //#########################################################################################################
    //#########################################################################################################

    //---------------------------------------------------------------------------------------------------------
    Kb.prototype._registry = {};

    Kb.prototype._initialized_types = {};

    return Kb;

  }).call(this);

}).call(this);

//# sourceMappingURL=kb.js.map