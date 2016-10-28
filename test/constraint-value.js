/* eslint-env mocha */
'use strict'

var expect = require('chai').expect

var ConstraintValue = require('../lib/constraint.js').ConstraintValue

describe('Constraint.ConstraintValue', function () {
  it('should export static methods', function () {
    expect(ConstraintValue).to.be.an.instanceOf(Function)
    expect(ConstraintValue.create).to.be.an.instanceOf(Function)
    expect(ConstraintValue.type).to.be.an.instanceOf(Function)
    expect(ConstraintValue.fromParam).to.be.an.instanceOf(Object)
  })

  it('should construct/create regardless of new', function () {
    var v = new ConstraintValue('blah', [])
    expect(v).to.be.an.instanceof(ConstraintValue)

    v = ConstraintValue('blah', [])
    expect(v).to.be.an.instanceof(ConstraintValue)

    v = ConstraintValue.create('blah', [])
    expect(v).to.be.an.instanceof(ConstraintValue)
  })

  it('should err without container', function () {
    var f = function () {
      ConstraintValue({ value: 'blah' })
    }
    expect(f).to.throw(/container is not an Array/)
  })

  it('should err on unknown type', function () {
    var f = function () {
      ConstraintValue({ foo: 'bar' }, [])
    }
    expect(f).to.throw(/unknown constraint value/)
  })

  it('should create value type', function () {
    var v = ConstraintValue({ value: 'blah' }, [])
    expect(v.type).to.equal('value')

    v = ConstraintValue('blah', [])
    expect(v.type).to.equal('value')
  })

  it('should create range type', function () {
    var v = ConstraintValue({ min: 1 }, [])
    expect(v.type).to.equal('range')

    v = ConstraintValue({ max: 2 }, [])
    expect(v.type).to.equal('range')

    v = ConstraintValue({ min: 1, max: 2 }, [])
    expect(v.type).to.equal('range')
  })

  it('should create box type', function () {
    var v = ConstraintValue({ north: 1, south: 1, east: 1, west: 1 }, [])
    expect(v.type).to.equal('box')
  })

  it('should remove from container', function () {
    var container = []
    var v = ConstraintValue('blah', container)
    expect(container).to.have.a.lengthOf(1)
    expect(v.container).to.equal(container)

    v.remove()
  })

  it('should err on subsequent removal', function () {
    var container = []
    var v = ConstraintValue('blah', container)
    expect(container).to.have.a.lengthOf(1)
    expect(v.container).to.equal(container)

    v.remove()

    var f = function () {
      v.remove()
    }
    expect(f).to.throw(/already removed/)
  })

  it('should create param', function () {
    var p = ConstraintValue({ value: 'blah' }, []).toParam()
    expect(p).to.equal('blah')

    p = ConstraintValue({ value: 'a:b' }, []).toParam()
    expect(p).to.equal('a%3Ab')

    p = ConstraintValue({ min: 1, max: 2 }, []).toParam()
    expect(p).to.equal('1_2')

    p = ConstraintValue({ min: -2, max: 2 }, []).toParam()
    expect(p).to.equal('-2_2')

    p = ConstraintValue({ min: 1 }, []).toParam()
    expect(p).to.equal('1_')

    p = ConstraintValue({ max: 2 }, []).toParam()
    expect(p).to.equal('_2')

    p = ConstraintValue({ north: 1, south: 2, east: 3, west: 4 }, []).toParam()
    expect(p).to.equal('2_4_1_3')

    var v = ConstraintValue({ value: 'blah' }, [])
    v.type = 'bar'
    var f = function () {
      v.toParam()
    }
    expect(f).to.throw(/invalid ConstraintValue/)
  })

  it('should initialize from param', function () {
    var c = ConstraintValue.fromParam('foo', [])
    expect(c.type).to.equal('value')
    expect(c.value).to.equal('foo')

    c = ConstraintValue.fromParam('a%3Ab', [])
    expect(c.type).to.equal('value')
    expect(c.value).to.equal('a:b')

    c = ConstraintValue.fromParam('1_2', [])
    expect(c.type).to.equal('range')
    expect(c.min).to.equal('1')
    expect(c.max).to.equal('2')

    c = ConstraintValue.fromParam('1_', [])
    expect(c.type).to.equal('range')
    expect(c.min).to.equal('1')
    expect(c.max).to.be.undefined

    c = ConstraintValue.fromParam('_2', [])
    expect(c.type).to.equal('range')
    expect(c.min).to.be.undefined
    expect(c.max).to.equal('2')

    c = ConstraintValue.fromParam('2_4_1_3', [])
    expect(c.type).to.equal('box')
    expect(c.box.south).to.equal('2')
    expect(c.box.west).to.equal('4')
    expect(c.box.north).to.equal('1')
    expect(c.box.east).to.equal('3')
  })

  it('should err on bad initialization param', function () {
    var f = function () {
      ConstraintValue.fromParam('2_4_3', [])
    }
    expect(f).to.throw(/unable to parse ConstraintValue param: 2_4_3/)
  })
})
