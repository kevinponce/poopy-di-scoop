export default class StringAddParams {
  constructor(text, { params }) {
    this.text = text
    this.params = params
  }

  build () {
    let newStr = ''
    let open = false
    let key = ''
    for (var i = 0; i < this.text.length; i++) {
      let char = this.text[i]

      if (char === '{') {
        key = ''
        open = true
      } else if (char === '}' && open) {
        open = false

        if (key.trim() === 'children') {
          let children = this.params[key.trim()]

          if (children) {
            children.forEach((child) => {
              newStr += child.toHtml({ params: this.params })
            })
          } else {
            newStr += `{${key}}`
          }
        } else {
          let keyArray = key.split('.')

          if (keyArray.length > 1) {
            let keyParams = this.params
            let found = true

            keyArray.forEach((keyItem) => {
              if (typeof keyParams[keyItem] !== 'undefined') {
                keyParams = keyParams[keyItem]
              } else {
                found = false
              }
            })

            if (found) {
              newStr += keyParams
            } else {
              newStr += `{${key}}`
            }
          } else {
            if (this.params[key]) {
              newStr += this.params[key]
            } else {
              newStr += `{${key}}`
            }
          }
        }
      } else if (open) {
        key += char
      } else {
        newStr += char
      }
    }

    return newStr
  }
}
