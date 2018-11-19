import _ from 'lodash';
import Base from './base'
import Tag from './tag'

export default class Parse extends Base {
  constructor(html, { start, params, withWhiteSpace, prefix, postfix }) {
    super(html,  { start, params, withWhiteSpace, prefix, postfix })

    this.tags = []
  }

  build() {
    let index = this.start
    let tag = this.nextTag(index)

    while (tag) {
      this.tags.push(tag)
      this.addToParams(tag.requiredParams)
      index = tag.endAt
      tag = this.nextTag(index)
    }

    return this
  }

  nextTag(start) {
    let index = this.ignoreWhiteSpace(start)
    if (this.html.indexOf('<', index) !== index) return
    let tagPrefix = (this.withWhiteSpace ? this.buildWhiteSpacePrefix(start, index) : '')

    return new Tag(this.html, { start: index, params: this.params, withWhiteSpace: this.withWhiteSpace, prefix: tagPrefix }).build()
  }

  dependencies () {
    let dependencies = []
    this.tags.forEach((tag) => {
      if (dependencies.indexOf(tag.name) === -1) {
        dependencies.push(tag.name)
      }

      tag.dependencies().forEach((dependency) => {
        if (dependencies.indexOf(dependency) === -1) {
          dependencies.push(dependency)
        }
      })
    })

    return dependencies
  }

  buildParams () {
    let params = {}
    this.tags.forEach((tag) => {
      params = _.merge({}. params, tag.buildParams())
    })

    return params
  }

  buildArrayParams () {
    return this.buildArrayParamsRecursive(this.buildParams())
  }

  buildArrayParamsRecursive (objParams) {
    let params = []

    for (let key in objParams) {
      let value = objParams[key]
      if (typeof value === 'string') {
        params.push({ path: key, value })
      } else {
        this.buildArrayParamsRecursive(value).forEach((param) => {
          params.push({ path: `${key}.${param.path}`, value: param.value})
        })
      }
    }

    return params
  }

  loadComponents(project) {
    let newThis = this.clone()
    newThis.tags = newThis.tags.map((tag) => tag.loadComponents(project))

    return newThis
  }

  toHtml({ params, htmlCheck }) {
    htmlCheck = htmlCheck || false
    let html = ''
    this.tags.forEach((tag) => {
      html += tag.toHtml({ params, htmlCheck })
    })

    return html
  }
}
