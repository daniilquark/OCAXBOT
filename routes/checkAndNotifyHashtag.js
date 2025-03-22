const client = require('../db/client');
const axios = require('axios');
require('dotenv').config();

if (!process.env.BOT_TOKEN) {
    throw new Error('BOT_TOKEN не найден в .env');
}  

const TELEGRAM_API_BASE = `https://api.telegram.org/bot${process.env.BOT_TOKEN}`;

async function checkAndNotifyHashtag() {
    try {
        // Обработка только необработанных записей
        const res = await client.query(`
            SELECT message_id, text, chat_id, reply_thread_id
            FROM messages
            WHERE text ILIKE '%#test%'
            AND chat_id IS NOT NULL
            AND reply_thread_id IS NOT NULL
            AND (reaction_by_hashtag IS NULL OR reaction_by_hashtag = false)
        `);

        for (const row of res.rows) {
            const { chat_id, reply_thread_id, message_id } = row;

            const response = await axios.get(`${TELEGRAM_API_BASE}/sendMessage`, {
                params: {
                    chat_id: chat_id,
                    message_thread_id: reply_thread_id,
                    text: 'Хештег пойман и прочитан!'
                }
            });

            console.log(`✅ Сообщение отправлено (message_id=${message_id})`);

            // Отмечаем как обработанное
            await client.query('UPDATE messages SET reaction_by_hashtag = TRUE WHERE message_id = $1', [message_id]);
        }

    } catch (err) {
        console.error('❌ Ошибка при отправке сообщения:', err);
    }
}

module.exports = checkAndNotifyHashtag;
