/* eslint-env mocha */
'use strict'

var expect = require('chai').expect

var paramsConfig = require('../lib/params-config.js')

describe('ParamsConfig', function () {
  it('should export static method', function () {
    expect(paramsConfig).to.be.an.instanceOf(Function)
  })

  it('should map param names to keys', function () {
    var p = paramsConfig()

    expect(p.prefix).to.equal('')
    expect(p.separator).to.equal(':')
    expect(p.byName.qtext).to.equal('q')
    expect(p.byName.page).to.equal('p')
    expect(p.byName.constraints).to.equal('c')
    expect(p.byName.orConstraints).to.equal('o')
    expect(p.byName.notConstraints).to.equal('n')
  })

  it('should map param keys to names', function () {
    var p = paramsConfig()

    expect(p.byKey.q).to.equal('qtext')
    expect(p.byKey.p).to.equal('page')
    expect(p.byKey.c).to.equal('constraints')
    expect(p.byKey.o).to.equal('orConstraints')
    expect(p.byKey.n).to.equal('notConstraints')
  })

  it('should create keys with prefix', function () {
    var p = paramsConfig({ prefix: 'x' })

    expect(p.prefix).to.equal('x:')
    expect(p.byName.qtext).to.equal('x:q')
    expect(p.byName.page).to.equal('x:p')
    expect(p.byName.constraints).to.equal('x:c')
    expect(p.byName.orConstraints).to.equal('x:o')
    expect(p.byName.notConstraints).to.equal('x:n')
  })

  it('should create keys with separator', function () {
    var p = paramsConfig({ prefix: 'x', prefixSeparator: '|' })

    expect(p.prefix).to.equal('x|')
    expect(p.byName.qtext).to.equal('x|q')
    expect(p.byName.page).to.equal('x|p')
    expect(p.byName.constraints).to.equal('x|c')
    expect(p.byName.orConstraints).to.equal('x|o')
    expect(p.byName.notConstraints).to.equal('x|n')
  })

  it('should skip nullified names', function () {
    var p = paramsConfig({ page: null })

    expect(p.prefix).to.equal('')
    expect(p.byName.qtext).to.equal('q')
    expect(p.byName.page).to.be.undefined
    expect(p.byName.constraints).to.equal('c')
    expect(p.byName.orConstraints).to.equal('o')
    expect(p.byName.notConstraints).to.equal('n')
  })
})
