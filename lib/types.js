(function() {
  'use strict';
  this.types = new (require('intertype')).Intertype();

  Object.assign(this, this.types.export());

  // #-----------------------------------------------------------------------------------------------------------
  // @declare 'keywatch_keytypes', tests:
  //   "x is a list of keywatch_keytype":     ( x ) -> @isa.list_of 'keywatch_keytype', x
  //   "x is not empty":                   ( x ) -> not @isa.empty x

  //-----------------------------------------------------------------------------------------------------------
  this.declare('keywatch_keytype', {
    tests: {
      "x is one of 'slatch', 'dlatch', 'up', 'down": function(x) {
        return x === 'slatch' || x === 'dlatch' || x === 'up' || x === 'down';
      }
    }
  });

  // #-----------------------------------------------------------------------------------------------------------
  // @declare 'keywatch_keynames', tests:
  //   "x is a list of keywatch_keyname":  ( x ) -> @isa.list_of 'keywatch_keyname', x
  //   "x is not empty":                   ( x ) -> not @isa.empty x

  //-----------------------------------------------------------------------------------------------------------
  this.declare('keywatch_keyname', {
    tests: {
      "x is a nonempty_text": function(x) {
        return this.isa.nonempty_text(x);
      }
    }
  });

  //-----------------------------------------------------------------------------------------------------------
  /* TAINT probably not correct to only check for Element, at least in some cases could be Node as well */
  this.declare('delement', function(x) {
    return (x === document) || (x instanceof Element);
  });

  this.declare('element', function(x) {
    return x instanceof Element;
  });

}).call(this);

//# sourceMappingURL=types.js.map