import client from '../db/client';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const BOT_TOKEN = process.env.BOT_TOKEN;

if (!BOT_TOKEN) {
  throw new Error('BOT_TOKEN не найден в .env');
}

const TELEGRAM_API_BASE = `https://api.telegram.org/bot${BOT_TOKEN}`;

interface MessageRow {
  message_id: number;
  text: string;
  chat_id: number;
  reply_thread_id: number | null; // теперь может быть null
}

async function checkAndNotifyHashtag(): Promise<void> {
  try {
    const res = await client.query(`
      SELECT message_id, text, chat_id, reply_thread_id
      FROM messages
      WHERE text ILIKE '%#test%'
        AND chat_id IS NOT NULL
        AND (reaction_by_hashtag IS NULL OR reaction_by_hashtag = false)
    `);

    const rows: MessageRow[] = res.rows;

    for (const row of rows) {
      const { chat_id, reply_thread_id, message_id } = row;

      const params: any = {
        chat_id,
        text: 'Хештег пойман и прочитан!',
      };

      if (reply_thread_id !== null) {
        params.message_thread_id = reply_thread_id;
      }

      await axios.get(`${TELEGRAM_API_BASE}/sendMessage`, { params });

      console.log(`✅ Сообщение отправлено (message_id=${message_id})`);

      await client.query(
        'UPDATE messages SET reaction_by_hashtag = TRUE WHERE message_id = $1',
        [message_id]
      );
    }

  } catch (err) {
    console.error('❌ Ошибка при отправке сообщения:', err);
  }
}

export default checkAndNotifyHashtag;
