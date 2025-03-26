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
  reply_thread_id: number | null;
}

async function checkAndNotifyHashtag(): Promise<void> {
  try {
    const res = await client.query(`
      SELECT message_id, text, chat_id, reply_thread_id
      FROM messages
      WHERE text ~* '(^|\\s)#test(\\s|$|\\W)'
        AND chat_id IS NOT NULL
        AND (reaction_by_hashtag IS NULL OR reaction_by_hashtag = false)
    `);

    const rows: MessageRow[] = res.rows;

    for (const row of rows) {
      const { chat_id, reply_thread_id, message_id } = row;

      const params: any = {
        chat_id,
        text: 'Хештег пойман и прочитан!', //Опасная хуйня, сюда нельзя писать хештеги
      };

      if (reply_thread_id !== null) {
        params.message_thread_id = reply_thread_id;
      }

      // Отправка сообщения ботом
      const response = await axios.get(`${TELEGRAM_API_BASE}/sendMessage`, { params });
      const botMessage = response.data.result;

      console.log(`✅ Сообщение отправлено (message_id=${message_id})`);

      // Обновляем исходное сообщение как обработанное
      await client.query(
        'UPDATE messages SET reaction_by_hashtag = TRUE WHERE message_id = $1',
        [message_id]
      );

      // Получаем последний update_id по дате
      const lastUpdateIdResult = await client.query(`
        SELECT update_id FROM messages ORDER BY date DESC LIMIT 1
      `);
      const lastUpdateId = BigInt(lastUpdateIdResult.rows[0]?.update_id ?? 0);
      const newUpdateId = BigInt(`${lastUpdateId}1`);

      // Сохраняем сообщение от бота
      await client.query(
        `INSERT INTO messages (
          update_id,
          date,
          username,
          text,
          message_id,
          chat_id,
          chat_title,
          reply_thread_id,
          reply_topic_name
        ) VALUES ($1, to_timestamp($2), $3, $4, $5, $6, $7, $8, $9)`,
        [
          newUpdateId.toString(),
          botMessage.date,
          botMessage.from?.username ?? 'OCAXBOT',
          botMessage.text,
          botMessage.message_id,
          botMessage.chat.id,
          botMessage.chat.title ?? null,
          botMessage.message_thread_id ?? null,
          botMessage.reply_to_message?.forum_topic_created?.name ?? null
        ]
      );
    }

  } catch (err) {
    console.error('❌ Ошибка при обработке хештега или отправке сообщения:', err);
  }
}

export default checkAndNotifyHashtag;
