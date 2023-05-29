const dynamoClient = require("../../../shared/database");
const response = require("../../../shared/response");
const responseErro = require("../../../shared/error");
const responseNotFound = require("../../../shared/notFound");
const check = require("../../../shared/isValid");

const PARAMS_TO_CHECK = ["name", "email"];
const ROLES_TO_CHECK = ["ADMIN", "COMPANY", "POSITION"];

module.exports.update = async (event, context, callback) => {
  try {
    if (!!!event?.body) {
      return responseErro.erro(callback, event.path, "Request inválido!", 400);
    }

    body = JSON.parse(event?.body);

    if (
      !check.isValid(body, PARAMS_TO_CHECK) ||
      (body.role && !Array.isArray(body.role))
    ) {
      responseErro.erro(callback, event.path, "Request inválido!", 400);
    }

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

    const responseSearch = await dynamoClient.read(
      {
        ...event.pathParameters,
        table: "USER",
      },
      `${process.env.STAGE}IdentificationTable`
    );

    if (Object.keys(responseSearch).length === 0) {
      return responseNotFound.notFound(event, context, callback);
    }

    if (!!body.email) {
      const checkEmailResponse = await dynamoClient.query({
        TableName: `${process.env.STAGE}IdentificationTable`,
        Key: {
          table: "USER",
          ...event.pathParameters,
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

      if (
        checkEmailResponse.Items.length !== 0 &&
        checkEmailResponse.Items[0].email !== body.email
      ) {
        return responseErro.erro(
          callback,
          event.path,
          "Usuário ja cadastrado",
          400
        );
      }
    }

    const userFounded = responseSearch.Item;

    let params = {
      TableName: `${process.env.STAGE}IdentificationTable`,
      Key: {
        ...event.pathParameters,
        table: "USER",
      },
      UpdateExpression:
        "set #firstAccess = :vFirstAccess, #name = :vName, #surname = :vSurname, #email = :vEmail, #password = :vPassword, #updatedAt = :vUpdatedAt, #role = :vRole, #positionId = :vPositionId, #companyId = :vCompanyId",
      ExpressionAttributeNames: {
        "#name": "name",
        "#surname": "surname",
        "#email": "email",
        "#password": "password",
        "#updatedAt": "updatedAt",
        "#role": "role",
        "#firstAccess": "firstAccess",
        "#positionId": "positionId",
        "#companyId": "companyId",
      },
      ExpressionAttributeValues: {
        ":vName": !!body.name ? body.name : userFounded.name,
        ":vSurname": !!body.surname ? body.surname : userFounded.surname,
        ":vEmail": !!body.email ? body.email : userFounded.email,
        ":vPassword": body.password ? body.password : userFounded.password,
        ":vRole": !!body.role ? body.role : userFounded.role,
        ":vFirstAccess":
          body.firstAccess !== undefined && body.firstAccess !== null
            ? body.firstAccess
            : userFounded.firstAccess,
        ":vPositionId": !!body.positionId
          ? body.positionId
          : userFounded.positionId || null,
        ":vCompanyId": !!body.companyId
          ? body.companyId
          : userFounded.companyId || null,
        ":vUpdatedAt": new Date(Date.now()).toISOString(),
      },
      ReturnValues: "ALL_NEW",
    };

    const responseUpdate = await dynamoClient.update(params);
    delete responseUpdate.Attributes.password;

    return response.json(callback, responseUpdate.Attributes, 200);
  } catch (error) {
    console.error("error in update user", error);

    return responseErro.erro(callback, event.path, error.message);
  }
};
