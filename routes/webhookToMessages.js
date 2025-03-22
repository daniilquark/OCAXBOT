const client = require('../db/client');

async function webhookToMessages() {
  try {
    // Создаём таблицу messages, если она ещё не существует
    await client.query(`
      CREATE TABLE IF NOT EXISTS messages (
        update_id BIGINT PRIMARY KEY,
        date TIMESTAMP,
        username TEXT,
        text TEXT,
        reaction_by_hashtag BOOLEAN DEFAULT FALSE,
        message_id INTEGER,
        chat_id BIGINT,
        chat_title TEXT,
        reply_thread_id INTEGER,
        reply_topic_name TEXT
      );
    `);

    // Запрос на вставку извлечённых данных из JSON
    const query = `
      INSERT INTO messages (
        update_id,
        date,
        username,
        text,
        message_id,
        chat_id,
        chat_title,
        reply_thread_id,
        reply_topic_name
      )
      SELECT
        (data->>'update_id')::BIGINT,
        to_timestamp((data->'message'->>'date')::BIGINT),
        data->'message'->'from'->>'username',
        data->'message'->>'text',
        (data->'message'->>'message_id')::INTEGER,
        (data->'message'->'chat'->>'id')::BIGINT,
        data->'message'->'chat'->>'title',
        (data->'message'->'reply_to_message'->>'message_thread_id')::INTEGER,
        data->'message'->'reply_to_message'->'forum_topic_created'->>'name'
      FROM data
      WHERE data ? 'update_id' AND data ? 'message'
      ON CONFLICT (update_id) DO NOTHING;
    `;

    const result = await client.query(query);
    console.log(`Добавлено ${result.rowCount} строк в таблицу messages на основании таблицы data`);
  } catch (err) {
    console.error('Ошибка при вставке webhook-данных из таблицы data в таблицу messages:', err);
  }
}

module.exports = webhookToMessages;
