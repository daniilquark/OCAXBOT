const fs = require('fs');
const https = require('https');
const express = require('express');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
const port = 8443;

const options = {
  key: fs.readFileSync('/etc/letsencrypt/live/daniilquark.com/privkey.pem'),
  cert: fs.readFileSync('/etc/letsencrypt/live/daniilquark.com/fullchain.pem')
};

// Middlewares
app.use(bodyParser.json());

// Routes
const webhookRoutes = require('./routes/webhook');
app.use('/', webhookRoutes);

// HTTPS server
https.createServer(options, app).listen(port, '0.0.0.0', () => {
  console.log(`by https://daniilquark.com:${port}`);
});
