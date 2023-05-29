var AWS = require("aws-sdk");

let option = { region: "us-east-1" };

if (process.env.IS_OFFLINE || process.env.IS_TEST) {
  option = {
    region: "localhost",
    endpoint: "http://localhost:8000",
    accessKeyId: "DEFAULT_ACCESS_KEY",
    secretAccessKey: "DEFAULT_SECRET",
  };
}

AWS.config.update(option);

const ddb = new AWS.DynamoDB.DocumentClient();

const client = {
  insert: (item, tableName) => {
    const params = {
      TableName: tableName,
      Item: item,
    };

    return ddb.put(params).promise();
  },
  read: (keys, tableName) => {
    const params = {
      TableName: tableName,
      Key: keys
    };

    return ddb.get(params).promise();
  },
  query: (params) => {
    return ddb.query(params).promise();
  },
  search: (params) => {
    return ddb.scan(params).promise();
  },
  update: (params) => {
    return ddb.update(params).promise();
  },
  delete: (keys, tableName) => {
    const params = {
      TableName: tableName,
      Key: keys,
    };

    return ddb.delete(params).promise();
  },
};

module.exports = client;
