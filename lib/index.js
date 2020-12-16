(function() {
  'use strict';
  (() => {
    var µ;
    ({µ} = require('./main.js'));
    console.log('^0082^', µ);
    if (globalThis.window != null) {
      globalThis.µ = µ;
    } else {
      module.exports = µ;
    }
    return null;
  })();

}).call(this);

//# sourceMappingURL=index.js.map