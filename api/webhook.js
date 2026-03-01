// Felix Bot v5.0 - Full Version
import Groq from 'groq-sdk';
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8623255560:AAE7sC-7-eWA5LD-ebATDUh6nGUG0pYm03U';
const GROQ_API_KEY = process.env.GROQ_API_KEY || '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';
const groq = new Groq({ apiKey: GROQ_API_KEY });
const userProfiles = new Map();
const groupSettings = new Map();
const groupWarnings = new Map();