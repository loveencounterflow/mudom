
'use strict'
loupe                     = require '../loupe.js'
misfit                    = Symbol 'misfit'
debug                     = console.debug
{ types
  isa
  validate }              = require './types'

#-----------------------------------------------------------------------------------------------------------
name_of_match_method      = do ->
  element = document.createElement 'div'
  for name in [ 'matches', 'matchesSelector', 'msMatchesSelector', \
    'mozMatchesSelector', 'webkitMatchesSelector', 'oMatchesSelector', ]
    if element[ name ]?
      ### TAINT remove element? ###
      return name
  return null


#===========================================================================================================
#
#-----------------------------------------------------------------------------------------------------------
class Text
  #---------------------------------------------------------------------------------------------------------
  rpr:          ( x     ) -> loupe.inspect x
  _pen1:        ( x     ) -> if isa.text x then x else @rpr x
  pen:          ( P...  ) -> ( P.map ( x ) => @_pen1        x ).join ' '
  pen_escape:   ( P...  ) -> ( P.map ( x ) => @_pen_escape1 x ).join ' '
  log:          ( P...  ) -> console.log @pen P...

  #---------------------------------------------------------------------------------------------------------
  _pen_escape1: ( x ) ->
    return @_escape x           if isa.text     x
    return @_escape x.outerHTML if isa.element  x
    return @rpr x

  #---------------------------------------------------------------------------------------------------------
  _escape: ( x ) -> x.replace( /&/g, '&amp;' ).replace( /</g, '&lt;' ).replace( />/g, '&gt;' )

