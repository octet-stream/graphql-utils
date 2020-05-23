module.exports = {
  extends: ["@octetstream"],
  rules: {
    "max-len": ["error", {
      code: 80,
      ignoreComments: true
    }],
    "prefer-const": ["error", {
      destructuring: "all"
    }],
  }
}
