const {
  GraphQLObjectType: Output,
  GraphQLNonNull: Required,
  GraphQLInt: TInt,
  GraphQLBoolean: TBoolean,
  GraphQLList: List,
  getNamedType,
  isNonNullType,
  isListType,
} = require("graphql")

const {isArray} = Array

const rowsToList = ({rows}) => rows

const getCurrent = ({page}) => page

const getHasNext = ({limit, page, count}) => count - limit * page > 0

const getLastPage = ({limit, page, count}) => Math.ceil(count / (limit * page))

function getTypeInfo(t) {
  if (isArray(t)) {
    return t
  }

  return [getNamedType(t), isNonNullType(t)]
}

function createPageType({type, required = false, ...field}) {
  let [t, nonNullableFlag] = getTypeInfo(type)

  const typeName = t.name.endsWith("Page") ? t.name : `${t.name}Page`

  if (!isListType(t)) {
    t = new List(nonNullableFlag ? new Required(t) : t)
  }

  return new Output({
    name: typeName,
    description: "Returns a page frame and navigation information.",
    fields: {
      count: {
        type: new Required(TInt),
        description: "Returns the total number of rows",
      },
      limit: {
        type: new Required(TInt),
        description: "Returns the actual limit of per-page entities",
      },
      offset: {
        type: new Required(TInt),
        description: "Returns the zero-indexed offset from the start",
      },
      current: {
        type: new Required(TInt),
        resolve: getCurrent,
        description: "Returns the number of the current page",
      },
      hasNext: {
        type: new Required(TBoolean),
        resolve: getHasNext,
        description: "Returns \"true\" when the next page exists, "
          + "\"false\" for otherwise",
      },
      last: {
        type: new Required(TInt),
        resolve: getLastPage,
        description: "Returns the number of the last page",
      },
      list: {
        ...field,

        type: required ? new Required(t) : t,
        resolve: rowsToList,
        description: "Returns the rows for the current page",
      },
    },
  })
}

module.exports = createPageType
module.exports.default = createPageType
