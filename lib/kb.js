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
        // validate.keywatch_keynames  keynames
        // validate.keywatch_types     types

        //---------------------------------------------------------------------------------------------------------
        this.XXXXXXXXXXXX_foobar = this.XXXXXXXXXXXX_foobar.bind(this);
        //---------------------------------------------------------------------------------------------------------
        this._detect_tlatch_events = this._detect_tlatch_events.bind(this);
        //---------------------------------------------------------------------------------------------------------
        this._call_handlers = this._call_handlers.bind(this);
        //---------------------------------------------------------------------------------------------------------
        this._listen_to_key = this._listen_to_key.bind(this);
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

      //---------------------------------------------------------------------------------------------------------
      _add_dom_kb_event_listener(keyname, eventname, callback) {
        /* Given a `keyname`, an `eventname` (such as `'keydown'` or `'keyup'`) and a `callback`, add an event
           listener such that `callback` will be called with an `event` as argument whenever a DOM event for that
           specific key and event name is triggered. */
        validate.keywatch_keyname(name);
        validate.nonempty_text(eventname);
        validate.function(callback);
        µ.DOM.on(document, eventname, (event) => {
          if (event.key === keyname) {
            callback(event);
          }
          return true;
        });
        return null/* TAINT may return listener reference ITF */;
      }

      _detect_tlatch_events(name, callback) {
        var base, entry, state;
        debug('^339^', name);
        entry = (base = this._registry)[name] != null ? base[name] : base[name] = {};
        state = entry.state != null ? entry.state : entry.state = {};
        µ.DOM.on(document, 'keydown', (event) => {
          state.tlatch = !state.latch;
          debug('^4455-keydown^', name, state);
          return callback(event);
        });
        µ.DOM.on(document, 'keyup', (event) => {
          state.tlatch = state.latch;
          debug('^4455-keyup^', name, state);
          return callback(event);
        });
        return null;
      }

      _call_handlers(behavior, event) {
        var d, entry, handler, handlers, i, len, name, state, toggle;
        name = event.key;
        entry = this._registry[name];
        if (entry == null) {
          return null;
        }
        handlers = entry[behavior];
        if (handlers == null) {
          return null;
        }
        state = entry.state;
        switch (behavior) {
          case 'up':
            state.up = true;
            state.down = false;
            break;
          case 'down':
            state.up = false;
            state.down = true;
            break;
          case 'latch':
            state.latch = !state.latch;
            break;
          case 'toggle':
            toggle = (state.toggle != null ? state.toggle : state.toggle = false);
            if ((event.type === 'keydown') && (toggle === false)) {
              state.toggle = true;
              entry.skip_next_keyup = true;
            } else if ((event.type === 'keyup') && (toggle === true)) {
              if (entry.skip_next_keyup) {
                entry.skip_next_keyup = false;
              } else {
                state.toggle = false;
              }
            }
        }
        //.......................................................................................................
        state = freeze({...state});
        d = freeze({name, behavior, state, event});
        for (i = 0, len = handlers.length; i < len; i++) {
          handler = handlers[i];
          /* TAINT also call catchall handlers */
          /* TAINT consider to use method to retrieve handlers */
          handler(d);
        }
        return null;
      }

      //---------------------------------------------------------------------------------------------------------
      _add_listener_for_behavior(behavior, keyname) {
        var eventname;
        if (this._initialized_types[behavior]) {
          return null;
        }
        this._initialized_types[behavior] = true;
        //.......................................................................................................
        switch (behavior) {
          case 'up':
          case 'down':
            eventname = `key${behavior}`;
            µ.DOM.on(document, eventname, (event) => {
              return this._call_handlers(behavior, event);
            });
            break;
          case 'latch':
            this._detect_latch_events((event) => {
              return this._call_handlers(behavior, event);
            });
            break;
          case 'tlatch':
            this._detect_tlatch_events(keyname, (event) => {
              return this._call_handlers(behavior, event);
            });
            break;
          case 'toggle':
            µ.DOM.on(document, 'keyup', (event) => {
              return this._call_handlers(behavior, event);
            });
            µ.DOM.on(document, 'keydown', (event) => {
              return this._call_handlers(behavior, event);
            });
            break;
          default:
            µ.DOM.warn(`^4453^ unknown key event behavior: ${µ.TEXT.rpr(behavior)}`);
        }
        return null/* NOTE may return a `remove_listener` method ITF */;
      }

      _listen_to_key(name, behavior, handler) {
        var base, entry, handlers, state;
        if (name === 'Space') {
          name = ' ';
        }
        validate.keywatch_keyname(name);
        validate.keywatch_keytype(behavior);
        entry = (base = this._registry)[name] != null ? base[name] : base[name] = {};
        state = entry.state != null ? entry.state : entry.state = {};
        handlers = entry[behavior] != null ? entry[behavior] : entry[behavior] = [];
        handlers.push(handler);
        debug('^_listen_to_key@1112^', {name, behavior});
        this._add_listener_for_behavior(behavior, name);
        //.......................................................................................................
        return null/* NOTE may return a `remove_listener` method ITF */;
      }

    };

    _Kb.prototype._prv_modifiers = {};

    _Kb.prototype._capslock_active = false;

    //#########################################################################################################
    //#########################################################################################################
    //#########################################################################################################
    //#########################################################################################################
    //#########################################################################################################
    //#########################################################################################################

    //---------------------------------------------------------------------------------------------------------
    _Kb.prototype._registry = {};

    _Kb.prototype._initialized_types = {};

    return _Kb;

  }).call(this);

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
      _initialized_latching() {
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

      _listen_to_key(keyname, behavior, handler) {
        var entry;
        boundMethodCheck(this, ref);
        if (keyname === 'Space') {
          keyname = ' ';
        }
        validate.keywatch_keyname(keyname);
        validate.keywatch_keytype(behavior);
        entry = {
          state: false
        };
        // entry   = @_registry[ keyname ]  ?= {}
        // state   = entry.state            ?= { @_defaults.state..., }
        //.......................................................................................................
        ((entry) => {
          // debug '^@Kb2._listen_to_key@30^', { keyname, behavior, }
          switch (behavior) {
            //...................................................................................................
            case 'push':
              µ.DOM.on(document, 'keydown', (event) => {
                if (event.key !== keyname) {
                  return true;
                }
                entry.state = true;
                handler(freeze({
                  keyname,
                  behavior,
                  state: entry.state,
                  event
                }));
                return true;
              });
              µ.DOM.on(document, 'keyup', (event) => {
                if (event.key !== keyname) {
                  return true;
                }
                entry.state = false;
                handler(freeze({
                  keyname,
                  behavior,
                  state: entry.state,
                  event
                }));
                return true;
              });
              break;
            //...................................................................................................
            case 'toggle':
              µ.DOM.on(document, 'keydown', (event) => {
                if (event.key !== keyname) {
                  return true;
                }
                if (entry.state) {
                  return true;
                }
                entry.state = true;
                entry.skip_next_keyup = true;
                // debug '^_listen_to_key@223^', 'keydown', { keyname, behavior, entry, }
                handler(freeze({
                  keyname,
                  behavior,
                  state: entry.state,
                  event
                }));
                return true;
              });
              µ.DOM.on(document, 'keyup', (event) => {
                if (event.key !== keyname) {
                  return true;
                }
                if (!entry.state) {
                  return true;
                }
                if (entry.skip_next_keyup) {
                  entry.skip_next_keyup = false;
                } else {
                  entry.state = false;
                }
                // debug '^_listen_to_key@223^', 'toggle/keyup', { keyname, behavior, entry, }
                handler(freeze({
                  keyname,
                  behavior,
                  state: entry.state,
                  event
                }));
                return true;
              });
              break;
            //...................................................................................................
            case 'latch':
              this._initialized_latching();
              µ.DOM.on(document, 'keyup', (event) => {
                if (keyname === this._get_latching_keyname()) {
                  entry.state = !entry.state;
                  handler(freeze({
                    keyname,
                    behavior,
                    state: entry.state,
                    event
                  }));
                }
                return true;
              });
          }
          //...................................................................................................
          return null;
        })(entry);
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