#===========================================================================================================
#
#-----------------------------------------------------------------------------------------------------------
class Dom # extends Multimix
  ### inspired by http://youmightnotneedjquery.com
  and https://blog.garstasio.com/you-dont-need-jquery ###

  #=========================================================================================================
  #
  #---------------------------------------------------------------------------------------------------------
  ready: ( f ) ->
    # thx to https://stackoverflow.com/a/7053197/7568091
    # function r(f){/in/.test(document.readyState)?setTimeout(r,9,f):f()}
    validate.function f
    return ( setTimeout ( => @ready f ), 9 ) if /in/.test document.readyState
    return f()


  #=========================================================================================================
  # WARNINGS, NOTIFICATIONS
  #---------------------------------------------------------------------------------------------------------
  _notify: ( message ) ->
    id          = 'msgbx49573'
    message_box = @select "#{id}", null
    if message_box is null
      body            = @select 'body', null
      ### TAINT body element cannot be found when method is called before document ready, but we could still
      construct element immediately, append it on document ready ###
      return unless body?
      style           = "background:#18171d;"
      style          += "position:fixed;"
      style          += "bottom:0mm;"
      style          += "border:1mm dashed #e2ff00;"
      style          += "padding-left:3mm;"
      style          += "padding-right:3mm;"
      style          += "padding-bottom:3mm;"
      style          += "font-family:sans-serif;"
      style          += "font-weight:bold !important;"
      style          += "font-size:3mm;"
      style          += "color:#e2ff00;"
      style          += "width:100%;"
      style          += "max-height:30mm;"
      style          += "overflow-y:scroll;"
      message_box     = @parse_one "<div id=#{id} style='#{style}'></div>"
      @append body, message_box
    message_p       = "<p style='padding-top:3mm;'>"
    message_p      += "⚠️&nbsp;<strong>"
    message_p      += µ.TEXT.pen_escape message
    message_p      += "</strong></p>"
    message_p       = @parse_one message_p
    @insert_as_last message_box, message_p
    return null

  #---------------------------------------------------------------------------------------------------------
  warn: ( P... ) ->
    ### Construct a text message for display in console and in notification box, alongside with a stack trace
    to be shown only in the console, preced by the original arguments as passed into this function,
    meaning that any DOM elements will be expandable links to their visible representations on the HTML
    page. ###
    message = µ.TEXT.pen P...
    error   = new Error message
    console.groupCollapsed P[ 0 ]
    console.warn P...
    console.groupEnd()
    @_notify message

  #=========================================================================================================
  #
  #---------------------------------------------------------------------------------------------------------
  select:     ( selector, fallback = misfit ) -> @select_from     document, selector, fallback
  select_all: ( selector                    ) -> @select_all_from document, selector

  #---------------------------------------------------------------------------------------------------------
  select_from: ( element, selector, fallback = misfit ) ->
    validate.delement element
    validate.nonempty_text selector
    unless ( R = element.querySelector selector )?
      throw new Error "^µDOM/select_from@7758^ no such element: #{µ.TEXT.rpr selector}" if fallback is misfit
      return fallback
    return R

  #---------------------------------------------------------------------------------------------------------
  select_all_from: ( element, selector ) ->
    validate.delement element
    validate.nonempty_text selector
    return element.querySelectorAll selector
    # Array.from element.querySelectorAll selector

  #---------------------------------------------------------------------------------------------------------
  select_id:  ( id, fallback = misfit ) ->
    validate.nonempty_text id
    unless ( R = document.getElementById id )?
      throw new Error "^µDOM/select_id@7758^ no element with ID: #{µ.TEXT.rpr id}" if fallback is misfit
      return fallback
    return R

  #---------------------------------------------------------------------------------------------------------
  matches_selector: ( element, selector ) ->
    validate.nonempty_text selector
    validate.delement element
    return element[ name_of_match_method ] selector

  #---------------------------------------------------------------------------------------------------------
  get:              ( element, name             ) -> validate.element element; element.getAttribute name
  # When called with two arguments as in `set div, 'bar'`, will set values-less attribute (`<div bar>`)
  set:              ( element, name, value = '' ) -> validate.element element; element.setAttribute name, value
  #---------------------------------------------------------------------------------------------------------
  get_classes:      ( element                   ) -> validate.element element; element.classList
  add_class:        ( element, name             ) -> validate.element element; element.classList.add      name
  has_class:        ( element, name             ) -> validate.element element; element.classList.contains name
  remove_class:     ( element, name             ) -> validate.element element; element.classList.remove   name
  toggle_class:     ( element, name             ) -> validate.element element; element.classList.toggle   name
  #---------------------------------------------------------------------------------------------------------
  swap_class: ( element, old_name, new_name ) ->
    element.classList.remove  old_name
    element.classList.add     new_name
  #---------------------------------------------------------------------------------------------------------
  hide:             ( element                   ) -> validate.element element; element.style.display = 'none'
  show:             ( element                   ) -> validate.element element; element.style.display = ''
  #---------------------------------------------------------------------------------------------------------
  get_live_styles:  ( element                   ) -> getComputedStyle element ### validation done by method ###
  ###
  globalThis.get_style = ( element, pseudo_selector, attribute_name ) ->
    unless attribute_name?
      [ pseudo_selector, attribute_name, ] = [ undefined, pseudo_selector, ]
    style = window.getComputedStyle element, pseudo_selector
    return style.getPropertyValue attribute_name
  ###
  ### TAINT also use pseudo_selector, see above ###
  get_style_rule:   ( element, name             ) -> ( getComputedStyle element )[ name ] ### validation done by method ###

  #---------------------------------------------------------------------------------------------------------
  set_style_rule:   ( element, name, value  ) ->
    ### see https://developer.mozilla.org/en-US/docs/Web/API/ElementCSSInlineStyle/style ###
    validate.element element
    validate.nonempty_text name
    element.style[ INTERTEXT.camelize name ] = value


  #=========================================================================================================
  # ELEMENT CREATION
  #---------------------------------------------------------------------------------------------------------
  parse_one: ( element_html ) ->
    R = @parse_all element_html
    unless ( length = R.length ) is 1
      throw new Error "^µDOM/parse_one@7558^ expected HTML for 1 element but got #{length}"
    return R[ 0 ]

  #---------------------------------------------------------------------------------------------------------
  parse_all: ( html ) ->
    ### TAINT return Array or HTMLCollection? ###
    validate.nonempty_text html
    R = document.implementation.createHTMLDocument()
    R.body.innerHTML = html
    return R.body.children

  #---------------------------------------------------------------------------------------------------------
  new_element: ( xname, P... ) ->
    ### TAINT analyze xname (a la `div#id42.foo.bar`) as done in Intertext.Cupofhtml ###
    ### TAINT in some cases using innerHTML, documentFragment may be advantageous ###
    R           = document.createElement xname
    attributes  = {}
    text        = null
    for p in P
      if isa.text p
        text = p
        continue
      attributes = Object.assign attributes, p ### TAINT check type? ###
    R.textContent = text if text?
    R.setAttribute k, v for k, v of attributes
    return R

  #---------------------------------------------------------------------------------------------------------
  deep_copy: ( element ) -> element.cloneNode true


  #=========================================================================================================
  # OUTER, INNER HTML
  #---------------------------------------------------------------------------------------------------------
  get_inner_html:   ( element ) -> validate.element element; element.innerHTML
  get_outer_html:   ( element ) -> validate.element element; element.outerHTML


  #=========================================================================================================
  # INSERTION
  #---------------------------------------------------------------------------------------------------------
  insert: ( position, target, x ) ->
    switch position
      when 'before',    'beforebegin' then return @insert_before   target, x
      when 'as_first',  'afterbegin'  then return @insert_as_first target, x
      when 'as_last',   'beforeend'   then return @insert_as_last  target, x
      when 'after',     'afterend'    then return @insert_after    target, x
    throw new Error "^µDOM/insert@7758^ not a valid position: #{µ.TEXT.rpr position}"

  #---------------------------------------------------------------------------------------------------------
  ### NOTE pending practical considerations and benchmarks we will probably remove one of the two sets
  of insertion methods ###
  insert_before:   ( target, x ) -> validate.element target; target.insertAdjacentElement 'beforebegin', x
  insert_as_first: ( target, x ) -> validate.element target; target.insertAdjacentElement 'afterbegin',  x
  insert_as_last:  ( target, x ) -> validate.element target; target.insertAdjacentElement 'beforeend',   x
  insert_after:    ( target, x ) -> validate.element target; target.insertAdjacentElement 'afterend',    x

  #---------------------------------------------------------------------------------------------------------
  before:   ( target, x... ) -> validate.element target; target.before   x...
  prepend:  ( target, x... ) -> validate.element target; target.prepend  x...
  append:   ( target, x... ) -> validate.element target; target.append   x...
  after:    ( target, x... ) -> validate.element target; target.after    x...


  #=========================================================================================================
  # REMOVAL
  #---------------------------------------------------------------------------------------------------------
  remove: ( element ) ->
    ### see http://youmightnotneedjquery.com/#remove ###
    validate.element element
    element.parentNode.removeChild element


  #=========================================================================================================
  # GEOMETRY
  #---------------------------------------------------------------------------------------------------------
  ### NOTE observe that `DOM.get_offset_top()` and `element.offsetTop` are two different things; terminology
  is confusing here, so consider renaming to avoid `offset` altogether ###
  get_offset_top:  ( element ) -> ( @get_offset element ).top
  get_offset_left: ( element ) -> ( @get_offset element ).left

  #---------------------------------------------------------------------------------------------------------
  get_offset: ( element ) ->
    ### see http://youmightnotneedjquery.com/#offset ###
    validate.element element
    rectangle = element.getBoundingClientRect()
    return {
      top:  rectangle.top   + document.body.scrollTop
      left: rectangle.left  + document.body.scrollLeft }

  #---------------------------------------------------------------------------------------------------------
  ### see http://youmightnotneedjquery.com/#get_width ###
  get_width: ( element ) -> parseFloat ( getComputedStyle element, null ).width


  #=========================================================================================================
  # EVENTS
  #---------------------------------------------------------------------------------------------------------
  on: ( element, name, handler ) ->
    ### TAINT add options ###
    ### see http://youmightnotneedjquery.com/#on, http://youmightnotneedjquery.com/#delegate ###
    ### Also note the addition of a `passive: false` parameter (as in `html_dom.addEventListener 'wheel', f,
    { passive: false, }`); see https://stackoverflow.com/a/55461632/256361; apparently it is a recently
    introduced feature of browser event processing; see also [JQuery issue #2871 *Add support for passive
    event listeners*](https://github.com/jquery/jquery/issues/2871), open as of Dec 2020 ###
    validate.delement element
    validate.nonempty_text name
    validate.function handler
    return element.addEventListener name, handler, false

  #---------------------------------------------------------------------------------------------------------
  emit_custom_event: ( name, options ) ->
    # thx to https://www.javascripttutorial.net/javascript-dom/javascript-custom-events/
    ### Acc. to https://developer.mozilla.org/en-US/docs/Web/API/Event/Event,
    https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent/CustomEvent, allowable fields for `options`
    include `bubbles`, `cancelable`, `composed`, `detail`; the last one may contain arbitrary data and can
    be retrieved as `event.detail`. ###
    validate.nonempty_text name
    document.dispatchEvent new CustomEvent name, options


  #=========================================================================================================
  # DRAGGABLES
  #---------------------------------------------------------------------------------------------------------
  make_draggable: ( element ) ->
    ### thx to http://jsfiddle.net/robertc/kKuqH/
    https://stackoverflow.com/a/6239882/7568091 ###
    @_attach_dragover()
    @_prv_draggable_id++
    id = @_prv_draggable_id
    @set element, 'draggable', true
    #.......................................................................................................
    @on element, 'dragstart', on_drag_start = ( event ) ->
      style = µ.DOM.get_live_styles event.target
      x     = ( parseInt style.left, 10 ) - event.clientX
      y     = ( parseInt style.top,  10 ) - event.clientY
      event.dataTransfer.setData 'application/json', JSON.stringify { x, y, id, }
    #.......................................................................................................
    @on document.body, 'drop', on_drop = ( event ) ->
      transfer  = JSON.parse event.dataTransfer.getData 'application/json'
      return unless id is transfer.id
      left      = event.clientX + transfer.x + 'px'
      top       = event.clientY + transfer.y + 'px'
      µ.DOM.set_style_rule element, 'left', left
      µ.DOM.set_style_rule element, 'top',  top
      event.preventDefault()
      return false
    #.......................................................................................................
    return null
  #.........................................................................................................
  _prv_draggable_id: 0

  #---------------------------------------------------------------------------------------------------------
  _attach_dragover: ->
    ### TAINT Apparently need for correct dragging behavior, but what if we wanted to handle this event? ###
    @on document.body, 'dragover', on_dragover = ( event ) -> event.preventDefault(); return false
    @_attach_dragover = ->
    return null


#===========================================================================================================
# MAGIC
#-----------------------------------------------------------------------------------------------------------
@_magic = Symbol.for 'µDOM'
@TEXT   = new Text()
@DOM    = new Dom()
@KB     = new ( require './kb' ).Kb()

# module.exports.rpr     ?= module.exports.µ.TEXT.rpr.bind( µ.TEXT )
# module.exports.log     ?= module.exports.µ.TEXT.log.bind( µ.TEXT )

###

https://stackoverflow.com/a/117988/7568091

innerHTML is remarkably fast, and in many cases you will get the best results just setting that (I would
just use append).

However, if there is much already in "mydiv" then you are forcing the browser to parse and render all of
that content again (everything that was there before, plus all of your new content). You can avoid this by
appending a document fragment onto "mydiv" instead:

var frag = document.createDocumentFragment();
frag.innerHTML = html;
$("#mydiv").append(frag);
In this way, only your new content gets parsed (unavoidable) and the existing content does not.

EDIT: My bad... I've discovered that innerHTML isn't well supported on document fragments. You can use the
same technique with any node type. For your example, you could create the root table node and insert the
innerHTML into that:

var frag = document.createElement('table');
frag.innerHTML = tableInnerHtml;
$("#mydiv").append(frag);


###
