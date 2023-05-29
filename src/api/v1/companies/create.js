"use-strict";

const uuid = require("uuid");
const dynamoClient = require("../../../shared/database");
const response = require("../../../shared/response");
const responseErro = require("../../../shared/error");
const check = require("../../../shared/isValid");

const PARAMS_TO_CHECK = ["cnpj", "fantasyName", "address", "phone"];
const ADDRESS_PARAMS_TO_CHECK = ["street", "district", "city", "state", "cep"];

module.exports.create = async (event, context, callback) => {
  try {
    if (!!!event?.body) {
      return responseErro.erro(callback, event.path, "Request inválido!", 400);
    }

    body = JSON.parse(event?.body);

    if (!check.isValid(body, PARAMS_TO_CHECK)) {
      return responseErro.erro(callback, event.path, "Request inválido!", 400);
    }

    if (!check.isValid(body.address, ADDRESS_PARAMS_TO_CHECK)) {
      return responseErro.erro(callback, event.path, "Request inválido!", 400);
    }

    const responseCompany = await dynamoClient.query({
      TableName: `${process.env.STAGE}IdentificationTable`,
      Key: {
        table: "COMPANY",
      },
      IndexName: "CompanyCnpjIndex",
      KeyConditionExpression: "#cnpj = :vCnpj",
      ExpressionAttributeNames: {
        "#cnpj": "cnpj",
      },
      ExpressionAttributeValues: {
        ":vCnpj": body.cnpj,
      },
    });

    if (responseCompany.Items.length !== 0) {
      return responseErro.erro(
        callback,
        event.path,
        "Empresa já cadastrada",
        400
      );
    }

    let rolesContext;
    if (process.env.STAGE === 'local') {
      rolesContext = event['requestContext']['authorizer']['role'];
    } else {
      rolesContext = event['requestContext']['authorizer']['lambda']['role'];
    }

    const roles = JSON.parse(rolesContext);

    if (!(roles.includes("ADMIN") || roles.includes("COMPANY"))) {
      return responseErro.erro(
        callback,
        event.path,
        "Usuário sem permissão",
        403
      );
    }

    let item = {
      table: "COMPANY",
      id: uuid.v4(),
      cnpj: body.cnpj,
      fantasyName: body.fantasyName,
      address: body.address,
      phone: body.phone,
      logoUrl: body.logoUrl || null,
      createdAt: new Date(Date.now()).toISOString(),
      updatedAt: null,
    };

    await dynamoClient.insert(item, `${process.env.STAGE}IdentificationTable`);

    return response.json(callback, item, 201);
  } catch (error) {
    console.error("error in create company", error);
    return responseErro.erro(callback, event.path, error.message);
  }
};
