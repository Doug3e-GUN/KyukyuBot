/**
 * @typedef {import('../../src/typedef.js').CommandContext} CommandContext
 * @typedef {import('discord.js').GuildMember} GuildMember
 */

import {COMMAND_PERM} from '../../src/typedef.js';
import {ContextMenuCommandBuilder} from '@discordjs/builders';

export const canonName = 'general.avatar';
export const name = 'avatar';
export const requireArgs = false;
export const commandPerm = COMMAND_PERM.GENERAL;
export const cooldown = 30;

import {getUserId} from '../../utils/utils.js';

const EMBED_TITLE          = `commands.${canonName}.embed-title`;

/**
 * @param {CommandContext|IContext} context
 * @return {ContextMenuCommandBuilder}
 */
export function getSlashData(context) {
  return new ContextMenuCommandBuilder().setName(name).setType(2);
}

/**
 * @param {IContext} context
 * @return {boolean} - true if command is executed
 */
export async function slashExecute(context) {
  const {client, guild, lang, interaction} = context;
  const {l10n} = client;
  const {targetId} = interaction;

  const member = guild.members.cache.get(targetId);

  interaction.reply({
    'embeds': [{
      'title': l10n.t(
          lang, EMBED_TITLE, '{USER NAME}', member.displayName),
      'image': {'url': member.user.avatarURL()},
    }],
  });

  return true;
}

/**
 * @param {CommandContext} context
 * @param {string|null} userMention
 * @return {GuildMember}
 */
export function getMember(context, userMention) {
  const {guild, user} = context;
  const userId = getUserId(userMention);
  if (userId) {
    const member = guild.members.cache.get(userId);
    if (member) return member;
  }
  return guild.members.cache.get(user.id);
}

/**
 * @param {CommandContext} context
 * @return {Promise<Discord.Message>}
 */
export async function execute(context) {
  const {client, channel, lang, args} = context;
  const l10n = client.l10n;

  /** @type {GuildMember} */ const member = getMember(context, args[0] || '');
  /** @type {string} */ const avatarUrl = member.user.avatarURL();

  channel.send({
    'embeds': [{
      'title': l10n.t(
          lang, EMBED_TITLE, '{USER NAME}', member.displayName),
      'image': {'url': avatarUrl},
    }],
  });

  return true;
}
