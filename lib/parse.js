'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _base = require('./base');

var _base2 = _interopRequireDefault(_base);

var _tag = require('./tag');

var _tag2 = _interopRequireDefault(_tag);

var _const = require('./const');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Parse = function (_Base) {
  _inherits(Parse, _Base);

  function Parse(html, _ref) {
    var start = _ref.start,
        params = _ref.params,
        withWhiteSpace = _ref.withWhiteSpace,
        prefix = _ref.prefix,
        postfix = _ref.postfix,
        path = _ref.path,
        rootDir = _ref.rootDir;

    _classCallCheck(this, Parse);

    var _this = _possibleConstructorReturn(this, (Parse.__proto__ || Object.getPrototypeOf(Parse)).call(this, html, { start: start, params: params, withWhiteSpace: withWhiteSpace, prefix: prefix, postfix: postfix }));

    _this.tags = [];
    _this.path = path;
    _this.rootDir = rootDir;
    return _this;
  }

  _createClass(Parse, [{
    key: 'build',
    value: function build() {
      var index = this.start;
      var tag = this.nextTag(index);

      while (tag) {
        this.tags.push(tag);
        this.addToParams(tag.requiredParams);
        index = tag.endAt;
        tag = this.nextTag(index);
      }

      return this;
    }
  }, {
    key: 'nextTag',
    value: function nextTag(start) {
      var index = this.ignoreWhiteSpace(start);
      if (this.html.indexOf('<', index) !== index) return;
      var tagPrefix = this.withWhiteSpace ? this.buildWhiteSpacePrefix(start, index) : '';

      return new _tag2.default(this.html, {
        start: index,
        params: this.params,
        withWhiteSpace: this.withWhiteSpace,
        prefix: tagPrefix,
        path: this.path,
        rootDir: this.rootDir
      }).build();
    }
  }, {
    key: 'dependencies',
    value: function dependencies() {
      var dependencies = [];
      this.tags.forEach(function (tag) {
        if (dependencies.indexOf(tag.name) === -1) {
          dependencies.push(tag.name);
        }

        tag.dependencies().forEach(function (dependency) {
          if (dependencies.indexOf(dependency) === -1) {
            dependencies.push(dependency);
          }
        });
      });

      return dependencies;
    }
  }, {
    key: 'buildParams',
    value: function buildParams() {
      var params = {};
      this.tags.forEach(function (tag) {
        params = _lodash2.default.merge({}.params, tag.buildParams());
      });

      return params;
    }
  }, {
    key: 'buildArrayParams',
    value: function buildArrayParams() {
      return this.buildArrayParamsRecursive(this.buildParams());
    }
  }, {
    key: 'buildArrayParamsRecursive',
    value: function buildArrayParamsRecursive(objParams) {
      var _this2 = this;

      var params = [];

      var _loop = function _loop(key) {
        var value = objParams[key];
        if (typeof value === 'string') {
          params.push({ path: key, value: value });
        } else {
          _this2.buildArrayParamsRecursive(value).forEach(function (param) {
            params.push({ path: key + '.' + param.path, value: param.value });
          });
        }
      };

      for (var key in objParams) {
        _loop(key);
      }

      return params;
    }
  }, {
    key: 'loadComponents',
    value: function loadComponents(project) {
      var newThis = this.clone();
      newThis.tags = newThis.tags.map(function (tag) {
        return tag.loadComponents(project);
      });

      return newThis;
    }
  }, {
    key: 'toHtml',
    value: function toHtml(_ref2) {
      var params = _ref2.params,
          htmlCheck = _ref2.htmlCheck,
          namespace = _ref2.namespace,
          _ref2$fmt = _ref2.fmt,
          fmt = _ref2$fmt === undefined ? _const.PRETTY : _ref2$fmt;

      htmlCheck = htmlCheck || false;
      var html = '';
      var parentSelectors = [];

      this.tags.forEach(function (tag) {
        var tagParentSelectors = tag.parentSelectors();

        for (var i = 0; i < tagParentSelectors.length; i++) {
          if (!parentSelectors.includes(tagParentSelectors[i])) {
            parentSelectors.push(tagParentSelectors[i]);
          }
        }
      });

      this.tags.forEach(function (tag) {
        tag.addNamesapce = true;
        html += tag.toHtml({ params: params, htmlCheck: htmlCheck, parentSelectors: parentSelectors, namespace: namespace, fmt: fmt });
      });

      return html;
    }
  }]);

  return Parse;
}(_base2.default);

exports.default = Parse;