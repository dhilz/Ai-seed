import TelegramBot from 'telegram-bot-api';
import dotenv from 'dotenv';
import fs from 'fs';
import { generateMnemonicWithAI, checkMnemonic } from './ai-mnemonic.js';

dotenv.config();

const allowedUsers = new Set();
const BOT_PASSWORD = 'hunterai123';

const api = new TelegramBot({
  token: process.env.TELEGRAM_BOT_TOKEN
});

let isScanning = false;

api.on('message', async msg => {
  const chatId = msg.chat.id;
  const text = msg.text || '';

  if (text.startsWith('/login')) {
    const input = text.split(' ')[1];
    if (input === BOT_PASSWORD) {
      allowedUsers.add(chatId);
      api.sendMessage({ chat_id: chatId, text: '✅ Login berhasil!' });
    } else {
      api.sendMessage({ chat_id: chatId, text: '❌ Password salah.' });
    }
    return;
  }

  if (!allowedUsers.has(chatId)) {
    api.sendMessage({ chat_id: chatId, text: '❌ Kamu belum login. Gunakan /login [password].' });
    return;
  }

  if (text.startsWith('/startscan')) {
    const jumlah = parseInt(text.split(' ')[1]);
    if (!jumlah || jumlah <= 0) {
      api.sendMessage({ chat_id: chatId, text: 'Masukkan jumlah valid. Contoh: /startscan 1000' });
      return;
    }

    if (isScanning) {
      api.sendMessage({ chat_id: chatId, text: 'Scanner sudah berjalan.' });
      return;
    }

    isScanning = true;
    api.sendMessage({ chat_id: chatId, text: `Memulai scan ${jumlah} mnemonic...` });

    let found = 0;
    for (let i = 0; i < jumlah; i++) {
      const mnemonic = await generateMnemonicWithAI();
      const result = await checkMnemonic(mnemonic);

      if (result && result.balance > 0) {
        found++;
        const line = `${mnemonic} | ${result.address} | ${result.balance}\n`;
        fs.appendFileSync('found.txt', line);
        api.sendMessage({ chat_id: chatId, text: `✅ Ditemukan!\n${line}` });
      }

      if (i % 10 === 0) {
        api.sendMessage({ chat_id: chatId, text: `Progress: ${i + 1}/${jumlah}` });
      }
    }

    isScanning = false;
    api.sendMessage({ chat_id: chatId, text: `Selesai! Total mnemonic valid: ${found}` });
  }

  if (text.startsWith('/status')) {
    api.sendMessage({ chat_id: chatId, text: isScanning ? 'Scanner sedang berjalan...' : 'Scanner idle.' });
  }
});
