

'use strict'

@types                    = new ( require 'intertype' ).Intertype()
Object.assign @, @types.export()

# #-----------------------------------------------------------------------------------------------------------
# @declare 'keywatch_keytypes', tests:
#   "x is a list of keywatch_keytype":     ( x ) -> @isa.list_of 'keywatch_keytype', x
#   "x is not empty":                   ( x ) -> not @isa.empty x

#-----------------------------------------------------------------------------------------------------------
@declare 'keywatch_keytype', tests:
  "x is one of 'slatch', 'dlatch', 'up', 'down": ( x ) -> x in [ 'slatch', 'dlatch', 'up', 'down', ]

# #-----------------------------------------------------------------------------------------------------------
# @declare 'keywatch_keynames', tests:
#   "x is a list of keywatch_keyname":  ( x ) -> @isa.list_of 'keywatch_keyname', x
#   "x is not empty":                   ( x ) -> not @isa.empty x

#-----------------------------------------------------------------------------------------------------------
@declare 'keywatch_keyname', tests:
  "x is a nonempty_text":      ( x ) -> @isa.nonempty_text x

#-----------------------------------------------------------------------------------------------------------
### TAINT probably not correct to only check for Element, at least in some cases could be Node as well ###
@declare 'delement',       ( x ) -> ( x is document ) or ( x instanceof Element )
@declare 'element',        ( x ) -> x instanceof Element


