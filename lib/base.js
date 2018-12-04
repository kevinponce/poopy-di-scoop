'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var base = function () {
  function base(html, _ref) {
    var start = _ref.start,
        params = _ref.params,
        withWhiteSpace = _ref.withWhiteSpace,
        prefix = _ref.prefix,
        postfix = _ref.postfix;

    _classCallCheck(this, base);

    this.html = html;
    this.start = start || 0;
    this.params = params || {};
    this.withWhiteSpace = withWhiteSpace || false;
    this.prefix = prefix || '';
    this.postfix = postfix || '';
    this.requiredParams = [];
  }

  _createClass(base, [{
    key: 'ignoreWhiteSpace',
    value: function ignoreWhiteSpace(index) {
      var letter = this.html[index];

      while (letter === ' ') {
        index++;
        letter = this.html[index];
      }

      return index;
    }
  }, {
    key: 'until',
    value: function until(index, check) {
      var letter = this.html[index];
      var word = '';

      while (letter && !check.includes(letter)) {
        word += letter;
        index++;
        letter = this.html[index];
      }

      return { word: word, newIndex: index };
    }
  }, {
    key: 'whilePattern',
    value: function whilePattern(index, pattern) {
      var letter = this.html[index];
      var word = '';

      while (letter && pattern.test(letter)) {
        word += letter;
        index++;
        letter = this.html[index];
      }

      return { word: word, newIndex: index };
    }
  }, {
    key: 'buildWhiteSpacePrefix',
    value: function buildWhiteSpacePrefix(startIndex, endIndex) {
      if (endIndex > startIndex) {
        return ' '.repeat(endIndex - startIndex);
      } else {
        return '';
      }
    }
  }, {
    key: 'errorAround',
    value: function errorAround(index) {
      var size = 20;
      var distanceFromStart = index - size;
      var start = distanceFromStart > 0 ? distanceFromStart : 0;
      var toTheEnd = index + size < this.html.length;
      var end = toTheEnd ? this.html.length : index + size;
      var prefix = start > 0 ? '...' : '';
      var postfix = toTheEnd ? '...' : '';
      return ' Around:\n' + prefix + this.html.substring(start, end) + postfix + '\n' + ' '.repeat(index - start + prefix.length) + '^';
    }
  }, {
    key: 'clone',
    value: function clone() {
      return _lodash2.default.clone(this);
      //return _.cloneDeepWith(this)
      //return this
      //return _.clone(this)
      //return Object.assign( Object.create( Object.getPrototypeOf(this)), this)
    }
  }, {
    key: 'addToParams',
    value: function addToParams(params) {
      var _this = this;

      var filter = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];

      params.forEach(function (param) {
        if (!_this.requiredParams.includes(param) && !filter.includes(param)) {
          _this.requiredParams.push(param);
        }
      });
    }
  }]);

  return base;
}();

exports.default = base;