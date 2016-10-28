/* eslint-env mocha */
'use strict'

var expect = require('chai').expect
var cqb = require('../lib/constraint-query-builder.js')

describe('Constraint.queryBuilder', function () {
  it('should export methods', function () {
    expect(cqb).to.be.an.instanceOf(Object)
    expect(cqb.builder).to.be.an.instanceOf(Function)
    expect(cqb.range).to.be.an.instanceOf(Function)
    expect(cqb.geo).to.be.an.instanceOf(Function)
    expect(cqb.customGeo).to.be.an.instanceOf(Function)
    expect(cqb.constraint).to.be.an.instanceOf(Function)
  })

  it('should error on invalid constraint type', function () {
    var f = function () {
      cqb.builder('name', 'bar')
    }
    expect(f).to.throw(/unknown constraint type: bar/)
  })

  it('should build an eq range query', function () {
    var builder = cqb.builder('name', 'range')
    var query = builder({ value: 'blah', type: 'value' })[0]

    expect(query['range-constraint-query']).not.to.be.undefined
    expect(query['range-constraint-query']['constraint-name']).to.equal('name')
    expect(query['range-constraint-query']['range-operator']).to.equal('EQ')
    expect(query['range-constraint-query']['value'][0]).to.equal('blah')
  })

  it('should build an ne range query', function () {
    var builder = cqb.builder('name', 'range')
    var query = builder({ value: 'blah', type: 'value' }, true)[0]

    expect(query['range-constraint-query']).not.to.be.undefined
    expect(query['range-constraint-query']['constraint-name']).to.equal('name')
    expect(query['range-constraint-query']['range-operator']).to.equal('NE')
    expect(query['range-constraint-query']['value'][0]).to.equal('blah')
  })

  it('should build a min range query', function () {
    var builder = cqb.builder('name', 'range')
    var query = builder({ min: 3, type: 'range' })[0]

    expect(query['range-constraint-query']).not.to.be.undefined
    expect(query['range-constraint-query']['constraint-name']).to.equal('name')
    expect(query['range-constraint-query']['range-operator']).to.equal('GE')
    expect(query['range-constraint-query']['value'][0]).to.equal(3)
  })

  it('should build a max range query', function () {
    var builder = cqb.builder('name', 'range')
    var query = builder({ max: 10, type: 'range' })[0]

    expect(query['range-constraint-query']).not.to.be.undefined
    expect(query['range-constraint-query']['constraint-name']).to.equal('name')
    expect(query['range-constraint-query']['range-operator']).to.equal('LE')
    expect(query['range-constraint-query']['value'][0]).to.equal(10)
  })

  it('should build a min/max range query', function () {
    var builder = cqb.builder('name', 'range')
    var queries = builder({ min: 3, max: 10, type: 'range' })

    expect(queries).to.have.lengthOf(2)
    expect(queries[0]['range-constraint-query']).not.to.be.undefined
    expect(queries[1]['range-constraint-query']).not.to.be.undefined
    expect(queries[0]['range-constraint-query']['constraint-name']).to.equal('name')
    expect(queries[1]['range-constraint-query']['constraint-name']).to.equal('name')
    expect(queries[0]['range-constraint-query']['range-operator']).to.equal('GE')
    expect(queries[1]['range-constraint-query']['range-operator']).to.equal('LE')
    expect(queries[0]['range-constraint-query']['value'][0]).to.equal(3)
    expect(queries[1]['range-constraint-query']['value'][0]).to.equal(10)
  })

  it('should build a ne min/max range query', function () {
    var builder = cqb.builder('name', 'range')
    var queries = builder({ min: 3, max: 10, type: 'range' }, true)

    expect(queries).to.have.lengthOf(2)
    expect(queries[0]['range-constraint-query']).not.to.be.undefined
    expect(queries[1]['range-constraint-query']).not.to.be.undefined
    expect(queries[0]['range-constraint-query']['constraint-name']).to.equal('name')
    expect(queries[1]['range-constraint-query']['constraint-name']).to.equal('name')
    expect(queries[0]['range-constraint-query']['range-operator']).to.equal('LT')
    expect(queries[1]['range-constraint-query']['range-operator']).to.equal('GT')
    expect(queries[0]['range-constraint-query']['value'][0]).to.equal(3)
    expect(queries[1]['range-constraint-query']['value'][0]).to.equal(10)
  })

  it('should error on invalid range value', function () {
    var builder = cqb.builder('name', 'range')
    var f = function () {
      builder({ box: { south: 25 }, type: 'box' })
    }
    expect(f).to.throw(/invalid value for range constraint: name/)
  })

  it('should build a geo query', function () {
    var builder = cqb.builder('name', 'geospatial')
    var query = builder({ box: { south: 25 }, type: 'box' })

    expect(query['geospatial-constraint-query']).not.to.be.undefined
    expect(query['geospatial-constraint-query']['constraint-name']).to.equal('name')
    expect(query['geospatial-constraint-query']['box'][0].south).to.equal(25)
  })

  it('should error on invalid geo value', function () {
    var builder = cqb.builder('name', 'geospatial')
    var f = function () {
      builder({ value: 'blah', type: 'value' })
    }
    expect(f).to.throw(/invalid value for geospatial constraint: name/)
  })

  it('should build a custom geo query', function () {
    var builder = cqb.builder('name', 'custom-geospatial')
    var query = builder({ box: { south: 25 }, type: 'box' })

    expect(query['custom-constraint-query']).not.to.be.undefined
    expect(query['custom-constraint-query']['constraint-name']).to.equal('name')
    expect(query['custom-constraint-query']['box'][0].south).to.equal(25)
  })

  it('should error on invalid custom geo value', function () {
    var builder = cqb.builder('name', 'custom-geospatial')
    var f = function () {
      builder({ value: 'blah', type: 'value' })
    }
    expect(f).to.throw(/invalid value for custom-geospatial constraint: name/)
  })

  it('should build a value query', function () {
    var builder = cqb.builder('name', 'value')
    var query = builder({ value: 'blah', type: 'value' })

    expect(query['value-constraint-query']).not.to.be.undefined
    expect(query['value-constraint-query']['constraint-name']).to.equal('name')
    expect(query['value-constraint-query']['text'][0]).to.equal('blah')
  })

  it('should error on invalid value constraint value', function () {
    var builder = cqb.builder('name', 'value')
    var f = function () {
      builder({ box: { south: 25 }, type: 'box' })
    }
    expect(f).to.throw(/invalid value for value constraint: name/)
  })

  it('should build a word query', function () {
    var builder = cqb.builder('name', 'word')
    var query = builder({ value: 'blah', type: 'value' })

    expect(query['word-constraint-query']).not.to.be.undefined
    expect(query['word-constraint-query']['constraint-name']).to.equal('name')
    expect(query['word-constraint-query']['text'][0]).to.equal('blah')
  })

  it('should build a collection query', function () {
    var builder = cqb.builder('name', 'collection')
    var query = builder({ value: 'blah', type: 'value' })

    expect(query['collection-constraint-query']).not.to.be.undefined
    expect(query['collection-constraint-query']['constraint-name']).to.equal('name')
    expect(query['collection-constraint-query']['uri'][0]).to.equal('blah')
  })

  it('should build a custom query', function () {
    var builder = cqb.builder('name', 'custom')
    var query = builder({ value: 'blah', type: 'value' })

    expect(query['custom-constraint-query']).not.to.be.undefined
    expect(query['custom-constraint-query']['constraint-name']).to.equal('name')
    expect(query['custom-constraint-query']['text'][0]).to.equal('blah')
  })
})
