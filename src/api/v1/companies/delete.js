const dynamoClient = require("../../../shared/database");
const response = require("../../../shared/response");
const responseErro = require("../../../shared/error");
const responseNotFound = require("../../../shared/notFound");

module.exports.delete = async (event, context, callback) => {
  try {
    const responseSearch = await dynamoClient.read(
      {
        ...event.pathParameters,
        table: "COMPANY",
      },
      `${process.env.STAGE}IdentificationTable`
    );
    if (Object.keys(responseSearch).length === 0) {
      return responseNotFound.notFound(event, context, callback);
    }

    const responseDelete = await dynamoClient.delete(
      {
        ...event.pathParameters,
        table: "COMPANY",
      },
      `${process.env.STAGE}IdentificationTable`
    );

    response.json(callback, responseDelete, 204);
  } catch (error) {
    console.error("erro", error);
    return responseErro.erro(callback, event.path, error.message);
  }
};
