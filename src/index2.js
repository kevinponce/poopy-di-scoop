require('babel-polyfill');
import fs from 'fs';
import { promisify } from 'util';
import path from 'path';
import crypto from 'crypto';
import Project from './project';
import Component from './component';
import Page from './page';
import { PRETTY } from './const';
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

export default class PoopyDiScoop {
  constructor(options = {}) {
    let { rootDir, fmt = PRETTY } = options;
    this.project = new Project({ rootDir, fmt });
  }

  async load () {
    await this.loadComponents(`${this.project.rootDir}components/`);
    this.project.build();
    await this.loadChecksums();
    await this.loadPages(`${this.project.rootDir}pages/`);
    this.buildPages();
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
          that.project.load(new Component({ name, html, path, rootDir: that.project.rootDir }).build());
        })
      }).catch(function(err) {
        throw err;
      });
    } catch (err) {
      throw err;
    }
  }

  componentName (file) {
    return file.replace(`${this.project.rootDir}components/`, '').replace('.html', '').split('/').join('-');
  }

  async loadChecksums () {
    let that = this;
    return new Promise((resolve, reject) => {
      let file = `${this.project.rootDir}checksums.json`;
      if (fs.existsSync(file)) { 
        fs.readFile(file, 'utf8', (err, checksums) => {
          if (err) {
            reject(err);
          }

          that.project.checksums = JSON.parse(checksums);

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
              resolve({ name, pageJson: JSON.parse(page) })
            });
          })
        })
      ).then(function(pages) {
        pages.forEach(({ name, pageJson }) => {
          let page = new Page(pageJson);

          if (!page.component) {
            throw new Error(`invalid page component required in ${name}`)
          }
          if (!page.url) {
            throw new Error(`invalid page url required in ${name}`)
          }

          let component = that.project.get(page.component)
          if (!component) {
            throw new Error(`Component ${page.component} not found...`)
          }

          that.project.loadPage(page);
        })
      }).catch(function(err) {
        throw err;
      });
    } catch (err) {
      throw err;
    }
  }

  buildPages () {
    let that = this
    let pageNames  = Object.keys(this.project.pages)

    for (let i = 0; i < pageNames.length; i++) {
      let page = this.project.pages[pageNames[i]];
      if (!page) {
        throw new Error(`Page ${pageName} not found...`);
      }

      let html = this.project.toHtml(page.name);
      let pageUrl = this.pageName(page.url.trim());
      let dir = `html${path.parse(pageUrl).dir}`

      if (!fs.existsSync(`${this.project.rootDir}${dir}`)) {
        let dirArray = dir.split('/')
        let currentDir = this.project.rootDir
        for (let i = 0; i < dirArray.length; i++) {
          currentDir += `${dirArray[i]}/`;

          if (!fs.existsSync(currentDir)) {
            fs.mkdirSync(currentDir)
          }
        }
      }

      // checksum inspired by: https://github.com/dshaw/checksum/blob/master/checksum.js
      var hash = crypto.createHash('sha1')
      hash.write(html)
      let checksum = hash.digest('hex');

      if (this.project.checksums[page.name] !== checksum) {
        fs.writeFile(`${this.project.rootDir}html${pageUrl}.html`, html, (err, data) => {
          if (err) throw err;

          that.project.checksums[page.name] = checksum

          fs.writeFile(`${that.project.rootDir}checksums.json`, JSON.stringify(that.project.checksums, undefined, 2), (err, data) => {
            if (err) throw err;
          });
        });
      }
    }
  }
}
