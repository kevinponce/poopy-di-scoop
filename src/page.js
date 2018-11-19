export default class Page {
  constructor({ componentName, project, params }) {
    this.componentName = componentName
    this.project = project
    this.params = params
    this.component = project.get(this.componentName)
  }

  build () {
    if (!this.component) {
      throw `Component ${this.componentName} not found`
    }

    this.project.build()
    if (this.project.isCircular(this.componentName)) {
      throw `Component ${this.componentName} is circular`
    }

    return this.component.loadComponents(this.project).toHtml({ params: this.params })
  }
}
