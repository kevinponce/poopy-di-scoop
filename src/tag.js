import path from 'path';
import fs from 'fs';
import _ from 'lodash';
import url from 'url';
import sass from 'node-sass';
import UglifyJS from 'uglify-js';
import pretty from 'pretty';
import { minify } from 'html-minifier';
import Base from './base';
import Attr from './attr';
import GetParams from './getParams';
import StringAddParams from './stringAddParams';
import { namespaceCss } from './css.js';
import { PRETTY, COMPRESSED, TEST } from './const';

export default class Tag extends Base {
  constructor(html, { start, params, withWhiteSpace, prefix, postfix, skipEach, tmpParams, path, rootDir }) {
    super(html, { start, params, withWhiteSpace, prefix, postfix })

    this.name = undefined
    this.attrs = []
    this.nestChildren = []
    this.children = []
    this.selfClosing = false
    this.closed = false
    this.endAt = start
    this.closing = false
    this.tagClosed = false
    this.skipEach = skipEach || false
    this.tmpParams = tmpParams || {}
    this.tagNamePostfix = ''
    this.closingTagNamePostfix = ''
    this.closingTagPrefix = ''
    this.path = path
    this.rootDir = rootDir
    this.addNamesapce = false
    this.parentName = ''
  }

  build () {
    let index = this.ignoreWhiteSpace(this.start)
    this.prefix += (this.withWhiteSpace ? this.buildWhiteSpacePrefix(this.start, index) : '')
    if (index === -1) {
      return
    }

    if (this.html.indexOf('</', index) === index) {
      this.closing = true
      index++
    }

    index = this.buildName(index + 1)

    let tagNameIndexEnd  = index
    index = this.ignoreWhiteSpace(index)
    if (this.withWhiteSpace) { this.tagNamePostfix = this.buildWhiteSpacePrefix(tagNameIndexEnd, index) }

    if (this.closing) {
      if (this.isClosed(index)) {
        index++
        this.endAt = index
      } else {
        throw new Error(`invalid closing tag: ${this.name}${this.errorAround(index)}`);
      }
    } else {
      if (this.isSelfClosed(index)) {
        index += 2
        this.endAt = index
        return this
      }

      index = this.buildAttrs(index)
      this.endAt = this.buildChildren(index)
    }

    return this
  }

  buildName (index) {
    var pattern = new RegExp('^[a-zA-Z0-9_-]+$');
    let { word, newIndex } = this.whilePattern(index, pattern);

    this.name = word;

    return newIndex;
  }

  isSelfClosed(index) {
    if (this.html.indexOf('/>', index) === index) {
      this.selfClosing = true
      this.closed = true
      this.tagClosed = true

      return true
    } else {
      return false
    }
  }

  isClosed(index) {
    if (this.html.indexOf('>', index) === index) {
      this.closed = true
      return true
    } else {
      return false
    }
  }

  buildAttrs(index) {
    while(!this.closed) {
      let prevAttrInexEnd = index
      index = this.ignoreWhiteSpace(index)
      let attrPrefix = ''
      if (this.withWhiteSpace) { attrPrefix = this.buildWhiteSpacePrefix(prevAttrInexEnd, index) }

      if (this.isSelfClosed(index)) {
        index += 2
        if (this.withWhiteSpace && this.attrs.length > 0) { this.attrs[this.attrs.length - 1].postfix = attrPrefix }
      } else if (this.isClosed(index)) {
        index++
        if (this.withWhiteSpace && this.attrs.length > 0) { this.attrs[this.attrs.length - 1].postfix = attrPrefix }
      } else {
        let attr = new Attr(this.html, { start: index, params: this.params, withWhiteSpace: this.withWhiteSpace, prefix: attrPrefix }).build()
        index = attr.endAt
        this.attrs.push(attr)
      }
    }

    return index
  }

  buildChildren(start) {
    let index = start

    while(!this.tagClosed) {
      let childStartIndex = index
      index = this.ignoreWhiteSpace(index)
      let childPrefix = ''
      if (this.withWhiteSpace) { childPrefix = this.buildWhiteSpacePrefix(childStartIndex, index) }

      let tagStartAt = this.html.indexOf('<', index)
      if (tagStartAt !== index) {
        this.children.push(`${childPrefix}${this.html.substring(index, tagStartAt)}`)
      } else if (childPrefix !== '') {
        this.children.push(childPrefix)
      }

      let tag = new Tag(this.html, {
        start: tagStartAt,
        params: this.params,
        withWhiteSpace: this.withWhiteSpace,
        prefix: '',
        path: this.path,
        rootDir: this.rootDir
      }).build();

      if (tag.closing) {
        if (tag.name === this.name) {
          this.tagClosed = true
          this.closingTagNamePostfix = tag.tagNamePostfix
          this.closingTagPrefix = tag.prefix

          index = tag.endAt
        } else {
          throw new Error(`Mismatched tag expect ${this.name} and got  ${tag.name}.${this.errorAround(index)}`);
        }
      } else {
        this.children.push(tag);
        index = tag.endAt;
      }
    }

    return index;
  }

