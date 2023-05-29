'use strict';

const response = require('./response');

module.exports.erro = (callback, resource, message = "Something went wrong", status = 500) => {
  let body = {
    recurso: resource,
    erro: message
  }

  return response.json(callback, body, status);
};
