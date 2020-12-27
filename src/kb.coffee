

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
  latch:
    dt:     350 # time in milliseconds between first and last key event to trigger latching

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
class @_Kb

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
    for eventname in @cfg.kblike_eventnames
      µ.DOM.on document, eventname, handle_kblike_event
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

class @Kb extends @_Kb

  # #---------------------------------------------------------------------------------------------------------
  # _defaults: freeze {
  #   state: freeze { down: false, up: false, toggle: false, latch: false, tlatch: false, }
  #   }

  #---------------------------------------------------------------------------------------------------------
  _shreg:                 []
  _latching_initialized:  false

  #---------------------------------------------------------------------------------------------------------
  _get_latching_keyname: ->
    return null unless ( Date.now() - ( @_shreg[ 0 ]?.t ? 0 ) ) < @cfg.latch.dt
    return null unless @_shreg[ 0 ]?.dir   is 'down'
    return null unless @_shreg[ 1 ]?.dir   is 'up'
    return null unless @_shreg[ 2 ]?.dir   is 'down'
    return null unless @_shreg[ 3 ]?.dir   is 'up'
    return null unless @_shreg[ 0 ]?.name  is @_shreg[ 1 ]?.name is @_shreg[ 2 ]?.name is @_shreg[ 3 ]?.name
    R               = @_shreg[ 3 ].name
    return R

  #---------------------------------------------------------------------------------------------------------
  _initialize_latching: ->
    return null if @_latching_initialized
    @_latching_initialized = true
    push = ( dir, event ) =>
      name = event.key
      @_shreg.push { dir, name, t: Date.now(), }
      @_shreg.shift() while @_shreg.length > 4
      return true
    µ.DOM.on document, 'keydown', ( event ) => push 'down', event
    µ.DOM.on document, 'keyup',   ( event ) => push 'up',   event
    return null

  #=========================================================================================================
  #
  #---------------------------------------------------------------------------------------------------------
  _listen_to_key_push: ( keyname, handler ) ->
    state     = false
    behavior  = 'push'
    #.......................................................................................................
    µ.DOM.on document, 'keydown', ( event ) =>
      return true unless event.key is keyname
      state = true
      handler freeze { keyname, behavior, state, event, }
      return true
    #.......................................................................................................
    µ.DOM.on document, 'keyup', ( event ) =>
      return true unless event.key is keyname
      state = false
      handler freeze { keyname, behavior, state, event, }
      return true
    #.......................................................................................................
    return null

  #---------------------------------------------------------------------------------------------------------
  _listen_to_key_toggle: ( keyname, handler ) ->
    state     = false
    behavior  = 'toggle'
    skip_next = false
    #.......................................................................................................
    µ.DOM.on document, 'keydown', ( event ) =>
      return true unless event.key is keyname
      return true if state
      state           = true
      skip_next = true
      # debug '^_listen_to_key@223^', 'keydown', { keyname, behavior, entry, }
      handler freeze { keyname, behavior, state, event, }
      return true
    #.......................................................................................................
    µ.DOM.on document, 'keyup', ( event ) =>
      return true unless event.key is keyname
      return true if not state
      if skip_next then skip_next = false
      else              state     = false
      # debug '^_listen_to_key@223^', 'toggle/keyup', { keyname, behavior, entry, }
      handler freeze { keyname, behavior, state, event, }
      return true
    #.......................................................................................................
    return null

  #---------------------------------------------------------------------------------------------------------
  _listen_to_key_latch: ( keyname, handler ) ->
    @_initialize_latching()
    state     = false
    behavior  = 'latch'
    #.......................................................................................................
    µ.DOM.on document, 'keyup', ( event ) =>
      if keyname is @_get_latching_keyname()
        state = not state
        handler freeze { keyname, behavior, state, event, }
      return true
    #.......................................................................................................
    return null

  #---------------------------------------------------------------------------------------------------------
  _listen_to_key_tlatch: ( keyname, handler ) ->
    state       = false
    behavior    = 'tlatch'
    is_latched  = false
    #.......................................................................................................
    @_listen_to_key keyname, 'latch', ( d ) =>
      is_latched = d.state
    #.......................................................................................................
    µ.DOM.on document, 'keydown', ( event ) =>
      return true unless event.key is keyname
      state = not is_latched
      handler freeze { keyname, behavior, state, event, }
      return true
    #.......................................................................................................
    µ.DOM.on document, 'keyup',   ( event ) =>
      return true unless event.key is keyname
      state = is_latched
      handler freeze { keyname, behavior, state, event, }
      return true
    #.......................................................................................................
    return null

  #---------------------------------------------------------------------------------------------------------
  _listen_to_key_ptlatch: ( keyname, handler ) ->
    state       = false
    behavior    = 'ptlatch'
    is_latched  = false
    #.......................................................................................................
    @_listen_to_key keyname, 'latch', ( d ) =>
      is_latched = d.state
    #.......................................................................................................
    µ.DOM.on document, 'keydown', ( event ) =>
      return true unless event.key is keyname
      return true if is_latched
      state = true
      handler freeze { keyname, behavior, state, event, }
      return true
    #.......................................................................................................
    µ.DOM.on document, 'keyup',   ( event ) =>
      return true unless event.key is keyname
      return true if is_latched
      state = false
      handler freeze { keyname, behavior, state, event, }
      return true
    #.......................................................................................................
    return null

  #---------------------------------------------------------------------------------------------------------
  _listen_to_key_ntlatch: ( keyname, handler ) ->
    state       = false
    behavior    = 'ntlatch'
    is_latched  = false
    #.......................................................................................................
    @_listen_to_key keyname, 'latch', ( d ) =>
      is_latched = d.state
    #.......................................................................................................
    µ.DOM.on document, 'keydown', ( event ) =>
      return true unless event.key is keyname
      return true unless is_latched
      state = false
      handler freeze { keyname, behavior, state, event, }
      return true
    #.......................................................................................................
    µ.DOM.on document, 'keyup',   ( event ) =>
      return true unless event.key is keyname
      return true unless is_latched
      state = true
      handler freeze { keyname, behavior, state, event, }
      return true
    #.......................................................................................................
    return null

  #---------------------------------------------------------------------------------------------------------
  _listen_to_key: ( keyname, behavior, handler ) =>
    keyname = ' ' if keyname is 'Space'
    validate.keywatch_keyname keyname
    validate.keywatch_keytype behavior
    #.......................................................................................................
    switch behavior
      when 'push'     then @_listen_to_key_push     keyname, handler
      when 'toggle'   then @_listen_to_key_toggle   keyname, handler
      when 'latch'    then @_listen_to_key_latch    keyname, handler
      when 'tlatch'   then @_listen_to_key_tlatch   keyname, handler
      when 'ntlatch'  then @_listen_to_key_ntlatch  keyname, handler
      when 'ptlatch'  then @_listen_to_key_ptlatch  keyname, handler
    #.......................................................................................................
    return null ### NOTE may return a `remove_listener` method ITF ###


