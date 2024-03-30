require("dotenv").config();
const TOKEN = process.env.TELEGRAM_BOT_API_KEY;
const TelegramBot = require("node-telegram-bot-api");
const bot = new TelegramBot(TOKEN);
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

const telegramBot = {
  start() {
    bot.on("message", (msg) => {
      const chatId = msg.chat.id;
      console.log(msg);
      bot.sendMessage(chatId, "Received your message");
    });
  },
};

module.exports = { bot, telegramBot };
