
'use strict'

TU = require '../deps/traverse_util.js'

#===========================================================================================================
class @Linefinder

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
  _draw_box: ( rectangle, cfg ) ->
    cfg               = { @cfg..., cfg..., }
    box               = document.createElement cfg.element_name
    box.style.top     = document.documentElement.scrollTop  + rectangle.top       + 'px'
    box.style.left    = document.documentElement.scrollLeft + rectangle.left      + 'px'
    box.style.width   =                                       rectangle.width - 1 + 'px' # collapse borders
    box.style.height  =                                       rectangle.height    + 'px'
    box.classList.add cfg.class_name
    document.body.appendChild box
    return box

  #---------------------------------------------------------------------------------------------------------
  draw_box: ( rectangle ) ->
    box               = document.createElement @cfg.box_element_name
    box.style.top     = document.documentElement.scrollTop  + rectangle.top       + 'px'
    box.style.left    = document.documentElement.scrollLeft + rectangle.left      + 'px'
    box.style.width   =                                       rectangle.width - 1 + 'px' # collapse borders
    box.style.height  =                                       rectangle.height    + 'px'
    box.classList.add @cfg.box_class_name
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
      yield from rectangles
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
