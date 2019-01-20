import url from 'url';
import path from 'path';
import moment from 'moment';

export default class Page {
  constructor({ name, url, title, component, params, date, tags, pages }) {
    this.name = name;
    this.url = url;
    this.title = title;
    this.component = component;
    this.params = params;
    this.date = date;
    this.tags = tags || [];
    this.pages = pages || {};

    if (this.date) {
      let momentDate = moment(this.date, 'YYYY-MM-DD');

      if (momentDate.isValid()) {
        this.date = momentDate.toDate();
      } else {
        this.date = null;
      }
    }

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
    if (urlPrefix) {
      if (this.url[0] === '/') {
        return urlPrefix + this.url.substr(1);
      } else {
        return urlPrefix + this.url;
      }
    } else {
      return this.url;
    }
  }

  fmtUrl(opts = {}) {
    let rootDir = opts.rootDir || false;
    let local = opts.local || false;
    let urlPrefix = opts.urlPrefix || '';

    return (local ? this.localUrl(rootDir): this.nonLocalUrl(urlPrefix));
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
    return {
      "name": this.name,
      "title": this.title,
      "url": this.fmtUrl(opts),
      "date": this.date,
      "tags": this.tags
    }
  }
}
