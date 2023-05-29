module.exports.isValid = (item, params) => {
  for (let i in params) {
    if (!item.hasOwnProperty(params[i]) || !(typeof item[params[i]] === 'string' || typeof item[params[i]] === 'object' )) {
      return false;
    }
  }

  return true;
}
