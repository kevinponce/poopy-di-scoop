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
    let component = this.components[componentName]

    if (component) {
      for (let i = 0; i < component.dependencies.length; i++) {
        let dependency = component.dependencies[i];

        let dependencyComponent = this.components[dependency]

        if (dependencyComponent) {
          if (dependencyComponent.dependencies.includes(componentName)) {
            return true
          }
        }
      }

      for (let i = 0; i < component.dependents.length; i++) {
        let dependency = component.dependents[i];

        let dependencyComponent = this.components[dependency]

        if (dependencyComponent) {
          if (dependencyComponent.dependencies.includes(componentName)) {
            return true
          }
        }
      }
    }

    return false
  }
}