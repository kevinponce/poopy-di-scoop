import _ from 'lodash'
import Base from './base'
import Attr from './attr'
import GetParams from './getParams'
import StringAddParams from './stringAddParams'

export default class Tag extends Base {
  constructor(html, { start, params, withWhiteSpace, prefix, postfix, skipEach, tmpParams }) {
    super(html, { start, params, withWhiteSpace, prefix, postfix })

    this.name = undefined
    this.attrs = []
    this.nestChildren = []
    this.children = []
    this.selfClosing = false
    this.closed = false
    this.endAt = start
    this.closing = false
    this.tagClosed = false
    this.skipEach = skipEach || false
    this.tmpParams = tmpParams || {}
    this.tagNamePostfix = ''
    this.closingTagNamePostfix = ''
    this.closingTagPrefix = ''
  }

  build () {
    let index = this.ignoreWhiteSpace(this.start)
    this.prefix += (this.withWhiteSpace ? this.buildWhiteSpacePrefix(this.start, index) : '')
    if (index === -1) {
      return
    }

    if (this.html.indexOf('</', index) === index) {
      this.closing = true
      index++
    }

    index = this.buildName(index + 1)

    let tagNameIndexEnd  = index
    index = this.ignoreWhiteSpace(index)
    if (this.withWhiteSpace) { this.tagNamePostfix = this.buildWhiteSpacePrefix(tagNameIndexEnd, index) }

    if (this.closing) {
      if (this.isClosed(index)) {
        index++
        this.endAt = index
      } else {
        throw `invalid closing tag: ${this.name}${this.errorAround(index)}`
      }
    } else {
      if (this.isSelfClosed(index)) {
        index += 2
        this.endAt = index
        return this
      }

      index = this.buildAttrs(index)
      this.endAt = this.buildChildren(index)
    }

    return this
  }

  buildName (index) {
    var pattern = new RegExp('^[a-zA-Z0-9_-]+$')
    let { word, newIndex } = this.whilePattern(index, pattern)

    this.name = word

    return newIndex
  }

  isSelfClosed(index) {
    if (this.html.indexOf('/>', index) === index) {
      this.selfClosing = true
      this.closed = true
      this.tagClosed = true

      return true
    } else {
      return false
    }
  }

  isClosed(index) {
    if (this.html.indexOf('>', index) === index) {
      this.closed = true
      return true
    } else {
      return false
    }
  }

  buildAttrs(index) {
    while(!this.closed) {
      let prevAttrInexEnd = index
      index = this.ignoreWhiteSpace(index)
      let attrPrefix = ''
      if (this.withWhiteSpace) { attrPrefix = this.buildWhiteSpacePrefix(prevAttrInexEnd, index) }

      if (this.isSelfClosed(index)) {
        index += 2
        if (this.withWhiteSpace && this.attrs.length > 0) { this.attrs[this.attrs.length - 1].postfix = attrPrefix }
      } else if (this.isClosed(index)) {
        index++
        if (this.withWhiteSpace && this.attrs.length > 0) { this.attrs[this.attrs.length - 1].postfix = attrPrefix }
      } else {
        let attr = new Attr(this.html, { start: index, params: this.params, withWhiteSpace: this.withWhiteSpace, prefix: attrPrefix }).build()
        index = attr.endAt
        this.attrs.push(attr)
      }
    }

    return index
  }

  buildChildren(start) {
    let index = start

    while(!this.tagClosed) {
      let childStartIndex = index
      index = this.ignoreWhiteSpace(index)
      let childPrefix = ''
      if (this.withWhiteSpace) { childPrefix = this.buildWhiteSpacePrefix(childStartIndex, index) }

      let tagStartAt = this.html.indexOf('<', index)
      if (tagStartAt !== index) {
        this.children.push(`${childPrefix}${this.html.substring(index, tagStartAt)}`)
      } else if (childPrefix !== '') {
        this.children.push(childPrefix)
      }

      let tag = new Tag(this.html, { start: tagStartAt, params: this.params, withWhiteSpace: this.withWhiteSpace, prefix: '' }).build()
      if (tag.closing) {
        if (tag.name === this.name) {
          this.tagClosed = true
          this.closingTagNamePostfix = tag.tagNamePostfix
          this.closingTagPrefix = tag.prefix

          index = tag.endAt
        } else {
          throw `Mismatched tag expect ${this.name} and got  ${tag.name}.${this.errorAround(index)}`
        }
      } else {
        this.children.push(tag)
        index = tag.endAt
      }
    }

    return index
  }

  dependencies () {
    let dependencies = []

    this.children.forEach((child) => {
      if (typeof child !== 'string') {
        if (dependencies.indexOf(child.name) === -1) {
          dependencies.push(child.name)
        }

        child.dependencies().forEach((dependency) => {
          if (dependencies.indexOf(dependency) === -1) {
            dependencies.push(dependency)
          }
        })
      }
    })

    return dependencies
  }

  loadComponents (project) {
    let newThis = this.clone()
    let component = project.get(newThis.name)

    if (component) {
      let { params, name, attrs, children, tmpParams, selfClosing, closed, tagClosed } = component.parse.tags[0]

      newThis.params = { ...newThis.params, ...params }
      newThis.name = name
      newThis.attrs = [...newThis.attrs, ...attrs]
      newThis.nestChildren = newThis.children
      newThis.children = children
      newThis.tmpParams = { ...newThis.tmpParams, ...tmpParams }
      newThis.selfClosing = selfClosing
      newThis.closed = closed
      newThis.tagClosed = tagClosed
    }

    newThis.children = newThis.children.map((child) => {
      if (typeof child !== 'string') {
        return child.loadComponents(project)
      } else {
        return child
      }
    })

    return newThis
  }

