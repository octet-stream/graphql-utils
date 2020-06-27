const {isObjectType} = require("graphql")

/**
 * @typedef {import("graphql").GraphQLResolveInfo} GraphQLResolveInfo
 * @typedef {import("graphql").GraphQLObjectType} GraphQLObjectType
 */

/**
 * @param  {...(value: any, info?: GraphQLResolveInfo) => GraphQLObjectType} fns
 */
function createTypesMatcher(...fns) {
  const list = []

  /**
   * @param  {...(value: any, info?: GraphQLResolveInfo) => GraphQLObjectType} args
   */
  function use(...args) {
    args = args.flat()

    if (args.some(fn => typeof fn !== "function")) {
      throw new TypeError("Expected a types matcher to be a function")
    }

    list.push(...args)
  }

  /**
   * Executes types matching.
   * Used as the as the resolveType function at Union and Interface.
   *
   * @param {any} value
   * @param {GraphQLResolveInfo} [info]
   *
   * @return {Promise<GraphQLObjectType | null>}
   */
  async function resolveType(value, info) {
    for (const fn of list) {
      const t = await fn(value, info)

      if (isObjectType(t)) {
        return t
      }
    }

    return null
  }

  use(...fns.flat())

  resolveType.resolveType = resolveType
  resolveType.use = use

  return resolveType
}

module.exports = createTypesMatcher
