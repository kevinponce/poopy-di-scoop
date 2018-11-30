import fs from 'fs';
import { promisify } from 'util';
import path from 'path';
import Project from './src/project';
import Component from './src/component';
const readFile = promisify(fs.readFile)
const writeFile = promisify(fs.writeFile)
const mkdir = promisify(fs.mkdir)

export default class PoopyDiScoop {
  constructor(rootDir) {
    rootDir = rootDir.trim();

    if (!fs.statSync(rootDir).isDirectory()) {
      throw new Error(`"${this.rootDir}" is an invalid directory`);
    }

    let slash = (rootDir.substr(-1) === '/' ? '' : '/');
    this.rootDir = rootDir + slash;
    this.project = new Project();
  }

  async load () {
    await this.loadTemplates(`${this.rootDir}templates/`);
    this.project.build()
    await this.loadPages(`${this.rootDir}pages/`);
  }

  templateFiles (dir, templateFiles = []) {
    let that = this
    let files = fs.readdirSync(dir);

    files.forEach(function(file) {
      let dirCheck = `${dir}${file}`;
      if (fs.statSync(dirCheck).isDirectory()) {
        templateFiles = [...templateFiles, ...that.templateFiles(`${dirCheck}/`)];
      } else if (path.extname(file) === '.html') {
        templateFiles.push(`${dir}${file}`);
      }
    });

    return templateFiles
  }

  async loadTemplates (dir) {
    let that = this;
    let files = this.templateFiles(dir);

    try {
      await Promise.all(
        files.map(name => {
          return new Promise((resolve, reject) => {
            fs.readFile(name, 'utf8', (err, html) => {
              if (err) {
                reject(err);
              }

              resolve({ name, html })
            });
          })
        })
      ).then(function(templates) {
        templates.forEach(({ name, html }) => {
          name = that.templateName(name);
          that.project.load(new Component({ name, html }).build())
        })
      }).catch(function(err) {
        throw err;
      });
    } catch (err) {
      throw err;
    }
  }

  templateName (file) {
    return file.replace(`${this.rootDir}templates/`, '').replace('.html', '').split('/').join('-');
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
              resolve({ name, page: JSON.parse(page) })
            });
          })
        })
      ).then(function(pages) {
        pages.forEach(({ name, page }) => {
          if (!page.template) {
            throw new Error(`invalid page template required in ${name}`)
          }
          if (!page.url) {
            throw new Error(`invalid page url required in ${name}`)
          }

          let component = that.project.get(page.template)
          if (!component) {
            throw new Erro(`Template ${page.template} not found...`)
          }
          let html = component.toHtml({ params: page.params });
          let path = that.pageName(page.url.trim());
          let paths = path.substr(1, path.length - 1).split('/');
          paths.pop();
          let dir = `html/${paths.join('/')}`

          if (!fs.existsSync(`${that.rootDir}${dir}`)) {
            let dirArray = dir.split('/')
            let currentDir = that.rootDir
            for (let i = 0; i < dirArray.length; i++) {
              currentDir += `${dirArray[i]}/`;

              if (!fs.existsSync(currentDir)) {
                fs.mkdirSync(currentDir)
              }
            }
          }

          writeFile(`${that.rootDir}html${path}.html`, html, (err, data) => {
            if (err) throw err;
          });
        })
      }).catch(function(err) {
        throw err;
      });
    } catch (err) {
      throw err;
    }
  }
}
