import Base from './base'

export default class Attr extends Base {
  constructor(html, { start, params, withWhiteSpace, prefix, postfix }) {
    super(html, { start, params, withWhiteSpace, prefix, postfix })

    this.key = undefined
    this.value = undefined
    this.endAt = start
    this.keyPostfix = ''
    this.valuePrefix = ''
    this.valueQuote = ''
  }

  build () {
    this.endAt = this.buildKey(this.start)
    this.endAt = this.buildValue(this.endAt)

    return this
  }

  buildKey (index) {
    let { word, newIndex } = this.until(index, ['=', '/', '>', ' '])
    this.key = word

    return newIndex
  }

  buildValue (index) {
    let keyStartIndex = index
    index = this.ignoreWhiteSpace(index)
    if (this.withWhiteSpace) { this.keyPostfix = this.buildWhiteSpacePrefix(keyStartIndex, index) }
    let letter = this.html[index]

    if (letter !== '=') {
      return index
    }

    let equalIndex = index + 1
    index = this.ignoreWhiteSpace(index + 1)
    if (this.withWhiteSpace) { this.valuePrefix = this.buildWhiteSpacePrefix(equalIndex, index) }
    letter = this.html[index]

    if(!["'", "\""].includes(letter)) {
      throw `invalid value for ${this.key}`
      return index
    }

    this.valueQuote = letter

    let open = letter
    let value = ''
    index++
    letter = this.html[index]

    while (letter && letter !== open) {
      value += letter
      index++
      letter = this.html[index]
    }

    this.value = value
    return index + 1
  }
}
