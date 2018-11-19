import _ from 'lodash'

export default class base {
  constructor(html, { start, params, withWhiteSpace, prefix, postfix }) {
    this.html = html
    this.start = start || 0
    this.params = params || {}
    this.withWhiteSpace = withWhiteSpace || false
    this.prefix = prefix || ''
    this.postfix = postfix || ''
    this.requiredParams = []
  }

  ignoreWhiteSpace(index) {
    let letter = this.html[index]

    while (letter === ' ') {
      index++
      letter = this.html[index]
    }

    return index
  }

  until(index, check) {
    let letter = this.html[index]
    let word = ''

    while (letter && !check.includes(letter)) {
      word += letter
      index++
      letter = this.html[index]
    }

    return { word, newIndex: index }
  }

  whilePattern(index, pattern) {
    let letter = this.html[index]
    let word = ''

    while (letter && pattern.test(letter)) {
      word += letter
      index++
      letter = this.html[index]
    }

    return { word, newIndex: index }
  }

  buildWhiteSpacePrefix(startIndex, endIndex) {
    if (endIndex > startIndex) {
      return ' '.repeat(endIndex - startIndex)
    } else {
      return ''
    }
  }

  errorAround (index) {
    let size = 20
    let distanceFromStart = index - size
    let start = (distanceFromStart > 0 ? distanceFromStart : 0)
    let toTheEnd = (index + size) < this.html.length
    let end = (toTheEnd ? this.html.length : (index + size))
    let prefix = start > 0 ? '...' : ''
    let postfix = toTheEnd ? '...' : ''
    return ` Around:\n${prefix}${this.html.substring(start, end)}${postfix}\n${' '.repeat(index - start + prefix.length)}^`
  }

  clone () {
    return _.clone(this)
    //return _.cloneDeepWith(this)
    //return this
    //return _.clone(this)
    //return Object.assign( Object.create( Object.getPrototypeOf(this)), this)
  }

  addToParams(params, filter = []) {
    params.forEach((param) => {
      if (!this.requiredParams.includes(param) && !filter.includes(param)) {
        this.requiredParams.push(param)
      }
    })
  }
}
