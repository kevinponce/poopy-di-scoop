'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _base = require('./base');

var _base2 = _interopRequireDefault(_base);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Attr = function (_Base) {
  _inherits(Attr, _Base);

  function Attr(html, _ref) {
    var start = _ref.start,
        params = _ref.params,
        withWhiteSpace = _ref.withWhiteSpace,
        prefix = _ref.prefix,
        postfix = _ref.postfix;

    _classCallCheck(this, Attr);

    var _this = _possibleConstructorReturn(this, (Attr.__proto__ || Object.getPrototypeOf(Attr)).call(this, html, { start: start, params: params, withWhiteSpace: withWhiteSpace, prefix: prefix, postfix: postfix }));

    _this.key = undefined;
    _this.value = undefined;
    _this.endAt = start;
    _this.keyPostfix = '';
    _this.valuePrefix = '';
    _this.valueQuote = '';
    return _this;
  }

  _createClass(Attr, [{
    key: 'build',
    value: function build() {
      this.endAt = this.buildKey(this.start);
      this.endAt = this.buildValue(this.endAt);

      return this;
    }
  }, {
    key: 'buildKey',
    value: function buildKey(index) {
      var _until = this.until(index, ['=', '/', '>', ' ']),
          word = _until.word,
          newIndex = _until.newIndex;

      this.key = word;

      return newIndex;
    }
  }, {
    key: 'buildValue',
    value: function buildValue(index) {
      var keyStartIndex = index;
      index = this.ignoreWhiteSpace(index);
      if (this.withWhiteSpace) {
        this.keyPostfix = this.buildWhiteSpacePrefix(keyStartIndex, index);
      }
      var letter = this.html[index];

      if (letter !== '=') {
        return index;
      }

      var equalIndex = index + 1;
      index = this.ignoreWhiteSpace(index + 1);
      if (this.withWhiteSpace) {
        this.valuePrefix = this.buildWhiteSpacePrefix(equalIndex, index);
      }
      letter = this.html[index];

      if (!["'", "\""].includes(letter)) {
        throw new Error('invalid value for ' + this.key);
        return index;
      }

      this.valueQuote = letter;

      var open = letter;
      var value = '';
      index++;
      letter = this.html[index];

      while (letter && letter !== open) {
        value += letter;
        index++;
        letter = this.html[index];
      }

      this.value = value;
      return index + 1;
    }
  }]);

  return Attr;
}(_base2.default);

exports.default = Attr;