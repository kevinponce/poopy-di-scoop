'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _base = require('./base');

var _base2 = _interopRequireDefault(_base);

var _parse = require('./parse');

var _parse2 = _interopRequireDefault(_parse);

var _const = require('./const');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Component = function (_Base) {
  _inherits(Component, _Base);

  function Component(_ref) {
    var name = _ref.name,
        html = _ref.html,
        path = _ref.path,
        rootDir = _ref.rootDir;

    _classCallCheck(this, Component);

    var _this = _possibleConstructorReturn(this, (Component.__proto__ || Object.getPrototypeOf(Component)).call(this, html, {}));

    _this.name = name;
    _this.html = html;
    _this.path = path;
    _this.rootDir = rootDir;
    _this.dependencies = [];
    _this.dependents = [];
    _this.parse = null;
    _this.built = false;
    return _this;
  }

  _createClass(Component, [{
    key: 'build',
    value: function build() {
      if (!this.built) {
        this.parse = new _parse2.default(this.html, { path: this.path, rootDir: this.rootDir }).build();
        this.dependencies = this.parse.dependencies();
        this.built = true;
      }

      return this;
    }
  }, {
    key: 'loadComponents',
    value: function loadComponents(project) {
      var newThis = this.clone();
      newThis.parse = newThis.parse.loadComponents(project);
      return newThis;
    }
  }, {
    key: 'toHtml',
    value: function toHtml(_ref2) {
      var params = _ref2.params,
          namespace = _ref2.namespace,
          _ref2$fmt = _ref2.fmt,
          fmt = _ref2$fmt === undefined ? _const.PRETTY : _ref2$fmt;

      return this.parse.toHtml({ params: params, namespace: 'pds-' + this.name, fmt: fmt });
    }
  }, {
    key: 'paramsStructure',
    value: function paramsStructure() {
      return this.parse.buildParams();
    }
  }, {
    key: 'buildDefaultParams',
    value: function buildDefaultParams() {
      var params = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;

      params = params || this.paramsStructure();

      for (var key in params) {
        var param = params[key];

        if (typeof param === 'string') {
          params[key] = '';
        } else if (Array.isArray(param)) {
          params[key] = [];
        } else {
          params[key] = this.buildDefaultParams(params[key]);
        }
      }

      return params;
    }
  }, {
    key: 'buildArrayParams',
    value: function buildArrayParams() {
      return this.parse.buildArrayParams();
    }
  }]);

  return Component;
}(_base2.default);

exports.default = Component;