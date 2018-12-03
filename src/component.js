import Base from './base';
import Parse from './parse';
import { PRETTY } from './const';

export default class Component extends Base {
  constructor({ name, html, path, rootDir }) {
    super(html, { })

    this.name = name;
    this.html = html;
    this.path = path;
    this.rootDir = rootDir;
    this.dependencies = [];
    this.dependents = [];
    this.parse = null;
    this.built = false;
  }

  build () {
    if (!this.built) {
      this.parse = new Parse(this.html, { path: this.path, rootDir: this.rootDir }).build();
      this.dependencies = this.parse.dependencies();
      this.built = true;
    }

    return this;
  }

  loadComponents(project) {
    let newThis = this.clone();
    newThis.parse = newThis.parse.loadComponents(project);
    return newThis;
  }

  toHtml ({ params, namespace, fmt = PRETTY }) {
    return this.parse.toHtml({ params, namespace: `pds-${this.name}`, fmt });
  }

  paramsStructure () {
    return this.parse.buildParams();
  }

  buildDefaultParams (params = null) {
    params = params || this.paramsStructure();

    for (let key in params) {
      let param = params[key];

      if (typeof param === 'string') {
        params[key] = '';
      } else if (Array.isArray(param)) {
        params[key] = [];
      } else {
        params[key] = this.buildDefaultParams(params[key]);
      }
    }

    return params;
  }

  buildArrayParams () {
    return this.parse.buildArrayParams();
  }
}
