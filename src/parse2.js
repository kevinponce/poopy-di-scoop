import { parse, HTMLElement, TextNode } from 'node-html-parser';
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
      let attrs = this.attrs(cn.rawAttrs);
      let ids = attrs.id ? (attrs.id.split(' ').map((_id) => `#${_id}`)) : [];
      let classes = attrs.class ? (attrs.class.split(' ').map((_id) => `.${_id}`)) : [];

      parentSelectors = [...parentSelectors, cn.tagName, ...ids, ...classes];
    }
    return _.uniq(parentSelectors)
  }

  addCompNamespace(hp) {
    for (let i = 0; i < hp.childNodes.length; i++) {
      if (!['script', 'link', 'style'].includes(hp.childNodes[i].tagName)) {
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
        styles[i].namespace = this.namespace;
      }
    }
  }

  addCompLinkSetPath (comps) {
    let comp = comps[this.name];

    if (comp) {
      this.compLinkSetPath(hp, comp);
    }
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

        if (['"', '\''].includes(char)) {
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

      attrsString += `${key}`;
      if (value) {
        attrsString += `="${value}" `;
      } else {
        attrsString += ' ';
      }
    }

    if (attrsString.length > 0) {
      attrsString = attrsString.substring(0, attrsString.length - 1);
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

      if (['['].includes(value[0])) {
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
  }

  comp (hp, comps) {
    if (hp.constructor.name === 'HTMLElement' && comps[hp.tagName] && comps[hp.tagName].html) {
      let compName = hp.tagName;
      let comp = comps[hp.tagName];
      let compHtml = comp.html;
      let params = hp.params || {}
      
      params['children'] = hp.innerHTML.toString();

      hp = parse(compHtml, { script: true, style: true });
      hp.params = params;

      for (let i = 0; i < hp.childNodes.length; i++) {
        hp.childNodes[i] = this.comp(hp.childNodes[i], comps);
        let attrs = this.attrs(hp.childNodes[i].rawAttrs);
        let newNamespace = `${this.namespace}-${compName}`;
        if (attrs.class) {
          attrs.class += ` ${newNamespace}`;
        } else {
          attrs.class = newNamespace;
        }

        hp.childNodes[i].rawAttrs = this.attrsHashToString(attrs);

        // TODO find style and load namespace
        let styles = hp.querySelectorAll('link');

        if (styles) {
          for (let i = 0; i < styles.length; i++) {
            styles[i].namespace = newNamespace;
          }
        }
      }
      this.compLinkSetPath(hp, comp);
    } else {
      for (let i = 0; i < hp.childNodes.length; i++) {
        hp.childNodes[i] = this.comp(hp.childNodes[i], comps);
      }
    }

    return hp;
  }

  each (hp, params) {
    if (hp.rawAttrs && hp.rawAttrs.indexOf('each') !== -1) {
      let { key, value } = this.eachKeyAndValue(hp);

      if (key, value) {
        if (Array.isArray(params[value])) {
          value = params[value];
        }

        if (Array.isArray(value)) {
          let attrs = this.attrs(hp.rawAttrs);
          delete attrs.each;
          hp.rawAttrs = this.attrsHashToString(attrs);
          let newHps = [];

          for (let i = 0; i < value.length; i++) {
            if (hp && hp.constructor.name === 'HTMLElement') {
              var newHp = new HTMLElement(_.cloneDeep(hp.tagName), {}, _.cloneDeep(hp.rawAttrs));
              newHp.childNodes = _.cloneDeep(hp.childNodes)
              if (typeof newHp.params === 'undefined') newHp.params = {}
              newHp.params[key] = value[i]
              newHps.push(newHp)
            } else if (hp && hp.constructor.name === 'TextNode') {
              let newHp = new TextNode(_.cloneDeep(hp.rawText))
              if (typeof newHp.params === 'undefined') newHp.params = {}
              newHp.params[key] = value[i]
              newHps.push(newHp)
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

  strAddParams(text, params, comps) {
    let newStr = '';
    let open = false;
    let key = '';

    for (var i = 0; i < text.length; i++) {
      let char = text[i];

      if (char === '{') {
        key = ''
        open = true
      } else if (char === '}' && open) {
        open = false

        if (key === 'children') {
          let value = this.findValue([key], params);
          if (value) {
            newStr += new Parse(value, { rootDir: this.rootDir, path: this.path, namespace: this.namespace }).build().toHtml(params, comps);
          } else {
            newStr += `{${key}}`;
          }
        } else {
          let keys = key.split('.');
          let value = this.findValue(keys, params);

          if (value) {
            newStr += value;
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

  params(hp, params, comps) {
    if (hp && hp.constructor.name === 'TextNode') {
      hp.rawText = this.strAddParams(hp.rawText, { ...params, ...hp.params }, comps);
    } else if (hp && hp.constructor.name === 'HTMLElement') {
      hp.rawAttrs = this.strAddParams(hp.rawAttrs, { ...params, ...hp.params }, comps);

      for (let i = 0; i < hp.childNodes.length; i++) {
        hp.childNodes[i] = this.params(hp.childNodes[i], { ...params, ...hp.params }, comps);
      }
    }

    return hp;
  }

  embedCss(hp) {
    console.log('???????????????')
    // <link href="codemirror.css" type="text/css" compressed/>
    let styles = hp.querySelectorAll('link');

    if (styles) {
      for (let i = 0; i < styles.length; i++) {
        let attrs = this.attrs(styles[i].rawAttrs);

        if (attrs['href']) {
          let uri = url.parse(attrs['href']);
          if (!uri.hostname) {
            let hrefPath = attrs['href'];
            if (['.css', '.scss'].includes(path.extname(hrefPath))) {
              if (hrefPath[0] === '/') {
                if (hrefPath.indexOf(this.rootDir) !== 0) {
                  hrefPath = this.rootDir + hrefPath.substr(1, hrefPath.length - 1);
                }
              } else {
                hrefPath = path.resolve(path.parse(styles[i].path || this.path).dir, hrefPath);
              }

              if (fs.existsSync(hrefPath)) {
                let outputStyle = (typeof attrs['compressed'] !== 'undefined' ? 'compressed' : 'nested');
                let cssBody = fs.readFileSync(hrefPath, 'utf8');

                if (path.extname(hrefPath) === '.scss' || outputStyle === 'compressed') {
                  cssBody = sass.renderSync({ data: cssBody, outputStyle, includePaths: [this.rootDir] }).css;
                }

                console.log('@@@@@@@@@@@@@@@@@@@@@@@')
                console.log(styles[i])
                console.log(attrs)
                console.log(((typeof attrs['namespaced'] !== 'undefined') || (typeof attrs['scoped'] !== 'undefined')))
                console.log(styles[i].namespace)
                console.log(styles[i].parentSelectors)
                if (((typeof attrs['namespaced'] !== 'undefined') || (typeof attrs['scoped'] !== 'undefined')) && styles[i].namespace && styles[i].parentSelectors) {
                  console.log('yesssss')
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
                hrefPath = path.resolve(path.parse(this.path).dir, hrefPath);
              }

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

                attrs['type'] = 'text/javascript'
                delete attrs.src;
                delete attrs.compressed;
                delete attrs.class;

                scripts[i].rawAttrs = this.attrsHashToString(attrs);

                scripts[i].childNodes = [new TextNode(jsBody)]
              }
            }
          }
        }
      }
    }

    return hp;
  }

  toHtml(params, comps) {
    if (!params) params = {};
    if (!comps) comps = {};

    comps = this.preloadParentSelectors(comps);
    let hp = parse(this.html, { script: true, style: true });
    this.addCompNamespace(hp);
    this.comp(hp, comps);
    this.each(hp, params);
    this.params(hp, params, comps);
    this.embedCss(hp, this.parentSelectors(hp))
    this.embedJs(hp)

    if (this.fmt === PRETTY) {
      return pretty(hp.toString());
    } else if (this.fmt === COMPRESSED) {
      return minify(hp.toString(), {
        collapseBooleanAttributes: true,
        collapseInlineTagWhitespace: true,
        collapseWhitespace: true,
        removeComments: true,
        removeRedundantAttributes: true,
        removeTagWhitespace: true
      });
    } else {
      return hp.toString();
    }
  }
}