  buildParams () {
    let params = {}
    let each = this.attrs.find((attr) => attr.key === 'each')
    let eachParam, eachValue

    if (each) {
      let [param, value] = each.value.split(' in ')

      if (typeof value === 'string' && typeof param === 'string') {
        eachParam = param.trim()
        eachValue = value.trim()
      }
    }

    this.attrs.forEach((attr) => {
      let keyParams = {}
      let valueParams = {}
      if (attr.key) { keyParams = new GetParams(attr.key).build() }
      if (attr.value) { valueParams = new GetParams(attr.value).build() }
      let newParams = { ...keyParams, ...valueParams }

      for (let key in newParams ) {
        if (eachParam && key === eachParam) {
          if (typeof newParams[key] === 'string') {
            params[eachValue] = newParams[key]
          } else {
            params[eachValue] = _.merge({}, params[key] || {}, newParams[key])
          }
        } else {
          if (typeof newParams[key] === 'string') {
            params[key] = newParams[key]
          } else {
            params[key] = _.merge({}, params[key] || {}, newParams[key])
          }
        }
      }
    })

    this.children.forEach((child) => {
      let childParams
      if (typeof child === 'string') {
        childParams = new GetParams(child).build()
      } else {
        childParams = child.buildParams()
      }

      for (let key in childParams ) {
        if (eachParam && key === eachParam) {
          if (typeof childParams[key] === 'string') {
            if (typeof params[eachValue] === 'undefined') {
              params[eachValue] = [childParams[key]]
            }
          } else {
            let nestedParams = (Array.isArray(params[eachValue]) ? params[eachValue][0] : params[eachValue]) || {}
            params[eachValue] = [_.merge({}, nestedParams, childParams[key])]
          }
        } else {
          if (typeof childParams[key] === 'string') {
            if (typeof params[key] === 'undefined') {
              params[key] = childParams[key]
            }
          } else {
            if (Array.isArray(childParams[key])) {
              params[key] = _.merge([], params[key] || [], childParams[key])
              // params[key] = [_.merge({}, params[key] || {}, childParams[key][0])]
            } else {
              params[key] = _.merge({}, params[key] || {}, childParams[key])
            }
          }
        }
      }
    })

    return params;
  }

  toHtml({ params, htmlCheck }) {
    htmlCheck = htmlCheck || false
    let html = `${this.prefix}<${this.name}${this.tagNamePostfix}`
    let currentParams = { ...this.params, ...params };
    let attrs = ''
    let each = this.attrs.find((attr) => attr.key === 'each')

    if (!htmlCheck && !this.skipEach && each) {
      html = ''
      if (each.value.split(' in ').length === 2) {
        let [param, value] = each.value.split(' in ')
        param = param.trim()
        this.skipEach = true

        if (currentParams[value]) {
          if (Array.isArray(currentParams[value])) {
            currentParams[value].forEach((item) => {
              this.tmpParams[param] = item
              let newParams = { ...params, ...currentParams, ...this.tmpParams }
              
              html += this.toHtml({ params: newParams, htmlCheck })
            })
          } else {
            throw `${value} is not array but is used in each.${this.errorAround(index)}`
          }
        } else {
          try {
            if (array && Array.isArray(array)) {
              array.forEach((item) => {
                this.tmpParams[param] = item
                let newParams = { ...params, ...currentParams, ...this.tmpParams }
                html += this.toHtml({ params: newParams, htmlCheck })
              })
            } else {
              throw `${value} is not array but is used in each.${this.errorAround(index)}`
            }
          } catch(err) {
            throw `${value} is not array but is used in each.${this.errorAround(index)}`
          }
        }
      } else {
        throw `invalid each value "${each.value}".${this.errorAround(index)}`
      }
    } else {
      /*
      let ifStatement = this.attrs.find((attr) => attr.key === 'if')

      if (ifStatement) {
        // TODO: if
      }
      */

      this.attrs.forEach((attr) => {
        let attrHtml = `${attr.prefix}${attr.key}${attr.keyPostfix}`

        if (htmlCheck || attr.key !== 'each') {
          if (!htmlCheck && typeof attr.value === 'string') {
            attrHtml += `=${attr.valuePrefix}${attr.valueQuote}${(new StringAddParams(attr.value, { params: { ...currentParams, ...this.tmpParams } })).build()}${attr.valueQuote}`
          } else if (attr.value) {
            attrHtml += `=${attr.valuePrefix}${attr.valueQuote}${attr.value}${attr.valueQuote}`
          }

          attrs += `${attrHtml}${attr.postfix}`
        }
      })

      let children = ''
      this.children.forEach((child) => {
        if (typeof child == 'string') {
          if (htmlCheck) {
            children += child
          } else {
            let newChildren = this.nestChildren.map((child) => {
              if (child.constructor.name === 'Tag') {
                let newTag = child.clone()
                newTag.params = { ...currentParams, ...this.tmpParams }

                return newTag
              } else {
                return child
              }
            })

            children += (new StringAddParams(child, { params: { ...currentParams, ...this.tmpParams, children: this.nestChildren } })).build()
          }
        } else {
          children += child.toHtml({ params, htmlCheck })
        }
      })
      if(!this.withWhiteSpace && attrs !== '') {
        html += ' '
      }
      if (this.selfClosing) {
        html += `${attrs}/>`
      } else {
        html += `${attrs}>${children}${this.closingTagPrefix}</${this.name}${this.closingTagNamePostfix}>`
      }
    }

    return html
  }
}
