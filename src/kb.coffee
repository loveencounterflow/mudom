

#-----------------------------------------------------------------------------------------------------------
#
#===========================================================================================================
'use strict'
µ = require './main'


#-----------------------------------------------------------------------------------------------------------
#
#===========================================================================================================
class @Kb

  #---------------------------------------------------------------------------------------------------------
  kblike_eventnames: [
    # ### TAINT not all of these events are needed
    'click',
    # 'dblclick', # implied / preceded by `click` event
    # 'drag', 'dragend', 'dragenter', 'dragleave', 'dragover', 'dragstart',
    # 'mousedown', 'mouseenter', 'mouseleave', 'mousemove', 'mouseout', 'mouseover', 'mouseup',
    # 'pointercancel',
    'wheel',
    'pointermove',
    'pointerout',
    'pointerover',
    # 'pointerdown',
    # 'pointerenter',
    # 'pointerleave',
    # 'pointerup',
    ]

  #---------------------------------------------------------------------------------------------------------
  modifier_names: [
    # ------------- Tier A: ubiquitous, unequivocal
    'Alt',
    'AltGraph',
    'Control',
    'Meta',
    'Shift',
    # ------------- Tier B: status doubtful
    # 'Hyper',
    # 'OS',
    # 'Super',
    # 'Symbol',
    # ------------- Tier C: rare, not needed, or not sensed by JS
    # 'Fn',
    # 'CapsLock',
    # 'FnLock',
    # 'NumLock',
    # 'ScrollLock',
    # 'SymbolLock',
    ]

  #---------------------------------------------------------------------------------------------------------
  prv_modifiers: {}
  for modifier_name of modifier_names
    prv_modifiers[ modifier_name ] = null
  Object.freeze( prv_modifiers )

  #---------------------------------------------------------------------------------------------------------
  caps_lock_pressed = false

  #---------------------------------------------------------------------------------------------------------
  ### Get the last known keyboard modifier state. NOTE may be extended with `event` argument ITF. ###
  # µ.DOM.get_kb_modifier_state = () -> return { ...prv, }

  #---------------------------------------------------------------------------------------------------------
  get_changed_kb_modifier_state: () ->
    ### Return keyboard modifier state if it has changed since the last call, or `null` if it hasn't changed. ###
    # log( '^33988^', { event, } )
    crt_modifiers     = { _type: event.type, }
    has_changed       = false
    for modifier_name in modifier_names
      state                           = event.getModifierState modifier_name
      has_changed                     = has_changed or ( prv_modifiers[ modifier_name ] isnt state )
      crt_modifiers[ modifier_name ]  = state
    if has_changed
      return prv_modifiers = Object.freeze crt_modifiers
    return null

  #---------------------------------------------------------------------------------------------------------
  handle_kblike_event: ( event ) ->
    modifier_state = @get_changed_kb_modifier_state event
    if ( modifier_state != null )
      µ.DOM.emit_custom_event 'mkts_kb_modifier_changed', { detail: modifier_state, }
    _set_verdict event.getModifierState 'CapsLock'

#-----------------------------------------------------------------------------------------------------------
# get_kb_modifier_state = ( event, value ) ->
#   prv_modifiers = {}
#   for ( modifier_name of modifier_names ) {
#     prv_modifiers[ modifier_name ] = null
#   Object.freeze( prv_modifiers )

  #---------------------------------------------------------------------------------------------------------
  _set_verdict: ( value ) ->
    # console.log('^22928^', µ.DOM.get_kb_modifier_state() )
    if ( value )
      µ.DOM.emit_custom_event 'mkts_capslock_pressed'
      caps_lock_pressed = true
    else
      µ.DOM.emit_custom_event 'mkts_capslock_released'
      caps_lock_pressed = false
    return null

  #---------------------------------------------------------------------------------------------------------
  XXXXXXXXXXXX_foobar: ->
    for event_name in kblike_eventnames
      µ.DOM.on document, event_name, handle_kblike_event
    #.......................................................................................................
    µ.DOM.on document, 'keydown', ( event ) ->
      ### TAINT logic is questionable ###
      if ( event.key is 'CapsLock' ) then _set_verdict not caps_lock_pressed
      else                                _set_verdict event.getModifierState 'CapsLock'
      return null
    #.......................................................................................................
    µ.DOM.on document, 'keyup', ( event ) ->
      ### TAINT logic is questionable ###
      return null if event.key is 'CapsLock'
      _set_verdict event.getModifierState 'CapsLock'
      return null
    return null


