(function() {
  'use strict';
  this.types = new (require('intertype')).Intertype();

  Object.assign(this, this.types.export());

  // #-----------------------------------------------------------------------------------------------------------
  // @declare 'kb_keytypes', tests:
  //   "x is a list of kb_keytype":     ( x ) -> @isa.list_of 'kb_keytype', x
  //   "x is not empty":                   ( x ) -> not @isa.empty x

  //-----------------------------------------------------------------------------------------------------------
  this.declare('kb_keytype', {
    tests: {
      "x is one of 'toggle', 'latch', 'tlatch', 'ptlatch', 'ntlatch', 'push'": function(x) {
        return x === 'toggle' || x === 'latch' || x === 'tlatch' || x === 'ptlatch' || x === 'ntlatch' || x === 'push';
      }
    }
  });

  // #-----------------------------------------------------------------------------------------------------------
  // @declare 'kb_keynames', tests:
  //   "x is a list of kb_keyname":  ( x ) -> @isa.list_of 'kb_keyname', x
  //   "x is not empty":                   ( x ) -> not @isa.empty x

  //-----------------------------------------------------------------------------------------------------------
  this.declare('kb_keyname', {
    tests: {
      "x is a nonempty_text": function(x) {
        return this.isa.nonempty_text(x);
      }
    }
  });

  //-----------------------------------------------------------------------------------------------------------
  this.declare('kb_watcher', {
    tests: {
      "x is a function or a nonempty_text": function(x) {
        return (this.isa.function(x)) || (this.isa.nonempty_text(x));
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