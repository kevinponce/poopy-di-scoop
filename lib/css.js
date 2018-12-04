'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.namespaceCss = namespaceCss;

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _postcss = require('postcss');

var _postcss2 = _interopRequireDefault(_postcss);

var _postcssSelectorParser = require('postcss-selector-parser');

var _postcssSelectorParser2 = _interopRequireDefault(_postcssSelectorParser);

var _nodeSass = require('node-sass');

var _nodeSass2 = _interopRequireDefault(_nodeSass);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var ID = 'id';
var CLASS = 'class';
var TAG = 'tag';

var addPrefix = function addPrefix(prefix, sameLineSelector) {
  return function (selectors) {
    selectors.each(function (selector) {
      var itemfirstSelector = _lodash2.default.first(selector.nodes);
      var selectorStr = void 0;
      var isTag = false;

      if (itemfirstSelector) {
        selectorStr = itemfirstSelector.toString();
        isTag = itemfirstSelector.type === TAG;
      }

      var onSameLine = sameLineSelector.includes(selectorStr);
      if (onSameLine) {
        if (isTag) {
          var nodes = _lodash2.default.clone(selector.nodes);
          var firstNode = nodes.shift();
          var spaceAfterFirstNode = '';
          while (nodes.length > 0 && nodes[0].type === 'combinator') {
            nodes.shift();
            spaceAfterFirstNode = ' ';
          }

          var className = _postcssSelectorParser2.default.tag({ value: firstNode.toString() + '.' + prefix + spaceAfterFirstNode + nodes.toString() + ', .' + prefix + ' ' });
          selector.prepend(className);
        } else {
          var _className = _postcssSelectorParser2.default.className({ value: '' + prefix + selector.toString() + ', .' + prefix + ' ' });
          selector.prepend(_className);
        }
      } else {
        var _className2 = _postcssSelectorParser2.default.className({ value: prefix + ' ' });
        selector.prepend(_className2);
      }
    });
  };
};

function namespaceCss(css, prefix) {
  var sameLineSelector = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : [];

  var ast = _postcss2.default.parse(css);

  try {
    ast.walkRules(function (rule) {
      rule.selector = (0, _postcssSelectorParser2.default)(addPrefix(prefix, sameLineSelector)).processSync(rule.selector);
    });
  } catch (err) {
    throw new Error(err);
  }

  return ast.toString();
};