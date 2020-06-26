const test = require("ava")

const {spy} = require("sinon")
const {
  // graphql,
  GraphQLObjectType: Output,
  // GraphQLUnionType: Union,
  // GraphQLSchema: Schema,
  GraphQLString: TString
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

test(
  "Throws a TypeError when list list of functions "
    + "contains a element with wrong type",
  t => {
    const trap = () => createTypesMatcher([42])

    t.throws(trap, {message: "Expected a types matcher to be a function"})
  }
)
