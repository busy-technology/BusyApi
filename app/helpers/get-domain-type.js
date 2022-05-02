module.exports = (apitype) =>
  apitype
    .replace(/^(?:http?:\/\/)?(?:https?:\/\/)?(?:www\.)?/i, '')
    .split('/')[0];
