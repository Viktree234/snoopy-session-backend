const express = require("express");
const { default: makeWASocket, useSingleFileAuthState } = require("@whiskeysockets/baileys");
const { generate } = require("randomstring");
const fs = require("fs");

const app = express();
const port = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("Snoopy Session Generator is Running!");
});

app.get("/generate", async (req, res) => {
  const sessionId = generate(8);
  const filePath = `./auth_sessions/${sessionId}.json`;

  const { state, saveState } = useSingleFileAuthState(filePath);
  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: false,
  });

  sock.ev.on("creds.update", saveState);

  sock.ev.on("connection.update", async ({ qr, pairingCode }) => {
    if (qr) {
      return res.send(`<h3>Scan this QR:</h3><img src="https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(qr)}&size=300x300" />`);
    }
    if (pairingCode) {
      return res.send(`<h3>Your Pairing Code:</h3><p>${pairingCode}</p>`);
    }
  });
});

app.listen(port, () => {
  console.log(`✅ Server running on http://localhost:${port}`);
});
