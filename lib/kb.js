(function() {
  //-----------------------------------------------------------------------------------------------------------

  //===========================================================================================================
  'use strict';
  var debug, defaults, freeze, isa, log, ref, types, validate, validate_optional, µ,
    boundMethodCheck = function(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new Error('Bound instance method accessed before binding'); } };

  µ = require('./main');

  log = console.log;

  debug = console.debug;

  freeze = Object.freeze;

  ({types, isa, validate, validate_optional} = require('./types'));

  //-----------------------------------------------------------------------------------------------------------
  defaults = {
    //---------------------------------------------------------------------------------------------------------
    latch: {
      dt: 350 // time in milliseconds between first and last key event to trigger latching
    },
    
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
  this._Kb = (function() {
    class _Kb {
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
        // validate.kb_keynames  keynames
        // validate.kb_types     types

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

      XXXXXXXXXXXX_foobar() {
        var eventname, handle_kblike_event, i, len, ref;
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
          eventname = ref[i];
          µ.DOM.on(document, eventname, handle_kblike_event);
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

    _Kb.prototype._prv_modifiers = {};

    _Kb.prototype._capslock_active = false;

    return _Kb;

  }).call(this);

  //#########################################################################################################
  //#########################################################################################################
  //#########################################################################################################
  //#########################################################################################################
  //#########################################################################################################
  //#########################################################################################################
  ref = this.Kb = (function() {
    class Kb extends this._Kb {
      constructor() {
        super(...arguments);
        //---------------------------------------------------------------------------------------------------------
        this._listen_to_key = this._listen_to_key.bind(this);
      }

      //---------------------------------------------------------------------------------------------------------
      _get_latching_keyname() {
        var R, ref1, ref10, ref11, ref12, ref2, ref3, ref4, ref5, ref6, ref7, ref8, ref9;
        if (!((Date.now() - ((ref1 = (ref2 = this._shreg[0]) != null ? ref2.t : void 0) != null ? ref1 : 0)) < this.cfg.latch.dt)) {
          return null;
        }
        if (((ref3 = this._shreg[0]) != null ? ref3.dir : void 0) !== 'down') {
          return null;
        }
        if (((ref4 = this._shreg[1]) != null ? ref4.dir : void 0) !== 'up') {
          return null;
        }
        if (((ref5 = this._shreg[2]) != null ? ref5.dir : void 0) !== 'down') {
          return null;
        }
        if (((ref6 = this._shreg[3]) != null ? ref6.dir : void 0) !== 'up') {
          return null;
        }
        if (((((ref9 = this._shreg[0]) != null ? ref9.name : void 0) !== (ref8 = (ref10 = this._shreg[1]) != null ? ref10.name : void 0) || ref8 !== (ref7 = (ref11 = this._shreg[2]) != null ? ref11.name : void 0)) || ref7 !== ((ref12 = this._shreg[3]) != null ? ref12.name : void 0))) {
          return null;
        }
        R = this._shreg[3].name;
        return R;
      }

      //---------------------------------------------------------------------------------------------------------
      _initialize_latching() {
        var push;
        if (this._latching_initialized) {
          return null;
        }
        this._latching_initialized = true;
        push = (dir, event) => {
          var name;
          name = event.key;
          this._shreg.push({
            dir,
            name,
            t: Date.now()
          });
          while (this._shreg.length > 4) {
            this._shreg.shift();
          }
          return true;
        };
        µ.DOM.on(document, 'keydown', (event) => {
          return push('down', event);
        });
        µ.DOM.on(document, 'keyup', (event) => {
          return push('up', event);
        });
        return null;
      }

      //=========================================================================================================

      //---------------------------------------------------------------------------------------------------------
      _listen_to_key_push(keyname, handler) {
        var behavior, state;
        state = false;
        behavior = 'push';
        //.......................................................................................................
        µ.DOM.on(document, 'keydown', (event) => {
          if (event.key !== keyname) {
            return true;
          }
          state = true;
          handler(freeze({keyname, behavior, state, event}));
          return true;
        });
        //.......................................................................................................
        µ.DOM.on(document, 'keyup', (event) => {
          if (event.key !== keyname) {
            return true;
          }
          state = false;
          handler(freeze({keyname, behavior, state, event}));
          return true;
        });
        //.......................................................................................................
        return null;
      }

      //---------------------------------------------------------------------------------------------------------
      _listen_to_key_toggle(keyname, handler) {
        var behavior, skip_next, state;
        state = false;
        behavior = 'toggle';
        skip_next = false;
        //.......................................................................................................
        µ.DOM.on(document, 'keydown', (event) => {
          if (event.key !== keyname) {
            return true;
          }
          if (state) {
            return true;
          }
          state = true;
          skip_next = true;
          // debug '^_listen_to_key@223^', 'keydown', { keyname, behavior, entry, }
          handler(freeze({keyname, behavior, state, event}));
          return true;
        });
        //.......................................................................................................
        µ.DOM.on(document, 'keyup', (event) => {
          if (event.key !== keyname) {
            return true;
          }
          if (!state) {
            return true;
          }
          if (skip_next) {
            skip_next = false;
          } else {
            state = false;
          }
          // debug '^_listen_to_key@223^', 'toggle/keyup', { keyname, behavior, entry, }
          handler(freeze({keyname, behavior, state, event}));
          return true;
        });
        //.......................................................................................................
        return null;
      }

      //---------------------------------------------------------------------------------------------------------
      _listen_to_key_latch(keyname, handler) {
        var behavior, state;
        this._initialize_latching();
        state = false;
        behavior = 'latch';
        //.......................................................................................................
        µ.DOM.on(document, 'keyup', (event) => {
          if (keyname === this._get_latching_keyname()) {
            state = !state;
            handler(freeze({keyname, behavior, state, event}));
          }
          return true;
        });
        //.......................................................................................................
        return null;
      }

      //---------------------------------------------------------------------------------------------------------
      _listen_to_key_tlatch(keyname, handler) {
        var behavior, is_latched, state;
        state = false;
        behavior = 'tlatch';
        is_latched = false;
        //.......................................................................................................
        this._listen_to_key(keyname, 'latch', (d) => {
          return is_latched = d.state;
        });
        //.......................................................................................................
        µ.DOM.on(document, 'keydown', (event) => {
          if (event.key !== keyname) {
            return true;
          }
          state = !is_latched;
          handler(freeze({keyname, behavior, state, event}));
          return true;
        });
        //.......................................................................................................
        µ.DOM.on(document, 'keyup', (event) => {
          if (event.key !== keyname) {
            return true;
          }
          state = is_latched;
          handler(freeze({keyname, behavior, state, event}));
          return true;
        });
        //.......................................................................................................
        return null;
      }

      //---------------------------------------------------------------------------------------------------------
      _listen_to_key_ptlatch(keyname, handler) {
        var behavior, is_latched, state;
        state = false;
        behavior = 'ptlatch';
        is_latched = false;
        //.......................................................................................................
        this._listen_to_key(keyname, 'latch', (d) => {
          return is_latched = d.state;
        });
        //.......................................................................................................
        µ.DOM.on(document, 'keydown', (event) => {
          if (event.key !== keyname) {
            return true;
          }
          if (is_latched) {
            return true;
          }
          state = true;
          handler(freeze({keyname, behavior, state, event}));
          return true;
        });
        //.......................................................................................................
        µ.DOM.on(document, 'keyup', (event) => {
          if (event.key !== keyname) {
            return true;
          }
          if (is_latched) {
            return true;
          }
          state = false;
          handler(freeze({keyname, behavior, state, event}));
          return true;
        });
        //.......................................................................................................
        return null;
      }

      //---------------------------------------------------------------------------------------------------------
      _listen_to_key_ntlatch(keyname, handler) {
        var behavior, is_latched, state;
        state = false;
        behavior = 'ntlatch';
        is_latched = false;
        //.......................................................................................................
        this._listen_to_key(keyname, 'latch', (d) => {
          return is_latched = d.state;
        });
        //.......................................................................................................
        µ.DOM.on(document, 'keydown', (event) => {
          if (event.key !== keyname) {
            return true;
          }
          if (!is_latched) {
            return true;
          }
          state = false;
          handler(freeze({keyname, behavior, state, event}));
          return true;
        });
        //.......................................................................................................
        µ.DOM.on(document, 'keyup', (event) => {
          if (event.key !== keyname) {
            return true;
          }
          if (!is_latched) {
            return true;
          }
          state = true;
          handler(freeze({keyname, behavior, state, event}));
          return true;
        });
        //.......................................................................................................
        return null;
      }

      _listen_to_key(keyname, behavior, watcher) {
        var handler;
        boundMethodCheck(this, ref);
        validate.kb_watcher(watcher);
        if (isa.function(watcher)) {
          handler = watcher;
        } else {
          handler = function(d) {
            return µ.DOM.emit_custom_event(watcher, {
              detail: d
            });
          };
        }
        if (keyname === 'Space') {
          keyname = ' ';
        }
        validate.kb_keyname(keyname);
        validate.kb_keytype(behavior);
        //.......................................................................................................
        switch (behavior) {
          case 'push':
            this._listen_to_key_push(keyname, handler);
            break;
          case 'toggle':
            this._listen_to_key_toggle(keyname, handler);
            break;
          case 'latch':
            this._listen_to_key_latch(keyname, handler);
            break;
          case 'tlatch':
            this._listen_to_key_tlatch(keyname, handler);
            break;
          case 'ntlatch':
            this._listen_to_key_ntlatch(keyname, handler);
            break;
          case 'ptlatch':
            this._listen_to_key_ptlatch(keyname, handler);
        }
        //.......................................................................................................
        return null/* NOTE may return a `remove_listener` method ITF */;
      }

    };

    // #---------------------------------------------------------------------------------------------------------
    // _defaults: freeze {
    //   state: freeze { down: false, up: false, toggle: false, latch: false, tlatch: false, }
    //   }

    //---------------------------------------------------------------------------------------------------------
    Kb.prototype._shreg = [];

    Kb.prototype._latching_initialized = false;

    return Kb;

  }).call(this);

}).call(this);

//# sourceMappingURL=kb.js.map