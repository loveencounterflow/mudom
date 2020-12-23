

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

  ##########################################################################################################
  ##########################################################################################################
  ##########################################################################################################
  ##########################################################################################################
  ##########################################################################################################
  ##########################################################################################################

  #---------------------------------------------------------------------------------------------------------
  _registry:          {}
  _initialized_types: {}

  #---------------------------------------------------------------------------------------------------------
  # µ_DOM_detect_doublekey_events { event_name: 'µKB_doublekey', dt: 350, }
  _detect_doublekey_events: ( cfg, callback ) =>
    defaults  = { dt: 350, }
    cfg       = { defaults..., cfg..., }
    shreg     = []
    #.......................................................................................................
    get_double_key = ->
      return null unless ( Date.now() - ( shreg[ 0 ]?.t ? 0 ) ) < cfg.dt
      return null unless shreg[ 0 ]?.dir   is 'down'
      return null unless shreg[ 1 ]?.dir   is 'up'
      return null unless shreg[ 2 ]?.dir   is 'down'
      return null unless shreg[ 3 ]?.dir   is 'up'
      return null unless shreg[ 0 ]?.name  is shreg[ 1 ]?.name is shreg[ 2 ]?.name is shreg[ 3 ]?.name
      R             = shreg[ 3 ].name
      shreg.length  = 0
      return R
    #.......................................................................................................
    shift = -> shreg.shift()
    push = ( dir, event ) ->
      name = event.key
      shreg.push { dir, name, t: Date.now(), }
      shreg.shift() while shreg.length > 4
      if name == get_double_key()
        callback event
      return null
    #.......................................................................................................
    µ.DOM.on document, 'keydown', ( event ) => push 'down', event
    µ.DOM.on document, 'keyup',   ( event ) => push 'up',   event
    return null

  #---------------------------------------------------------------------------------------------------------
  _listen_to_key: ( name, behavior, handler ) =>
    ### NOTE catch-all bindings to be implemented later ###
    ### NOTE allowing for `'Space'` as alias for `' '` ###
    name = ' ' if name is 'Space'
    validate.keywatch_keyname name
    validate.keywatch_keytype behavior
    entry     = @_registry[ name ] ?= {}
    state     = entry.state        ?= {}
    handlers  = entry[ behavior  ] ?= []
    handlers.push handler
    @_add_listener_for_behavior behavior
    #.......................................................................................................
    return null ### NOTE may return a `remove_listener` method ITF ###

  #---------------------------------------------------------------------------------------------------------
  _call_handlers: ( behavior, event ) =>
    name      = event.key
    entry     = @_registry[ name  ]; return null unless entry?
    handlers  = entry[ behavior   ]; return null unless handlers?
    state     = entry.state
    switch behavior
      when 'up'     then state.up     = true;   state.down = false
      when 'down'   then state.up     = false;  state.down = true
      when 'dlatch' then state.dlatch = not state.dlatch
      when 'slatch'
        slatch  = ( state.slatch ?= false )
        # log '^298^', xxx_count, { slatch, type: event.type, skip_next_keyup: entry.skip_next_keyup, }
        if ( event.type is 'keydown' ) and ( slatch is false )
          state.slatch      = true
          entry.skip_next_keyup   = true
        else if ( event.type is 'keyup' ) and ( slatch is true )
          if entry.skip_next_keyup then entry.skip_next_keyup = false
          else                          state.slatch          = false
    #.......................................................................................................
    state     = freeze { state..., }
    d         = freeze { name, behavior, state, event, }
    ### TAINT also call catchall handlers ###
    ### TAINT consider to use method to retrieve handlers ###
    handler d for handler in handlers
    return null

  #---------------------------------------------------------------------------------------------------------
  _add_listener_for_behavior: ( behavior ) ->
    return null if @_initialized_types[ behavior ]
    @_initialized_types[ behavior ] = true
    debug '^2252^', "binding behavior #{behavior}"
    #.......................................................................................................
    switch behavior
      when 'up', 'down'
        event_name = "key#{behavior}"
        µ.DOM.on document, event_name,  ( event ) => @_call_handlers behavior, event
      when 'dlatch'
        @_detect_doublekey_events null, ( event ) => @_call_handlers behavior, event
      when 'slatch'
        µ.DOM.on document, 'keyup',     ( event ) => @_call_handlers behavior, event
        µ.DOM.on document, 'keydown',   ( event ) => @_call_handlers behavior, event
      else
        µ.DOM.warn "^4453^ unknown key event behavior: #{µ.TEXT.rpr behavior}"
    return null ### NOTE may return a `remove_listener` method ITF ###

