### design

This project is a redesign of the [`MLSearchContext`](https://joemfb.github.io/ml-search-ng/MLSearchContext.html) class of [`ml-search-ng`](https://github.com/joemfb/ml-search-ng). The implementation is *vanilla.js*; it has no framework dependencies whatsoever. The only external dependency is [`ml-query-builder.js`](https://github.com/joemfb/ml-query-builder.js), which itself has no external dependencies. Of course, normal usage requires a REST API client compatible with [`ml-rest.js`](https://github.com/joemfb/ml-rest.js) ...

This project reimagines search state as being primarily constraint-based, and accordingly provides a typed `Constraint` class, instantiated from a Search
options constraint definition.

`Constraint` manages and transforms typed state in three forms:

- internal state
- URL params (to and from internal state, invertably)
- structured query (from internal state)

This design has many advantages over the single namespace in `MLSearchContext`,
but the greatest may simply be a consistent API for manipulating constraints, 
since that is effectively what most 3rd-party Search UI components do. The 
goal is to enable a richer and more simply interoperable ecosystem of
compatible components.

While the current implementation is wedded to the constraint types provided by
the Search API, this design allows for the possibility of a "synthetic"
constraint, backed by arbitrary APIs and data. One enticing possibility is a
true *semantic* constraint.

### api

An instance of the `Constraint` class has the following properties:

- `name`
- `type`
- `datatype`
- `values`
- `facet` (nullable)

along with a reference to the its `SearchContext` parent (`context`), the Search options from which it was instantiated (`def`), and a type-specific
instance of `ConstraintQueryBuilder` (`queryBuilder`).

It also has the following methods:

- `match()`
- `matchAny()`
- `exclude()`
- `clearMatches()`
- `clearChoices()`
- `clearExclusions()`
- `clear()`
- `queries()`
- `params()`
- `fromParams()`
- `more()`

"Selected" values are all instances of `ConstraintValue` (the first three 
methods will helpfully instantiate these instances for you). They store constraint-type-specific values, and come with a `remove()` method to
"deselect" themselves.

### next steps

I'm developing some React components that use this API. I'll also be porting a branch of `ml-search-ng` onto this project, and updating those directives.

Please send your feedback! I welcome any and all suggestions (especially bikeshedding about the method names -- I'm not convinced they're right ;)).
