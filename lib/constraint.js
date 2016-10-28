'use strict'

var qb = require('ml-query-builder.js')
var utils = require('./utils.js')

function ConstraintValue (value, container) {
  if (!(this instanceof ConstraintValue)) {
    return new ConstraintValue(value, container)
  }

  if (!(container instanceof Array)) {
    throw new TypeError('container is not an Array')
  }

  this.type = ConstraintValue.type(value)
  this.container = container
  this.container.push(this)

  if (this.type === 'value') {
    if (typeof value === 'string') {
      this.value = value
    } else {
      this.value = value.value
      this.name = value.name
      this.count = value.count
    }
  }
  if (this.type === 'range') {
    this.min = value.min
    this.max = value.max
    // TODO: 'exclusive' option ?
  }
  if (this.type === 'box') {
    this.box = normalizeBox(value)
    this.count = value.count
  }
}

function normalizeBox (b) {
  if (b.north) {
    return {
      south: b.south,
      west: b.west,
      north: b.north,
      east: b.east
    }
  }

  if (b.n) {
    return {
      south: b.s,
      west: b.w,
      north: b.n,
      east: b.e
    }
  }

  throw new Error('unknown box')
}

ConstraintValue.create = function (value, container) {
  return new ConstraintValue(value, container)
}

ConstraintValue.type = function (v) {
  if (typeof v === 'string' || v.value !== undefined) return 'value'

  if (v.min !== undefined || v.max !== undefined) return 'range'

  // TODO: confirm \.n
  if (v.north !== undefined || v.n !== undefined) return 'box'

  throw new TypeError('unknown constraint value: ' + JSON.stringify(v))
}

var constraintValueSeparator = '_'

// TODO: parse rangeConstraint by constraint.datatype?
ConstraintValue.fromParam = function (param, container) {
  if (typeof param !== 'string') throw new TypeError('bad param for ConstraintValue')

  if (param.indexOf(constraintValueSeparator) === -1) {
    return ConstraintValue.create({ value: decodeURIComponent(param) }, container)
  }

  var tokens = param.split(constraintValueSeparator)
  .map(decodeURIComponent)
  .filter(function (x) {
    return x.length
  })

  if (tokens.length === 1 && param[tokens[0].length] === constraintValueSeparator) {
    return ConstraintValue.create({ min: tokens[0] }, container)
  }

  if (tokens.length === 1 && param[0] === constraintValueSeparator) {
    return ConstraintValue.create({ max: tokens[0] }, container)
  }

  if (tokens.length === 2) {
    return ConstraintValue.create({ min: tokens[0], max: tokens[1] }, container)
  }

  if (tokens.length === 4) {
    return ConstraintValue.create({
      south: tokens[0],
      west: tokens[1],
      north: tokens[2],
      east: tokens[3]
    }, container)
  }

  throw new TypeError('unable to parse ConstraintValue param: ' + param)
}

function encodeValue (x) {
  var val = encodeURIComponent(x)
  // TODO: '%' + '-'.charCodeAt(0).toString(16)
  // return val.replace('-', '%2D')
  return val.replace(
    constraintValueSeparator,
    '%' + constraintValueSeparator.charCodeAt(0).toString(16)
  )
}

// TODO: quote values?
ConstraintValue.prototype.toParam = function () {
  if (this.type === 'value') return encodeValue(this.value)

  if (this.type === 'box') {
    // console.log(this.box)
    return [this.box.south, this.box.west, this.box.north, this.box.east]
    .map(encodeValue)
    .join('_')
  }

  if (this.type === 'range') {
    return [
      this.min != null && this.min || '',
      this.max != null && this.max || ''
    ]
    .map(encodeValue)
    .join('_')
  }

  throw new TypeError('invalid ConstraintValue: unknown type: ' + this.type)
}

ConstraintValue.prototype.remove = function () {
  var idx = this.container.indexOf(this)

  if (idx === -1) throw new Error('already removed')

  this.container.splice(idx, 1)
}

function Constraint (options, context) {
  if (!(this instanceof Constraint)) {
    return new Constraint(options, context)
  }

  this.context = context
  this.def = options // ConstraintDef?
  this.type = Constraint.type(options)
  this.name = options.name
  this.datatype = this.type === 'range' ? options.range.type : null
  this.queryBuilder = Constraint.queryBuilder(this.name, this.type)
  this.values = { every: [], any: [], none: [] }
  this.facet = null
}

