(function() {
  //-----------------------------------------------------------------------------------------------------------

  //===========================================================================================================
  'use strict';
  var debug, defaults, freeze, log, µ;

  µ = require('./main');

  log = console.log;

  debug = console.debug;

  freeze = Object.freeze;

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
    modifier_names: ['Alt', 'AltGraph', 'Control', 'Meta', 'Shift']
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
  // 'CapsLock',
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
        this._set_verdict = this._set_verdict.bind(this);
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

      _set_verdict(value) {
        // console.log('^22928^', µ.DOM.get_kb_modifier_state() )
        if (value) {
          µ.DOM.emit_custom_event('µ_kb_capslock_active');
          this._caps_lock_pressed = true;
        } else {
          µ.DOM.emit_custom_event('µ_kb_capslock_inactive');
          this._caps_lock_pressed = false;
        }
        return null;
      }

      XXXXXXXXXXXX_foobar() {
        var event_name, handle_kblike_event, i, len, ref;
        //.......................................................................................................
        handle_kblike_event = (event) => {
          var modifier_state;
          modifier_state = this.get_changed_kb_modifier_state(event);
          debug('^2287001^', {modifier_state});
          if (modifier_state !== null) {
            µ.DOM.emit_custom_event('µ_kb_modifier_changed', {
              detail: modifier_state
            });
          }
          this._set_verdict(event.getModifierState('CapsLock'));
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
          /* TAINT logic is questionable */
          if (event.key === 'CapsLock') {
            this._set_verdict(!this._caps_lock_pressed);
          } else {
            this._set_verdict(event.getModifierState('CapsLock'));
          }
          return null;
        });
        //.......................................................................................................
        µ.DOM.on(document, 'keyup', (event) => {
          if (event.key === 'CapsLock') {
            /* TAINT logic is questionable */
            return null;
          }
          this._set_verdict(event.getModifierState('CapsLock'));
          return null;
        });
        return null;
      }

    };

    Kb.prototype._prv_modifiers = {};

    Kb.prototype._caps_lock_pressed = false;

    return Kb;

  }).call(this);

}).call(this);

//# sourceMappingURL=kb.js.map