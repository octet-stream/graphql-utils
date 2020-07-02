const test = require("ava")

const {spy} = require("sinon")
const {
  graphql,
  GraphQLNonNull: Required,
  GraphQLObjectType: Output,
  GraphQLUnionType: Union,
  GraphQLSchema: Schema,
  GraphQLString: TString,
  GraphQLInt: TInt
} = require("graphql")

const createTypesMatcher = require("../createTypesMatcher")

test("Returns a function with appropriate properties", t => {
  const matcher = createTypesMatcher()

  t.is(typeof matcher, "function")
  t.is(typeof matcher.resolveType, "function")
  t.is(typeof matcher.use, "function")
})

test("Takes a set of functions as a single argument", async t => {
  const fn = spy()
  const matcher = createTypesMatcher([fn])

  await matcher()

  t.true(fn.called)
})

test("Adds more function with \"use\" method", async t => {
  const [first, second] = [spy(), spy()]

  const matcher = createTypesMatcher([first])

  matcher.use(second)

  await matcher()

  t.true(first.called)
  t.true(second.called)
})

test("Breaks the cycle after the successful first match", async t => {
  const TUser = new Output({
    name: "User",
    fields: {
      name: {
        type: TString
      }
    }
  })

  const [first, second, third] = [spy(), spy(() => TUser), spy()]

  const matcher = createTypesMatcher([first, second, third])

  await matcher()

  t.true(first.called)
  t.true(second.called)
  t.false(third.called)
})

test("Returns a GraphQLObjectType returned by one of functions", async t => {
  const TUser = new Output({
    name: "User",
    fields: {
      name: {
        type: TString
      }
    }
  })

  const fn = spy(() => TUser)
  const matcher = createTypesMatcher([fn])

  const type = await matcher()

  t.is(type, TUser)
})

test("Returns null if no GraphQLObjectType has been returned", async t => {
  const map = new Map()
  const fn = spy(() => map)
  const matcher = createTypesMatcher([fn])

  const type = await matcher()

  t.true(fn.called)
  t.is(fn.firstCall.returnValue, map)
  t.is(type, null)
})

test("Calls functions from the list with given value", async t => {
  const expected = new Map()
  const fn = spy()
  const matcher = createTypesMatcher([fn])

  await matcher(expected)

  const [actual] = fn.firstCall.args

  t.is(actual, expected)
})

test("Resolves expected type from Union", async t => {
  const DATA_SOURCE = [
    {
      author: "Daniel Keyes",
      title: "Flowers for Algernon",
      pages: 311
    },
    {
      director: "Christopher Nolan",
      title: "Interstellar",
      runningTime: 169
    }
  ]

  const TBook = new Output({
    name: "Book",
    fields: {
      author: {
        type: new Required(TString)
      },
      title: {
        type: new Required(TString)
      },
      pages: {
        type: new Required(TInt)
      }
    }
  })

  const TMovie = new Output({
    name: "Movie",
    fields: {
      director: {
        type: new Required(TString)
      },
      title: {
        type: new Required(TString)
      },
      runningTyme: {
        type: new Required(TInt)
      }
    }
  })

  const matcher = createTypesMatcher([
    ({director, runningTime}) => (director && runningTime) && TMovie,

    ({author, pages}) => (author && pages) && TBook
  ])

  const TSearchable = new Union({
    name: "Searchable",
    types: [TBook, TMovie],
    resolveType: matcher
  })

  const schema = new Schema({
    query: new Output({
      name: "Query",
      fields: {
        search: {
          type: new Required(TSearchable),
          args: {
            name: {
              type: new Required(TString)
            }
          },

          resolve: (_, {name}) => (
            DATA_SOURCE.find(({author, director, username}) => (
              [author, director, username].includes(name)
            ))
          )
        }
      }
    })
  })

  const query = `
    query {
      search(name: "Daniel Keyes") {
        ... on Book {
          author
          title
          pages
        }
      }
    }
  `

  const response = await graphql(schema, query)

  t.deepEqual(response, {
    data: {
      search: {
        author: "Daniel Keyes",
        title: "Flowers for Algernon",
        pages: 311
      }
    }
  })
})

test(
  "Throws a TypeError when list list of functions "
    + "contains a element with wrong type",
  t => {
    const trap = () => createTypesMatcher([42])

    t.throws(trap, {message: "Expected types matcher to be a function"})
  }
)
