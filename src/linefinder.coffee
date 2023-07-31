
'use strict'

TU = require '../deps/traverse_util.js'

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
    defaults =
      box_element_name:   'div'
      box_class_name:     'box'
      xxx_height_factor:  1 / 2 ### relative minimum height to recognize line step ###
    @cfg = Object.freeze { defaults..., cfg..., }
    return undefined

  #---------------------------------------------------------------------------------------------------------
  draw_box: ( rectangle ) ->
    box               = document.createElement @cfg.box_element_name
    box.style.top     =  rectangle.top       + 'px'
    box.style.left    =  rectangle.left      + 'px'
    box.style.width   =                                             rectangle.width - 1 + 'px' # collapse borders
    box.style.height  =                                             rectangle.height    + 'px'
    box.classList.add @cfg.box_class_name
    document.body.appendChild box
    return box

  #---------------------------------------------------------------------------------------------------------
  ### TAINT to be merged with `draw_box()` in new method ###
  xxx_draw_line_cover: ( rectangle ) ->
    box               = document.createElement @cfg.box_element_name
    box.style.top     =  rectangle.top       + 'px'
    box.style.left    =  rectangle.left      + 'px'
    box.style.width   =                                             rectangle.width - 1 + 'px' # collapse borders
    box.style.height  =                                             rectangle.height    + 'px'
    box.classList.add @cfg.box_class_name
    box.classList.add 'cover'
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

  #---------------------------------------------------------------------------------------------------------
  constructor: ( iterator, stop = null ) ->
    @_iterator  = iterator
    @_stop      = stop
    @done       = false
    @value      = stop
    return undefined

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
  constructor: ( iterator, stop = null ) ->
    super iterator, stop
    @height                 = null
    # @galley_document        = null
    @window                 = null
    @draw_box               = null
    @draw_line_cover        = null
    return undefined

  #---------------------------------------------------------------------------------------------------------
  step: ->
    super()
    return @_stop if @done
    @height                 = µ.DOM.get_height @value
    # @galley_document        = @value.contentDocument
    @window                 = @value.contentWindow
    ### TAINT may want to return `linefinder` itself ###
    local_linefinder        = new @window.µ.LINE.Finder()
    @draw_box               = local_linefinder.draw_box.bind            local_linefinder
    @draw_line_cover        = local_linefinder.xxx_draw_line_cover.bind local_linefinder
    return @value


#===========================================================================================================
class Distributor

  #---------------------------------------------------------------------------------------------------------
  constructor: ( cfg ) ->
    ### TAINT use `intertype` ###
    defaults =
      paragraph_selector:   'galley > p'
      iframe_selector:      'iframe'
    @cfg = Object.freeze { defaults..., cfg..., }
    return undefined

  #---------------------------------------------------------------------------------------------------------
  distribute_lines: ->
    #.......................................................................................................
    if µ.DOM.page_is_inside_iframe()
      log '^123-9^', "leaving b/c document is loaded in iframe"
      return null
    #.......................................................................................................
    _iframes = µ.DOM.select_all @cfg.iframe_selector
    unless _iframes.length > 0
      log '^123-10^', "leaving b/c document does not have iframes"
      return null
    #.......................................................................................................
    ### Allow user-scrolling for demo ###
    # µ.DOM.set ø_iframe.value, 'scrolling', 'true' for ø_iframe.value in µ.DOM.select_all 'ø_iframe.value'
    #.......................................................................................................
    ø_iframe          = new Iframe_walker _iframes.values()
    ø_iframe.step()
    ø_node            = new Node_walker ( ø_iframe.window.µ.DOM.select_all @cfg.paragraph_selector ).values()
    linefinder        = new ø_iframe.window.µ.LINE.Finder()
    column            = null
    #.......................................................................................................
    loop
      break if ø_iframe.done
      #.....................................................................................................
      unless ø_node.step()? # might want to mark galleys without content at this point
        log '^123-1^', "nodes done"; break
      #.....................................................................................................
      ø_slug = new Slug_walker linefinder.walk_slugs_of_node ø_node.value
      loop
        unless ø_slug.step()?
          log '^123-1^', "slugs done"; break
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
