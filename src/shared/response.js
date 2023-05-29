'use strict';

module.exports.json = (callback, body = {}, status = 200) => {
  return callback(null, {
    statusCode: status,
    headers: {
      "Access-Control-Allow-Origin": process.env.STAGE === 'local' ? process.env.FRONTEND_LOCAL_ORIGIN : process.env.FRONTEND_ORIGIN,
      'Access-Control-Allow-Credentials': true
    },
    body: (body != null) ? JSON.stringify(body) : ""
  });
};
