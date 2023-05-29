"use-strict";

const uuid = require("uuid");
const dynamoClient = require("../../../shared/database");
const response = require("../../../shared/response");
const responseErro = require("../../../shared/error");
const check = require("../../../shared/isValid");

const PARAMS_TO_CHECK = ["name", "email", "password", "role"];
const ROLES_TO_CHECK = ["ADMIN", "COMPANY", "POSITION"];

module.exports.create = async (event, context, callback) => {
  try {
    if (!!!event?.body) {
      return responseErro.erro(callback, event.path, "Request inválido!", 400);
    }

    body = JSON.parse(event?.body);

    if (
      !check.isValid(body, PARAMS_TO_CHECK) ||
      (body.role && !Array.isArray(body.role))
    ) {
      return responseErro.erro(callback, event.path, "Request inválido!", 400);
    }

    const responseUser = await dynamoClient.query({
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

    if (responseUser.Items.length !== 0) {
      return responseErro.erro(
        callback,
        event.path,
        "Usuário já cadastrado",
        400
      );
    }

    console.log(`creating new user... ${body.email}`);

    if (body.role) {
      body.role.forEach((role) => {
        if (!ROLES_TO_CHECK.includes(role)) {
          return responseErro.erro(
            callback,
            event.path,
            "Request inválido!",
            400
          );
        }
      });
    }

    let item = {
      table: "USER",
      id: uuid.v4(),
      name: body.name,
      surname: body.surname,
      email: body.email,
      password: body.password,
      role: body.role,
      companyId: body.companyId,
      positionId: body.positionId,
      createdAt: new Date(Date.now()).toISOString(),
      firstAccess: true,
      updatedAt: null,
    };

    await dynamoClient.insert(item, `${process.env.STAGE}IdentificationTable`);

    console.log("user created successfully");

    delete item.password;

    return response.json(callback, item, 201);
  } catch (error) {
    console.error("error in create user", error);
    return responseErro.erro(callback, event.path, error.message);
  }
};
