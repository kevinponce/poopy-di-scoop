import _ from 'lodash';
export default class GetParams {
  constructor(text) {
    this.text = text
  }

  build () {
    let open = false
    let param = ''
    let params = {}

    for (var i = 0; i < this.text.length; i++) {
      let char = this.text[i]

      if (char === '{') {
        param = ''
        open = true
      } else if (char === '}' && open) {
        open = false

        let paramArray = param.split('.')
        let paramArrayLength = paramArray.length -1

        let updateParams = {}

        for (let i = paramArrayLength; i >= 0 ; i--) {
          let p = paramArray[i];

          if (i === paramArrayLength) {
            let newObjNestedParams = {}
            newObjNestedParams[p] = 'string'
            updateParams = newObjNestedParams
          } else {
            let newObjNestedParams = {}
            newObjNestedParams[p] = updateParams
            updateParams = newObjNestedParams
          }

          if (i === 0) {
            params = _.merge({}, params, updateParams)
          }
        }
      } else if (open) {
        param += char
      }
    }

    return params
  }
}
