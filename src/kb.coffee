

#-----------------------------------------------------------------------------------------------------------
#
#===========================================================================================================
'use strict'
µ                         = require './main'
log                       = console.log
debug                     = console.debug
freeze                    = Object.freeze
{ types
  isa
  validate
  validate_optional }     = require './types'

#-----------------------------------------------------------------------------------------------------------
defaults                  =

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
    'CapsLock',
    # ------------- Tier B: status doubtful
    # 'Hyper',
    # 'OS',
    # 'Super',
    # 'Symbol',
    # ------------- Tier C: rare, not needed, or not sensed by JS
    # 'Fn',
    # 'FnLock',
    # 'NumLock',
    # 'ScrollLock',
    # 'SymbolLock',
    ]

#-----------------------------------------------------------------------------------------------------------
#
#===========================================================================================================
class @Kb

  #---------------------------------------------------------------------------------------------------------
  constructor: ( cfg ) ->
    @cfg = { defaults..., cfg..., }
    for modifier_name in @cfg.modifier_names
      @_prv_modifiers[ modifier_name ] = null
    freeze( @_prv_modifiers )
    return null

  _prv_modifiers: {}
  _capslock_active: false

  #---------------------------------------------------------------------------------------------------------
  @_registry: null

  #---------------------------------------------------------------------------------------------------------
  ### Get the last known keyboard modifier state. NOTE may be extended with `event` argument ITF. ###
  # µ.DOM.get_kb_modifier_state = () => return { ...prv, }

  #---------------------------------------------------------------------------------------------------------
  get_changed_kb_modifier_state: () =>
    ### Return keyboard modifier state if it has changed since the last call, or `null` if it hasn't changed. ###
    # log( '^33988^', { event, } )
    crt_modifiers     = { _type: event.type, }
    has_changed       = false
    for modifier_name in @cfg.modifier_names
      state                           = event.getModifierState modifier_name
      has_changed                     = has_changed or ( @_prv_modifiers[ modifier_name ] isnt state )
      crt_modifiers[ modifier_name ]  = state
    return @_prv_modifiers = freeze crt_modifiers if has_changed
    return null

#-----------------------------------------------------------------------------------------------------------
# get_kb_modifier_state = ( event, value ) =>
#   @_prv_modifiers = {}
#   for ( modifier_name of @cfg.modifier_names ) {
#     @_prv_modifiers[ modifier_name ] = null
#   freeze( @_prv_modifiers )

  #---------------------------------------------------------------------------------------------------------
  _set_capslock_state: ( capslock_active ) =>
    return null if capslock_active is @_capslock_active
    @_capslock_active = capslock_active
    µ.DOM.emit_custom_event 'µ_kb_capslock_changed', { detail: { CapsLock: capslock_active, }, }
    return null

  # #---------------------------------------------------------------------------------------------------------
  # on_push: ( keynames, handler ) =>
    # keynames  = [ keynames, ] unless isa.list keynames
    # types     = [ types,    ] unless isa.list types
    # validate.keywatch_keynames  keynames
    # validate.keywatch_types     types

  #---------------------------------------------------------------------------------------------------------
  _XXX_initialized = false
  _listen_to_key: ( name, type, listener ) =>
    do =>
      if name? then validate.keywatch_keyname name else name = ''
      if type? then validate.keywatch_keytype type else type = ''
      # debug '^90009^', name + "\x00" + type
      tag       = "#{type}:#{name}"
      registry  = @_registry         ?= {}
      listeners = registry[ tag ]    ?= []
      listeners.push listener
    #.......................................................................................................
    # throw new Error '^493841^' unless type is 'down'
    return null if _XXX_initialized
    _XXX_initialized = true
    debug '^2252^', "binding keydown"
    #.......................................................................................................
    µ.DOM.on document, 'keydown', ( event ) =>
      name = event.key
      type = 'down'
      d       = freeze { name, type, event, }
      for tag in [ "#{type}:#{name}", "#{type}:", ":#{event.key}", ":", ]
        continue unless ( listeners = @_registry[ tag ] )?
        listener d for listener in listeners
      return null
    return null ### NOTE may return a `remove_listener` method ITF ###

  #---------------------------------------------------------------------------------------------------------
  XXXXXXXXXXXX_foobar: =>
    #.......................................................................................................
    handle_kblike_event = ( event ) =>
      modifier_state = @get_changed_kb_modifier_state event
      if ( modifier_state != null )
        µ.DOM.emit_custom_event 'µ_kb_modifier_changed', { detail: modifier_state, }
      @_set_capslock_state event.getModifierState 'CapsLock'
      return null
    #.......................................................................................................
    for event_name in @cfg.kblike_eventnames
      µ.DOM.on document, event_name, handle_kblike_event
    #.......................................................................................................
    µ.DOM.on document, 'keydown', ( event ) =>
      handle_kblike_event event ### !!!!!!!!!!!!!!!!!!!!!! ###
      ### TAINT logic is questionable ###
      if ( event.key is 'CapsLock' ) then @_set_capslock_state not @_capslock_active
      else                                @_set_capslock_state event.getModifierState 'CapsLock'
      return null
    #.......................................................................................................
    µ.DOM.on document, 'keyup', ( event ) =>
      handle_kblike_event event ### !!!!!!!!!!!!!!!!!!!!!! ###
      ### TAINT logic is questionable ###
      return null if event.key is 'CapsLock'
      @_set_capslock_state event.getModifierState 'CapsLock'
      return null
    return null



