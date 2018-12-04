'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _const = require('./const');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Project = function () {
  function Project() {
    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    _classCallCheck(this, Project);

    this.components = {};
    this.pages = {};
    this.checksums = {};
    this.built = false;

    var rootDir = options.rootDir,
        _options$fmt = options.fmt,
        fmt = _options$fmt === undefined ? _const.PRETTY : _options$fmt;

    rootDir = rootDir ? rootDir.trim() : '.';
    if (!_fs2.default.statSync(rootDir).isDirectory()) {
      throw new Error('"' + this.rootDir + '" is an invalid directory');
    }

    var slash = rootDir.substr(-1) === '/' ? '' : '/';
    this.rootDir = rootDir + slash;
    this.fmt = fmt;
  }

  _createClass(Project, [{
    key: 'load',
    value: function load(component) {
      this.components[component.name] = component;
    }
  }, {
    key: 'loadPage',
    value: function loadPage(page) {
      this.pages[page.name] = page;
    }
  }, {
    key: 'get',
    value: function get(componentName) {
      var component = this.components[componentName];

      if (component) {
        return component.loadComponents(this);
      } else {
        return component;
      }
    }
  }, {
    key: 'build',
    value: function build() {
      if (!this.built) {
        this.buildDependents();
        var components = this.componentNames();

        for (var i = 0; i < components.length; i++) {
          var componentName = components[i];
        }

        for (var _i = 0; _i < components.length; _i++) {
          var _componentName = components[_i];
          if (this.isCircular(_componentName)) {
            throw new Error(_componentName + ' is circular');
          }
        }
        this.built = true;
      }

      return this;
    }
  }, {
    key: 'componentNames',
    value: function componentNames() {
      return Object.keys(this.components);
    }
  }, {
    key: 'buildDependents',
    value: function buildDependents() {
      var _this = this;

      var dependenciesMap = {};

      var _loop = function _loop() {
        var component = _this.components[componentName];

        component.dependencies.forEach(function (dependency) {
          if (!dependenciesMap[dependency]) {
            dependenciesMap[dependency] = [];
          }

          dependenciesMap[dependency].push(component.name);
        });
      };

      for (var componentName in this.components) {
        _loop();
      }

      for (var componentName in this.components) {
        var _component = this.components[componentName];
        _component.dependents = dependenciesMap[_component.name] || [];
      }

      return this;
    }
  }, {
    key: 'isCircular',
    value: function isCircular(componentName) {
      return this.allDependent(componentName).includes(componentName);
    }
  }, {
    key: 'allDependent',
    value: function allDependent(componentName) {
      var dependents = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];

      var component = this.components[componentName];
      if (!component) {
        return dependents;
      }

      for (var i = 0; i < component.dependencies.length; i++) {
        var dependencyComponentName = component.dependencies[i];
        var dependencyComponent = this.components[dependencyComponentName];

        if (dependencyComponent && !dependents.includes(dependencyComponentName)) {
          dependents.push(dependencyComponentName);
          var nestDependents = this.allDependent(dependencyComponentName, dependents).filter(function (e) {
            return !dependents.includes(e);
          });
          dependents = [].concat(_toConsumableArray(dependents), _toConsumableArray(nestDependents));
        }
      }

      return dependents;
    }
  }, {
    key: 'pageParams',
    value: function pageParams() {
      var pageNames = Object.keys(this.pages);
      var params = {};

      for (var i = 0; i < pageNames.length; i++) {
        var page = this.pages[pageNames[i]];
        if (!page) {
          throw new Error('Page ' + pageName + ' not found...');
        }

        params[page.name] = page.toJson();
      }

      return params;
    }
  }, {
    key: 'toHtml',
    value: function toHtml(pageName) {
      var page = this.pages[pageName];
      if (!page) {
        throw new Error('Page ' + pageName + ' not found...');
      }

      var component = this.get(page.component);
      if (!component) {
        throw new Error('Component ' + page.component + ' not found...');
      }

      return component.toHtml({
        params: _extends({}, page.params, {
          pages: this.pageParams(),
          page: page.toJson()
        }),
        fmt: this.fmt
      });
    }
  }]);

  return Project;
}();

exports.default = Project;