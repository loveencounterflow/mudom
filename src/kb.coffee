

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

  #---------------------------------------------------------------------------------------------------------
  _registry:          {}
  _initialized_types: {}

  #---------------------------------------------------------------------------------------------------------
  _add_dom_kb_event_listener: ( keyname, eventname, callback ) ->
    ### Given a `keyname`, an `eventname` (such as `'keydown'` or `'keyup'`) and a `callback`, add an event
    listener such that `callback` will be called with an `event` as argument whenever a DOM event for that
    specific key and event name is triggered. ###
    validate.keywatch_keyname name
    validate.nonempty_text eventname
    validate.function callback
    µ.DOM.on document, eventname, ( event ) =>
      callback event if event.key is keyname
      return true
    return null ### TAINT may return listener reference ITF ###

  #---------------------------------------------------------------------------------------------------------
  _detect_tlatch_events: ( name, callback ) =>
    debug '^339^', name
    entry     = @_registry[ name ] ?= {}
    state     = entry.state        ?= {}
    µ.DOM.on document, 'keydown', ( event ) =>
      state.tlatch = not state.latch
      debug '^4455-keydown^', name, state
      callback event
    µ.DOM.on document, 'keyup',   ( event ) =>
      state.tlatch =     state.latch
      debug '^4455-keyup^', name, state
      callback event
    return null

  #---------------------------------------------------------------------------------------------------------
  _call_handlers: ( behavior, event ) =>
    name      = event.key
    entry     = @_registry[ name  ]; return null unless entry?
    handlers  = entry[ behavior   ]; return null unless handlers?
    state     = entry.state
    switch behavior
      when 'up'     then state.up     = true;   state.down = false
      when 'down'   then state.up     = false;  state.down = true
      when 'latch'  then state.latch  = not state.latch
      when 'toggle'
        toggle  = ( state.toggle ?= false )
        if ( event.type is 'keydown' ) and ( toggle is false )
          state.toggle      = true
          entry.skip_next_keyup   = true
        else if ( event.type is 'keyup' ) and ( toggle is true )
          if entry.skip_next_keyup then entry.skip_next_keyup = false
          else                          state.toggle          = false
    #.......................................................................................................
    state     = freeze { state..., }
    d         = freeze { name, behavior, state, event, }
    ### TAINT also call catchall handlers ###
    ### TAINT consider to use method to retrieve handlers ###
    handler d for handler in handlers
    return null

  #---------------------------------------------------------------------------------------------------------
  _add_listener_for_behavior: ( behavior, keyname ) ->
    return null if @_initialized_types[ behavior ]
    @_initialized_types[ behavior ] = true
    #.......................................................................................................
    switch behavior
      when 'up', 'down'
        eventname = "key#{behavior}"
        µ.DOM.on document, eventname,  ( event ) => @_call_handlers behavior, event
      when 'latch'
        @_detect_latch_events           ( event ) => @_call_handlers behavior, event
      when 'tlatch'
        @_detect_tlatch_events keyname, ( event ) => @_call_handlers behavior, event
      when 'toggle'
        µ.DOM.on document, 'keyup',     ( event ) => @_call_handlers behavior, event
        µ.DOM.on document, 'keydown',   ( event ) => @_call_handlers behavior, event
      else
        µ.DOM.warn "^4453^ unknown key event behavior: #{µ.TEXT.rpr behavior}"
    return null ### NOTE may return a `remove_listener` method ITF ###

  #---------------------------------------------------------------------------------------------------------
  _listen_to_key: ( name, behavior, handler ) =>
    ### NOTE catch-all bindings to be implemented later ###
    ### NOTE allowing for `'Space'` as alias for `' '` ###
    name      = ' ' if name is 'Space'
    validate.keywatch_keyname name
    validate.keywatch_keytype behavior
    entry     = @_registry[ name ] ?= {}
    state     = entry.state        ?= {}
    handlers  = entry[ behavior  ] ?= []
    handlers.push handler
    debug '^_listen_to_key@1112^', { name, behavior, }
    @_add_listener_for_behavior behavior, name
    #.......................................................................................................
    return null ### NOTE may return a `remove_listener` method ITF ###

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
  _initialized_latching: ->
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

  #---------------------------------------------------------------------------------------------------------
  _listen_to_key: ( keyname, behavior, handler ) =>
    keyname = ' ' if keyname is 'Space'
    validate.keywatch_keyname keyname
    validate.keywatch_keytype behavior
    entry   = { state: false, }
    # entry   = @_registry[ keyname ]  ?= {}
    # state   = entry.state            ?= { @_defaults.state..., }
    #.......................................................................................................
    do ( entry ) =>
      # debug '^@Kb2._listen_to_key@30^', { keyname, behavior, }
      switch behavior
        #...................................................................................................
        when 'push'
          µ.DOM.on document, 'keydown', ( event ) =>
            return true unless event.key is keyname
            entry.state = true
            handler freeze { keyname, behavior, state: entry.state, event, }
            return true
          µ.DOM.on document, 'keyup', ( event ) =>
            return true unless event.key is keyname
            entry.state = false
            handler freeze { keyname, behavior, state: entry.state, event, }
            return true
        #...................................................................................................
        when 'toggle'
          µ.DOM.on document, 'keydown', ( event ) =>
            return true unless event.key is keyname
            return true if entry.state
            entry.state           = true
            entry.skip_next_keyup = true
            # debug '^_listen_to_key@223^', 'keydown', { keyname, behavior, entry, }
            handler freeze { keyname, behavior, state: entry.state, event, }
            return true
          µ.DOM.on document, 'keyup', ( event ) =>
            return true unless event.key is keyname
            return true if not entry.state
            if entry.skip_next_keyup then entry.skip_next_keyup = false
            else                          entry.state           = false
            # debug '^_listen_to_key@223^', 'toggle/keyup', { keyname, behavior, entry, }
            handler freeze { keyname, behavior, state: entry.state, event, }
            return true
        #...................................................................................................
        when 'latch'
          @_initialized_latching()
          µ.DOM.on document, 'keyup', ( event ) =>
            if keyname is @_get_latching_keyname()
              entry.state = not entry.state
              handler freeze { keyname, behavior, state: entry.state, event, }
            return true
        #...................................................................................................
      return null
    #.......................................................................................................
    return null ### NOTE may return a `remove_listener` method ITF ###


