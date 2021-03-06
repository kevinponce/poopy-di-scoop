import { parse, HTMLElement, TextNode } from './my-node-html-parser';
//import { parse, HTMLElement, TextNode } from 'node-html-parser';
import parseJson from 'parse-json';
import url from 'url';
import fs from 'fs';
import path from 'path';
import _ from 'lodash';
import sass from 'node-sass';
import UglifyJS from 'uglify-js';
import pretty from 'pretty';
import { minify } from 'html-minifier';
import { PRETTY, COMPRESSED } from './const';
import { namespaceCss } from './css.js';

export default class Parse {
  // opts: [path, rootDir]
  constructor(html, opts={}) {
    this.html = html;
    this.rootDir = opts.rootDir;
    this.path = opts.path;
    this.namespace = (opts.namespace ? opts.namespace : 'pds');
    this.name = opts.name;
    this.fmt = opts.fmt || PRETTY;
    this.skipParamsValueComp = opts.skipParamsValueComp || false;
    this.assetUrl = opts.assetUrl || '/';
    this.assetPath = opts.assetPath || '/';
    this.images = [];
    this.renderedCss = opts.renderedCss || {}
    this.renderedJs = opts.renderedJs || {}
  }

  build() {
    return this;
  }

  preloadParentSelectors(comps) {
    let keys = Object.keys(comps);

    for (let i = 0; i < keys.length; i++) {
      let compName = keys[i];
      comps[compName].parentSelectors = this.parentSelectors(parse(comps[compName].html))
    }

    return comps;
  }

  parentSelectors(hp) {
    let parentSelectors = [];

    for (let i = 0; i < hp.childNodes.length; i++) {
      let cn = hp.childNodes[i];
      if (cn && cn.constructor.name === 'HTMLElement') {
        let attrs = this.attrs(cn.rawAttrs);
        let ids = attrs.id ? (attrs.id.split(' ').map((_id) => `#${_id}`)) : [];
        let classes = attrs.class ? (attrs.class.split(' ').map((_id) => `.${_id}`)) : [];

        parentSelectors = [...parentSelectors, cn.tagName, ...ids, ...classes];
      }
    }
    return _.uniq(parentSelectors)
  }

  addCompNamespace(hp) {
    for (let i = 0; i < hp.childNodes.length; i++) {
      if (hp.childNodes[i].tagName && !['script', 'link', 'style'].includes(hp.childNodes[i].tagName)) {
        let attrs = this.attrs(hp.childNodes[i].rawAttrs);

        if (attrs.class) {
          attrs.class += ` ${this.namespace}`;
        } else {
          attrs.class = `${this.namespace}`;
        }

        hp.childNodes[i].rawAttrs = this.attrsHashToString(attrs);
      }
    }

    let styles = hp.querySelectorAll('link');

    if (styles) {
      for (let i = 0; i < styles.length; i++) {
        if (!styles[i].namespace) {
          styles[i].namespace = this.namespace;
        }
      }
    }

    return hp;
  }

  addCompLinkAndScriptSetPath (hp, comps) {
    let comp = comps[this.name];

    if (comp) {
      hp = this.compLinkSetPath(hp, comp);
      hp = this.compScriptSetPath(hp, comp);
    }

    return hp
  }

  attrs(rawAttrs) {
    let attrs = {};
    let parseType = 'name'
    let attr = {
      name: '',
      value: null,
      closingChar: null
    };

    for (let i = 0; i < rawAttrs.length; i++) {
      let char = rawAttrs[i];

      // ignore whitespace
      while (char && char === ' ') { i++; char = rawAttrs[i]; }

      let name = '';
      let value = '';
      while (char && !['=', ' '].includes(char)) {
        name += char
        i++;
        char = rawAttrs[i];
      }

      // ignore whitespace
      while (char && char === ' ') { i++; char = rawAttrs[i]; }

      if (char === '=') {
        i++;
        char = rawAttrs[i];

        // ignore whitespace
        while (char && char === ' ') { i++; char = rawAttrs[i]; }

        if (char && ['"', '\''].includes(char)) {
          let closeChar = char;
          i++;
          char = rawAttrs[i];

          while (char && char !== closeChar) {
            if (char === '\\') {
              value += char;
              i++;
              char = rawAttrs[i];
            }

            value += char;
            i++;
            char = rawAttrs[i];

          }
        }
      } else {
        i--;
      }

      if (!attrs[attr.name]) {
        attrs[name] = value.trim();
      } else {
        attrs[name] = ` ${value.trim()}`;
      }
    }

    return attrs;
  }

