require("dotenv").config();
const MTProto = require("@mtproto/core");
const { getSRPParams } = require("@mtproto/core");
const prompts = require("prompts");
const path = require("path");
const { bot } = require("./services/telegram");

const api_id = process.env.TELEGRAM_APP_ID; // insert api_id here
const api_hash = process.env.TELEGRAM_APP_HASH; // insert api_hash here

async function getPhone() {
  return (
    await prompts({
      type: "text",
      name: "phone",
      message: "Enter your phone number:",
    })
  ).phone;
}

async function getCode() {
  // you can implement your code fetching strategy here
  return (
    await prompts({
      type: "text",
      name: "code",
      message: "Enter the code sent:",
    })
  ).code;
}

async function getPassword() {
  return (
    await prompts({
      type: "text",
      name: "password",
      message: "Enter Password:",
    })
  ).password;
}

const mtproto = new MTProto({
  api_id,
  api_hash,
  storageOptions: {
    path: path.resolve(__dirname, "./telegramData.json"),
  },
});

function startListener() {
  try {
    console.log("[+] starting listener");
    mtproto.updates.on("updates", ({ updates }) => {
      const newChannelMessages = updates
        .filter((update) => {
          if (update.message && update.message.peer_id)
            return update.message.peer_id.channel_id == 1872658362;
          return false;
        })
        .map(({ message }) => message);
      for (const message of newChannelMessages) {
        if (message.message.includes("✅ Renounced")) {
          const countRugged = (message.message.match(/Rugged/g) || []).length;
          const countRugged0 = (message.message.match(/Rugged: 0/g) || [])
            .length;
          if (countRugged === countRugged0) {
            bot.sendMessage(
              process.env.TELEGRAM_CHAT_ID,
              message.message.split("Token Socials")[0]
            );
          }
        }
      }
    });
  } catch (error) {
    console.log('ERROR', error)
    startListener();
  }
}

// checking authentication status
mtproto
  .call("users.getFullUser", {
    id: {
      _: "inputUserSelf",
    },
  })
  .then(startListener) // means the user is logged in -> so start the listener
  .catch(async (error) => {
    // The user is not logged in
    console.log("[+] You must log in");
    const phone_number = await getPhone();

    mtproto
      .call("auth.sendCode", {
        phone_number: phone_number,
        settings: {
          _: "codeSettings",
        },
      })
      .catch((error) => {
        if (error.error_message.includes("_MIGRATE_")) {
          const [type, nextDcId] = error.error_message.split("_MIGRATE_");

          mtproto.setDefaultDc(+nextDcId);

          return sendCode(phone_number);
        }
      })
      .then(async (result) => {
        return mtproto.call("auth.signIn", {
          phone_code: await getCode(),
          phone_number: phone_number,
          phone_code_hash: result.phone_code_hash,
        });
      })
      .catch((error) => {
        if (error.error_message === "SESSION_PASSWORD_NEEDED") {
          return mtproto.call("account.getPassword").then(async (result) => {
            const { srp_id, current_algo, srp_B } = result;
            const { salt1, salt2, g, p } = current_algo;

            const { A, M1 } = await getSRPParams({
              g,
              p,
              salt1,
              salt2,
              gB: srp_B,
              password: await getPassword(),
            });

            return mtproto.call("auth.checkPassword", {
              password: {
                _: "inputCheckPasswordSRP",
                srp_id,
                A,
                M1,
              },
            });
          });
        }
      })
      .then((result) => {
        console.log("[+] successfully authenticated");
        // start listener since the user has logged in now
        startListener();
      });
  });
