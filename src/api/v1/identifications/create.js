"use-strict";

const uuid = require("uuid");
const dynamoClient = require("../../../shared/database");
const response = require("../../../shared/response");
const responseErro = require("../../../shared/error");
const check = require("../../../shared/isValid");

const PARAMS_TO_CHECK = ["pIdentificationId", "dateTime"];

module.exports.create = async (event, context, callback) => {
  try {
    if (!!!event?.body) {
      return responseErro.erro(callback, event.path, "Request inválido!", 400);
    }

    body = JSON.parse(event?.body);

    if (
      !check.isValid(body, PARAMS_TO_CHECK)
    ) {
      return responseErro.erro(callback, event.path, "Request inválido!", 400);
    }

    console.log(`creating new identification... ${body.pIdentificationId}`);

    let item = {
      table: "IDENTIFICATION",
      id: uuid.v4(),
      dateTime: body.dateTime,
      pIdentificationId: body.pIdentificationId,
      createdAt: new Date(Date.now()).toISOString(),
      updatedAt: null,
    };

    await dynamoClient.insert(item, `${process.env.STAGE}IdentificationTable`);

    console.log("identification created successfully");

    return response.json(callback, item, 201);
  } catch (error) {
    console.error("error in create identification", error);
    return responseErro.erro(callback, event.path, error.message);
  }
};