  dependencies () {
    let dependencies = [];

    this.children.forEach((child) => {
      if (typeof child !== 'string') {
        if (dependencies.indexOf(child.name) === -1) {
          dependencies.push(child.name);
        }

        child.dependencies().forEach((dependency) => {
          if (dependencies.indexOf(dependency) === -1) {
            dependencies.push(dependency)
          }
        });
      }
    });

    return dependencies;
  }

  parentSelectors () {
    let parentSelectors = []
    parentSelectors = [this.name];
    let id = this.attrs.find((attr) => attr.key === 'id')
    let klass = this.attrs.find((attr) => attr.key === 'class')

    if (id) {
      let ids = id.value.split(' ');
      ids = ids.map((_id) => `#${_id}`)
      parentSelectors = [...parentSelectors, ...ids];
    }
    if (klass) {
      let klasses = klass.value.split(' ');
      klasses = klasses.map((_class) => `.${_class}`)
      parentSelectors = [...parentSelectors, ...klasses];
    }

    return parentSelectors;
  }

  loadComponents (project) {
    let newThis = this.clone();
    let component = project.get(newThis.name);

    if (component) {

      let { params, name, attrs, children, tmpParams, selfClosing, closed, tagClosed, path, rootDir } = component.parse.tags[0];

      newThis.params = { ...newThis.params, ...params };
      newThis.parentName = newThis.name;
      newThis.name = name;
      if (newThis.children.length > 0) {
        newThis.appendNameToNamespace = component.name
      }
      newThis.attrs = [...newThis.attrs, ...attrs];
      newThis.nestChildren = newThis.children;
      newThis.children = children;
      newThis.tmpParams = { ...newThis.tmpParams, ...tmpParams };
      newThis.selfClosing = selfClosing;
      newThis.closed = closed;
      newThis.tagClosed = tagClosed;

      newThis.path = path;
      newThis.rootDir = rootDir;

      let nestedComponent = project.get(newThis.name);
    }

    newThis.children = newThis.children.map((child) => {
      if (typeof child !== 'string') {
        return child.loadComponents(project);
      } else {
        return child;
      }
    });

    if (newThis.nestChildren) {
      newThis.nestChildren = newThis.nestChildren.map((child) => {
        if (typeof child !== 'string') {
          return child.loadComponents(project);
        } else {
          return child;
        }
      });
    }

    return newThis;
  }

  buildParams () {
    let params = {};
    let each = this.attrs.find((attr) => attr.key === 'each');
    let eachParam, eachValue;

    if (each) {;
      let [param, value] = each.value.split(' in ');

      if (typeof value === 'string' && typeof param === 'string') {
        eachParam = param.trim();
        eachValue = value.trim();
      }
    }

    this.attrs.forEach((attr) => {
      let keyParams = {};
      let valueParams = {};
      if (attr.key) { keyParams = new GetParams(attr.key).build() };
      if (attr.value) { valueParams = new GetParams(attr.value).build() };
      let newParams = { ...keyParams, ...valueParams };

      for (let key in newParams ) {
        if (eachParam && key === eachParam) {
          if (typeof newParams[key] === 'string') {
            params[eachValue] = newParams[key];
          } else {
            params[eachValue] = _.merge({}, params[key] || {}, newParams[key]);
          }
        } else {
          if (typeof newParams[key] === 'string') {
            params[key] = newParams[key];
          } else {
            params[key] = _.merge({}, params[key] || {}, newParams[key]);
          }
        }
      }
    })

    this.children.forEach((child) => {
      let childParams
      if (typeof child === 'string') {
        childParams = new GetParams(child).build()
      } else {
        childParams = child.buildParams()
      }

      for (let key in childParams ) {
        if (eachParam && key === eachParam) {
          if (typeof childParams[key] === 'string') {
            if (typeof params[eachValue] === 'undefined') {
              params[eachValue] = [childParams[key]]
            }
          } else {
            let nestedParams = (Array.isArray(params[eachValue]) ? params[eachValue][0] : params[eachValue]) || {}
            params[eachValue] = [_.merge({}, nestedParams, childParams[key])]
          }
        } else {
          if (typeof childParams[key] === 'string') {
            if (typeof params[key] === 'undefined') {
              params[key] = childParams[key]
            }
          } else {
            if (Array.isArray(childParams[key])) {
              params[key] = _.merge([], params[key] || [], childParams[key])
              // params[key] = [_.merge({}, params[key] || {}, childParams[key][0])]
            } else {
              params[key] = _.merge({}, params[key] || {}, childParams[key])
            }
          }
        }
      }
    })

    return params;
  }

