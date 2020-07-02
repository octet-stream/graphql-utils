const {isArray} = Array

/**
 * @param {any[]} array
 * @param {number} [depth = 1]
 *
 * @return {any[]}
 *
 * @api private
 */
function flat(array, depth = 1) {
  const step = (prev, next) => (
    prev.concat(isArray(next) && depth > 0 ? flat(next, depth - 1) : [next])
  )

  return array.reduce(step, [])
}

module.exports = flat
