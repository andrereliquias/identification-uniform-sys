"use-strict";

const jwt = require("jsonwebtoken");
const dynamoClient = require("../../../shared/database");
const response = require("../../../shared/response");
const responseErro = require("../../../shared/error");
const check = require("../../../shared/isValid");
const responseNotFound = require("../../../shared/notFound");

const PARAMS_TO_CHECK = ["email", "password"];

module.exports.login = async (event, context, callback) => {
  try {
    if (!!!event?.body) {
      return responseErro.erro(callback, event.path, "Request inválido!", 400);
    }

    body = JSON.parse(event.body);

    if (!check.isValid(body, PARAMS_TO_CHECK)) {
      responseErro.erro(callback, event.path, "Request inválido!", 400);
    }

    console.log(`try to login - ${body.email}`);

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

    if (body.password !== user.password) {
      return responseErro.erro(callback, event.path, "Senha incorreta.", 403);
    }


    const token = jwt.sign({ data: user }, process.env.SECRET, {
      expiresIn: "1h",
    });

    const dateTime = new Date(Date.now());
    dateTime.setHours(dateTime.getHours() + 1);

    const resp = {
      token: token,
      createdAt: new Date(Date.now()).toISOString(),
      expiresAt: dateTime.toISOString(),
      user: user
    };

    return response.json(callback, resp, 200);
  } catch (error) {
    console.error("erro", error);
    return responseErro.erro(callback, event.path, error.message);
  }
};
