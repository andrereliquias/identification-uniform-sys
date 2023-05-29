const dynamoClient = require("../../../shared/database");
const response = require("../../../shared/response");
const responseErro = require("../../../shared/error");
const responseNotFound = require("../../../shared/notFound");

module.exports.read = async (event, context, callback) => {
  try {
    let responseSearch;
    let query = {
      TableName: `${process.env.STAGE}IdentificationTable`,
      Key: {
        table: "COMPANY",
      },
      KeyConditionExpression: "#table = :vCompany",
      ExpressionAttributeNames: {
        "#table": "table",
      },
      ExpressionAttributeValues: {
        ":vCompany": "COMPANY",
      },
    }

    if (!!event?.queryStringParameters?.cnpj) {
      query.KeyConditionExpression = `#cnpj = :vCnpj`
      query.ExpressionAttributeNames = {
        "#cnpj": "cnpj",
      }
      query.ExpressionAttributeValues = {
        ":vCnpj": event?.queryStringParameters?.cnpj,
      }
      query = {
        ...query,
        IndexName: "CompanyCnpjIndex",
      }
    }

    responseSearch = await dynamoClient.query(query);

    return response.json(callback, responseSearch.Items, 200);
  } catch (error) {
    console.error("erro", error);
    return responseErro.erro(callback, event.path, error.message);
  }
};

module.exports.readById = async (event, context, callback) => {
  try {
    console.log(`searching for ${event.pathParameters.id}`);

    const responseSearch = await dynamoClient.read(
      {
        ...event.pathParameters,
        table: "COMPANY",
      },
      `${process.env.STAGE}IdentificationTable`
    );

    if (Object.keys(responseSearch).length !== 0) {
      return response.json(callback, responseSearch.Item, 200);
    } else {
      return responseNotFound.notFound(event, context, callback);
    }
  } catch (error) {
    console.error("erro", error);
    return responseErro.erro(callback, event.path, error.message);
  }
};
