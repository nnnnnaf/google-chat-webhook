// Dedicated handler for self-hosted-cloud-platform project
const webhookHandler = require('./webhook');

module.exports = (req, res) => {
  console.log("self-hosted-cloud-platform specific handler called");
  // Force the project to be self-hosted-cloud-platform regardless of URL path
  req.query.project = 'self-hosted-cloud-platform';
  return webhookHandler(req, res);
}; 