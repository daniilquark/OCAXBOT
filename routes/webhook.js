const express = require('express');
const router = express.Router();
const client = require('../db/client');
const webhookToMessages = require('./webhookToMessages');
const checkAndNotifyHashtag = require('./checkAndNotifyHashtag');

router.post('/tgwh', async (req, res) => {
  console.log("Output data", req.body);

  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS data (
      id SERIAL PRIMARY KEY,
      received_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      data JSONB
    );
  `;

  const insertQuery = 'INSERT INTO data(data) VALUES($1)';
  const values = [JSON.stringify(req.body)];

  try {
    await client.query(createTableQuery);
    await client.query(insertQuery, values);

    await webhookToMessages(); // Обновляем messages на основании data
    await checkAndNotifyHashtag(); // Проверяем наличие хештега test на основании text of messages

    res.status(200).json({
      message: "Data received and saved",
      receivedData: req.body
    });
  } catch (err) {
    console.error('Error saving data:', err.stack);
    res.status(500).json({
      message: 'Error saving data to the database'
    });
  }
});

module.exports = router;