  attrsHashToString(attrs) {
    let attrsString = '';
    let keys = Object.keys(attrs);

    for (let i = 0; i < keys.length; i++) {
      let key = keys[i];
      let value = attrs[key];

      attrsString += ` ${key}`;
      if (value) {
        attrsString += `="${value}"`;
      } else {
        attrsString += ' ';
      }
    }

    if (attrsString.length > 0) {
      attrsString = attrsString.substr(1);
    }

    return attrsString;
  }

  eachKeyAndValue(hp) {
    let attrs = this.attrs(hp.rawAttrs);
    let each = attrs['each'];

    if (each.split(' in ').length === 2) {
      let [key, value] = each.split(' in ');
      key = key.trim();
      value = value.trim();

      if (value[0] && ['['].includes(value[0])) {
        value = parseJson(value)
      }

      return { key, value };
    }

    return {};
  }

  compLinkSetPath(hp, comp) {
    let styles = hp.querySelectorAll('link');

    if (styles) {
      for (let i = 0; i < styles.length; i++) {
        if (!styles[i].path) {
          styles[i].path = comp.path
          styles[i].parentSelectors = comp.parentSelectors
        }
      }
    }

    return hp
  }

  compScriptSetPath(hp, comp) {
    let scripts = hp.querySelectorAll('script');

    if (scripts) {
      for (let i = 0; i < scripts.length; i++) {
        if (!scripts[i].path) {
          scripts[i].path = comp.path
        }
      }
    }
    return hp;
  }

  comp(hp, comps) {
    if (hp && hp.constructor.name === 'HTMLElement' && hp.tagName && comps[hp.tagName] && comps[hp.tagName].html) {
      let compName = hp.tagName;
      let comp = comps[hp.tagName];
      let compHtml = comp.html;
      let params = hp.params || {}
      let orgAttrs = this.attrs(hp.rawAttrs);

      params['children'] = hp.innerHTML.toString();

      hp = parse(compHtml, { script: true, style: true });
      hp.params = params;

      let newAttrs = this.attrs(hp.rawAttrs);
      let orgAttrsKeys = Object.keys(orgAttrs);
      for(let i = 0; i < orgAttrsKeys.length; i++) {
        if (newAttrs[orgAttrsKeys[i]]) {
          newAttrs[orgAttrsKeys[i]] += ` ${orgAttrs[orgAttrsKeys[i]]}`;
        } else {
          newAttrs[orgAttrsKeys[i]] = `${orgAttrs[orgAttrsKeys[i]]}`;
        }
      }

      hp.rawAttrs = this.attrsHashToString(newAttrs);

      for (let i = 0; i < hp.childNodes.length; i++) {
        hp.childNodes[i] = this.comp(hp.childNodes[i], comps);
        let attrs = this.attrs(hp.childNodes[i].rawAttrs);
        let newNamespace = `${this.namespace}-${compName}`;
        if (hp.tagName) {
          if (attrs.class) {
            attrs.class += ` ${newNamespace}`;
          } else {
            attrs.class = ` ${newNamespace}`;
          }
        } else {
          if (attrs.class) {
          attrs.class += ` ${this.namespace} ${newNamespace}`;
          } else {
            attrs.class = ` ${this.namespace} ${newNamespace}`;
          }
        }

        hp.childNodes[i].rawAttrs = this.attrsHashToString(attrs);

        let styles = hp.querySelectorAll('link');
        if (styles) {
          for (let i = 0; i < styles.length; i++) {
            if (!styles[i].namespace) {
              styles[i].namespace = newNamespace;
            }
          }
        }
      }
      hp = this.compLinkSetPath(hp, comp);
      hp = this.compScriptSetPath(hp, comp);
    } else {
      for (let i = 0; i < hp.childNodes.length; i++) {
        hp.childNodes[i] = this.comp(hp.childNodes[i], comps);
      }
    }

    return hp;
  }

  setMarkRenderHtml(hp) {
    hp.renderHtml = true

    for (let i = 0; i < hp.childNodes.length; i++) {
      let ch = hp.childNodes[i];

      if (ch && ['TextNode', 'HTMLElement'].includes(ch.constructor.name)) {
        hp.childNodes[i] = this.setMarkRenderHtml(hp.childNodes[i]);
      }
    }

    return hp;
  }

