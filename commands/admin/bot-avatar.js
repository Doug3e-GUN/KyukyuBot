/**
* @typedef {import('../../src/typedef.js').CommandContext} CommandContext
*/
import {COMMAND_TYPE} from '../../src/typedef.js';

export const canonName = 'admin.bot-avatar';
export const name = 'bot-avatar';
export const requireArgs = false;
export const commandType = COMMAND_TYPE.ADMIN;
export const cooldown = 0;

const COMMAND_SUCCESS     = `commands.${canonName}.success`;
const COMMAND_ERROR       = `commands.${canonName}.error`;

const IMAGE_CT = ['image/jpeg', 'image/gif', 'image/png'];

/**
 * @param {CommandContext} context
 * @return {boolean} - true if command is executed
 */
export async function execute(context) {
  const {client, lang, channel} = context;
  const attachments = context.message.attachments;
  if (attachments.size) {
    const file = context.message.attachments.first();
    console.log(file.contentType);
    if (IMAGE_CT.indexOf(file.contentType.toLowerCase()) !== -1) {
      try {
        await context.client.user.setAvatar(file.url);
        channel.send(client.l10n.s(lang, COMMAND_SUCCESS));
        return true;
      } catch (error) {
        channel.send(client.l10n.s(lang, COMMAND_ERROR));
        throw error;
      }
    } else {
      channel.send(client.l10n.s(lang, COMMAND_ERROR));
      throw new Error('Attachment is not an image');
    }
  }
  return false;
}