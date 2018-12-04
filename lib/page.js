"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _url = require("url");

var _url2 = _interopRequireDefault(_url);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Page = function () {
  function Page(_ref) {
    var name = _ref.name,
        url = _ref.url,
        title = _ref.title,
        component = _ref.component,
        params = _ref.params;

    _classCallCheck(this, Page);

    this.name = name;
    this.url = url;
    this.title = title;
    this.component = component;
    this.params = params;

    this.isValid();
  }

  _createClass(Page, [{
    key: "isValid",
    value: function isValid() {
      if (!this.component) {
        throw new Error("invalid page component required in " + this.name);
      }
      if (!this.url) {
        throw new Error("invalid page url required in " + this.name);
      }

      if (!this.title) {
        throw new Error("invalid page title required in " + this.name);
      }

      var uri = _url2.default.parse(this.url);
      if (uri.hostname) {
        throw new Error(this.name + " url must be relative");
      }

      return true;
    }
  }, {
    key: "toJson",
    value: function toJson() {
      return {
        "name": this.name,
        "title": this.title,
        "url": this.url
      };
    }
  }]);

  return Page;
}();

exports.default = Page;