'use strict'

var defaultNames = {
  qtext: 'q',
  // sort: 's',
  page: 'p',
  // TODO: pageLength, searchTransform, operators
  constraints: 'c',
  orConstraints: 'o',
  notConstraints: 'n'
}

var constraintNames = ['constraints', 'orConstraints', 'notConstraints']

function createConfig (options) {
  options = options || {}

  var separator = options.separator || ':'
  var prefix = options.prefix == null ? ''
               : options.prefix + (options.prefixSeparator || separator)

  var config = {
    separator: separator,
    prefix: prefix,
    constraintNames: constraintNames,
    constraintKeys: [],
    names: [],
    keys: [],
    byName: {},
    byKey: {}
  }

  Object.keys(defaultNames)
  .forEach(function (name) {
    if (options[name] === null) return

    var key = prefix + (options[name] || defaultNames[name])

    config.names.push(name)
    config.keys.push(key)
    config.byName[name] = key
    config.byKey[key] = name

    if (constraintNames.indexOf(name) > -1) {
      config.constraintKeys.push(key)
    }
  })

  return config
}

module.exports = createConfig
