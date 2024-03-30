require("dotenv").config();
const axios = require("axios");

const BASE_URL = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_API_KEY}`;

const sendMessage = async (text) => {
  const URL = `${BASE_URL}/sendMessage`;
  await axios.get(URL, {
    params: { chat_id: process.env.TELEGRAM_CHAT_ID, text },
  });
};

const prompts = require("prompts");

const getPhone = async () => {
  return (
    await prompts({
      type: "text",
      name: "phone",
      message: "Enter your phone number:",
    })
  ).phone;
};

const getCode = async () => {
  return (
    await prompts({
      type: "text",
      name: "code",
      message: "Enter the code that has been sent to your Telegram:",
    })
  ).code;
};

const getPassword = async () => {
  return (
    await prompts({
      type: "text",
      name: "password",
      message: "Enter your Telegram password:",
    })
  ).password;
};

module.exports = { sendMessage, getPhone, getCode, getPassword };