  markRenderHtml (hp) {
    for (let i = 0; i < hp.childNodes.length; i++) {
      let ch = hp.childNodes[i];

      if (ch && ch.constructor.name === 'HTMLElement') {
        let attrs = this.attrs(ch.rawAttrs);
        if (attrs['raw'] === 'html') {
          delete attrs['raw']
          hp.childNodes[i].rawAttrs = this.attrsHashToString(attrs);
          hp.childNodes[i] = this.setMarkRenderHtml(hp.childNodes[i]);
        } else {
          hp.childNodes[i] = this.markRenderHtml(hp.childNodes[i]);
        }
      }
    }

    return hp;
  }

  each (hp, params) {
    if (hp.rawAttrs && hp.rawAttrs.indexOf('each') !== -1) {
      let { key, value } = this.eachKeyAndValue(hp);

      if (key, value) {
        if (value && typeof value === 'string') {
          let possibleValue = this.findValue(value.split('.'), params);
          if (possibleValue) {
            value = possibleValue;
          } else if (Array.isArray(params[value])) {
            value = params[value];
          }
        }

        if (Array.isArray(value)) {
          let attrs = this.attrs(hp.rawAttrs);
          delete attrs.each;
          hp.rawAttrs = this.attrsHashToString(attrs);
          let newHps = [];

          for (let i = 0; i < value.length; i++) {
            if (hp && hp.constructor.name === 'HTMLElement') {
              var newHp = new HTMLElement(_.cloneDeep(hp.tagName), {}, _.cloneDeep(hp.rawAttrs));
              newHp.childNodes = _.cloneDeep(hp.childNodes);
              if (typeof newHp.params === 'undefined') newHp.params = {}
              newHp.params[key] = value[i];
              newHps.push(newHp);
            } else if (hp && hp.constructor.name === 'TextNode') {
              let newHp = new TextNode(_.cloneDeep(hp.rawText));
              if (typeof newHp.params === 'undefined') newHp.params = {}
              newHp.params[key] = value[i];
              newHps.push(newHp);
            }
          }

          return newHps;
        } else {
          return hp;
        }
      } else {
        return hp
      }
    } else {
      let newChildNodes = [];
      for (let i = 0; i < hp.childNodes.length; i++) {
        let possibleNewChildNodes = this.each(hp.childNodes[i], params);

        if (Array.isArray(possibleNewChildNodes)) {
          newChildNodes = [...newChildNodes, ...possibleNewChildNodes];
        } else {
          newChildNodes.push(possibleNewChildNodes);
        }
      }

      hp.childNodes = newChildNodes;

      return hp;
    }
  }

  findValue (keys, params) {
    let key = keys.shift();

    if (params[key]) {
      if (keys.length === 0) {
        return params[key]
      } else {
        return this.findValue(keys, params[key]);
      }
    }
  }

  strAddParams(text, params, comps, raw) {
    let newStr = '';
    let open = false;
    let key = '';

    for (var i = 0; i < text.length; i++) {
      let char = text[i];

      if (char === '{') {
        key = '';
        open = true;
      } else if (char === '}' && open) {
        open = false;
        let defaultKey;
        let dataType = 'string';

        if (key.indexOf('||') !== -1) {
          let keys = key.split('||');
          if (keys.length === 2) {
            defaultKey = keys[1].trim();
            key = keys[0].trim();
          }
        }

        if (key.indexOf(':') !== -1) {
          let keys = key.split(':');
          if (keys.length === 2) {
            dataType = keys[1].trim();
            key = keys[0].trim();
          }
        }

        if (key === 'children') {
          let value = this.findValue([key], params);

          if (value) {
            if (raw) {
              return value
            }

            let strAddParamsParse = new Parse(`<div>${value}</div>`, { rootDir: this.rootDir, path: this.path, namespace: this.namespace, name: this.name, fmt: this.fmt, skipParamsValueComp: true, assetUrl: this.assetUrl, assetPath: this.assetPath, renderedCss: this.renderedCss, renderedJs: this.renderedJs }).build()
            newStr += strAddParamsParse.toHtml({ params, comps, unwrap: true, raw });
            this.images = this.images.concat(strAddParamsParse.images)
          } else {
            newStr += `{${key}}`;
          }
        } else {
          let keys = key.split('.');
          let value = this.findValue(keys, params);

          if (raw) {
            newStr += `{${key}}`;
          } else if (typeof value !== 'undefined') {
            newStr += value;
          } else if (defaultKey) {
            newStr += eval(defaultKey)
          } else {
            newStr += `{${key}}`
          }
        }
      } else if (open) {
        key += char
      } else {
        newStr += char
      }
    }
    return newStr
  }

