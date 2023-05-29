"use-strict";

const uuid = require("uuid");
const dynamoClient = require("../../../shared/database");
const response = require("../../../shared/response");
const responseErro = require("../../../shared/error");
const check = require("../../../shared/isValid");
const AWS = require('aws-sdk');

let config;
if (process.env.NODE_ENV === 'local') {
  config = {
    accessKeyId: 'S3RVER',
    secretAccessKey: 'S3RVER',
    endpoint: new AWS.Endpoint('http://localhost:4569'),
    s3ForcePathStyle: true,
    region: 'localhost',
  }
} else {
  config = {
    region: 'us-east-1'
  }
}

console.log(config)
AWS.config.update(config);
const s3 = new AWS.S3();


const PARAMS_TO_CHECK = ["name", "companyId"];

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

    console.log(`creating new position... ${body.name}`);

    let rolesContext;
    if (process.env.STAGE === 'local') {
      rolesContext = event['requestContext']['authorizer']['role'];
    } else {
      rolesContext = event['requestContext']['authorizer']['lambda']['role'];
    }

    const roles = JSON.parse(rolesContext);
    if (!(roles.includes("ADMIN") || roles.includes("POSITION"))) {
      return responseErro.erro(
        callback,
        event.path,
        "Usuário sem permissão",
        403
      );
    }

    const objId = uuid.v4();
    if (!!body.imageBuffered) {
      const imageData = Buffer.from(body.imageBuffered, 'base64');

      await s3.putObject({
        Bucket: 'detections-bucket',
        Key: `${objId}.png`,
        Body: imageData,
        ContentType: 'image/png',
        ACL: 'public-read'
      }).promise();

    }

    let imageUrl;
    if (process.env.NODE_ENV === 'local') {
      imageUrl = `http://localhost:4569/detections-bucket/${`${objId}.png`}`;
    } else {
      imageUrl = `https://detections-bucket.s3.amazonaws.com/${`${objId}.png`}`
    }

    let item = {
      table: "POSITION",
      id: objId,
      name: body.name,
      description: body.description || null,
      companyId: body.companyId,
      color: body.color,
      rgb: body.rgb,
      uniformUrl: body.uniformUrl || imageUrl || null,
      createdAt: new Date(Date.now()).toISOString(),
      updatedAt: null,
    };

    await dynamoClient.insert(item, `${process.env.STAGE}IdentificationTable`);

    console.log("position created successfully");

    return response.json(callback, item, 201);
  } catch (error) {
    console.error("error in create user", error);
    return responseErro.erro(callback, event.path, error.message);
  }
};
