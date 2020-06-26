const {isObjectType} = require("graphql")

const {isArray} = Array

/**
 * @param  {Function[]} fns
 */
function createTypesMatcher(fns = []) {
  const list = []

  /**
   * @param  {...Function} args
   */
  function use(...args) {
    if (args.some(fn => typeof fn !== "function")) {
      throw new TypeError("Expected a types matcher to be a function")
    }

    list.push(...args)
  }

  /**
   * Executes types matching.
   * Used as the as the resolveType function at Union and Interface.
   *
   * @return {GraphQLObjectType | null}
   */
  async function resolveType(source, ctx, info) {
    for (const fn of list) {
      const t = await fn(source, ctx, info)

      if (isObjectType(t)) {
        return t
      }
    }

    return null
  }

  if (isArray(list)) {
    use(fns)
  }

  resolveType.resolveType = resolveType
  resolveType.use = resolveType

  return resolveType
}

module.exports = createTypesMatcher
