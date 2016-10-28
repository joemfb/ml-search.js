/* eslint-env mocha */
'use strict'

var expect = require('chai').expect

var utils = require('../lib/utils.js')

describe('utils', function () {
  it('should flatten array', function () {
    var x = [0, [1, 2], 3]
    var y = utils.flatten(x)

    expect(y).to.have.a.lengthOf(4)
    expect(y[1]).to.equal(1)
  })

  it('should return non-Array args', function () {
    expect(utils.flatten(1)).to.equal(1)
  })
})
