const {isObjectType} = require("graphql")

const {isArray} = Array

/**
 * @typedef {import("graphql").GraphQLResolveInfo} GraphQLResolveInfo
 * @typedef {import("graphql").GraphQLObjectType} GraphQLObjectType
 */

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
   * @param {any} value
   * @param {GraphQLResolveInfo}
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

  if (isArray(list)) {
    use(...fns)
  }

  resolveType.resolveType = resolveType
  resolveType.use = use

  return resolveType
}

module.exports = createTypesMatcher