Constraint.create = function (options, context) {
  return new Constraint(options, context)
}

var names = ['value', 'word', 'custom', 'collection', 'range']
var geospatialNames = [
  'geo-attr-pair',
  'geo-elem-pair',
  'geo-elem',
  'geo-path',
  'geo-json-property',
  'geo-json-property-pair'
]

function constraintName (c) {
  if (!c) return null

  return Object.keys(c).filter(function (x) {
    return x !== 'name' && x !== '_value'
  })[0]
}

Constraint.type = function (c) {
  var name = constraintName(c)

  if (!name) throw new TypeError('bad arg: not a constraint')

  if (name === 'custom' && c.annotation && c.annotation.length) {
    // TODO: filter annotations?
    if (geospatialNames.indexOf(constraintName(c.annotation[0])) > -1) {
      return 'custom-geospatial'
    }
  }

  if (names.indexOf(name) > -1) return name
  if (geospatialNames.indexOf(name) > -1) return 'geospatial'

  throw new TypeError('unknown constraint type: ' + name)
}

Constraint.queryBuilder = require('./constraint-query-builder.js').builder
Constraint.ConstraintValue = ConstraintValue

Object.defineProperties(Constraint.prototype, {
  active: {
    get: function () {
      return !!(
        this.values.every.length ||
        this.values.any.length ||
        this.values.none.length
      )
    }
  },
  geospatial: {
    get: function () {
      return this.type === 'geospatial' || this.type === 'custom-geospatial'
    }
  }
})

function addValues (container, values) {
  utils.asArray(values)
  .map(function (value) {
    return ConstraintValue.create(value, container)
  })
}

Constraint.prototype.match = function (values) {
  addValues(this.values.every, values)
}

Constraint.prototype.matchAny = function (values) {
  addValues(this.values.any, values)
}

Constraint.prototype.exclude = function (values) {
  addValues(this.values.none, values)
}

Constraint.prototype.clearMatches = function () {
  if (this.values.every.length) {
    this.values.every.splice(0)
  }
}

Constraint.prototype.clearChoices = function () {
  if (this.values.any.length) {
    this.values.any.splice(0)
  }
}

Constraint.prototype.clearExclusions = function () {
  if (this.values.none.length) {
    this.values.none.splice(0)
  }
}

Constraint.prototype.clear = function () {
  this.clearMatches()
  this.clearChoices()
  this.clearExclusions()
}

Constraint.prototype.queries = function () {
  var queries = this.values.every
  .map(function (value) {
    return this.queryBuilder(value)
  }, this)

  if (this.values.any.length) {
    queries.push(this.queryBuilder(this.values.any))
  }

  if (this.values.none.length) {
    if (this.type === 'range') {
      queries.push(this.queryBuilder(this.values.none, true))
    } else {
      queries.push(qb.not(this.queryBuilder(this.values.none)))
    }
  }

  return utils.flatten(queries)
}

function makeParams (container, prefix) {
  return container.map(function (value) {
    return prefix + value.toParam()
  })
}

Constraint.prototype.params = function () {
  // TODO: add paramsConfig directly to this?
  var separator = this.context && this.context.paramsConfig &&
                  this.context.paramsConfig.separator || ':'
  var prefix = encodeURIComponent(this.name) + separator
  var values = this.values

  return {
    constraints: makeParams(values.every, prefix),
    orConstraints: makeParams(values.any, prefix),
    notConstraints: makeParams(values.none, prefix)
  }
}

function addValuesFromParams (container, params) {
  if (!(params && params.length)) return

  params.forEach(function (param) {
    ConstraintValue.fromParam(param, container)
  })
}

Constraint.prototype.fromParams = function (params) {
  this.clear()

  if (!params) return

  addValuesFromParams(this.values.every, params.constraints)
  addValuesFromParams(this.values.any, params.orConstraints)
  addValuesFromParams(this.values.none, params.notConstraints)
}

Constraint.prototype.more = function () {
  throw new Error('not implemented')
}

module.exports = Constraint
