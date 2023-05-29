const dynamoClient = require("../../../shared/database");
const response = require("../../../shared/response");
const responseErro = require("../../../shared/error");
const responseNotFound = require("../../../shared/notFound");
const check = require("../../../shared/isValid");

const PARAMS_TO_CHECK = ["cnpj", "fantasyName", "address", "phone"];
const ADDRESS_PARAMS_TO_CHECK = ["street", "district", "city", "state", "cep"];

module.exports.update = async (event, context, callback) => {
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

    if (!!body.cnpj) {
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

      if (
        responseCompany.Items.length !== 0 &&
        responseCompany.Items[0].cnpj !== body.cnpj
      ) {
        return responseErro.erro(
          callback,
          event.path,
          "Empresa já cadastrado",
          400
        );
      }
    }

    const companyFounded = responseSearch.Item;

    let params = {
      TableName: `${process.env.STAGE}IdentificationTable`,
      Key: {
        ...event.pathParameters,
        table: "COMPANY",
      },
      UpdateExpression:
        "set #cnpj = :vCnpj, #fantasyName = :vFantasyName, #address = :vAddress, #phone = :vPhone, #updatedAt = :vUpdatedAt, #logoUrl = :vLogoUrl",
      ExpressionAttributeNames: {
        "#cnpj": "cnpj",
        "#fantasyName": "fantasyName",
        "#address": "address",
        "#phone": "phone",
        "#updatedAt": "updatedAt",
        "#logoUrl": "logoUrl",
      },
      ExpressionAttributeValues: {
        ":vCnpj": !!body.cnpj ? body.cnpj : companyFounded.cnpj,
        ":vFantasyName": !!body.fantasyName ? body.fantasyName : companyFounded.fantasyName,
        ":vAddress": !!body.address ? body.address : companyFounded.address,
        ":vPhone": !!body.phone ? body.phone : companyFounded.phone,
        ":vLogoUrl": !!body.logoUrl ? body.logoUrl : companyFounded.logoUrl || null,
        ":vUpdatedAt": new Date(Date.now()).toISOString(),
      },
      ReturnValues: "ALL_NEW",
    };

    const responseUpdate = await dynamoClient.update(params);

    return response.json(callback, responseUpdate.Attributes, 200);
  } catch (error) {
    console.error("error in update company", error);

    return responseErro.erro(callback, event.path, error.message);
  }
};
