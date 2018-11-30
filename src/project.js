export default class Project {
  constructor () {
    this.components = {}
    this.built = false
  }

  load (component) {
    this.components[component.name] = component
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
}