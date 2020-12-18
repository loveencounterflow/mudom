(function() {
  //-----------------------------------------------------------------------------------------------------------

  //===========================================================================================================
  'use strict';
  var µ;

  µ = require('./main');

  //-----------------------------------------------------------------------------------------------------------

  //===========================================================================================================
  this.Kb = (function() {
    var caps_lock_pressed, modifier_name;

    class Kb {
      //---------------------------------------------------------------------------------------------------------
      /* Get the last known keyboard modifier state. NOTE may be extended with `event` argument ITF. */
      // µ.DOM.get_kb_modifier_state = () -> return { ...prv, }

        //---------------------------------------------------------------------------------------------------------
      get_changed_kb_modifier_state() {
        var crt_modifiers, has_changed, i, len, prv_modifiers, state;
        /* Return keyboard modifier state if it has changed since the last call, or `null` if it hasn't changed. */
        // log( '^33988^', { event, } )
        crt_modifiers = {
          _type: event.type
        };
        has_changed = false;
        for (i = 0, len = modifier_names.length; i < len; i++) {
          modifier_name = modifier_names[i];
          state = event.getModifierState(modifier_name);
          has_changed = has_changed || (prv_modifiers[modifier_name] !== state);
          crt_modifiers[modifier_name] = state;
        }
        if (has_changed) {
          return prv_modifiers = Object.freeze(crt_modifiers);
        }
        return null;
      }

      //---------------------------------------------------------------------------------------------------------
      handle_kblike_event(event) {
        var modifier_state;
        modifier_state = this.get_changed_kb_modifier_state(event);
        if (modifier_state !== null) {
          µ.DOM.emit_custom_event('mkts_kb_modifier_changed', {
            detail: modifier_state
          });
        }
        return _set_verdict(event.getModifierState('CapsLock'));
      }

      //-----------------------------------------------------------------------------------------------------------
      // get_kb_modifier_state = ( event, value ) ->
      //   prv_modifiers = {}
      //   for ( modifier_name of modifier_names ) {
      //     prv_modifiers[ modifier_name ] = null
      //   Object.freeze( prv_modifiers )

        //---------------------------------------------------------------------------------------------------------
      _set_verdict(value) {
        // console.log('^22928^', µ.DOM.get_kb_modifier_state() )
        if (value) {
          µ.DOM.emit_custom_event('mkts_capslock_pressed');
          caps_lock_pressed = true;
        } else {
          µ.DOM.emit_custom_event('mkts_capslock_released');
          caps_lock_pressed = false;
        }
        return null;
      }

      //---------------------------------------------------------------------------------------------------------
      XXXXXXXXXXXX_foobar() {
        var event_name, i, len;
        for (i = 0, len = kblike_eventnames.length; i < len; i++) {
          event_name = kblike_eventnames[i];
          µ.DOM.on(document, event_name, handle_kblike_event);
        }
        //.......................................................................................................
        µ.DOM.on(document, 'keydown', function(event) {
          /* TAINT logic is questionable */
          if (event.key === 'CapsLock') {
            _set_verdict(!caps_lock_pressed);
          } else {
            _set_verdict(event.getModifierState('CapsLock'));
          }
          return null;
        });
        //.......................................................................................................
        µ.DOM.on(document, 'keyup', function(event) {
          if (event.key === 'CapsLock') {
            /* TAINT logic is questionable */
            return null;
          }
          _set_verdict(event.getModifierState('CapsLock'));
          return null;
        });
        return null;
      }

    };

    //---------------------------------------------------------------------------------------------------------
    Kb.prototype.kblike_eventnames = [
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
    ];

    //---------------------------------------------------------------------------------------------------------
    // 'pointerdown',
    // 'pointerenter',
    // 'pointerleave',
    // 'pointerup',
    // ------------- Tier A: ubiquitous, unequivocal
    Kb.prototype.modifier_names = ['Alt', 'AltGraph', 'Control', 'Meta', 'Shift'];

    //---------------------------------------------------------------------------------------------------------
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
    Kb.prototype.prv_modifiers = {};

    for (modifier_name in modifier_names) {
      prv_modifiers[modifier_name] = null;
    }

    Object.freeze(prv_modifiers);

    //---------------------------------------------------------------------------------------------------------
    caps_lock_pressed = false;

    return Kb;

  }).call(this);

}).call(this);

//# sourceMappingURL=kb.js.map