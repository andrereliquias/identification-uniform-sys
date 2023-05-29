const dynamoClient = require("../../../shared/database");
const response = require("../../../shared/response");
const responseErro = require("../../../shared/error");
const responseNotFound = require("../../../shared/notFound");
const check = require("../../../shared/isValid");
const AWS = require('aws-sdk');

const PARAMS_TO_CHECK = ["name", "companyId"];

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

module.exports.update = async (event, context, callback) => {
  try {
    if (!!!event?.body) {
      return responseErro.erro(callback, event.path, "Request inválido!", 400);
    }

    body = JSON.parse(event?.body);

    if (!check.isValid(body, PARAMS_TO_CHECK)) {
      return responseErro.erro(callback, event.path, "Request inválido!", 400);
    }

    const responseSearch = await dynamoClient.read(
      {
        ...event.pathParameters,
        table: "POSITION",
      },
      `${process.env.STAGE}IdentificationTable`
    );

    if (Object.keys(responseSearch).length === 0) {
      return responseNotFound.notFound(event, context, callback);
    }

    const positionFounded = responseSearch.Item;

    if (!!body.imageBuffered) {
      const imageData = Buffer.from(body.imageBuffered, 'base64');

      await s3.putObject({
        Bucket: 'detections-bucket',
        Key: `${positionFounded.id}.png`,
        Body: imageData,
        ContentType: 'image/png',
        ACL: 'public-read'
      }).promise();

    }

    let params = {
      TableName: `${process.env.STAGE}IdentificationTable`,
      Key: {
        ...event.pathParameters,
        table: "POSITION",
      },
      UpdateExpression:
        "set #name = :vName, #description = :vDescription, #companyId = :vCompanyId, #uniformUrl = :vUniformUrl, #updatedAt = :vUpdatedAt, #color = :vColor, #rgb = :vRgb",
      ExpressionAttributeNames: {
        "#name": "name",
        "#description": "description",
        "#companyId": "companyId",
        "#uniformUrl": "uniformUrl",
        "#updatedAt": "updatedAt",
        "#color": "color",
        "#rgb": "rgb",
      },
      ExpressionAttributeValues: {
        ":vName": !!body.name ? body.name : positionFounded.name,
        ":vDescription": !!body.description ? body.description : positionFounded.description,
        ":vCompanyId": !!body.companyId ? body.companyId : positionFounded.companyId,
        ":vUniformUrl": !!body.uniformUrl ? body.uniformUrl : positionFounded.uniformUrl,
        ":vColor": !!body.color ? body.color : positionFounded.color,
        ":vRgb": !!body.rgb ? body.rgb : positionFounded.rgb,
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
