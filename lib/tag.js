'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _path2 = require('path');

var _path3 = _interopRequireDefault(_path2);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _url = require('url');

var _url2 = _interopRequireDefault(_url);

var _nodeSass = require('node-sass');

var _nodeSass2 = _interopRequireDefault(_nodeSass);

var _uglifyJs = require('uglify-js');

var _uglifyJs2 = _interopRequireDefault(_uglifyJs);

var _pretty = require('pretty');

var _pretty2 = _interopRequireDefault(_pretty);

var _htmlMinifier = require('html-minifier');

var _base = require('./base');

var _base2 = _interopRequireDefault(_base);

var _attr = require('./attr');

var _attr2 = _interopRequireDefault(_attr);

var _getParams = require('./getParams');

var _getParams2 = _interopRequireDefault(_getParams);

var _stringAddParams = require('./stringAddParams');

var _stringAddParams2 = _interopRequireDefault(_stringAddParams);

var _css = require('./css.js');

var _const = require('./const');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Tag = function (_Base) {
  _inherits(Tag, _Base);

  function Tag(html, _ref) {
    var start = _ref.start,
        params = _ref.params,
        withWhiteSpace = _ref.withWhiteSpace,
        prefix = _ref.prefix,
        postfix = _ref.postfix,
        skipEach = _ref.skipEach,
        tmpParams = _ref.tmpParams,
        path = _ref.path,
        rootDir = _ref.rootDir;

    _classCallCheck(this, Tag);

    var _this = _possibleConstructorReturn(this, (Tag.__proto__ || Object.getPrototypeOf(Tag)).call(this, html, { start: start, params: params, withWhiteSpace: withWhiteSpace, prefix: prefix, postfix: postfix }));

    _this.name = undefined;
    _this.attrs = [];
    _this.nestChildren = [];
    _this.children = [];
    _this.selfClosing = false;
    _this.closed = false;
    _this.endAt = start;
    _this.closing = false;
    _this.tagClosed = false;
    _this.skipEach = skipEach || false;
    _this.tmpParams = tmpParams || {};
    _this.tagNamePostfix = '';
    _this.closingTagNamePostfix = '';
    _this.closingTagPrefix = '';
    _this.path = path;
    _this.rootDir = rootDir;
    _this.addNamesapce = false;
    _this.parentName = '';
    return _this;
  }

  _createClass(Tag, [{
    key: 'build',
    value: function build() {
      var index = this.ignoreWhiteSpace(this.start);
      this.prefix += this.withWhiteSpace ? this.buildWhiteSpacePrefix(this.start, index) : '';
      if (index === -1) {
        return;
      }

      if (this.html.indexOf('</', index) === index) {
        this.closing = true;
        index++;
      }

      index = this.buildName(index + 1);

      var tagNameIndexEnd = index;
      index = this.ignoreWhiteSpace(index);
      if (this.withWhiteSpace) {
        this.tagNamePostfix = this.buildWhiteSpacePrefix(tagNameIndexEnd, index);
      }

      if (this.closing) {
        if (this.isClosed(index)) {
          index++;
          this.endAt = index;
        } else {
          throw new Error('invalid closing tag: ' + this.name + this.errorAround(index));
        }
      } else {
        if (this.isSelfClosed(index)) {
          index += 2;
          this.endAt = index;
          return this;
        }

        index = this.buildAttrs(index);
        this.endAt = this.buildChildren(index);
      }

      return this;
    }
  }, {
    key: 'buildName',
    value: function buildName(index) {
      var pattern = new RegExp('^[a-zA-Z0-9_-]+$');

      var _whilePattern = this.whilePattern(index, pattern),
          word = _whilePattern.word,
          newIndex = _whilePattern.newIndex;

      this.name = word;

      return newIndex;
    }
  }, {
    key: 'isSelfClosed',
    value: function isSelfClosed(index) {
      if (this.html.indexOf('/>', index) === index) {
        this.selfClosing = true;
        this.closed = true;
        this.tagClosed = true;

        return true;
      } else {
        return false;
      }
    }
  }, {
    key: 'isClosed',
    value: function isClosed(index) {
      if (this.html.indexOf('>', index) === index) {
        this.closed = true;
        return true;
      } else {
        return false;
      }
    }
  }, {
    key: 'buildAttrs',
    value: function buildAttrs(index) {
      while (!this.closed) {
        var prevAttrInexEnd = index;
        index = this.ignoreWhiteSpace(index);
        var attrPrefix = '';
        if (this.withWhiteSpace) {
          attrPrefix = this.buildWhiteSpacePrefix(prevAttrInexEnd, index);
        }

        if (this.isSelfClosed(index)) {
          index += 2;
          if (this.withWhiteSpace && this.attrs.length > 0) {
            this.attrs[this.attrs.length - 1].postfix = attrPrefix;
          }
        } else if (this.isClosed(index)) {
          index++;
          if (this.withWhiteSpace && this.attrs.length > 0) {
            this.attrs[this.attrs.length - 1].postfix = attrPrefix;
          }
        } else {
          var attr = new _attr2.default(this.html, { start: index, params: this.params, withWhiteSpace: this.withWhiteSpace, prefix: attrPrefix }).build();
          index = attr.endAt;
          this.attrs.push(attr);
        }
      }

      return index;
    }
  }, {
    key: 'buildChildren',
    value: function buildChildren(start) {
      var index = start;

      while (!this.tagClosed) {
        var childStartIndex = index;
        index = this.ignoreWhiteSpace(index);
        var childPrefix = '';
        if (this.withWhiteSpace) {
          childPrefix = this.buildWhiteSpacePrefix(childStartIndex, index);
        }

        var tagStartAt = this.html.indexOf('<', index);
        if (tagStartAt !== index) {
          this.children.push('' + childPrefix + this.html.substring(index, tagStartAt));
        } else if (childPrefix !== '') {
          this.children.push(childPrefix);
        }

        var tag = new Tag(this.html, {
          start: tagStartAt,
          params: this.params,
          withWhiteSpace: this.withWhiteSpace,
          prefix: '',
          path: this.path,
          rootDir: this.rootDir
        }).build();

        if (tag.closing) {
          if (tag.name === this.name) {
            this.tagClosed = true;
            this.closingTagNamePostfix = tag.tagNamePostfix;
            this.closingTagPrefix = tag.prefix;

            index = tag.endAt;
          } else {
            throw new Error('Mismatched tag expect ' + this.name + ' and got  ' + tag.name + '.' + this.errorAround(index));
          }
        } else {
          this.children.push(tag);
          index = tag.endAt;
        }
      }

      return index;
    }
  }, {
    key: 'dependencies',
    value: function dependencies() {
      var dependencies = [];

      this.children.forEach(function (child) {
        if (typeof child !== 'string') {
          if (dependencies.indexOf(child.name) === -1) {
            dependencies.push(child.name);
          }

          child.dependencies().forEach(function (dependency) {
            if (dependencies.indexOf(dependency) === -1) {
              dependencies.push(dependency);
            }
          });
        }
      });

      return dependencies;
    }
  }, {
    key: 'parentSelectors',
    value: function parentSelectors() {
      var parentSelectors = [];
      parentSelectors = [this.name];
      var id = this.attrs.find(function (attr) {
        return attr.key === 'id';
      });
      var klass = this.attrs.find(function (attr) {
        return attr.key === 'class';
      });

      if (id) {
        var ids = id.value.split(' ');
        ids = ids.map(function (_id) {
          return '#' + _id;
        });
        parentSelectors = [].concat(_toConsumableArray(parentSelectors), _toConsumableArray(ids));
      }
      if (klass) {
        var klasses = klass.value.split(' ');
        klasses = klasses.map(function (_class) {
          return '.' + _class;
        });
        parentSelectors = [].concat(_toConsumableArray(parentSelectors), _toConsumableArray(klasses));
      }

      return parentSelectors;
    }
  }, {
    key: 'loadComponents',
    value: function loadComponents(project) {
      var newThis = this.clone();
      var component = project.get(newThis.name);

      if (component) {
        var _component$parse$tags = component.parse.tags[0],
            params = _component$parse$tags.params,
            name = _component$parse$tags.name,
            attrs = _component$parse$tags.attrs,
            children = _component$parse$tags.children,
            tmpParams = _component$parse$tags.tmpParams,
            selfClosing = _component$parse$tags.selfClosing,
            closed = _component$parse$tags.closed,
            tagClosed = _component$parse$tags.tagClosed,
            _path = _component$parse$tags.path,
            rootDir = _component$parse$tags.rootDir;


        newThis.params = _extends({}, newThis.params, params);
        newThis.parentName = newThis.name;
        newThis.name = name;
        newThis.attrs = [].concat(_toConsumableArray(newThis.attrs), _toConsumableArray(attrs));
        newThis.nestChildren = newThis.children;
        newThis.children = children;
        newThis.tmpParams = _extends({}, newThis.tmpParams, tmpParams);
        newThis.selfClosing = selfClosing;
        newThis.closed = closed;
        newThis.tagClosed = tagClosed;

        newThis.path = _path;
        newThis.rootDir = rootDir;
      }

      newThis.children = newThis.children.map(function (child) {
        if (typeof child !== 'string') {
          return child.loadComponents(project);
        } else {
          return child;
        }
      });

      return newThis;
    }
  }, {
    key: 'buildParams',
    value: function buildParams() {
      var params = {};
      var each = this.attrs.find(function (attr) {
        return attr.key === 'each';
      });
      var eachParam = void 0,
          eachValue = void 0;

      if (each) {
        ;

        var _each$value$split = each.value.split(' in '),
            _each$value$split2 = _slicedToArray(_each$value$split, 2),
            param = _each$value$split2[0],
            value = _each$value$split2[1];

        if (typeof value === 'string' && typeof param === 'string') {
          eachParam = param.trim();
          eachValue = value.trim();
        }
      }

      this.attrs.forEach(function (attr) {
        var keyParams = {};
        var valueParams = {};
        if (attr.key) {
          keyParams = new _getParams2.default(attr.key).build();
        };
        if (attr.value) {
          valueParams = new _getParams2.default(attr.value).build();
        };
        var newParams = _extends({}, keyParams, valueParams);

        for (var key in newParams) {
          if (eachParam && key === eachParam) {
            if (typeof newParams[key] === 'string') {
              params[eachValue] = newParams[key];
            } else {
              params[eachValue] = _lodash2.default.merge({}, params[key] || {}, newParams[key]);
            }
          } else {
            if (typeof newParams[key] === 'string') {
              params[key] = newParams[key];
            } else {
              params[key] = _lodash2.default.merge({}, params[key] || {}, newParams[key]);
            }
          }
        }
      });

      this.children.forEach(function (child) {
        var childParams = void 0;
        if (typeof child === 'string') {
          childParams = new _getParams2.default(child).build();
        } else {
          childParams = child.buildParams();
        }

        for (var key in childParams) {
          if (eachParam && key === eachParam) {
            if (typeof childParams[key] === 'string') {
              if (typeof params[eachValue] === 'undefined') {
                params[eachValue] = [childParams[key]];
              }
            } else {
              var nestedParams = (Array.isArray(params[eachValue]) ? params[eachValue][0] : params[eachValue]) || {};
              params[eachValue] = [_lodash2.default.merge({}, nestedParams, childParams[key])];
            }
          } else {
            if (typeof childParams[key] === 'string') {
              if (typeof params[key] === 'undefined') {
                params[key] = childParams[key];
              }
            } else {
              if (Array.isArray(childParams[key])) {
                params[key] = _lodash2.default.merge([], params[key] || [], childParams[key]);
                // params[key] = [_.merge({}, params[key] || {}, childParams[key][0])]
              } else {
                params[key] = _lodash2.default.merge({}, params[key] || {}, childParams[key]);
              }
            }
          }
        }
      });

      return params;
    }
  }, {
    key: 'toHtml',
    value: function toHtml(_ref2) {
      var _this2 = this;

      var params = _ref2.params,
          htmlCheck = _ref2.htmlCheck,
          parentSelectors = _ref2.parentSelectors,
          namespace = _ref2.namespace,
          _ref2$fmt = _ref2.fmt,
          fmt = _ref2$fmt === undefined ? _const.PRETTY : _ref2$fmt;

      htmlCheck = htmlCheck || false;
      var html = this.prefix + '<' + this.name + this.tagNamePostfix;
      var currentParams = _extends({}, this.params, params);
      var attrs = '';
      var each = this.attrs.find(function (attr) {
        return attr.key === 'each';
      });

      if (!htmlCheck && !this.skipEach && each) {
        html = '';
        if (each.value.split(' in ').length === 2) {
          var _each$value$split3 = each.value.split(' in '),
              _each$value$split4 = _slicedToArray(_each$value$split3, 2),
              param = _each$value$split4[0],
              value = _each$value$split4[1];

          param = param.trim();
          this.skipEach = true;

          if (currentParams[value]) {
            if (Array.isArray(currentParams[value])) {
              currentParams[value].forEach(function (item, index) {
                _this2.tmpParams[param] = item;
                var newParams = _extends({}, params, currentParams, _this2.tmpParams);

                html += _this2.toHtml({ params: newParams, htmlCheck: htmlCheck, parentSelectors: parentSelectors, namespace: namespace + '-index', fmt: fmt });
              });
            } else {
              throw new Error(value + ' is not array but is used in each.');
            }
          } else {
            try {
              if (value) {
                if (!Array.isArray(value)) {
                  value = JSON.parse(value);
                }

                if (Array.isArray(value)) {
                  value.forEach(function (item, index) {
                    _this2.tmpParams[param] = item;
                    var newParams = _extends({}, params, currentParams, _this2.tmpParams);
                    html += _this2.toHtml({ params: newParams, htmlCheck: htmlCheck, parentSelectors: parentSelectors, namespace: namespace + '-index', fmt: fmt }) + '\n';
                  });
                } else {
                  throw new Error(value + ' is not array but is used in each.');
                }
              }
            } catch (err) {
              throw new Error(value + ' is not array but is used in each.');
            }
          }
        } else {
          throw new Error('invalid each value "' + each.value + '".');
        }
      } else {
        var skipRender = false;
        if (!htmlCheck && this.name === 'link') {
          var href = this.attrs.find(function (attr) {
            return attr.key === 'href';
          });
          if (!href || !href.value) {
            throw new Error('invalid link');
          }

          var uri = _url2.default.parse(href.value);
          if (!uri.hostname) {
            skipRender = true;

            var hrefPath = href.value.trim();
            if (!['.css', '.scss'].includes(_path3.default.extname(hrefPath))) {
              throw new Error(hrefPath + ' needs to end with .css or .scss');
            }

            if (hrefPath[0] === '/') {
              if (hrefPath.indexOf(this.rootDir) !== 0) {
                hrefPath = this.rootDir + hrefPath.substr(1, hrefPath.length - 1);
              }
            } else {
              hrefPath = _path3.default.resolve(_path3.default.parse(this.path).dir, hrefPath);
            }

            try {
              if (_fs2.default.existsSync(hrefPath)) {
                var cssBody = _fs2.default.readFileSync(hrefPath, 'utf8');
                var outputStyle = 'nested';

                if (this.attrs.find(function (attr) {
                  return attr.key === 'compressed';
                })) {
                  outputStyle = 'compressed';
                }

                if (_path3.default.extname(hrefPath) === '.scss' || outputStyle === 'compressed') {
                  cssBody = _nodeSass2.default.renderSync({ data: cssBody, outputStyle: outputStyle, includePaths: [this.rootDir] }).css;
                }

                if (this.attrs.find(function (attr) {
                  return ['namespaced', 'scoped'].includes(attr.key);
                })) {
                  cssBody = (0, _css.namespaceCss)(cssBody, namespace, parentSelectors);
                }

                var newLine = outputStyle === 'compressed' ? '' : '\n';
                html = '<style>' + newLine + cssBody + newLine + '</style>' + newLine;
              } else {
                throw new Error('link file not found ' + hrefPath);
              }
            } catch (err) {
              throw err;
            }
          }
        } else if (!htmlCheck && this.name === 'script') {
          var src = this.attrs.find(function (attr) {
            return attr.key === 'src';
          });
          if (!src || !src.value) {
            throw new Error('invalid script');
          }

          var _uri = _url2.default.parse(src.value);
          if (!_uri.hostname) {
            skipRender = true;

            var srcPath = src.value.trim();
            if (_path3.default.extname(srcPath) !== '.js') {
              throw new Error(srcPath + ' needs to end with .js');
            }

            if (srcPath[0] === '/') {
              if (srcPath.indexOf(this.rootDir) !== 0) {
                srcPath = this.rootDir + srcPath.substr(1, srcPath.length - 1);
              }
            } else {
              srcPath = _path3.default.resolve(_path3.default.parse(this.path).dir, srcPath);
            }

            try {
              if (_fs2.default.existsSync(srcPath)) {
                var jsBody = _fs2.default.readFileSync(srcPath, 'utf8');

                var compressed = this.attrs.find(function (attr) {
                  return attr.key === 'compressed';
                });
                if (compressed) {
                  var result = _uglifyJs2.default.minify(jsBody);

                  if (result.error) {
                    throw result.error;
                  }

                  jsBody = result.code;
                }

                html = '<script type="text/javascript">\n' + jsBody + '\n</script>\n';
              } else {
                throw new Error('script file not found ' + srcPath);
              }
            } catch (err) {
              throw err;
            }
          }
        }
        /*
        let ifStatement = this.attrs.find((attr) => attr.key === 'if')
         if (ifStatement) {
          // TODO: if
        }
        */

        if (!skipRender) {
          var addedAddNamespacedClass = false;
          var numberOfAttrs = this.attrs.length;
          for (var i = 0; i < numberOfAttrs; i++) {
            var attr = this.attrs[i];
            var attrHtml = '' + attr.prefix + attr.key + attr.keyPostfix;

            if (htmlCheck || attr.key !== 'each') {
              if (!htmlCheck && typeof attr.value === 'string') {
                var _value = attr.value;
                if (attr.key === 'class' && !addedAddNamespacedClass && this.addNamesapce) {
                  addedAddNamespacedClass = true;
                  _value += ' ' + namespace;
                } else {}
                attrHtml += '=' + attr.valuePrefix + attr.valueQuote + new _stringAddParams2.default(_value, { params: _extends({}, currentParams, this.tmpParams) }).build() + attr.valueQuote;
              } else if (attr.value) {
                attrHtml += '=' + attr.valuePrefix + attr.valueQuote + attr.value + attr.valueQuote;
              }

              if (!htmlCheck && i !== numberOfAttrs - 1) {
                attrHtml += ' ';
              }

              attrs += '' + attrHtml + attr.postfix;
            }
          }
          if (!addedAddNamespacedClass && this.addNamesapce) {
            attrs += ' class="' + namespace + '"';
          }

          var children = '';
          this.children.forEach(function (child) {
            if (typeof child == 'string') {
              if (htmlCheck) {
                children += child;
              } else {
                var newChildren = _this2.nestChildren.map(function (child) {
                  if (child.constructor.name === 'Tag') {
                    var newTag = child.clone();
                    newTag.params = _extends({}, currentParams, _this2.tmpParams);

                    return newTag;
                  } else {
                    return child;
                  }
                });

                children += new _stringAddParams2.default(child, { params: _extends({}, currentParams, _this2.tmpParams, { children: _this2.nestChildren }) }).build();
              }
            } else {
              if (child.parentName) {
                child.addNamesapce = true;
                children += child.toHtml({ params: params, htmlCheck: htmlCheck, parentSelectors: child.parentSelectors(), namespace: namespace + '-' + child.parentName, fmt: fmt });
              } else {
                children += child.toHtml({ params: params, htmlCheck: htmlCheck, parentSelectors: parentSelectors, namespace: namespace, fmt: fmt });
              }
            }
          });

          if (!this.withWhiteSpace && attrs !== '') {
            html += ' ';
          }

          if (this.selfClosing) {
            html += attrs + '/>';
          } else {
            html += attrs + '>' + children + this.closingTagPrefix + '</' + this.name + this.closingTagNamePostfix + '>';
          }
        }
      }

      if (fmt === _const.PRETTY) {
        return (0, _pretty2.default)(html);
      } else {
        return (0, _htmlMinifier.minify)(html, {
          collapseBooleanAttributes: true,
          collapseInlineTagWhitespace: true,
          collapseWhitespace: true,
          removeComments: true,
          removeRedundantAttributes: true,
          removeTagWhitespace: true
        });
      }
    }
  }]);

  return Tag;
}(_base2.default);

exports.default = Tag;