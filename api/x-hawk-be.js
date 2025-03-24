// Dedicated handler for x-hawk-be project
const webhookHandler = require('./webhook');

module.exports = (req, res) => {
  console.log("x-hawk-be specific handler called");
  // Force the project to be x-hawk-be regardless of URL path
  req.query.project = 'x-hawk-be';
  return webhookHandler(req, res);
}; 