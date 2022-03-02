import 'core-js/es/index.js';
import {existsSync, readFileSync} from 'fs';
import {resolve, dirname} from 'path';
import {getFilesFromDir} from './utils/utils.js';
import Client from './src/client.js';

import {DEFAULT_CONFIG} from './src/const.js';

const __dirname = resolve();
global.__basedir = __dirname;

const CLIENT_CONFIG_FILE = './app.json';

/**
 * @typedef {import('./src/typedef.js').ClientConfig} ClientConfig
 * @typedef {import('./src/typedef.js').CommandContext} CommandContext
 * @typedef {import('discord.js').Guild} Guild
 */

// Full file path of the client config file
const configFilePath =
  resolve(process.argv.slice(2)?.[0] || CLIENT_CONFIG_FILE);

if (!existsSync(configFilePath)) {
  throw new Error(`Config file not found: ${configFilePath}`);
}

const userConfig = JSON.parse(readFileSync(configFilePath, 'utf8'));

const clientToken =
    userConfig?.['login-token']?.value?.trim() ||
    process.env.DISCORD_TOKEN;

if (!clientToken) throw new Error('Login token unknown');

/** @type ClientConfig */
const clientConfig = {};

Object.keys(DEFAULT_CONFIG).forEach((property) => {
  clientConfig[property] =
      userConfig?.[property]?.value?.trim() ||
      defaultConfig[property];
});

if (clientConfig['client-data-path']) { // Convert to absolute file path
  clientConfig['client-data-path'] = resolve(
      dirname(configFilePath),
      clientConfig['client-data-path'],
  );
}

const client = new Client(clientConfig);

// Load language files
/** @type {Object.<string, string>} */
const l10nDirectories = {
  'en': './locales/en',
  'zh-tw': './locales/zh-tw',
};
for (const [lang, dir] of Object.entries(l10nDirectories)) {
  client.l10n.loadLanguageFiles(
      lang, getFilesFromDir(resolve(__dirname, dir), ['.json'], 3),
  );
}

const commandDirectories = [
  './commands/admin',
  './commands/owner',
  './commands/general',
];

commandDirectories.forEach((dir) => {
  client.commands.loadCommandFiles(
      getFilesFromDir(resolve(__dirname, dir), ['.js'], 3),
  );
});

client.ready();
client.login(clientToken);

import {REST} from '@discordjs/rest';
import {Routes} from 'discord-api-types/v9';

/**
 * @param {CommandContext} context
 * @return {boolean} - true if command is executed
 */
export async function deploy(context) {
  const {guild} = context;

  const clientId = client.application.id;
  const guildId = guild.id;

  const pendingData = [];

  client.commands.forEach((cmd) => {
    if (cmd.getSlashData) {
      const data = cmd.getSlashData(context);
      pendingData.push(data);
    }
  });

  const rest = new REST({version: '9'}).setToken(clientToken);

  await rest.put(
      Routes.applicationGuildCommands(clientId, guildId),
      {body: pendingData},
  );
  return true;
}
