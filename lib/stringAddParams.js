'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var StringAddParams = function () {
  function StringAddParams(text, _ref) {
    var params = _ref.params;

    _classCallCheck(this, StringAddParams);

    this.text = text;
    this.params = params;
  }

  _createClass(StringAddParams, [{
    key: 'build',
    value: function build() {
      var _this = this;

      var newStr = '';
      var open = false;
      var key = '';
      for (var i = 0; i < this.text.length; i++) {
        var char = this.text[i];

        if (char === '{') {
          key = '';
          open = true;
        } else if (char === '}' && open) {
          open = false;

          if (key.trim() === 'children') {
            var children = this.params[key.trim()];

            if (children) {
              children.forEach(function (child) {
                newStr += child.toHtml({ params: _this.params });
              });
            } else {
              newStr += '{' + key + '}';
            }
          } else {
            var keyArray = key.split('.');

            if (keyArray.length > 1) {
              (function () {
                var keyParams = _this.params;
                var found = true;

                keyArray.forEach(function (keyItem) {
                  if (typeof keyParams[keyItem] !== 'undefined') {
                    keyParams = keyParams[keyItem];
                  } else {
                    found = false;
                  }
                });

                if (found) {
                  newStr += keyParams;
                } else {
                  newStr += '{' + key + '}';
                }
              })();
            } else {
              if (this.params[key]) {
                newStr += this.params[key];
              } else {
                newStr += '{' + key + '}';
              }
            }
          }
        } else if (open) {
          key += char;
        } else {
          newStr += char;
        }
      }

      return newStr;
    }
  }]);

  return StringAddParams;
}();

exports.default = StringAddParams;