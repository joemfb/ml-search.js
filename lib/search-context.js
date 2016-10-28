'use strict'

var qb = require('ml-query-builder.js')
var utils = require('./utils.js')
var paramsConfig = require('./params-config.js')

function SearchContext (client, options) {
  if (!(this instanceof SearchContext)) {
    return new SearchContext(client, options)
  }

  if (!(typeof client === 'object' &&
        typeof client.search === 'function' &&
        typeof client.values === 'function' &&
        typeof client.suggest === 'function' &&
        typeof client.options === 'function')) {
    throw new TypeError('invalid client')
  }

  this.client = client

  options = options || {}

  this.state = {
    status: 'uninitialized',
    qtext: '',
    start: 1,
    pageLength: 10,
    // TODO: from options
    searchTransform: null,
    queryOptions: 'all'
  }

  // TODO transformParams

  // TODO: facetMode=or or shadow facets?
  // TODO: shadowQText?

  // TODO: from options
  this.options = {
    includeProperties: false,
    includeAggregates: false
  }

  // TODO: generic operators (sort, snippet, etc.)

  this.constraints = {}

  // todo: args from options
  this.paramsConfig = paramsConfig(options.params)

  var self = this

  // TODO: parse constraints from options?
  if (false) {
    this.state.status = 'ready'
    this.state.readyPromise = Promise.resolve()
  } else {
    this.state.readyPromise = this.initFromOptions(this.queryOptions)
    .then(function () {
      self.state.status = 'ready'
    })
    .catch(function (err) {
      console.log(err)
      self.state.status = 'failed'
      throw err
    })
  }
}

SearchContext.create = function (client, options) {
  return new SearchContext(client, options)
}

SearchContext.Constraint = require('./constraint.js')

Object.defineProperties(SearchContext.prototype, {
  qtext: {
    get: function () {
      return this.state.qtext
    },
    set: function (q) {
      this.state.qtext = (q && typeof q === 'string') ? q : ''
    }
  },
  page: {
    get: function () {
      if (this.state.pageLength === 1) return this.state.start
      return Math.floor(this.state.start / this.state.pageLength) + 1
    },
    set: function (p) {
      p = parseInt(p, 10) || 1
      this.state.start = 1 + (p - 1) * this.state.pageLength
    }
  },
  pageLength: {
    get: function () {
      return this.state.pageLength
    },
    set: function (pl) {
      if (this.state.pageLength !== pl) {
        this.state.pageLength = parseInt(pl, 10) || 10
        this.state.start = 1
      }
    }
  },
  searchTransform: {
    get: function () {
      return this.state.searchTransform
    },
    set: function (t) {
      this.state.searchTransform = (t && typeof t === 'string') ? t : null
    }
  },
  queryOptions: {
    get: function () {
      return this.state.queryOptions
    }
  },
  activeConstraints: {
    get: function () {
      return Object.keys(this.constraints)
      .map(function (name) {
        return this.constraints[name]
      }, this)
      .filter(function (constraint) {
        return constraint.active
      })
    }
  }
})

SearchContext.prototype.initFromOptions = function (options) {
  var self = this

  return this.client.options(options)
  .then(function (resp) {
    return resp.json()
  })
  .then(function (resp) {
    // TODO: ?
    if (!(resp && resp.options)) {
      throw new TypeError('invalid options')
    }

    var constraints = resp.options.constraint || []

    constraints.forEach(function (constraint) {
      self.constraints[constraint.name] =
        SearchContext.Constraint.create(constraint, self)
    })
  })
}

// getSuggestOptions: function getSuggestOptions() {

// getSnippet: function getSnippet() {
// setSnippet: function setSnippet(snippet) {
// clearSnippet: function clearSnippet() {

// getSort: function getSort() {
// setSort: function setSort(sort) {
// clearSort: function clearSort() {

SearchContext.prototype.ready = function () {
  if (this.state.status === 'failed') {
    throw new Error('failed to initialize')
  }

  return this.state.readyPromise
}

SearchContext.prototype.query = function () {
  var queries = this.activeConstraints
  .filter(function (constraint) {
    return !constraint.geospatial
  })
  .map(function (constraint) {
    return constraint.queries()
  })
  // flatten min/max range queries
  .reduce(utils.flattenReducer, [])

  var geoQueries = this.activeConstraints
  .filter(function (constraint) {
    return constraint.geospatial
  })
  .map(function (constraint) {
    return constraint.queries()
  })

  // TODO: validate
  if (geoQueries.length === 1) {
    queries.push(geoQueries[0])
  } else if (geoQueries.length > 1) {
    queries.push(qb.or(geoQueries))
  }

  // TODO: boost, additional, includeProperties

  // TODO: operators

  var query = queries.length > 1 ? qb.and(queries) : queries

  return qb.where(query)
}

SearchContext.prototype.combinedQuery = function (options) {
  // TODO: handle additional options
  return qb.ext.combined(this.query(), this.qtext, options)
}

