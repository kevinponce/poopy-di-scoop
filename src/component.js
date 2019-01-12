import Parse from './parse';
import { PRETTY } from './const';

export default class Component {
  constructor({ name, html, path, rootDir }) {

    this.name = name;
    this.html = html;
    this.path = path;
    this.rootDir = rootDir;
    this.dependencies = [];
    this.dependents = [];
    this.parse = null;
    this.built = false;
  }
}
