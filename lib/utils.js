'use strict'

function flatten (x) {
  // TODO: error?
  if (!(x instanceof Array)) return x

  return x.reduce(flattenReducer, [])
}

function flattenReducer (col, item) {
  if (Array.isArray(item)) {
    return col.concat(item)
  }
  col.push(item)
  return col
}

module.exports = {
  flatten: flatten,
  flattenReducer: flattenReducer,
  asArray: require('ml-query-builder.js/lib/utils.js').asArray
}
