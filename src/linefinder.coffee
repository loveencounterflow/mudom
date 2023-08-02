
'use strict'

TU = require '../deps/traverse_util.js'

#===========================================================================================================
every  = ( dts, f  ) =>                            setInterval f,                  dts * 1000
after  = ( dts, f  ) => new Promise ( resolve ) => setTimeout  ( -> resolve f() ), dts * 1000
sleep  = ( dts     ) => new Promise ( resolve ) => setTimeout  resolve,            dts * 1000
defer  = ( f = ->  ) => await sleep 0; return await f()

#===========================================================================================================
### TAINT to be integrated with types ###
defaults = {}
#...........................................................................................................
defaults.finder_cfg =
  ### TAINT inconsistent naming ###
  box_element_name:         'div'
  box_class_name:           'box'
  cover_class_name:         'cover'
  xxx_height_factor:        1 / 2 ### relative minimum height to recognize line step ###
  inject_stylesheet_after:  null
  inject_stylesheet_before: null
#...........................................................................................................
defaults.distributor_cfg =
  paragraph_selector:       'galley > p'
  iframe_selector:          'iframe'
defaults.distributor_cfg = { defaults.finder_cfg..., defaults.distributor_cfg..., }


#===========================================================================================================
class Slug
  constructor: ({ llnr, rlnr, node, rectangle, }) ->
    @llnr       = llnr
    @rlnr       = rlnr
    @node       = node
    @rectangle  = rectangle
    return undefined


