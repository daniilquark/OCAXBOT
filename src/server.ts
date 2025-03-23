import fs from 'fs';
import https from 'https';
import express, { Application } from 'express';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const app: Application = express();
const port = 8443;

// HTTPS сертификаты
const options = {
  key: fs.readFileSync('/etc/letsencrypt/live/daniilquark.com/privkey.pem'),
  cert: fs.readFileSync('/etc/letsencrypt/live/daniilquark.com/fullchain.pem'),
};

// Middlewares
app.use(bodyParser.json());

// Роуты
import webhookRoutes from './routes/webhook';
app.use('/', webhookRoutes);

// HTTPS сервер
https.createServer(options, app).listen(port, '0.0.0.0', () => {
  console.log(`Server running at https://daniilquark.com:${port}`);
});
