import url from 'url';
import path from 'path';

export default class Page {
  constructor({ name, url, title, component, params }) {
    this.name = name;
    this.url = url;
    this.title = title;
    this.component = component;
    this.params = params;

    this.isValid();
  }

  isValid () {
    if (!this.component) {
      throw new Error(`invalid page component required in ${this.name}`)
    }
    if (!this.url) {
      throw new Error(`invalid page url required in ${this.name}`)
    }

    if (!this.title) {
      throw new Error(`invalid page title required in ${this.name}`)
    }

    let uri = url.parse(this.url);
    if (uri.hostname) {
      throw new Error(`${this.name} url must be relative`)
    }

    return true;
  }

  localUrl(rootDir) {
    return `${process.cwd()}/local${path.resolve(path.parse(rootDir).dir, this.fixUrl(this.url.trim()))}.html`;
  }

  nonLocalUrl(urlPrefix) {
    if (this.url[0] === '/') {
      return urlPrefix + this.url.substr(1);
    } else {
      return urlPrefix + this.url;
    }
  }


  fixUrl (path) {
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

  toJson (opts = {}) {
    let rootDir = opts.rootDir || false;
    let local = opts.local || false;
    let urlPrefix = opts.urlPrefix || '';

    return {
      "name": this.name,
      "title": this.title,
      "url": (local ? this.localUrl(rootDir): this.nonLocalUrl(urlPrefix))
    }
  }
}
