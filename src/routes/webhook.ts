import { Router, Request, Response } from 'express';
import client from '../db/client';
import webhookToMessages from './webhookToMessages';
import checkAndNotifyHashtag from './checkAndNotifyHashtag';

const router = Router();

router.post('/tgwh', async (req: Request, res: Response) => {
  console.log('Output data', req.body);

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

    await webhookToMessages();
    await checkAndNotifyHashtag();

    res.status(200).json({
      message: 'Data received and saved',
      receivedData: req.body,
    });
  } catch (err) {
    console.error('Error saving data:', err);
    res.status(500).json({
      message: 'Error saving data to the database',
    });
  }
});

export default router;