#===========================================================================================================
class Finder

  #---------------------------------------------------------------------------------------------------------
  constructor: ( cfg ) ->
    ### TAINT use intertype ###
    @cfg = Object.freeze { defaults.finder_cfg..., cfg..., }
    @_inject_stylesheet 'after',  @cfg.inject_stylesheet_after  if @cfg.inject_stylesheet_after?
    @_inject_stylesheet 'before', @cfg.inject_stylesheet_before if @cfg.inject_stylesheet_before?
    return undefined

  #---------------------------------------------------------------------------------------------------------
  draw_box: ( rectangle ) ->
    box               = document.createElement @cfg.box_element_name
    box.style.top     =  rectangle.top       + 'px'
    box.style.left    =  rectangle.left      + 'px'
    box.style.width   =  rectangle.width - 1 + 'px' # collapse borders
    box.style.height  =  rectangle.height    + 'px'
    box.classList.add @cfg.box_class_name
    document.body.appendChild box
    return box

  #---------------------------------------------------------------------------------------------------------
  ### TAINT to be merged with `draw_box()` in new method ###
  xxx_draw_line_cover: ( rectangle ) ->
    box               = document.createElement @cfg.box_element_name
    box.style.top     =  rectangle.top       + 'px'
    box.style.left    =  rectangle.left      + 'px'
    box.style.width   =  rectangle.width - 1 + 'px' # collapse borders
    box.style.height  =  rectangle.height    + 'px'
    box.classList.add @cfg.box_class_name
    box.classList.add @cfg.cover_class_name
    document.body.appendChild box
    return box

  #---------------------------------------------------------------------------------------------------------
  _get_next_chr_rectangles: ( node, c1, c2 ) ->
    TU.TraverseUtil.getNextChar c1, c2, [], false
    selection   = TU.TraverseUtil.setSelection c1, c2
    range       = selection.getRangeAt 0
    return null unless node.contains range.startContainer.parentNode
    return null unless node.contains range.endContainer.parentNode
    return range.getClientRects()

  #---------------------------------------------------------------------------------------------------------
  walk_chr_rectangles_of_node: ( node ) ->
    text_node     = node.childNodes[ 0 ]
    c1            = new TU.Cursor text_node, 0, text_node.data
    c2            = new TU.Cursor text_node, 0, text_node.data
    TU.TraverseUtil.setSelection c1, c2
    loop
      rectangles = @_get_next_chr_rectangles node, c1, c2
      break unless rectangles?
      for rectangle from rectangles
        yield new DOMRect                                       \
          rectangle.left + document.documentElement.scrollLeft, \   # left
          rectangle.top  + document.documentElement.scrollTop,  \   # top
          rectangle.width,                                      \   # width
          rectangle.height                                          # height
    return null

  #---------------------------------------------------------------------------------------------------------
  _reset_line_walker: ( s ) ->
    s.min_top       = +Infinity
    s.max_bottom    = -Infinity
    s.min_left      = +Infinity
    s.max_right     = -Infinity
    s.avg_height    = 0
    s.avg_bottom    = 0
    s.count         = 0
    return null

  #---------------------------------------------------------------------------------------------------------
  walk_line_rectangles_of_node: ( node ) ->
    @_reset_line_walker s  = {}
    for rectangle from @walk_chr_rectangles_of_node node
      if s.count > 0 and rectangle.bottom - s.avg_bottom > s.avg_height * @cfg.xxx_height_factor
        yield new DOMRect             \
          s.min_left,                 \   # left
          s.min_top,                  \   # top
          s.max_right   - s.min_left, \   # width
          s.max_bottom  - s.min_top       # height
        @_reset_line_walker s
      #.......................................................................................................
      # draw_box rectangle
      s.count++
      s.min_top     = Math.min s.min_top,     rectangle.top
      s.max_bottom  = Math.max s.max_bottom,  rectangle.bottom
      s.min_left    = Math.min s.min_left,    rectangle.left
      s.max_right   = Math.max s.max_right,   rectangle.right
      s.avg_height  = ( s.avg_height * ( s.count - 1 ) / s.count ) + ( rectangle.height * 1 / s.count )
      s.avg_bottom  = ( s.avg_bottom * ( s.count - 1 ) / s.count ) + ( rectangle.bottom * 1 / s.count )
    #.........................................................................................................
    if s.count > 0
      yield new DOMRect             \
        s.min_left,                 \   # left
        s.min_top,                  \   # top
        s.max_right   - s.min_left, \   # width
        s.max_bottom  - s.min_top       # height
    return null

  #---------------------------------------------------------------------------------------------------------
  walk_slugs_of_node: ( node ) ->
    rectangles  = [ ( @walk_line_rectangles_of_node node )..., ]
    line_count  = rectangles.length
    for rectangle, idx in rectangles
      llnr  = idx + 1
      rlnr  = line_count - idx
      yield new Slug { llnr, rlnr, node, rectangle, }
    return null

  #---------------------------------------------------------------------------------------------------------
  inject_stylesheet_before: ( element_or_selector ) -> @_inject_stylesheet 'before', element_or_selector
  inject_stylesheet_after:  ( element_or_selector ) -> @_inject_stylesheet 'after',  element_or_selector

  #---------------------------------------------------------------------------------------------------------
  _inject_stylesheet: ( where, ref ) ->
    element     = if typeof ref is 'string' then ( µ.DOM.select_first ref ) else ref
    stylesheet  = @_get_stylesheet()
    log '^3428436^', stylesheet, element
    switch where
      when 'before' then µ.DOM.insert_before  element, stylesheet
      when 'after'  then µ.DOM.insert_after   element, stylesheet
      else "unknown location #{µ.TEXT.rpr where}"
    return null

  #---------------------------------------------------------------------------------------------------------
  _get_stylesheet: ->
    ### TAINT must honour element, class name configuration ###
    return µ.DOM.new_stylesheet """
      .debug iframe {
        outline:                1px dotted red; }

      /* ### TAINT use explicit class for debugging line box (as for cover) */
      .box {
        background-color:       transparent;
        pointer-events:         none;
        position:               absolute; }

      .debug .box {
        background-color:       rgba( 255, 248, 0, 0.2 );
        outline:                1px solid rgba( 255, 0, 0, 0.2 );
        mix-blend-mode:         multiply; }

      .box.cover {
        background-color:       white;
        pointer-events:         none;
        position:               absolute; }

      .debug .box.cover {
        background-color:       rgba( 255, 0, 0, 0.2 );
        mix-blend-mode:         multiply; }
      """


#===========================================================================================================
class Column

  #---------------------------------------------------------------------------------------------------------
  constructor: ( ø_iframe, ø_slug ) ->
    @_ø_iframe  = ø_iframe
    @first_slug = ø_slug.value
    @top        = ø_slug.value.rectangle.top
    @height     = 0
    return undefined

  #---------------------------------------------------------------------------------------------------------
  scroll_to_first_line: ->
    @_ø_iframe.window.scrollTo { top: @top, }
    return null

  #---------------------------------------------------------------------------------------------------------
  set_height_from_slug: ( ø_slug ) ->
    @height = ø_slug.value.rectangle.bottom - @top
    return @height


