require('babel-polyfill');
import _ from 'lodash';
import fs from 'fs';
import { promisify } from 'util';
import path from 'path';
import crypto from 'crypto';
import parseJson from 'parse-json';
import ghpages from 'gh-pages';
import Component from './component';
import Page from './page';
import Parse from './parse';
import { PRETTY, LOCAL, HTML } from './const';
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

export default class PoopyDiScoop {
  constructor(options = {}) {
    let { rootDir = './', fmt = PRETTY, githubName } = options;

    this.components = {};
    this.checksums = [];
    this.pages = {};
    this.fmt = fmt;
    this.githubName = githubName || null;

    let slash = (rootDir.substr(-1) === '/' ? '' : '/');
    this.rootDir = rootDir + slash;
  }

  async load (pushToProd=true) {
    await this.loadComponents(`${this.rootDir}components/`);
    await this.loadChecksums();
    await this.loadPages(`${this.rootDir}pages/`);
    this.buildPages();
    if (pushToProd) {
      this.pushToProd()
    }
  }

  async listComponents () {
    await this.loadComponents(`${this.rootDir}components/`);
    return this.components;
  }

  async listPages () {
    await await this.loadPages(`${this.rootDir}pages/`);
    return this.pages;
  }

  componentFiles (dir, componentFiles = []) {
    let that = this;
    let files = fs.readdirSync(dir);

    files.forEach(function(file) {
      let dirCheck = `${dir}${file}`;
      if (fs.statSync(dirCheck).isDirectory()) {
        componentFiles = [...componentFiles, ...that.componentFiles(`${dirCheck}/`)];
      } else if (path.extname(file) === '.html') {
        componentFiles.push(`${dir}${file}`);
      }
    });

    return componentFiles;
  }

  async loadComponents (dir) {
    let that = this;
    let files = this.componentFiles(dir);

    try {
      await Promise.all(
        files.map(file => {
          return new Promise((resolve, reject) => {
            fs.readFile(file, 'utf8', (err, html) => {
              if (err) {
                reject(err);
              }

              resolve({ path: file, html });
            });
          })
        })
      ).then(function(components) {
        components.forEach(({ path, html }) => {
          let name = that.componentName(path);
          that.components[name] = new Component({ name, html, path });

          let names = name.split('-');
          if (names.splice(-1)[0] === 'index' && typeof that.components[names.join('-')] === 'undefined') {
            let aliasName = names.join('-');
            that.components[aliasName] = new Component({ name: aliasName, html, path });
          }
        });
      }).catch(function(err) {
        throw err;
      });
    } catch (err) {
      throw err;
    }
  }

  componentName (file) {
    return file.replace(`${this.rootDir}components/`, '').replace('.html', '').split('/').join('-');
  }

