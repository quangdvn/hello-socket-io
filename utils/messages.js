const messageGenerator = (username, message, display) => {
  return {
    username,
    message,
    display: display,
    createdAt: new Date().getTime()
  };
};

const locationGenerator = (username, url) => {
  return {
    username,
    url,
    createdAt: new Date().getTime()
  };
};

module.exports = {
  messageGenerator,
  locationGenerator
};
