import Base from './base'
import Parse from './parse'

export default class Component extends Base {
  constructor({ name, html }) {
    super(html, { })

    this.name = name
    this.html = html
    this.dependencies = []
    this.dependents = []
    this.parse = null
    this.built = false
  }

  build () {
    if (!this.built) {
      this.parse = new Parse(this.html, {}).build()
      this.dependencies = this.parse.dependencies()
      this.built = true
    }

    return this
  }

  loadComponents(project) {
    let newThis = this.clone()
    newThis.parse = newThis.parse.loadComponents(project)
    return newThis
  }

  toHtml ({ params }) {
    return this.parse.toHtml({ params })
  }

  paramsStructure () {
    return this.parse.buildParams()
  }

  buildDefaultParams (params = null) {
    params = params || this.paramsStructure()

    for (let key in params) {
      let param = params[key]

      if (typeof param === 'string') {
        params[key] = ''
      } else if (Array.isArray(param)) {
        params[key] = []
      } else {
        params[key] = this.buildDefaultParams(params[key])
      }
    }

    return params
  }

  buildArrayParams () {
    return this.parse.buildArrayParams()
  }
}
