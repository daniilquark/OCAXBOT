const fs = require('fs');
const https = require('https');
const express = require('express');
const bodyParser = require('body-parser');
const { Client } = require('pg');
require('dotenv').config();

const app = express();
const port = 8443;

const options = {
  key: fs.readFileSync('/etc/letsencrypt/live/daniilquark.com/privkey.pem'),
  cert: fs.readFileSync('/etc/letsencrypt/live/daniilquark.com/fullchain.pem')
};

const client = new Client({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

client.connect()
  .then(() => {
    console.log('Connected to the database');
  })
  .catch(err => {
    console.error('Database connection error:', err.stack);
});

app.use(bodyParser.json());

app.post('/tgwh', (req, res) => {
    console.log("Output data", req.body);

    const query = 'INSERT INTO data(data) VALUES($1)';
    const values = [JSON.stringify(req.body)];

    client.query(query, values)
        .then(() => {
            res.status(200).json({ message: "Data received and saved", receivedData: req.body });
        })
        .catch(err => {
            console.error('Error saving data:', err.stack);
            res.status(500).json({ message: 'Error saving data to the database' });
    });
});

https.createServer(options, app).listen(port, '0.0.0.0', () => {
  console.log(`by https://daniilquark.com:${port}`);
});
