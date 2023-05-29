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
        table: "POSITION",
      },
      KeyConditionExpression: "#table = :vPosition",
      ExpressionAttributeNames: {
        "#table": "table",
      },
      ExpressionAttributeValues: {
        ":vPosition": "POSITION",
      },
    }

    if (!!event?.queryStringParameters?.companyId) {
      query.KeyConditionExpression = `#companyId = :companyIdValue`
      query.ExpressionAttributeNames = {
        "#companyId": "companyId",
      }
      query.ExpressionAttributeValues = {
        ":companyIdValue": event?.queryStringParameters?.companyId,
      }
      query = {
        ...query,
        IndexName: "CompanyIdIndex",
      }
    }

    responseSearch = await dynamoClient.query(query);

    responseSearch = responseSearch.Items.filter((item) => item.table === 'POSITION')

    return response.json(callback, responseSearch, 200);
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
        table: "POSITION",
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
