const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const cors = require('cors');

const token = "7646707882:AAGCAzD7aZci8sjv2UibrlckbG5pFeQDpsI";
const bot = new TelegramBot(token, {polling: true});
const url = "https://aitu-complaints.netlify.app";
const id = {
    moderation: -4659604334, channel: -1002296112753
}

const app = express();
app.use(cors({
    origin: url,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept']
}));

app.use(express.json());
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', url);
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    console.log('CORS headers set for:', req.method, req.url);
    next();
});

app.options('*', (req, res) => {
    res.header('Access-Control-Allow-Origin', url);
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.send(200);
});

bot.on("message", async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text || "Error";

    if (text === "Error") {
        await bot.sendMessage(chatId, "Где-то есть ошибка, повторите попытку позже");
        return;
    }
    if (text === "/start") {
        await bot.sendMessage(chatId, "Здравствуйте! Я ваш AITU-Complaints Bot.\n" +
            "Моя цель — помочь вам решить проблемы и ответить на вопросы. Запустите приложение", {
            reply_markup: {
                inline_keyboard: [[{text: "Открыть", web_app: {url: url}}]]
            }
        })
    }
});
bot.on('callback_query', async (callbackQuery) => {
    try {
        const callbackMsg = callbackQuery.message;
        const callbackData = callbackQuery.data;

        if (callbackData === 'yes') {
            await bot.sendMessage(id.moderation, 'Опубликовано ✅');
            await bot.sendMessage(id.channel, `${callbackMsg?.text}`, {});
            if (callbackMsg?.message_id) {
                await bot.editMessageReplyMarkup({inline_keyboard: []}, {
                    chat_id: id.moderation, message_id: callbackMsg.message_id
                });
            } else {
                console.log("message_id не найден.");
            }
        } else if (callbackData === 'no') {
            await bot.sendMessage(id.moderation, 'Отказано ❌');
            if (callbackMsg?.message_id) {
                await bot.editMessageReplyMarkup({inline_keyboard: []}, {
                    chat_id: id.moderation, message_id: callbackMsg.message_id
                });
            } else {
                console.log("message_id не найден.");
            }
        }
    } catch (error) {
        console.log("Ошибка в обработке callback_query:", error);
    }
});

app.post('/complaints', async (req, res) => {
    const text = req.body.result.input_message_content.message_text;
    const type = req.body.result.title.text;
    console.log("Type: " * type)
    try {
        await bot.sendMessage(id.moderation, `*Категория:* ${type}\n*Описание:* ${text}`,);
        res.json({success: true});
    } catch (error) {
        console.error("Error sending message to chat:", error);
        res.status(500).json({success: false, error: error});
    }
})

app.listen(8080, () => {
    console.log('Server is running on port 8080');
});