  async loadChecksums () {
    let that = this;
    return new Promise((resolve, reject) => {
      let file = `${this.rootDir}checksums.json`;
      if (fs.existsSync(file)) { 
        fs.readFile(file, 'utf8', (err, checksums) => {
          if (err) {
            reject(err);
          }

          that.checksums = parseJson(checksums);

          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  pageFiles (dir, pageFiles = []) {
    let that = this
    let files = fs.readdirSync(dir);

    files.forEach(function(file) {
      let dirCheck = `${dir}${file}`;
      if (fs.statSync(dirCheck).isDirectory()) {
        pageFiles = [...pageFiles, ...that.pageFiles(`${dirCheck}/`)];
      } else if (path.extname(file) === '.js') {
        pageFiles.push(`${dir}${file}`);
      }
    });

    return pageFiles
  }

  pageName (path) {
    if (path === '/') {
      path = '/index';
    } else {
      if (path[0] !== '/') {
        path = `/${path}`;
      }
      if (path.substr(-1) === '/') {
        path = path.substr(0, path.length -1);
      }
    }

    return path;
  }

  async loadPages (dir) {
    let that = this;
    let files = this.pageFiles(dir);

    try {
      await Promise.all(
        files.map(name => {
          return new Promise((resolve, reject) => {
            fs.readFile(name, 'utf8', (err, page) => {
              if (err) {
                reject(err);
              }

              // TODO catch invalid json
              resolve({ name, pageJson: parseJson(page) });
            });
          })
        })
      ).then(function(pages) {
        pages.forEach(({ name, pageJson }) => {
          let page = new Page(pageJson);

          if (!page.component) {
            throw new Error(`invalid page component required in ${name}`);
          }
          if (!page.url) {
            throw new Error(`invalid page url required in ${name}`);
          }

          let component = that.components[page.component];
          if (!component) {
            throw new Error(`Component ${page.component} not found...1`);
          }

          that.pages[page.name] = page;
        })
      }).catch(function(err) {
        throw err;
      });
    } catch (err) {
      throw err;
    }
  }

  pageParams (local=false) {
    let pageNames  = Object.keys(this.pages);
    let params  = {};

    for (let i = 0; i < pageNames.length; i++) {
      let page = this.pages[pageNames[i]];
      if (!page) {
        throw new Error(`Page ${pageName} not found...2`);
      }

      if (this.githubName) {
        params[page.name] = page.toJson({ rootDir: this.rootDir, local, urlPrefix: `/${this.githubName}/` })
      } else {
        params[page.name] = page.toJson({ rootDir: this.rootDir, local })
      }
    }

    return params
  }

  mkdir(dir) {
    if (!fs.existsSync(dir)) {
      let dirArray = dir.split('/')
      let currentDir = this.rootDir;

      for (let i = 0; i < dirArray.length; i++) {
        currentDir += `${dirArray[i]}/`;

        if (!fs.existsSync(currentDir)) {
          fs.mkdirSync(currentDir)
        }
      }
    }
  }

  buildPages () {
    let that = this
    let pageNames  = Object.keys(this.pages)
    let types = [HTML, LOCAL];

    for (let typeI = 0; typeI < types.length; typeI++) {
      let type = types[typeI];

      for (let i = 0; i < pageNames.length; i++) {
        let page = this.pages[pageNames[i]];
        if (!page) {
          throw new Error(`Page ${pageNames[i]} not found...3`);
        }

        let component = that.components[page.component];
        if (component) {
          let assetUrl = '/';
          let assetPath = `/${type}/`;
          if (type === LOCAL) {
            assetUrl = `${process.cwd()}/local`;
            assetPath = `${process.cwd()}/local`;
          } else if (that.githubName) {
            assetUrl = `/${that.githubName}/`
          }

          let assetUrlSlash = (assetUrl.substr(-1) === '/' ? '' : '/');
          let assetPathSlash = (assetPath.substr(-1) === '/' ? '' : '/');

          let parse = new Parse(_.cloneDeep(component.html), {
            path: component.path,
            rootDir: this.rootDir,
            namespace: `pds-${component.name}`,
            name: component.name,
            fmt: this.fmt,
            assetUrl: assetUrl + assetUrlSlash,
            assetPath: assetPath + assetPathSlash
          }).build();

          let currentPageParams;
          if (this.githubName) {
            currentPageParams = page.toJson({ rootDir: this.rootDir, local: (type === LOCAL), urlPrefix: `/${this.githubName}/` })
          } else {
            currentPageParams = page.toJson({ rootDir: this.rootDir, local: (type === LOCAL) })
          }

          let params = {
            ...page.params,
            pages: this.pageParams(type === LOCAL),
            page: currentPageParams
          };

          if (typeof page.pages !== 'undefined') {
            if (typeof page.pages.nameAs !== 'undefined' && typeof page.pages.tags !== 'undefined' && Array.isArray(page.pages.tags)) {
              let pageArray = pageNames.map((pn) =>  this.pages[pn]);

              params[page.pages.nameAs] = pageArray.filter((p) => {
                if(typeof p.tags !== 'undefined' && Array.isArray(p.tags)) {
                  for (var i = 0; i < page.pages.tags.length; i++) {
                    if (!p.tags.includes(page.pages.tags[i])) {
                      return false;
                    }
                  }
                  return true;
                } else {
                  return false;
                }
              });

              if (typeof page.pages.orderBy !== 'undefined') {
                let withOrderByAttr = params[page.pages.nameAs].filter((p) => (typeof p[page.pages.orderBy] !== 'undefined'))
                let withoutOrderByAttr = params[page.pages.nameAs].filter((p) => (typeof p[page.pages.orderBy] === 'undefined'))

                withOrderByAttr.sort((p1, p2) => p2[page.pages.orderBy] - p1[page.pages.orderBy])

                params[page.pages.nameAs] = [...withOrderByAttr, ...withoutOrderByAttr];
              }

              params[page.pages.nameAs].map((p) => {
                if (that.githubName) {
                  p.url = p.fmtUrl({ rootDir: that.rootDir, local: (type === LOCAL), urlPrefix: `/${that.githubName}/` })
                } else {
                  p.url = p.fmtUrl({ rootDir: that.rootDir, local: (type === LOCAL) })
                }
                return p
              })
            }
          }

          let html = parse.toHtml({ params: _.cloneDeep(params), comps: _.cloneDeep(that.components) });
          let pageUrl = this.pageName(page.url.trim());
          let dir = `${type}${path.parse(pageUrl).dir}`

          this.mkdir(`${this.rootDir}${dir}`)

          // checksum inspired by: https://github.com/dshaw/checksum/blob/master/checksum.js
          var hash = crypto.createHash('sha1')
          hash.write(html)
          let checksum = hash.digest('hex');

          if (type !== HTML || this.checksums[page.name] !== checksum) {
            fs.writeFile(`${this.rootDir}${type}${pageUrl}.html`, html, (err, data) => {
              if (err) throw err;

              for (let imageI = 0; imageI < parse.images.length; imageI++) {
                let imageHash = parse.images[imageI];

                if (imageHash.to.split(`${process.cwd()}`).length > 1) {
                  that.mkdir(path.parse(imageHash.to.split(`${process.cwd()}`)[1]).dir)
                } else {
                  that.mkdir(path.parse(imageHash.to).dir)
                }

                if (!imageHash.from.includes(process.cwd())) {
                  imageHash.from = process.cwd() + imageHash.from;
                } else
                if (!imageHash.to.includes(process.cwd())) {
                  imageHash.to = process.cwd() + imageHash.to;
                }
                
                fs.copyFile(imageHash.from, imageHash.to, (err) => {
                  if (err) throw err;
                });
              }

              if (type === HTML) {
                that.checksums[page.name] = checksum

                fs.writeFile(`${that.rootDir}checksums.json`, JSON.stringify(that.checksums, undefined, 2), (err, data) => {
                  if (err) throw err;
                });
              }
            });
          }
        }
      }
    }
  }

  paramsUsed(component) {
    let parse = new Parse(_.cloneDeep(component.html), {
      rootDir: this.rootDir
    }).build();

    return parse.paramsUsed(this.components)
  }

  pushToProd() {
    if (this.githubName) {
      ghpages.publish('html', function(err) {
        if (err) throw err;
      });
    }
  }
}
