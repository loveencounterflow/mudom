

'use strict'

misfit                = Symbol 'misfit'
_types                = µ.TYPES.export()
V                     = _types.validate
{ isa }               = _types

#===========================================================================================================
name_of_match_method  = do ->
  element = document.createElement 'div'
  for name in [ 'matches', 'matchesSelector', 'msMatchesSelector', \
    'mozMatchesSelector', 'webkitMatchesSelector', 'oMatchesSelector', ]
    return name if element[ name ]?

#===========================================================================================================
### TAINT probably not correct to only check for Element, at least in some cases could be Node as well ###
µ.TYPES.declare 'element',  ( x ) -> x instanceof Element
µ.TYPES.declare 'delement', ( x ) -> ( x is document ) or ( x instanceof Element )


#===========================================================================================================
class Micro_dom # extends Multimix
  ### inspired by http://youmightnotneedjquery.com
  and https://blog.garstasio.com/you-dont-need-jquery ###

  #---------------------------------------------------------------------------------------------------------
  ready: ( f ) ->
    # thx to https://stackoverflow.com/a/7053197/7568091
    # function r(f){/in/.test(document.readyState)?setTimeout(r,9,f):f()}
    V.function f
    return ( setTimeout ( => @ready f ), 9 ) if /in/.test document.readyState
    return f()
# thx to https://codetonics.com/javascript/detect-document-ready/
# function ready(callbackFunction){
#   if(document.readyState != 'loading')
#     callbackFunction(event)
#   else
#     document.addEventListener("DOMContentLoaded", callbackFunction)}
  #---------------------------------------------------------------------------------------------------------
  select:     ( selector, fallback = misfit ) -> @select_from     document, selector, fallback
  select_all: ( selector                    ) -> @select_all_from document, selector

  #---------------------------------------------------------------------------------------------------------
  select_from: ( element, selector, fallback = misfit ) ->
    V.delement element
    V.nonempty_text selector
    unless ( R = element.querySelector selector )?
      throw new Error "^µDOM/select_from@7758^ no such element: #{µ.rpr selector}" if fallback is misfit
      return fallback
    return R

  #---------------------------------------------------------------------------------------------------------
  select_all_from: ( element, selector ) ->
    V.delement element
    V.nonempty_text selector
    return element.querySelectorAll selector
    # Array.from element.querySelectorAll selector

  #---------------------------------------------------------------------------------------------------------
  select_id:  ( id, fallback = misfit ) ->
    V.nonempty_text id
    unless ( R = document.getElementById id )?
      throw new Error "^µDOM/select_id@7758^ no element with ID: #{µ.rpr id}" if fallback is misfit
      return fallback
    return R

  #---------------------------------------------------------------------------------------------------------
  matches_selector: ( element, selector ) ->
    V.nonempty_text selector
    V.element element
    return element[ name_of_match_method ] selector

  #---------------------------------------------------------------------------------------------------------
  get:              ( element, name         ) -> V.element element; element.getAttribute name
  set:              ( element, name, value  ) -> V.element element; element.setAttribute name, value
  #---------------------------------------------------------------------------------------------------------
  get_classes:      ( element               ) -> V.element element; element.classList
  add_class:        ( element, name         ) -> V.element element; element.classList.add      name
  has_class:        ( element, name         ) -> V.element element; element.classList.contains name
  remove_class:     ( element, name         ) -> V.element element; element.classList.remove   name
  toggle_class:     ( element, name         ) -> V.element element; element.classList.toggle   name
  #---------------------------------------------------------------------------------------------------------
  hide:             ( element               ) -> V.element element; element.style.display = 'none'
  show:             ( element               ) -> V.element element; element.style.display = ''
  #---------------------------------------------------------------------------------------------------------
  get_live_styles:  ( element               ) -> getComputedStyle element ### validation done by method ###
  ###
  globalThis.get_style = ( element, pseudo_selector, attribute_name ) ->
    unless attribute_name?
      [ pseudo_selector, attribute_name, ] = [ undefined, pseudo_selector, ]
    style = window.getComputedStyle element, pseudo_selector
    return style.getPropertyValue attribute_name
  ###
  ### TAINT also use pseudo_selector, see above ###
  get_style_rule:   ( element, name         ) -> ( getComputedStyle element )[ name ] ### validation done by method ###

  #---------------------------------------------------------------------------------------------------------
  set_style_rule:   ( element, name, value  ) ->
    ### see https://developer.mozilla.org/en-US/docs/Web/API/ElementCSSInlineStyle/style ###
    V.element element
    V.nonempty_text name
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
    V.nonempty_text html
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
  get_inner_html:   ( element ) -> V.element element; element.innerHTML
  get_outer_html:   ( element ) -> V.element element; element.outerHTML


  #=========================================================================================================
  # INSERTION
  #---------------------------------------------------------------------------------------------------------
  insert: ( position, target, x ) ->
    switch position
      when 'before',    'beforebegin' then return @insert_before   target, x
      when 'as_first',  'afterbegin'  then return @insert_as_first target, x
      when 'as_last',   'beforeend'   then return @insert_as_last  target, x
      when 'after',     'afterend'    then return @insert_after    target, x
    throw new Error "^µDOM/insert@7758^ not a valid position: #{µ.rpr position}"

  #---------------------------------------------------------------------------------------------------------
  ### NOTE pending practical considerations and benchmarks we will probably remove one of the two sets
  of insertion methods ###
  insert_before:   ( target, x ) -> V.element target; target.insertAdjacentElement 'beforebegin', x
  insert_as_first: ( target, x ) -> V.element target; target.insertAdjacentElement 'afterbegin',  x
  insert_as_last:  ( target, x ) -> V.element target; target.insertAdjacentElement 'beforeend',   x
  insert_after:    ( target, x ) -> V.element target; target.insertAdjacentElement 'afterend',    x

  #---------------------------------------------------------------------------------------------------------
  before:   ( target, x... ) -> V.element target; target.before   x...
  prepend:  ( target, x... ) -> V.element target; target.prepend  x...
  append:   ( target, x... ) -> V.element target; target.append   x...
  after:    ( target, x... ) -> V.element target; target.after    x...


  #=========================================================================================================
  # REMOVAL
  #---------------------------------------------------------------------------------------------------------
  remove: ( element ) ->
    ### see http://youmightnotneedjquery.com/#remove ###
    V.element element
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
    V.element element
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
    V.element element
    V.nonempty_text name
    V.function handler
    return element.addEventListener name, handler, false

  #---------------------------------------------------------------------------------------------------------
  emit_custom_event: ( name, options ) ->
    # thx to https://www.javascripttutorial.net/javascript-dom/javascript-custom-events/
    V.nonempty_text name
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





( globalThis.µ ?= {} ).DOM = new Micro_dom()

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
