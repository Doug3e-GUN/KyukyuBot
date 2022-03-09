/**
 * @typedef {import('../../src/typedef.js').CommandContext} CommandContext
 * @typedef {import('../../src/typedef.js').InteractionContext} IContext
 */
import {COMMAND_PERM} from '../../src/typedef.js';
import {SlashCommandBuilder} from '@discordjs/builders';
import {ChannelType} from 'discord-api-types/v10';

export const canonName = 'admin.bot-channel';
export const name = 'bot-channel';
export const requireArgs = false;
export const commandPerm = COMMAND_PERM.ADMIN;
export const cooldown = 0;

import {getChannelId} from '../../utils/utils.js';

const SHOW_BOT_CHANNEL    = `commands.${canonName}.info-bot-channel`;
const NO_BOT_CHANNEL      = `commands.${canonName}.no-bot-channel`;
const ALREADY_BOT_CHANNEL = `commands.${canonName}.already-the-bot-channel`;
const SET_SUCCESS         = `commands.${canonName}.set-success`;
const UNSET_SUCCESS       = `commands.${canonName}.unset-success`;
const INVALID_COMMAND     = `messages.invalid-command`;
const viewFlags          = ['--view', '-v'];
const setFlags           = ['--set', '-s'];
const unsetFlags         = ['--unset', '-u'];

/**
 * @param {CommandContext|IContext} context
 * @return {object}
 */
export function getSlashData(context) {
  const {client, lang} = context;
  const {l10n} = client;

  const hint = l10n.s(lang, `commands.${canonName}.command-hint`);
  const viewHint = l10n.s(lang, `commands.${canonName}.view-hint`);
  const setHint = l10n.s(lang, `commands.${canonName}.set-hint`);
  const unsetHint = l10n.s(lang, `commands.${canonName}.unset-hint`);
  const channelHint = l10n.s(lang, `commands.${canonName}.channel-hint`);

  return new SlashCommandBuilder()
      .setName(name)
      .setDescription(hint)
      .addSubcommand((c) => c.setName('view').setDescription(viewHint))
      .addSubcommand((c) => c.setName('set').setDescription(setHint)
          .addChannelOption((option) => option
              .setName('channel')
              .setDescription(channelHint)
              .setRequired(true)
              .addChannelType(ChannelType.GuildText),
          ),
      )
      .addSubcommand((c) => c.setName('unset').setDescription(unsetHint),
      );
}

/**
 * @param {IContext} context
 * @return {boolean} - true if command is executed
 */
export async function slashExecute(context) {
  const {
    client,
    lang,
    guild,
    guildSettings,
    interaction,
  } = context;

  const {l10n} = client;
  const oldBotChannelId = guildSettings['bot-channel'] || null;

  let response;
  let result = false;

  if (context.hasAdminPermission) {
    const subCommand = interaction.options.getSubcommand();
    switch (subCommand) {
      case 'set':
        const newChannelId = interaction.options.getChannel('channel').id;
        const newChannelTag = `<#${newChannelId}>`;
        if (oldBotChannelId == newChannelId) { // already the bot channel
          response = l10n.t(
              lang, ALREADY_BOT_CHANNEL,
              '{CHANNEL}', newChannelTag,
          );
        } else { // set
          response = l10n.t(
              lang, SET_SUCCESS,
              '{CHANNEL}', newChannelTag,
          );
          client.updateGuildSettings(guild, 'bot-channel', newChannelId);
        }
        break;
      case 'unset':
        if (typeof oldBotChannelId == 'string') {
          response = l10n.t(
              lang, UNSET_SUCCESS,
              '{CHANNEL}', `<#${oldBotChannelId}>`,
          );
          client.updateGuildSettings(guild, 'bot-channel', '');
        } else {
          response = l10n.s(lang, NO_BOT_CHANNEL);
        }
        break;
      default:
        response =
          (oldBotChannelId)?
          l10n.t(lang, SHOW_BOT_CHANNEL, '{CHANNEL}', `<#${oldBotChannelId}>`):
          l10n.s(lang, NO_BOT_CHANNEL);
        result = true;
    }
    interaction.reply({content: response, ephemeral: true});
    result = false;
  } else {
    response = l10n.s(lang, NO_PERMISSION);
    interaction.reply({content: response, ephemeral: true});
  }
  return result;
}

/**
 * @param {CommandContext} context
 * @param {string|null} prevId
 * @param {string|null} newId
 * @return {boolean}
 */
function set(context, prevId, newId) {
  const {client, lang, guild, channel, message} = context;
  const l10n = client.l10n;
  let response;
  let result = false;

  if (newId) {
    if (prevId == newId) { // already the bot channel
      response = l10n.t(lang, ALREADY_BOT_CHANNEL, '{CHANNEL}', `<#${newId}>`);
    } else if (guild.channels.cache.get(newId)?.isText()) { // set
      response = l10n.t(lang, SET_SUCCESS, '{CHANNEL}', `<#${newId}>`);
      client.updateGuildSettings(guild, 'bot-channel', newId);
      result = true;
    } else { // invalid
      response = l10n.s(lang, INVALID_COMMAND);
    }
  } else {
    response = l10n.s(lang, INVALID_COMMAND);
  }

  channel.send({
    content: response, reply: {messageReference: message.id},
  });
  return result;
}

/**
 * @param {CommandContext} context
 * @param {string|null} prevId
 * @return {boolean}
 */
function unset(context, prevId) {
  const {client, lang, guild, channel, message} = context;
  const l10n = client.l10n;
  let response;
  let result = false;

  if (typeof prevId == 'string') {
    response = l10n.t(lang, UNSET_SUCCESS, '{CHANNEL}', `<#${prevId}>`);
    client.updateGuildSettings(guild, 'bot-channel', '');
    result = true;
  } else {
    response = l10n.s(lang, NO_BOT_CHANNEL);
  }

  channel.send({
    content: response, reply: {messageReference: message.id},
  });
  return result;
}

/**
 * @param {CommandContext} context
 * @param {string|null} prevId
 * @return {boolean}
 */
function view(context, prevId) {
  const {client, lang, channel, message} = context;
  const l10n = client.l10n;

  const response =
      (prevId)?
      l10n.t(lang, SHOW_BOT_CHANNEL, '{CHANNEL}', `<#${prevId}>`):
      l10n.s(lang, NO_BOT_CHANNEL);

  channel.send({
    content: response, reply: {messageReference: message.id},
  });
  return true;
}

/**
 * @param {CommandContext} context
 * @return {boolean} - true if command is executed
 */
export async function execute(context) {
  const {guildSettings, args} = context;
  const prevId = guildSettings['bot-channel'] || null;

  if (args.length == 0) return view(context, prevId);

  const firstArg = args[0].toLowerCase();

  if (viewFlags.includes(firstArg)) return view(context, prevId);
  if (unsetFlags.includes(firstArg)) return unset(context, prevId);
  if (setFlags.includes(firstArg) && (args.length > 1)) {
    const newId = getChannelId(args[1]);
    return set(context, prevId, newId);
  }
  return set(context, prevId, getChannelId(firstArg));
}
