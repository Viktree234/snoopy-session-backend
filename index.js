const express = require("express");
const { default: makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion } = require("@whiskeysockets/baileys");
const qrcode = require("qrcode-terminal");
const fs = require("fs");
const path = require("path");
const randomstring = require("randomstring");

const app = express(); // ✅ This must be BEFORE using `app.get(...)`
const port = process.env.PORT || 3000;

app.use(express.json());

app.get("/", (req, res) => {
  res.send("✅ Snoopy Session Generator is Running!");
});

app.get("/generate", async (req, res) => {
  try {
    const sessionId = randomstring.generate(6).toLowerCase();
    const sessionDir = path.join(__dirname, "auth_sessions", sessionId);

    if (!fs.existsSync(sessionDir)) {
      fs.mkdirSync(sessionDir, { recursive: true });
    }

    const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
      version,
      auth: state,
      printQRInTerminal: true,
    });

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("connection.update", (update) => {
      const { connection, qr, isNewLogin, lastDisconnect } = update;
      if (qr) {
        console.log("🔐 QR Code received for session ID:", sessionId);
        qrcode.generate(qr, { small: true });
      }

      if (connection === "open") {
        console.log("✅ Session connected:", sessionId);
      } else if (connection === "close") {
        console.log("❌ Connection closed", lastDisconnect?.error);
      }
    });

    res.json({
      status: "pending",
      message: "Scan the QR from terminal or implement frontend to render",
      sessionId: sessionId,
    });
  } catch (error) {
    console.error("Error generating session:", error);
    res.status(500).json({ status: "error", error: error.message });
  }
});

app.listen(port, () => {
  console.log(`🚀 Snoopy Session Backend running on port ${port}`);
});
