module.exports.preflight = async (event, context, callback) => {
  return callback(null, {
    statusCode: 200,
    headers: {
      "Access-Control-Allow-Origin": process.env.STAGE === 'local' ? process.env.FRONTEND_LOCAL_ORIGIN : process.env.FRONTEND_ORIGIN,
      'Access-Control-Allow-Credentials': true,
      "Access-Control-Allow-Headers": "Content-Type,Authorization",
    },
    body: JSON.stringify({ message: "CORS enabled" }),
  });
};
