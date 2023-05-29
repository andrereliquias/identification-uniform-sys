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
        table: "IDENTIFICATION",
      },
      KeyConditionExpression: "#table = :vIdentification",
      ExpressionAttributeNames: {
        "#table": "table",
      },
      ExpressionAttributeValues: {
        ":vIdentification": "IDENTIFICATION",
      },
    }

    if (!!event?.queryStringParameters?.pIdentificationId) {
      query.KeyConditionExpression = `#pIdentificationId = :positionIdValue`
      query.ExpressionAttributeNames = {
        "#pIdentificationId": "pIdentificationId",
      }
      query.ExpressionAttributeValues = {
        ":positionIdValue": event?.queryStringParameters?.pIdentificationId,
      }
      query = {
        ...query,
        IndexName: "PositionIdIndex",
      }
    }

    responseSearch = await dynamoClient.query(query);

    responseSearch = responseSearch.Items.filter((item) => item.table === 'IDENTIFICATION')

    return response.json(callback, responseSearch, 200);
  } catch (error) {
    console.error("erro", error);
    return responseErro.erro(callback, event.path, error.message);
  }
};
