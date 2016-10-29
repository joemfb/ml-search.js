### ml-search.js

a lightweight library for managing search-application state, and generating
MarkLogic structured-queries.

This project is an evolution of the [`ml-search-ng`](https://github.com/joemfb/ml-search-ng) angular component. Specifically, it's a rewrite of the [`MLSearchContext`](https://joemfb.github.io/ml-search-ng/MLSearchContext.html) class, with two important distinguishing features:

- *vanilla.js* -- no framework dependencies whatsoever
- a new, object-oriented, constraint-based API for component interoperability

It depends on [`ml-query-builder.js`](https://github.com/joemfb/ml-query-builder.js), and requires a REST API client compatible with [`ml-rest.js`](https://github.com/joemfb/ml-rest.js).

install from npm:

```sh
npm install ml-search.js
npm install ml-rest.js
```


```js
var MLRest = require('ml-rest.js')
var SearchContext = require('ml-search.js')

var client = MLRest.create()
var context = SearchContext.create(client)

context.search().then(function (response) {
  console.log(response.results)
})
```

This project is alpha-quality software, and is likely to continue to change.
See `DESIGN.md` for details on the current design, API doumentation, and
project status.
