

'use strict'

@types                    = new ( require 'intertype' ).Intertype()
Object.assign @, @types.export()

# #-----------------------------------------------------------------------------------------------------------
# @declare 'kb_keytypes', tests:
#   "x is a list of kb_keytype":     ( x ) -> @isa.list_of 'kb_keytype', x
#   "x is not empty":                   ( x ) -> not @isa.empty x

#-----------------------------------------------------------------------------------------------------------
@declare 'kb_keytype', tests:
  "x is one of 'toggle', 'latch', 'tlatch', 'ptlatch', 'ntlatch', 'push'": \
    ( x ) -> x in [ 'toggle', 'latch', 'tlatch', 'ptlatch', 'ntlatch', 'push', ]

# #-----------------------------------------------------------------------------------------------------------
# @declare 'kb_keynames', tests:
#   "x is a list of kb_keyname":  ( x ) -> @isa.list_of 'kb_keyname', x
#   "x is not empty":                   ( x ) -> not @isa.empty x

#-----------------------------------------------------------------------------------------------------------
@declare 'kb_keyname', tests:
  "x is a nonempty_text":      ( x ) -> @isa.nonempty_text x

#-----------------------------------------------------------------------------------------------------------
@declare 'kb_watcher', tests:
  "x is a function or a nonempty_text":   ( x ) -> ( @isa.function x )or ( @isa.nonempty_text x )

#-----------------------------------------------------------------------------------------------------------
### TAINT probably not correct to only check for Element, at least in some cases could be Node as well ###
@declare 'delement',       ( x ) -> ( x is document ) or ( x instanceof Element )
@declare 'element',        ( x ) -> x instanceof Element

#-----------------------------------------------------------------------------------------------------------
@declare 'ready_callable', ( x ) -> ( @isa.function x ) or ( @isa.asyncfunction x )


