export default class Project {
  constructor () {
    this.components = {}
    this.built = false
    this.loadComponentsCache = {}
  }

  load (component) {
    this.components[component.name] = component
  }

  get (componentName) {
    console.log(componentName)
    console.log(this.loadComponentsCache[componentName])
    if (this.loadComponentsCache[componentName]) {
      return this.loadComponentsCache[componentName];
    }

    let component = this.components[componentName]

    if (component) {
      this.loadComponentsCache[componentName] = component.loadComponents(this)
      return this.loadComponentsCache[componentName]
    } else {
      return component
    }
  }

  build () {
    if (!this.built) {
      this.buildDependents()
      for (let componentName in this.components) {
        this.loadComponentsCache[componentName] = this.components[componentName].loadComponents(this)
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

    console.log('yessssssssss')

    return this
  }

  isCircular (componentName) {
    if (!this.built) this.build()
    console.log('@@@@@@@@@@@@@@@@@@@@@@@@@@@')
    let component = this.get(componentName)

    if (component) {
      component.dependencies.forEach((dependency) => {
        let dependencyComponent = this.get(dependency)

        if (dependencyComponent) {
          if (dependencyComponent.dependencies.includes(componentName)) {
            return true
          }
        }
      })
    }

    return false
  }
}