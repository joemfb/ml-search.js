/* eslint-env mocha */
'use strict'

var expect = require('chai').expect

var Constraint = require('../lib/constraint.js')

describe('Constraint', function () {
  it('should export static methods', function () {
    expect(Constraint).to.be.an.instanceOf(Function)
    expect(Constraint.create).to.be.an.instanceOf(Function)
    expect(Constraint.type).to.be.an.instanceOf(Function)
    expect(Constraint.queryBuilder).to.be.an.instanceOf(Object)
    expect(Constraint.ConstraintValue).to.be.an.instanceOf(Function)
  })

  it('should err without constraint def', function () {
    var f = function () {
      Constraint()
    }
    expect(f).to.throw(/bad arg: not a constraint/)
  })

  it('should err with unknown constraint def', function () {
    var f = function () {
      Constraint({ foo: 'bar' })
    }
    expect(f).to.throw(/unknown constraint type: foo/)
  })

  it('should construct/create regardless of new', function () {
    var c = new Constraint({ name: 'blah', range: {} })
    expect(c).to.be.an.instanceof(Constraint)

    c = Constraint({ name: 'blah', range: {} })
    expect(c).to.be.an.instanceof(Constraint)

    c = Constraint.create({ name: 'blah', range: {} })
    expect(c).to.be.an.instanceof(Constraint)
  })

  it('should create geo Constraint', function () {
    var c = Constraint({ 'geo-elem': {} })
    expect(c.type).to.equal('geospatial')
    expect(c.geospatial).to.be.true
  })

  it('should create custom geo Constraint', function () {
    var c = Constraint({
      custom: {},
      annotation: [{ 'geo-elem': {} }]
    })
    expect(c.type).to.equal('custom-geospatial')
    expect(c.geospatial).to.be.true
  })

  it('should create custom Constraint', function () {
    var c = Constraint({
      custom: {},
      annotation: [{ _value: 'hi there' }]
    })
    expect(c.type).to.equal('custom')
    expect(c.geospatial).to.be.false
  })

  it('should add criteria', function () {
    var c = new Constraint({ name: 'blah', range: {} })

    expect(c.active).to.be.false
    c.match({ value: 'blah' })
    expect(c.active).to.be.true
  })

  it('should clear criteria', function () {
    var c = new Constraint({ name: 'blah', range: {} })

    c.match({ value: 'blah' })
    expect(c.active).to.be.true
    c.clear()
    expect(c.active).to.be.false

    c.matchAny({ value: 'blah' })
    expect(c.active).to.be.true
    c.clear()
    expect(c.active).to.be.false

    c.exclude({ value: 'blah' })
    expect(c.active).to.be.true
    c.clear()
    expect(c.active).to.be.false
  })

  it('should construct queries', function () {
    var c = new Constraint({ name: 'blah', word: {} })
    c.exclude({ value: 'blah' })
    var queries = c.queries()

    expect(queries).to.have.a.lengthOf(1)

    c = new Constraint({ name: 'blah', range: {} })
    c.match({ value: 'blah' })
    queries = c.queries()

    expect(queries).to.have.a.lengthOf(1)

    c.matchAny([{ min: 1, max: 2 }, { min: 4, max: 5 }])
    queries = c.queries()

    expect(queries).to.have.a.lengthOf(5)

    c.exclude({ value: 'foo' })
    queries = c.queries()

    expect(queries).to.have.a.lengthOf(6)
  })

  it('should create params', function () {
    var context = {
      paramsConfig: { separator: ':' }
    }
    var c = Constraint.create({ name: 'blah', range: {} }, context)
    c.match({ value: 'foo' })
    var p = c.params()

    expect(p.constraints).to.have.a.lengthOf(1)
    expect(p.orConstraints).to.have.a.lengthOf(0)
    expect(p.notConstraints).to.have.a.lengthOf(0)
    expect(p.constraints[0]).to.equal('blah:foo')

    c.clear()
    c.matchAny({ value: 'bar' })
    p = c.params()

    expect(p.constraints).to.have.a.lengthOf(0)
    expect(p.orConstraints).to.have.a.lengthOf(1)
    expect(p.notConstraints).to.have.a.lengthOf(0)
    expect(p.orConstraints[0]).to.equal('blah:bar')

    c = Constraint.create({ name: 'blah', range: {} })
    c.exclude({ value: 'baz' })
    p = c.params()

    expect(p.constraints).to.have.a.lengthOf(0)
    expect(p.orConstraints).to.have.a.lengthOf(0)
    expect(p.notConstraints).to.have.a.lengthOf(1)
    expect(p.notConstraints[0]).to.equal('blah:baz')
  })

  it('should activate from params', function () {
    var c = Constraint.create({ name: 'blah', range: {} })
    c.fromParams({
      constraints: ['foo'],
      orConstraints: [],
      notConstraints: []
    })

    expect(c.values.every).to.have.a.lengthOf(1)
    expect(c.values.any).to.have.a.lengthOf(0)
    expect(c.values.none).to.have.a.lengthOf(0)
    expect(c.values.every[0].value).to.equal('foo')
  })

  it('should get more values', function () {
    var c = Constraint.create({ name: 'blah', range: {} })
    expect(c.more).to.throw(/not implemented/)
  })
})
