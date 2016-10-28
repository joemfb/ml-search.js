/* eslint-env mocha */
'use strict'

var expect = require('chai').expect
var sinon = require('sinon')
var Response = require('node-fetch').Response

var sandbox = sinon.sandbox.create()
var client = {
  search: sandbox.stub(),
  values: sandbox.stub(),
  suggest: sandbox.stub(),
  options: sandbox.stub()
}

var SearchContext = require('../lib/search-context.js')

describe('SearchContext', function () {
  afterEach(function () {
    sandbox.reset()
  })

  it('should export static methods', function () {
    expect(SearchContext).to.be.an.instanceOf(Function)
    expect(SearchContext.create).to.be.an.instanceOf(Function)
    expect(SearchContext.Constraint).to.be.an.instanceOf(Function)
  })

  it('should construct/create regardless of new', function () {
    client.options.returns(Promise.reject())

    var context = new SearchContext(client, {})
    expect(context).to.be.an.instanceof(SearchContext)

    context = SearchContext(client, {})
    expect(context).to.be.an.instanceof(SearchContext)

    context = SearchContext.create(client, {})
    expect(context).to.be.an.instanceof(SearchContext)
  })

  it('should err without client', function () {
    var f = function () {
      SearchContext()
    }
    expect(f).to.throw(/invalid client/)
  })

  describe('#properties', function () {
    client.options.returns(Promise.resolve(new Response(
      JSON.stringify({ options: { constraint: [] } }),
      { status: 200, ok: true }
    )))

    var context = new SearchContext(client, {})

    it('should get/set qtext', function () {
      expect(context.qtext).to.equal('')

      context.qtext = 'test'
      expect(context.qtext).to.equal('test')

      context.qtext = null
      expect(context.qtext).to.equal('')
    })

    it('should get/set page and pageLength', function () {
      expect(context.page).to.equal(1)
      expect(context.state.start).to.equal(1)
      expect(context.pageLength).to.equal(10)

      context.page = null
      expect(context.page).to.equal(1)

      context.page = 4
      expect(context.page).to.equal(4)
      expect(context.state.start).to.equal(31)

      context.pageLength = 20
      expect(context.pageLength).to.equal(20)
      expect(context.page).to.equal(1)

      context.page = 9
      expect(context.page).to.equal(9)
      expect(context.state.start).to.equal(161)

      context.pageLength = null
      expect(context.pageLength).to.equal(10)
      expect(context.page).to.equal(1)

      context.pageLength = 1
      expect(context.pageLength).to.equal(1)
      expect(context.page).to.equal(1)

      context.pageLength = 18
      context.pageLength = 18
      expect(context.pageLength).to.equal(18)
      expect(context.page).to.equal(1)

      context.page = 7
      expect(context.page).to.equal(7)
      expect(context.state.start).to.equal(109)

      context.page = 1
      expect(context.page).to.equal(1)
      expect(context.state.start).to.equal(1)
    })

    it('should get/set searchTransform', function () {
      expect(context.searchTransform).to.be.null

      context.searchTransform = 'test'
      expect(context.searchTransform).to.equal('test')

      context.searchTransform = undefined
      expect(context.searchTransform).to.be.null
    })
  })
})
