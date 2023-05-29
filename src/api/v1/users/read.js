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
        table: "USER",
      },
      KeyConditionExpression: "#table = :vUser",
      ExpressionAttributeNames: {
        "#table": "table",
      },
      ExpressionAttributeValues: {
        ":vUser": "USER",
      },
    }

    if (!!event?.queryStringParameters?.email) {
      query.KeyConditionExpression = `#emailName = :emailValue`
      query.ExpressionAttributeNames = {
        "#emailName": "email",
      }
      query.ExpressionAttributeValues = {
        ":emailValue": event?.queryStringParameters?.email,
      }
      query = {
        ...query,
        IndexName: "UserEmailIndex",
      }
    }

    responseSearch = await dynamoClient.query(query);

    const filteredUsers = responseSearch.Items.map((user) => {
      delete user.password;
      return user;
    });

    return response.json(callback, filteredUsers, 200);
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
        table: "USER",
      },
      `${process.env.STAGE}IdentificationTable`
    );

    if (Object.keys(responseSearch).length !== 0) {
      delete responseSearch.Item.password;

      return response.json(callback, responseSearch.Item, 200);
    } else {
      return responseNotFound.notFound(event, context, callback);
    }
  } catch (error) {
    console.error("erro", error);
    return responseErro.erro(callback, event.path, error.message);
  }
};
