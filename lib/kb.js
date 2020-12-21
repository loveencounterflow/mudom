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
    var _XXX_initialized;

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
        this._listen_to_key = this._listen_to_key.bind(this);
        //---------------------------------------------------------------------------------------------------------
        this.XXXXXXXXXXXX_foobar = this.XXXXXXXXXXXX_foobar.bind(this);
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

      _listen_to_key(name, type, listener) {
        (() => {
          var listeners, registry, tag;
          if (name != null) {
            validate.keywatch_keyname(name);
          } else {
            name = '';
          }
          if (type != null) {
            validate.keywatch_keytype(type);
          } else {
            type = '';
          }
          // debug '^90009^', name + "\x00" + type
          tag = `${type}:${name}`;
          registry = this._registry != null ? this._registry : this._registry = {};
          listeners = registry[tag] != null ? registry[tag] : registry[tag] = [];
          return listeners.push(listener);
        })();
        if (_XXX_initialized) {
          //.......................................................................................................
          // throw new Error '^493841^' unless type is 'down'
          return null;
        }
        _XXX_initialized = true;
        debug('^2252^', "binding keydown");
        //.......................................................................................................
        µ.DOM.on(document, 'keydown', (event) => {
          var d, i, j, len, len1, listeners, ref, tag;
          name = event.key;
          type = 'down';
          d = freeze({name, type, event});
          ref = [`${type}:${name}`, `${type}:`, `:${event.key}`, ":"];
          for (i = 0, len = ref.length; i < len; i++) {
            tag = ref[i];
            if ((listeners = this._registry[tag]) == null) {
              continue;
            }
            for (j = 0, len1 = listeners.length; j < len1; j++) {
              listener = listeners[j];
              listener(d);
            }
          }
          return null;
        });
        return null/* NOTE may return a `remove_listener` method ITF */;
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

    };

    Kb.prototype._prv_modifiers = {};

    Kb.prototype._capslock_active = false;

    //---------------------------------------------------------------------------------------------------------
    Kb._registry = null;

    // #---------------------------------------------------------------------------------------------------------
    // on_push: ( keynames, handler ) =>
    // keynames  = [ keynames, ] unless isa.list keynames
    // types     = [ types,    ] unless isa.list types
    // validate.keywatch_keynames  keynames
    // validate.keywatch_types     types

    //---------------------------------------------------------------------------------------------------------
    _XXX_initialized = false;

    return Kb;

  }).call(this);

}).call(this);

//# sourceMappingURL=kb.js.map