  toHtml({ params, htmlCheck, parentSelectors, namespace, fmt = PRETTY }) {
    htmlCheck = htmlCheck || false
    let html = `${this.prefix}<${this.name}${this.tagNamePostfix}`
    let currentParams = { ...this.params, ...params };
    let attrs = ''
    let each = this.attrs.find((attr) => attr.key === 'each')

    if (!htmlCheck && !this.skipEach && each) {
      html = ''
      if (each.value.split(' in ').length === 2) {
        let [param, value] = each.value.split(' in ')
        param = param.trim()
        this.skipEach = true

        if (currentParams[value]) {
          if (Array.isArray(currentParams[value])) {
            currentParams[value].forEach((item, index) => {
              this.tmpParams[param] = item
              let newParams = { ...params, ...currentParams, ...this.tmpParams }
              
              html += this.toHtml({ params: newParams, htmlCheck, parentSelectors, namespace: `${namespace}-index`, fmt })
            })
          } else {
            throw new Error(`${value} is not array but is used in each.`);
          }
        } else {
          try {
            if (value) {
              if (!Array.isArray(value)) {
                value = JSON.parse(value)
              }

              if (Array.isArray(value)) {
                value.forEach((item, index) => {
                  this.tmpParams[param] = item;
                  let newParams = { ...params, ...currentParams, ...this.tmpParams };
                  html += this.toHtml({ params: newParams, htmlCheck, parentSelectors, namespace: `${namespace}-index`, fmt }) + '\n';
                })
              } else {
                throw new Error(`${value} is not array but is used in each.`);
              }
            }
          } catch(err) {
            throw new Error(`${value} is not array but is used in each.`);
          }
        }
      } else {
        throw new Error(`invalid each value "${each.value}".`);
      }
    } else {
      let skipRender = false;
      if (!htmlCheck && this.name === 'link') {
        let href = this.attrs.find((attr) => attr.key === 'href');
        if (!href || !href.value) {
          throw new Error(`invalid link`);
        }

        let uri = url.parse(href.value);
        if (!uri.hostname) {
          skipRender = true;

          let hrefPath = href.value.trim();
          if (!['.css', '.scss'].includes(path.extname(hrefPath))) {
            throw new Error(`${hrefPath} needs to end with .css or .scss`);
          }

          if (hrefPath[0] === '/') {
            if (hrefPath.indexOf(this.rootDir) !== 0) {
              hrefPath = this.rootDir + hrefPath.substr(1, hrefPath.length - 1);
            }
          } else {
            hrefPath = path.resolve(path.parse(this.path).dir, hrefPath);
          }

          if (fs.existsSync(hrefPath)) {
            let cssBody = fs.readFileSync(hrefPath, 'utf8');
            let outputStyle = 'nested';

            if (this.attrs.find((attr) => attr.key === 'compressed')) {
              outputStyle = 'compressed';
            }
            
            if (path.extname(hrefPath) === '.scss' || outputStyle === 'compressed') {
              cssBody = sass.renderSync({ data: cssBody, outputStyle, includePaths: [this.rootDir] }).css;
            }

            if (this.attrs.find((attr) => ['namespaced', 'scoped'].includes(attr.key))) {
              let selectedNamespace = namespace;
              if (this.appendNameToNamespace) {
                selectedNamespace += `-${this.appendNameToNamespace}`;
              }

              cssBody = namespaceCss(cssBody, selectedNamespace, parentSelectors);
            }

            let newLine = (outputStyle === 'compressed' ? '' : '\n');
            html = `<style>${newLine}${cssBody}${newLine}</style>${newLine}`;
          } else {
            skipRender = false;
          }
        }
      } else if (!htmlCheck && this.name === 'script') {
        let src = this.attrs.find((attr) => attr.key === 'src')
        if (!src || !src.value) {
          throw new Error(`invalid script`);
        }

        let uri = url.parse(src.value);
        if (!uri.hostname) {
          skipRender = true;

          let srcPath = src.value.trim();
          if (path.extname(srcPath) !== '.js') {
            throw new Error(`${srcPath} needs to end with .js`)
          }

          if (srcPath[0] === '/') {
            if (srcPath.indexOf(this.rootDir) !== 0) {
              srcPath = this.rootDir + srcPath.substr(1, srcPath.length - 1)
            }
          } else {
            srcPath = path.resolve(path.parse(this.path).dir, srcPath);
          }

          if (fs.existsSync(srcPath)) {
            let jsBody = fs.readFileSync(srcPath, 'utf8')

            let compressed = this.attrs.find((attr) => attr.key === 'compressed')
            if (compressed) {
              let result = UglifyJS.minify(jsBody);

              if (result.error) {
                throw result.error;
              }

              jsBody = result.code;
            }

            html = `<script type="text/javascript">\n${jsBody}\n</script>\n`
          } else {
            skipRender = false;
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
        let addedAddNamespacedClass = false
        let numberOfAttrs = this.attrs.length;
        for (let i = 0; i < numberOfAttrs; i++) {
          let attr = this.attrs[i];
          let attrHtml = `${attr.prefix}${attr.key}${attr.keyPostfix}`;

          if (htmlCheck || attr.key !== 'each') {
            if (!htmlCheck && typeof attr.value === 'string') {
              let value = attr.value
              if (attr.key === 'class' && !addedAddNamespacedClass && this.addNamesapce && namespace && fmt !== TEST) {
                addedAddNamespacedClass = true;
                if (this.appendNameToNamespace) {
                  value += ` ${namespace}-${this.appendNameToNamespace}`;
                } else {
                  value += ` ${namespace}`;
                }
              }
              attrHtml += `=${attr.valuePrefix}${attr.valueQuote}${(new StringAddParams(value, { params: { ...currentParams, ...this.tmpParams } })).build()}${attr.valueQuote}`;
            } else if (attr.value) {
              attrHtml += `=${attr.valuePrefix}${attr.valueQuote}${attr.value}${attr.valueQuote}`;
            }

            if (!htmlCheck && i !== (numberOfAttrs - 1)) {
              attrHtml += ' ';
            }

            attrs += `${attrHtml}${attr.postfix}`;
          }
        }
        if (!addedAddNamespacedClass && this.addNamesapce && namespace && fmt !== TEST) {
          if (this.appendNameToNamespace) {
            attrs += ` class="${namespace}-${this.appendNameToNamespace}"`;
          } else {
            attrs += ` class="${namespace}"`;
          }
        }

        let children = '';
        this.children.forEach((child) => {
          if (typeof child == 'string') {
            if (htmlCheck) {
              children += child;
            } else {
              let newChildren = this.nestChildren.map((child) => {
                if (child.constructor.name === 'Tag') {
                  let newTag = child.clone();
                  newTag.params = { ...currentParams, ...this.tmpParams };
                  newTag.nestChildren = { ...newTag.nestChildren, ...this.nestChildren };

                  return newTag;
                } else {
                  return child;
                }
              })

              children += (new StringAddParams(child, { params: { ...currentParams, ...this.tmpParams, children: this.nestChildren }, addNamesapce: true, namespace })).build();
            }
          } else {
            child.nestChildren = this.nestChildren
            if (child.parentName) {
              child.addNamesapce = true
              children += child.toHtml({ params, htmlCheck, parentSelectors: child.parentSelectors(), namespace: `${namespace}-${child.parentName}`, fmt });
            } else {
              children += child.toHtml({ params, htmlCheck, parentSelectors, namespace, fmt });
            }
          }
        });

        if(!this.withWhiteSpace && attrs !== '') {
          html += ' ';
        }

        if (this.selfClosing) {
          html += `${attrs}/>`;
        } else {
          html += `${attrs}>${children}${this.closingTagPrefix}</${this.name}${this.closingTagNamePostfix}>`;
        }
      }
    }

    if (fmt === PRETTY) {
      return pretty(html);
    } else if (fmt === COMPRESSED) {
      return minify(html, {
        collapseBooleanAttributes: true,
        collapseInlineTagWhitespace: true,
        collapseWhitespace: true,
        removeComments: true,
        removeRedundantAttributes: true,
        removeTagWhitespace: true
      });
    } else {
      return html;
    }
  }
}
