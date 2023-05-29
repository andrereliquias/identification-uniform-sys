"use-strict";

const jwt = require("jsonwebtoken");
const dynamoClient = require("../../../shared/database");
const response = require("../../../shared/response");
const responseErro = require("../../../shared/error");
const check = require("../../../shared/isValid");
const responseNotFound = require("../../../shared/notFound");

const PARAMS_TO_CHECK = ["email", "password"];

module.exports.forgotPassword = async (event, context, callback) => {
  try {
    if (!!!event?.body) {
      return responseErro.erro(callback, event.path, "Request inválido!", 400);
    }

    body = JSON.parse(event.body);

    if (!check.isValid(body, PARAMS_TO_CHECK)) {
      responseErro.erro(callback, event.path, "Request inválido!", 400);
    }

    console.log(`try to set new password - ${body.email}`);

    const responseSearch = await dynamoClient.query({
      TableName: `${process.env.STAGE}IdentificationTable`,
      Key: {
        table: "USER",
      },
      IndexName: "UserEmailIndex",
      KeyConditionExpression: "#emailName = :emailValue",
      ExpressionAttributeNames: {
        "#emailName": "email",
      },
      ExpressionAttributeValues: {
        ":emailValue": body.email,
      },
    });

    if (responseSearch.Items.length === 0) {
      return responseNotFound.notFound(event, context, callback);
    }

    const user = responseSearch.Items[0];

    let params = {
      TableName: `${process.env.STAGE}IdentificationTable`,
      Key: {
        id: user.id,
        table: "USER",
      },
      UpdateExpression: "set #password = :vPassword, #updatedAt = :vUpdatedAt",
      ExpressionAttributeNames: {
        "#password": "password",
        "#updatedAt": "updatedAt",
      },
      ExpressionAttributeValues: {
        ":vPassword": !!body.password ? body.password : user.password,
        ":vUpdatedAt": new Date(Date.now()).toISOString(),
      },
      ReturnValues: "ALL_NEW",
    };

    const responseUpdate = await dynamoClient.update(params);

    delete responseUpdate.Attributes.password;

    return response.json(callback, responseUpdate.Attributes, 200);
  } catch (error) {
    console.error("erro", error);
    return responseErro.erro(callback, event.path, error.message);
  }
};