  paramsValueComp(params, comps) {
    for (var key in params) {
      if (typeof params[key] === "object") {
        this.paramsValueComp(params[key], comps);
      } else {
        if (typeof params[key] === 'string' && params[key].indexOf('<') !== -1) {
          let paramHp = parse(`<div>${params[key]}</div>`);
          let paramNodes = paramHp.firstChild.childNodes;
          let paramStr = '';
          for (let i = 0; i < paramNodes.length; i++) {
            if (paramNodes[i].constructor.name === 'TextNode') {
              paramStr += paramNodes[i].rawText
            } else if (paramNodes[i].constructor.name === 'HTMLElement') {
              let paramsValueCompParse = new Parse('', { rootDir: this.rootDir, path: this.path, namespace: `${this.namespace}-param`, name: this.name, fmt: this.fmt, skipParamsValueComp: true, assetUrl: this.assetUrl, assetPath: this.assetPath, renderedCss: this.renderedCss, renderedJs: this.renderedJs }).build();
              paramStr += paramsValueCompParse.toHtml({ params, comps, hp: paramNodes[i] });
              this.images = this.images.concat(paramsValueCompParse.images);
            }
          }
          params[key] = paramStr;
        }
      }
    }
  }

  params(hp, params, comps, raw) {
    let currentParams = { ...params, ...hp.params };

    if (hp.renderHtml) {
      currentParams = { ...currentParams , ...params.pdsPreload };
    }

    if (hp && hp.constructor.name === 'TextNode') {
      hp.rawText = this.strAddParams(hp.rawText, currentParams, comps, raw) || '';
    } else if (hp && hp.constructor.name === 'HTMLElement') {
      if (!['style', 'script'].includes(hp.tagName)) {
        if (!raw) {
          let attrsHash = this.attrs(hp.rawAttrs)
          raw = attrsHash['raw'] === 'text'

          if (raw) {
            delete attrsHash.raw;
            hp.rawAttrs = this.attrsHashToString(attrsHash);
          }
        }

        hp.rawAttrs = this.strAddParams(hp.rawAttrs, currentParams, comps, raw);

        for (let i = 0; i < hp.childNodes.length; i++) {
          hp.childNodes[i] = this.params(hp.childNodes[i], currentParams, comps, raw);
        }
      }
    }

    return hp;
  }

