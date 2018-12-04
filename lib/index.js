'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _util = require('util');

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _crypto = require('crypto');

var _crypto2 = _interopRequireDefault(_crypto);

var _project = require('./project');

var _project2 = _interopRequireDefault(_project);

var _component = require('./component');

var _component2 = _interopRequireDefault(_component);

var _page = require('./page');

var _page2 = _interopRequireDefault(_page);

var _const = require('./const');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var readFile = (0, _util.promisify)(_fs2.default.readFile);
var writeFile = (0, _util.promisify)(_fs2.default.writeFile);

var PoopyDiScoop = function () {
  function PoopyDiScoop() {
    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    _classCallCheck(this, PoopyDiScoop);

    var rootDir = options.rootDir,
        _options$fmt = options.fmt,
        fmt = _options$fmt === undefined ? _const.PRETTY : _options$fmt;

    this.project = new _project2.default({ rootDir: rootDir, fmt: fmt });
  }

  _createClass(PoopyDiScoop, [{
    key: 'load',
    value: function () {
      var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee() {
        return regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                _context.next = 2;
                return this.loadComponents(this.project.rootDir + 'components/');

              case 2:
                this.project.build();
                _context.next = 5;
                return this.loadChecksums();

              case 5:
                _context.next = 7;
                return this.loadPages(this.project.rootDir + 'pages/');

              case 7:
                this.buildPages();

              case 8:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function load() {
        return _ref.apply(this, arguments);
      }

      return load;
    }()
  }, {
    key: 'componentFiles',
    value: function componentFiles(dir) {
      var _componentFiles = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];

      var that = this;
      var files = _fs2.default.readdirSync(dir);

      files.forEach(function (file) {
        var dirCheck = '' + dir + file;
        if (_fs2.default.statSync(dirCheck).isDirectory()) {
          _componentFiles = [].concat(_toConsumableArray(_componentFiles), _toConsumableArray(that.componentFiles(dirCheck + '/')));
        } else if (_path2.default.extname(file) === '.html') {
          _componentFiles.push('' + dir + file);
        }
      });

      return _componentFiles;
    }
  }, {
    key: 'loadComponents',
    value: function () {
      var _ref2 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2(dir) {
        var that, files;
        return regeneratorRuntime.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                that = this;
                files = this.componentFiles(dir);
                _context2.prev = 2;
                _context2.next = 5;
                return Promise.all(files.map(function (file) {
                  return new Promise(function (resolve, reject) {
                    _fs2.default.readFile(file, 'utf8', function (err, html) {
                      if (err) {
                        reject(err);
                      }

                      resolve({ path: file, html: html });
                    });
                  });
                })).then(function (components) {
                  components.forEach(function (_ref3) {
                    var path = _ref3.path,
                        html = _ref3.html;

                    var name = that.componentName(path);
                    that.project.load(new _component2.default({ name: name, html: html, path: path, rootDir: that.project.rootDir }).build());
                  });
                }).catch(function (err) {
                  throw err;
                });

              case 5:
                _context2.next = 10;
                break;

              case 7:
                _context2.prev = 7;
                _context2.t0 = _context2['catch'](2);
                throw _context2.t0;

              case 10:
              case 'end':
                return _context2.stop();
            }
          }
        }, _callee2, this, [[2, 7]]);
      }));

      function loadComponents(_x3) {
        return _ref2.apply(this, arguments);
      }

      return loadComponents;
    }()
  }, {
    key: 'componentName',
    value: function componentName(file) {
      return file.replace(this.project.rootDir + 'components/', '').replace('.html', '').split('/').join('-');
    }
  }, {
    key: 'loadChecksums',
    value: function () {
      var _ref4 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee3() {
        var _this = this;

        var that;
        return regeneratorRuntime.wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                that = this;
                return _context3.abrupt('return', new Promise(function (resolve, reject) {
                  _fs2.default.readFile(_this.project.rootDir + 'checksums.json', 'utf8', function (err, checksums) {
                    if (err) {
                      reject(err);
                    }

                    that.project.checksums = JSON.parse(checksums);

                    resolve();
                  });
                }));

              case 2:
              case 'end':
                return _context3.stop();
            }
          }
        }, _callee3, this);
      }));

      function loadChecksums() {
        return _ref4.apply(this, arguments);
      }

      return loadChecksums;
    }()
  }, {
    key: 'pageFiles',
    value: function pageFiles(dir) {
      var _pageFiles = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];

      var that = this;
      var files = _fs2.default.readdirSync(dir);

      files.forEach(function (file) {
        var dirCheck = '' + dir + file;
        if (_fs2.default.statSync(dirCheck).isDirectory()) {
          _pageFiles = [].concat(_toConsumableArray(_pageFiles), _toConsumableArray(that.pageFiles(dirCheck + '/')));
        } else if (_path2.default.extname(file) === '.js') {
          _pageFiles.push('' + dir + file);
        }
      });

      return _pageFiles;
    }
  }, {
    key: 'pageName',
    value: function pageName(path) {
      if (path === '/') {
        path = '/index';
      } else {
        if (path[0] !== '/') {
          path = '/' + path;
        }
        if (path.substr(-1) === '/') {
          path = path.substr(0, path.length - 1);
        }
      }

      return path;
    }
  }, {
    key: 'loadPages',
    value: function () {
      var _ref5 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee4(dir) {
        var that, files;
        return regeneratorRuntime.wrap(function _callee4$(_context4) {
          while (1) {
            switch (_context4.prev = _context4.next) {
              case 0:
                that = this;
                files = this.pageFiles(dir);
                _context4.prev = 2;
                _context4.next = 5;
                return Promise.all(files.map(function (name) {
                  return new Promise(function (resolve, reject) {
                    _fs2.default.readFile(name, 'utf8', function (err, page) {
                      if (err) {
                        reject(err);
                      }

                      // TODO catch invalid json
                      resolve({ name: name, pageJson: JSON.parse(page) });
                    });
                  });
                })).then(function (pages) {
                  pages.forEach(function (_ref6) {
                    var name = _ref6.name,
                        pageJson = _ref6.pageJson;

                    var page = new _page2.default(pageJson);

                    if (!page.component) {
                      throw new Error('invalid page component required in ' + name);
                    }
                    if (!page.url) {
                      throw new Error('invalid page url required in ' + name);
                    }

                    var component = that.project.get(page.component);
                    if (!component) {
                      throw new Error('Component ' + page.component + ' not found...');
                    }

                    that.project.loadPage(page);
                  });
                }).catch(function (err) {
                  throw err;
                });

              case 5:
                _context4.next = 10;
                break;

              case 7:
                _context4.prev = 7;
                _context4.t0 = _context4['catch'](2);
                throw _context4.t0;

              case 10:
              case 'end':
                return _context4.stop();
            }
          }
        }, _callee4, this, [[2, 7]]);
      }));

      function loadPages(_x5) {
        return _ref5.apply(this, arguments);
      }

      return loadPages;
    }()
  }, {
    key: 'buildPages',
    value: function buildPages() {
      var _this2 = this;

      var that = this;
      var pageNames = Object.keys(this.project.pages);

      var _loop = function _loop(i) {
        var page = _this2.project.pages[pageNames[i]];
        if (!page) {
          throw new Error('Page ' + pageName + ' not found...');
        }

        var html = _this2.project.toHtml(page.name);
        var pageUrl = _this2.pageName(page.url.trim());
        var dir = 'html' + _path2.default.parse(pageUrl).dir;

        if (!_fs2.default.existsSync('' + _this2.project.rootDir + dir)) {
          var dirArray = dir.split('/');
          var currentDir = _this2.project.rootDir;
          for (var _i = 0; _i < dirArray.length; _i++) {
            currentDir += dirArray[_i] + '/';

            if (!_fs2.default.existsSync(currentDir)) {
              _fs2.default.mkdirSync(currentDir);
            }
          }
        }

        // checksum inspired by: https://github.com/dshaw/checksum/blob/master/checksum.js
        hash = _crypto2.default.createHash('sha1');

        hash.write(html);
        var checksum = hash.digest('hex');

        if (_this2.project.checksums[page.name] !== checksum) {
          _fs2.default.writeFile(_this2.project.rootDir + 'html' + pageUrl + '.html', html, function (err, data) {
            if (err) throw err;

            that.project.checksums[page.name] = checksum;

            _fs2.default.writeFile(that.project.rootDir + 'checksums.json', JSON.stringify(that.project.checksums, undefined, 2), function (err, data) {
              if (err) throw err;
            });
          });
        }
      };

      for (var i = 0; i < pageNames.length; i++) {
        var hash;

        _loop(i);
      }
    }
  }]);

  return PoopyDiScoop;
}();

exports.default = PoopyDiScoop;