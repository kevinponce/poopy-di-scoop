import fs from 'fs';
import { PRETTY } from './const';

export default class Project {
  constructor (options = {}) {
    this.components = {}
    this.pages = {}
    this.checksums = {}
    this.built = false

    let { rootDir, fmt = PRETTY } = options;
    rootDir = rootDir ? rootDir.trim() : '.';
    if (!fs.statSync(rootDir).isDirectory()) {
      throw new Error(`"${this.rootDir}" is an invalid directory`);
    }

    let slash = (rootDir.substr(-1) === '/' ? '' : '/');
    this.rootDir = rootDir + slash;
    this.fmt = fmt;
  }

  load (component) {
    this.components[component.name] = component
  }

  loadPage (page) {
    this.pages[page.name] = page;
  }

  get (componentName) {
    let component = this.components[componentName]

    if (component) {
      return component.loadComponents(this)
    } else {
      return component
    }
  }

  build () {
    if (!this.built) {
      this.buildDependents()
      let components = this.componentNames()

      for (let i = 0; i < components.length; i++) {
        let componentName = components[i];
      }

      for (let i = 0; i < components.length; i++) {
        let componentName = components[i];
        if (this.isCircular(componentName)) {
          throw new Error(`${componentName} is circular`);
        }
      }
      this.built = true
    }

    return this
  }

  componentNames () {
    return Object.keys(this.components)
  }

  buildDependents () {
    let dependenciesMap = {}

    for (var componentName in this.components) {
      let component = this.components[componentName]

      component.dependencies.forEach((dependency) => {
        if (!dependenciesMap[dependency]) {
          dependenciesMap[dependency] = []
        }

        dependenciesMap[dependency].push(component.name)
      })
    }

    for (var componentName in this.components) {
      let component = this.components[componentName]
      component.dependents = dependenciesMap[component.name] || []
    }

    return this
  }

  isCircular (componentName) {
    return this.allDependent(componentName).includes(componentName);
  }

  allDependent(componentName, dependents=[]) {
    let component = this.components[componentName]
    if (!component) {
      return dependents;
    }

    for (let i = 0; i < component.dependencies.length; i++) {
      let dependencyComponentName = component.dependencies[i];
      let dependencyComponent = this.components[dependencyComponentName];

      if (dependencyComponent && !dependents.includes(dependencyComponentName)) {
        dependents.push(dependencyComponentName);
        let nestDependents = this.allDependent(dependencyComponentName, dependents).filter(e => !dependents.includes(e));
        dependents = [...dependents, ...nestDependents]
      }
    }

    return dependents;
  }

  pageParams () {
    let pageNames  = Object.keys(this.pages);
    let params  = {};

    for (let i = 0; i < pageNames.length; i++) {
      let page = this.pages[pageNames[i]];
      if (!page) {
        throw new Error(`Page ${pageName} not found...`);
      }

      params[page.name] = page.toJson()
    }

    return params
  }

  toHtml (pageName) {
    let page = this.pages[pageName];
    if (!page) {
      throw new Error(`Page ${pageName} not found...`);
    }

    let component = this.get(page.component);
    if (!component) {
      throw new Error(`Component ${page.component} not found...`);
    }

    return component.toHtml({
      params: { 
        ...page.params,
        pages: this.pageParams(),
        page: page.toJson()
      },
      fmt: this.fmt,
      project: this
    });
  }
}