#===========================================================================================================
class Walker
  ### TAINT should add `next` method (or well-known symbol) to make it an iterator ###

  #---------------------------------------------------------------------------------------------------------
  constructor: ( iterator, stop = null ) ->
    @_iterator  = iterator
    @_stop      = stop
    @done       = false
    @value      = stop
    return undefined

  #---------------------------------------------------------------------------------------------------------
  [Symbol.iterator]: ->
    while @step() isnt @_stop
      yield @
    return null

  #---------------------------------------------------------------------------------------------------------
  step: ->
    { value, done, } = @_iterator.next()
    if done
      @done   = true
      @value  = @_stop
      return @_stop
    @value = value
    return value


#===========================================================================================================
class Node_walker extends Walker
class Slug_walker extends Walker


#===========================================================================================================
class Iframe_walker extends Walker

  #---------------------------------------------------------------------------------------------------------
  constructor: ( iterator, stop = null, cfg ) ->
    super iterator, stop
    @height                 = null
    # @galley_document        = null
    @window                 = null
    @draw_box               = null
    @draw_line_cover        = null
    @cfg                    = cfg
    return undefined

  #---------------------------------------------------------------------------------------------------------
  step: ->
    super()
    return @_stop if @done
    @height                 = µ.DOM.get_height @value
    # @galley_document        = @value.contentDocument
    @window                 = @value.contentWindow
    ### TAINT may want to return `linefinder` itself ###
    local_linefinder        = new @window.µ.LINE.Finder @cfg
    @draw_box               = local_linefinder.draw_box.bind            local_linefinder
    @draw_line_cover        = local_linefinder.xxx_draw_line_cover.bind local_linefinder
    return @value


#===========================================================================================================
class Distributor

  #---------------------------------------------------------------------------------------------------------
  @is_galley_document:  -> (     µ.DOM.page_is_inside_iframe() ) and ( µ.DOM.select_first 'galley', null )?
  @is_main_document:    -> ( not µ.DOM.page_is_inside_iframe() ) and ( µ.DOM.select_first 'iframe', null )?

  #---------------------------------------------------------------------------------------------------------
  constructor: ( cfg ) ->
    ### TAINT use `intertype` ###
    @cfg = Object.freeze { defaults.distributor_cfg..., cfg..., }
    return undefined

  #---------------------------------------------------------------------------------------------------------
  new_iframe_walker: -> new Iframe_walker ( µ.DOM.select_all @cfg.iframe_selector ).values(), null, @cfg

  #---------------------------------------------------------------------------------------------------------
  distribute_lines: ->
    #.......................................................................................................
    ### Allow user-scrolling for demo ###
    # µ.DOM.set ø_iframe.value, 'scrolling', 'true' for ø_iframe.value in µ.DOM.select_all 'ø_iframe.value'
    #.......................................................................................................
    ø_iframe          = @new_iframe_walker()
    ø_iframe.step()
    ø_node            = new Node_walker ( ø_iframe.window.µ.DOM.select_all @cfg.paragraph_selector ).values()
    linefinder        = new ø_iframe.window.µ.LINE.Finder @cfg
    column            = null
    #.......................................................................................................
    loop
      break if ø_iframe.done
      #.....................................................................................................
      unless ø_node.step()? # might want to mark galleys without content at this point
        log '^123-1^', "nodes done"; break
      #.....................................................................................................
      await defer()
      ø_slug = new Slug_walker linefinder.walk_slugs_of_node ø_node.value
      loop
        unless ø_slug.step()?
          log '^123-1^', "slugs done"; break
        await defer()
        #...................................................................................................
        unless column?.first_slug?
          column = new Column ø_iframe, ø_slug
          column.scroll_to_first_line()
        #...................................................................................................
        column.set_height_from_slug ø_slug
        if ø_iframe.height > column.height
          ø_iframe.draw_box ø_slug.value.rectangle
          continue
        #...................................................................................................
        ø_iframe.draw_line_cover ø_slug.value.rectangle
        column    = null
        unless ø_iframe.step()?
          log '^123-1^', "iframes done"; break
        ø_iframe.draw_box ø_slug.value.rectangle
        column = new Column ø_iframe, ø_slug
        column.scroll_to_first_line()
    #.......................................................................................................
    return null



module.exports = { Finder, Distributor, }