  embedCss(hp) {
    let styles = hp.querySelectorAll('link');

    if (styles) {
      for (let i = 0; i < styles.length; i++) {
        let attrs = this.attrs(styles[i].rawAttrs);

        if (attrs['href']) {
          let uri = url.parse(attrs['href']);
          if (!uri.hostname) {
            let hrefPath = attrs['href'];
            let ext = path.extname(hrefPath);
            if (ext && ['.css', '.scss'].includes(ext)) {
              if (hrefPath[0] === '/') {
                if (hrefPath.indexOf(this.rootDir) !== 0) {
                  hrefPath = this.rootDir + hrefPath.substr(1, hrefPath.length - 1);
                }
              } else {
                hrefPath = path.resolve(path.parse(styles[i].path || this.path).dir, hrefPath);
              }

              let namespace = ((typeof attrs['namespaced'] !== 'undefined') || (typeof attrs['scoped'] !== 'undefined')) && styles[i].namespace && styles[i].parentSelectors;
              let skip = false;
              if (typeof attrs['once'] !== 'undefined') {
                if (typeof this.renderedCss[hrefPath] !== 'undefined') {
                  if (namespace) {
                    skip = typeof this.renderedCss[hrefPath][namespace] !== 'undefined';
                  } else {
                    skip = typeof this.renderedCss[hrefPath]['*'] !== 'undefined';
                  }
                }
              }

              if (!skip) {
                if (fs.existsSync(hrefPath)) {
                  let outputStyle = (typeof attrs['compressed'] !== 'undefined' ? 'compressed' : 'nested');
                  let cssBody = fs.readFileSync(hrefPath, 'utf8');

                  if (path.extname(hrefPath) === '.scss' || outputStyle === 'compressed') {
                    cssBody = sass.renderSync({ data: cssBody, outputStyle, includePaths: [this.rootDir] }).css;
                  }

                  if (namespace) {
                    cssBody = namespaceCss(cssBody, styles[i].namespace, styles[i].parentSelectors);
                  }

                  let newLine = (outputStyle === 'compressed' ? '' : '\n');

                  delete attrs.href;
                  delete attrs.compressed;
                  delete attrs.namespaced;
                  delete attrs.scoped;
                  delete attrs.class;
                  attrs.type = 'text/css';

                  styles[i].tagName = 'style';
                  styles[i].rawAttrs = this.attrsHashToString(attrs);
                  styles[i].childNodes = [new TextNode(cssBody.toString())];

                  if (typeof this.renderedCss[hrefPath] === 'undefined') {
                    this.renderedCss[hrefPath] = {};
                  }

                  if (namespace) {
                    this.renderedCss[hrefPath][styles[i].namespace] = true;
                  } else {
                    this.renderedCss[hrefPath]['*'] = true;
                  }
                }
              } else {
                delete attrs.href;
                styles[i].rawAttrs = this.attrsHashToString(attrs);
                styles[i].childNodes = [new TextNode('already included style sheet')]
                styles[i].tagName = '!--'
              }
            }
          }
        }
      }
    }

    return hp;
  }

  embedJs(hp) {
    let scripts = hp.querySelectorAll('script');

    if (scripts) {
      for (let i = 0; i < scripts.length; i++) {
        let attrs = this.attrs(scripts[i].rawAttrs);

        if (attrs['src']) {
          let uri = url.parse(attrs['src']);
          if (!uri.hostname) {
            let hrefPath = attrs['src'];
            if (path.extname(hrefPath) === '.js') {
              if (hrefPath[0] === '/') {
                if (hrefPath.indexOf(this.rootDir) !== 0) {
                  hrefPath = this.rootDir + hrefPath.substr(1, hrefPath.length - 1);
                }
              } else {
                hrefPath = path.resolve(path.parse(scripts[i].path || this.path).dir, hrefPath);
              }

              let skip = false;
              if (typeof attrs['once'] !== 'undefined') {
                skip = typeof this.renderedJs[hrefPath] !== 'undefined'
              }

              if (!skip) {
                if (fs.existsSync(hrefPath)) {
                  let compressed = typeof attrs['compressed'] !== 'undefined';
                  let jsBody = fs.readFileSync(hrefPath, 'utf8');

                  if (compressed) {
                    let result = UglifyJS.minify(jsBody);

                    if (result.error) {
                      throw result.error;
                    }

                    jsBody = result.code;
                  }

                  if (jsBody) {
                    attrs['type'] = 'text/javascript'
                    delete attrs.src;
                    delete attrs.compressed;
                    delete attrs.class;

                    scripts[i].rawAttrs = this.attrsHashToString(attrs);

                    scripts[i].childNodes = [new TextNode(jsBody)]
                    this.renderedJs[hrefPath] = true;
                  }
                }
              } else {
                delete attrs.src;
                scripts[i].rawAttrs = this.attrsHashToString(attrs);
                scripts[i].childNodes = [new TextNode('already included javascript')]
                scripts[i].tagName = '!--'
              }
            }
          }
        }
      }
    }

    return hp;
  }

  buildImages (hp) {
    let images = hp.querySelectorAll('img');

    if (images) {
      for (let i = 0; i < images.length; i++) {
        let attrs = this.attrs(images[i].rawAttrs);

        if (attrs['src']) {
          let uri = url.parse(attrs['src']);
          if (!uri.hostname) {
            let hrefPath = attrs['src'];
 
            if (hrefPath[0] === '/') {
              if (hrefPath.indexOf(this.rootDir) !== 0) {
                hrefPath = this.rootDir + hrefPath.substr(1, hrefPath.length - 1);
              }
            } else {
              hrefPath = path.resolve(path.parse(images[i].path || this.path).dir, hrefPath);
            }

            if (fs.existsSync(hrefPath)) {
              let to = (this.assetPath + hrefPath.split(`${process.cwd()}/components/`)[1])
              attrs.src = (this.assetUrl + hrefPath.split(`${process.cwd()}/components/`)[1])
              images[i].rawAttrs = this.attrsHashToString(attrs);

              this.images.push({ from: hrefPath, to });
            }
          }
        }
      }
    }
  }

