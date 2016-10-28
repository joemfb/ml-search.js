'use strict'

var qb = require('ml-query-builder.js')
var utils = require('./utils.js')

function range (name, type) {
  return function (values, exclude) {
    exclude = !!exclude
    values = utils.asArray(values)

    var valid = values.every(function (value) {
      return value.type === 'value' || value.type === 'range'
    })

    if (!valid) {
      console.log('invalid value in:')
      console.log(values)
      throw new TypeError('invalid value for ' + type + ' constraint: ' + name)
    }

    var queryValues = values.filter(function (value) {
      return value.type === 'value'
    })
    .map(function (value) {
      return value.value
    })

    var queries = []

    if (queryValues.length) {
      // TODO: '!=' : '='
      queries.push(qb.ext.rangeConstraint(name, exclude ? 'NE' : 'EQ', queryValues))
    }

    values.filter(function (value) {
      return value.type === 'range'
    })
    .forEach(function (value) {
      // TODO: inclusive/exclusive option?
      if (value.min !== undefined) {
        // TODO: '<' : '>='
        queries.push(qb.ext.rangeConstraint(name, exclude ? 'LT' : 'GE', value.min))
      }
      if (value.max !== undefined) {
        // TODO: '>' : '<='
        queries.push(qb.ext.rangeConstraint(name, exclude ? 'GT' : 'LE', value.max))
      }
    })

    return queries
  }
}

function geo (name, type) {
  return function (values) {
    var queryValues = utils.asArray(values)
    .map(function (value) {
      if (value.type !== 'box') {
        console.log('invalid value:')
        console.log(value)
        throw new TypeError('invalid value for ' + type + ' constraint: ' + name)
      }
      return value.box
    })

    return qb.ext.geospatialConstraint(name, queryValues)
  }
}

function customGeo (name, type) {
  return function (values) {
    var queryValues = utils.asArray(values)
    .map(function (value) {
      if (value.type !== 'box') {
        console.log('invalid value:')
        console.log(value)
        throw new TypeError('invalid value for ' + type + ' constraint: ' + name)
      }
      return value.box
    })

    return qb.ext.customConstraint(name, qb.ext.geospatialValues(queryValues))
  }
}

function constraint (name, type) {
  var builder

  switch (type) {
    case 'value':
      builder = qb.ext.valueConstraint
      break
    case 'word':
      builder = qb.ext.wordConstraint
      break
    case 'collection':
      builder = qb.ext.collectionConstraint
      break
    case 'custom':
      builder = qb.ext.customConstraint
      break
    default:
      throw new TypeError('unknown constraint type: ' + type)
  }

  return function (values) {
    var queryValues = utils.asArray(values)
    .map(function (value) {
      if (value.type !== 'value') {
        console.log('invalid value:')
        console.log(value)
        throw new TypeError('invalid value for ' + type + ' constraint: ' + name)
      }
      return value.value
    })

    return builder(name, queryValues)
  }
}

function builder (name, type) {
  switch (type) {
    case 'range':
      return range(name, type)
    case 'geospatial':
      return geo(name, type)
    case 'custom-geospatial':
      return customGeo(name, type)
    default:
      return constraint(name, type)
  }
}

module.exports = {
  range: range,
  geo: geo,
  customGeo: customGeo,
  constraint: constraint,
  builder: builder
}
