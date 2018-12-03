import _ from 'lodash';
import postcss from 'postcss';
import selectorParser from 'postcss-selector-parser';
import sass from 'node-sass';

const ID = 'id';
const CLASS = 'class';
const TAG = 'tag';

const addPrefix = (prefix, sameLineSelector) => {
  return (selectors) => {
    selectors.each((selector) => {
      let itemfirstSelector = _.first(selector.nodes);
      let selectorStr;
      let isTag = false;

      if (itemfirstSelector) {
        selectorStr = itemfirstSelector.toString();
        isTag = itemfirstSelector.type === TAG
      }

      let onSameLine = sameLineSelector.includes(selectorStr)
      if (onSameLine) {
        if (isTag) {
          let nodes = _.clone(selector.nodes);
          let firstNode = nodes.shift();
          let spaceAfterFirstNode = '';
          while (nodes.length > 0 && nodes[0].type === 'combinator') {
            nodes.shift()
            spaceAfterFirstNode = ' ';
          }

          const className = selectorParser.tag({value: `${firstNode.toString()}.${prefix}${spaceAfterFirstNode}${nodes.toString()}, .${prefix} `});
          selector.prepend(className);
        } else {
          const className = selectorParser.className({value: `${prefix}${selector.toString()}, .${prefix} `});
          selector.prepend(className);
        }
      } else {
        const className = selectorParser.className({value: `${prefix} `});
        selector.prepend(className);
      }
    });
  };
};

export function namespaceCss (css, prefix, sameLineSelector=[]) {
  const ast = postcss.parse(css);

  try {
    ast.walkRules((rule) => {
      rule.selector = selectorParser(addPrefix(prefix, sameLineSelector)).processSync(rule.selector);
    });
  } catch(err) {
    throw new Error(err);
  }

  return ast.toString();
};
