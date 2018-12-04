'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var GetParams = function () {
  function GetParams(text) {
    _classCallCheck(this, GetParams);

    this.text = text;
  }

  _createClass(GetParams, [{
    key: 'build',
    value: function build() {
      var open = false;
      var param = '';
      var params = {};

      for (var i = 0; i < this.text.length; i++) {
        var char = this.text[i];

        if (char === '{') {
          param = '';
          open = true;
        } else if (char === '}' && open) {
          open = false;

          var paramArray = param.split('.');
          var paramArrayLength = paramArray.length - 1;

          var updateParams = {};

          for (var _i = paramArrayLength; _i >= 0; _i--) {
            var p = paramArray[_i];

            if (_i === paramArrayLength) {
              var newObjNestedParams = {};
              newObjNestedParams[p] = 'string';
              updateParams = newObjNestedParams;
            } else {
              var _newObjNestedParams = {};
              _newObjNestedParams[p] = updateParams;
              updateParams = _newObjNestedParams;
            }

            if (_i === 0) {
              params = _lodash2.default.merge({}, params, updateParams);
            }
          }
        } else if (open) {
          param += char;
        }
      }

      return params;
    }
  }]);

  return GetParams;
}();

exports.default = GetParams;