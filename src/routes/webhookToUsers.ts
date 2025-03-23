import client from '../db/client';
import { QueryResult } from 'pg';

async function webhookToUsers(): Promise<void> {
  try {
    // Создаём таблицу users, если она ещё не существует
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id BIGINT PRIMARY KEY,
        is_bot BOOLEAN,
        username TEXT,
        first_name TEXT,
        last_name TEXT,
        language_code TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Вставка уникальных пользователей из JSON
    const query = `
    INSERT INTO users (
      id,
      is_bot,
      username,
      first_name,
      last_name,
      language_code
    )
    SELECT DISTINCT ON ((data->'message'->'from'->>'id'))
      (data->'message'->'from'->>'id')::BIGINT,
      (data->'message'->'from'->>'is_bot')::BOOLEAN,
      data->'message'->'from'->>'username',
      data->'message'->'from'->>'first_name',
      data->'message'->'from'->>'last_name',
      data->'message'->'from'->>'language_code'
    FROM data
    WHERE data ? 'message'
      AND data->'message' ? 'from'
      AND (data->'message'->'from'->>'id') IS NOT NULL
    ON CONFLICT (id) DO UPDATE SET
      is_bot = EXCLUDED.is_bot,
      username = EXCLUDED.username,
      first_name = EXCLUDED.first_name,
      last_name = EXCLUDED.last_name,
      language_code = EXCLUDED.language_code;
  `;
  
    const result: QueryResult = await client.query(query);
    console.log(`Добавлено или обновлено ${result.rowCount} строк в таблице users на основании таблицы data`);
  } catch (err) {
    console.error('Ошибка при вставке данных пользователей из таблицы data в таблицу users:', err);
  }
}

export default webhookToUsers;