SearchContext.prototype.params = function () {
  var map = this.paramsConfig.byName
  var params = {}

  if (map.qtext && this.qtext) {
    params[map.qtext] = this.qtext
  }
  // if (map.sort && this.sort) {
  //   params[map.sort] = this.sort
  // }
  if (map.page && this.page && this.page > 1) {
    params[map.page] = this.page
  }
  // TODO: pageLength, searchTransform, operators

  var c = {}
  var categories = this.paramsConfig.constraintNames

  this.activeConstraints
  .map(function (constraint) {
    return constraint.params()
  })
  .forEach(function (p) {
    categories.forEach(function (category) {
      if (p[category].length) {
        c[category] = c[category] || []
        Array.prototype.push.apply(c[category], p[category])
      }
    })
  })

  categories.forEach(function (category) {
    if (map[category] && c[category] && c[category].length) {
      params[map[category]] = c[category]
    }
  })

  return params
}

SearchContext.prototype.fromParams = function (params) {
  if (this.paramsEqual(params)) return false

  var map = this.paramsConfig.byName

  if (map.qtext) {
    this.qtext = params[map.qtext]
  }
  // if (map.sort && params[map.sort]) {
  //   this.sort = params[map.sort]
  // }
  if (map.page) {
    this.page = params[map.page]
  }
  // TODO: pageLength, searchTransform, operators

  var separator = this.paramsConfig.separator
  var c = {}
  var categories = this.paramsConfig.constraintNames

  categories.forEach(function (category) {
    if (!(map[category] && params[map[category]])) return

    utils.asArray(params[map[category]])
    .forEach(function (param) {
      var tokens = param.split(separator)
      .filter(function (x) {
        return x.length
      })

      if (param.indexOf(separator) < 1 || tokens.length !== 2) {
        throw new TypeError('bad Constraint param: ' + param)
      }

      var name = decodeURIComponent(tokens[0])

      c[name] = c[name] || {}
      c[name][category] = c[name][category] || []
      c[name][category].push(tokens[1])
    })
  })

  Object.keys(this.constraints).forEach(function (name) {
    var constraint = this.constraints[name]
    if (!constraint) throw new TypeError('bad param: missing Constraint: ' + name)

    constraint.fromParams(c[name])
  }, this)

  return true
}

SearchContext.prototype.paramsEqual = function (update) {
  var constraintKeys = this.paramsConfig.constraintKeys
  var params = this.params()
  var keys = Object.keys(params)

  if (keys.length !== Object.keys(update).length) return false

  var o, n, i, j

  for (i = 0; i < keys.length; i++) {
    o = params[keys[i]]
    n = update[keys[i]]

    if (o === n) continue

    if (constraintKeys.indexOf(keys[i]) === -1) return false

    o = utils.asArray(o)
    n = utils.asArray(n)

    if (o.length !== n.length) return false

    for (j = 0; j < o.length; j++) {
      if (o[j] !== n[j]) return false
    }
  }

  return true
}

SearchContext.prototype.search = function (adhoc) {
  var query = this.combinedQuery()
  var params = {
    start: this.state.start,
    pageLength: this.pageLength,
    transform: this.searchTransform
  }

  if (typeof this.queryOptions === 'string') {
    params.options = this.queryOptions
  }

  if (adhoc && typeof adhoc === 'object') {
    if (adhoc.search && typeof adhoc.search === 'object') {
      query.search = adhoc.search
    } else if (adhoc.query && typeof adhoc.query === 'object') {
      query.search.query = adhoc.query
    } else {
      query.search.options = typeof adhoc.options === 'object' && adhoc.options || adhoc
    }
  }

  var self = this

  return this.ready()
  .then(function () {
    return self.client.search(query, params)
  })
  .then(function (resp) {
    // TODO: throw resp?
    if (!resp.ok) throw new Error('bad search')
    return resp.json()
  })
  .then(function (results) {
    Object.keys(results.facets)
    .forEach(function (name) {
      var constraint = self.constraints[name]

      if (constraint) {
        constraint.facet = results.facets[name]
      }
    })

    return results
  })
  // TODO:
  // self.transformMetadata(results.results);
  // self.annotateActiveFacets(results.facets);
  // self.getAggregates(results.facets)
}

SearchContext.prototype.suggest = function (qtext, adhoc) {
  var query = this.combinedQuery()
  var params = {}

  // TODO: suggestOptions, adhoc as string?
  if (typeof this.queryOptions === 'string') {
    params.options = this.queryOptions
  }

  if (adhoc && typeof adhoc === 'object') {
    if (adhoc.search && typeof adhoc.search === 'object') {
      query.search = adhoc.search
    } else if (adhoc.query && typeof adhoc.query === 'object') {
      query.search.query = adhoc.query
    } else {
      query.search.options = typeof adhoc.options === 'object' && adhoc.options || adhoc
    }
  }

  var self = this

  return this.ready()
  .then(function () {
    return self.client.suggest(qtext, query, params)
  })
  .then(function (resp) {
    if (!resp.ok) throw new Error('bad suggest')
    return resp.json()
  })
  .then(function (resp) {
    return resp.suggestions || []
  })
}

SearchContext.prototype.values = function (name, params, options) {
}

module.exports = SearchContext
