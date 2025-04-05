import { Configuration, OpenAI } from 'openai';
import bip39 from 'bip39';
import fetch from 'node-fetch';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function generateMnemonicWithAI() {
  try {
    const prompt = `Generate a 12-word BIP39 mnemonic phrase separated by spaces.`;
    const res = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: 'user', content: prompt }]
    });

    const text = res.choices[0].message.content.trim();
    const mnemonic = text.split(/\n/)[0].trim();
    return mnemonic;
  } catch (err) {
    console.error("AI generation error:", err);
    return bip39.generateMnemonic(); // fallback
  }
}

export async function checkMnemonic(mnemonic) {
  const seed = await bip39.mnemonicToSeed(mnemonic);
  const address = await getEthAddressFromSeed(seed);

  const res = await fetch(`https://api.ethplorer.io/getAddressInfo/${address}?apiKey=freekey`);
  const json = await res.json();

  const balance = json.ETH && json.ETH.balance ? json.ETH.balance : 0;
  return { address, balance };
}

async function getEthAddressFromSeed(seed) {
  const { hdkey } = await import('ethereumjs-wallet');
  const hdwallet = hdkey.fromMasterSeed(seed);
  const wallet = hdwallet.derivePath("m/44'/60'/0'/0/0").getWallet();
  return '0x' + wallet.getAddress().toString('hex');
}
