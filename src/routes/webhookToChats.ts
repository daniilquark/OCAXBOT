import client from '../db/client';
import { QueryResult } from 'pg';

async function webhookToChats(): Promise<void> {
  try {
    // Создание таблицы chats, если она ещё не существует
    await client.query(`
      CREATE TABLE IF NOT EXISTS chats (
        id BIGINT PRIMARY KEY,
        type TEXT,
        title TEXT,
        username TEXT,
        first_name TEXT,
        last_name TEXT,
        is_forum BOOLEAN,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    const query = `
      INSERT INTO chats (
        id,
        type,
        title,
        username,
        first_name,
        last_name,
        is_forum
      )
      SELECT DISTINCT ON ((data->'message'->'chat'->>'id'))
        (data->'message'->'chat'->>'id')::BIGINT,
        data->'message'->'chat'->>'type',
        data->'message'->'chat'->>'title',
        data->'message'->'chat'->>'username',
        data->'message'->'chat'->>'first_name',
        data->'message'->'chat'->>'last_name',
        CASE
          WHEN data->'message'->'chat' ? 'is_forum' THEN (data->'message'->'chat'->>'is_forum')::BOOLEAN
          ELSE NULL
        END
      FROM data
      WHERE data ? 'message'
        AND data->'message' ? 'chat'
        AND (data->'message'->'chat'->>'id') IS NOT NULL
      ON CONFLICT (id) DO UPDATE SET
        type = EXCLUDED.type,
        title = EXCLUDED.title,
        username = EXCLUDED.username,
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name,
        is_forum = EXCLUDED.is_forum;
    `;

    const result: QueryResult = await client.query(query);
    console.log(`Добавлено или обновлено ${result.rowCount} строк в таблице chats на основании таблицы data`);
  } catch (err) {
    console.error('Ошибка при вставке чатов из таблицы data в таблицу chats:', err);
  }
}

export default webhookToChats;