  keysUsed(text, hp, comps, children) {
    let keysUsed = {};
    let open = false;
    let key = '';

    for (var i = 0; i < text.length; i++) {
      let char = text[i];

      if (char === '{') {
        key = '';
        open = true;
      } else if (char === '}' && open) {
        open = false;
        let defaultKey;
        let dataType = 'string';

        if (key.indexOf('||') !== -1) {
          let keys = key.split('||');
          if (keys.length === 2) {
            defaultKey = keys[1].trim();
            key = keys[0].trim();
          }
        }

        if (key.indexOf(':') !== -1) {
          let keys = key.split(':');
          if (keys.length === 2 && ['text', 'html', 'number'].includes(keys[1].trim())) {
            dataType = keys[1].trim();
            key = keys[0].trim();
          }
        }

        if (key === 'children') {
          if (children) {
            keysUsed = _.merge({}, keysUsed, children);
          }
        } else {
          let keys = key.split('.');
          let passOnParam = false;

          if (typeof hp.ignoreParams !== 'undefined') {
            if (hp.ignoreParams.includes(keys[0])) {
              passOnParam = true;
            }
            
          }
          if (!passOnParam) {
            let newKeysUsed = {};
            let lastKey = keys.splice(-1);
            newKeysUsed[lastKey] = { type: dataType };
            if (typeof defaultKey !== 'undefined') {
              newKeysUsed[lastKey].default = eval(defaultKey);
            }

            for (let keyI = keys.length -1; keyI >= 0; keyI--) {
              let tempNewKeysUsed = newKeysUsed
              newKeysUsed = {}
              newKeysUsed[keys[keyI]] = tempNewKeysUsed;
            }

            keysUsed = _.merge({}, keysUsed, newKeysUsed);
          }
        }
      } else if (open) {
        key += char
      }
    }

    return keysUsed;
  }

  buildParamsUsed(hp, comps, children=null) {
    let paramsUsed = {};

    if (hp.childNodes) {
      for (let i = 0; i < hp.childNodes.length; i++) {
        if (hp.childNodes[i].constructor.name === 'HTMLElement') {
          if (hp.params && hp.params.children) {
            let childrenParse = new Parse(hp.params.children).build();
            children = childrenParse.paramsUsed(comps);
          }

          if (typeof hp.childNodes[i].tagName === 'string' && hp.childNodes[i].tagName.indexOf('{') !== -1) {
            paramsUsed = _.merge({}, paramsUsed, this.keysUsed(hp.childNodes[i].tagName, hp.childNodes[i], comps, children))
          }

          if (typeof hp.childNodes[i].rawAttrs === 'string' && hp.childNodes[i].rawAttrs.indexOf('{') !== -1) {
            let attrs = this.attrs(hp.childNodes[i].rawAttrs);
            delete attrs['each']
            paramsUsed = _.merge({}, paramsUsed, this.keysUsed(this.attrsHashToString(attrs), hp.childNodes[i], comps, children))
          }

          paramsUsed = _.merge({}, paramsUsed, this.buildParamsUsed(hp.childNodes[i], comps, children))
        } else if (hp.childNodes[i].constructor.name === 'TextNode') {
          if (typeof hp.childNodes[i].rawText === 'string' && hp.childNodes[i].rawText.indexOf('{') !== -1) {
            paramsUsed = _.merge({}, paramsUsed, this.keysUsed(hp.childNodes[i].rawText, hp.childNodes[i], comps, children))
          }
        }
      }
    }

    delete paramsUsed['pages'];

    return paramsUsed;
  }

  findAttrEach(hp, paramsUsed) {
    let eachAttr = [];
    let deleteAttr = [];

    if (hp.childNodes) {
      for (let i = 0; i < hp.childNodes.length; i++) {
        if (hp.childNodes[i].constructor.name === 'HTMLElement') {
          if (hp.childNodes[i].rawAttrs.indexOf('each') !== -1) {
            let { key, value } = this.eachKeyAndValue(hp.childNodes[i]);

            if (key && value) {
              eachAttr.push({ key, value });
            }
          }

          let newEachAttr;
          [newEachAttr, paramsUsed] =  this.findAttrEach(hp.childNodes[i], paramsUsed)
          eachAttr = _.merge([], eachAttr, newEachAttr);
        }
      }
    }

    return [eachAttr, paramsUsed];
  }

