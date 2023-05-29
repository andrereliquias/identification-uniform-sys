"use-strict";

const jwt = require("jsonwebtoken");
const dynamoClient = require("../../../shared/database");

const generatePolicyHttp = (principalId, effect, resource, context) => {
  const authResponse = {};
  authResponse.principalId = principalId;
  if (effect && resource) {
    const policyDocument = {};
    policyDocument.Version = "2012-10-17";
    policyDocument.Statement = [];
    const statementOne = {};
    statementOne.Action = "execute-api:Invoke";
    statementOne.Effect = effect;
    statementOne.Resource = resource;
    policyDocument.Statement[0] = statementOne;
    authResponse.policyDocument = policyDocument;
    authResponse.context = context;
  }
  return authResponse;
};

module.exports.validateToken = async (event, context, callback) => {
  try {
    console.log('Validação de token', JSON.stringify(event))

    let authorization;
    if (process.env.STAGE === 'local') {
      authorization = event.authorizationToken;
    } else {
      authorization = event.headers['authorization'];
    }

    if (!!!authorization) {
      console.error("Authorization not found!");
      return callback("Unauthorized");
    }

    const tokenValue = authorization;
    console.log('tokenValue', tokenValue)
    await jwt.verify(
      tokenValue,
      process.env.SECRET,
      async (verifyError, decoded) => {
        if (verifyError) {
          console.error("verifyError", verifyError);
          // 401 Unauthorized
          console.error(`Token invalid. ${verifyError}`);
          return callback("Unauthorized");
        }

        const responseSearch = await dynamoClient.read(
          {
            id: decoded.data.id,
            table: "USER",
          },
          `${process.env.STAGE}IdentificationTable`
        );

        console.log('user: ', responseSearch)

        if (Object.keys(responseSearch).length === 0) {
          console.error("User not found!");
          return callback("Unauthorized");
        }


        const context = {
          role: JSON.stringify(decoded.data.role)
        }

        let arn;
        if (process.env.STAGE === 'local') {
          arn = event.methodArn;
        } else {
          arn = event.routeArn;
        }

        const policy = generatePolicyHttp(decoded.data.id, "Allow", arn, context)
        console.log('policy', JSON.stringify(policy))

        return callback(
          null,
          policy
        );
      }
    );
  } catch (err) {
    console.log("catch error. Invalid token", err);
    return callback("Unauthorized");
  }
};

module.exports.validateExternToken = async (event, context, callback) => {
  try {

    if (!!!event.headers['authorization']) {
      return callback(null, {
        statusCode: 401,
        headers: {
          "Access-Control-Allow-Origin": process.env.STAGE === 'local' ? process.env.FRONTEND_LOCAL_ORIGIN : process.env.FRONTEND_ORIGIN,
          'Access-Control-Allow-Credentials': true
        },
        body: JSON.stringify("Unauthorized")
      });
    }

    const tokenValue = event.headers['authorization'];

    await jwt.verify(
      tokenValue,
      process.env.SECRET,
      async (verifyError, decoded) => {
        if (verifyError) {
          console.error("verifyError", verifyError);
          console.error(`Token invalid. ${verifyError}`);
          return callback(null, {
            statusCode: 401,
            headers: {
              "Access-Control-Allow-Origin": process.env.STAGE === 'local' ? process.env.FRONTEND_LOCAL_ORIGIN : process.env.FRONTEND_ORIGIN,
              'Access-Control-Allow-Credentials': true
            },
            body: JSON.stringify("Unauthorized")
          });
        }

        const responseSearch = await dynamoClient.read(
          {
            id: decoded.data.id,
            table: "USER",
          },
          `${process.env.STAGE}IdentificationTable`
        );

        if (Object.keys(responseSearch).length === 0) {
          return callback(null, {
            statusCode: 401,
            headers: {
              "Access-Control-Allow-Origin": process.env.STAGE === 'local' ? process.env.FRONTEND_LOCAL_ORIGIN : process.env.FRONTEND_ORIGIN,
              'Access-Control-Allow-Credentials': true
            },
            body: JSON.stringify("Unauthorized")
          });
        }

        // is custom authorizer function
        console.log("valid user", decoded.data.email);
        return callback(null, {
          statusCode: 204,
          headers: {
            "Access-Control-Allow-Origin": process.env.STAGE === 'local' ? process.env.FRONTEND_LOCAL_ORIGIN : process.env.FRONTEND_ORIGIN,
            'Access-Control-Allow-Credentials': true
          },
          body: JSON.stringify("")
        });
      }
    );
  } catch (err) {
    console.log("catch error. Invalid token", err);

    return callback(null, {
      statusCode: 401,
      headers: {
        "Access-Control-Allow-Origin": process.env.STAGE === 'local' ? process.env.FRONTEND_LOCAL_ORIGIN : process.env.FRONTEND_ORIGIN,
        'Access-Control-Allow-Credentials': true
      },
      body: JSON.stringify("Unauthorized")
    });
  }
};