  eachHuntMark(hp, key) {
    if (typeof hp.ignoreParams === 'undefined') {
      hp.ignoreParams = [key]
    } else if (!hp.ignoreParams.includes(key)) {
      hp.ignoreParams.push(key)
    }

    for (let i = 0; i < hp.childNodes.length; i++) {
      this.eachHuntMark(hp.childNodes[i], key)
    }
  }

  eachHunt(hp) {
    let eachAttr = [];

    if (hp.childNodes) {
      for (let i = 0; i < hp.childNodes.length; i++) {
        if (hp.childNodes[i].constructor.name === 'HTMLElement') {
          if (hp.childNodes[i].rawAttrs.indexOf('each') !== -1) {
            let { key, value } = this.eachKeyAndValue(hp.childNodes[i]);

            if (Array.isArray(value)) {
              this.eachHuntMark(hp.childNodes[i], key)
            }
          }
          eachAttr = _.merge([], eachAttr, this.eachHunt(hp.childNodes[i]));
        }
      }
    }

    return eachAttr;
  }

  paramsUsed (comps) {
    let hp = parse(this.html);
    hp = this.comp(hp, comps);
    this.eachHunt(hp);
    let paramsUsed = this.buildParamsUsed(hp, comps);
    let attrWithEach = [];
    [attrWithEach, paramsUsed] = this.findAttrEach(hp, paramsUsed);

    for (let i = 0; i < attrWithEach.length; i++) {
      if (typeof paramsUsed[attrWithEach[i].key] !== 'undefined') {
        if (!Array.isArray(attrWithEach[i].value)) {
          let newValue = [paramsUsed[attrWithEach[i].key]];
          delete paramsUsed[attrWithEach[i].key]

          let values = attrWithEach[i].value.split('.').reverse();
          let lastValue = values.shift();
          let newHash = {};
          newHash[lastValue] = newValue;

          for(let valueI = 0; valueI < values.length; valueI++) {
            let newHashWrap = {}
            newHashWrap[values[valueI]] = newHash;
            newHash = newHashWrap;
          }

          paramsUsed = _.merge({}, paramsUsed, newHash)
        }
      }
    }

    return paramsUsed;
  }

  toHtml(opts = {}) {
    let params = opts.params || {};
    let comps = opts.comps || {};
    let hp = opts.hp || null;
    let unwrap = opts.unwrap || false;
    let raw = opts.raw || false;

    comps = this.preloadParentSelectors(comps);
    if(!hp) {
      hp = parse(this.html, { script: true, style: true });
    }
    hp = this.addCompNamespace(hp);
    hp = this.addCompLinkAndScriptSetPath(hp, comps);
    hp = this.comp(hp, comps);
    if (!this.skipParamsValueComp) {
      if (!params.pdsPreload) {
        params.pdsPreload = { ...params };
      }

      this.paramsValueComp(params.pdsPreload, comps);
    }
    hp = this.markRenderHtml(hp);
    hp = this.each(hp, params);
    hp = this.params(hp, params, comps, raw);
    hp = this.embedCss(hp)
    hp = this.embedJs(hp)
    this.buildImages(hp)

    if (unwrap) {
      if (hp.firstChild.tagName === 'div' && hp.firstChild.childNodes.length === 1) {
        hp = hp.firstChild.firstChild;
      } else {
        hp = hp.firstChild
        hp.tagName = null
        hp.rawAttrs = ''
      }
    }

    if (this.fmt === PRETTY) {
      return pretty(hp.toString());
    } else if (this.fmt === COMPRESSED) {
      return minify(hp.toString(), {
        collapseBooleanAttributes: true,
        collapseInlineTagWhitespace: true,
        collapseWhitespace: true,
        conservativeCollapse: true,
        removeComments: true,
        removeRedundantAttributes: true,
        removeTagWhitespace: true,
        includeAutoGeneratedTags: false,
        caseSensitive: true
      });
    } else {
      return hp.toString();
    }
  }
}

