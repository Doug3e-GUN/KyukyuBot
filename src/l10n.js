/*
 * Localization helper class
 **/

import 'core-js/es/index.js';
import * as fs from 'fs';
import {resolve} from 'path';
import {Collection} from 'discord.js';
import {createFlattenedCollectionFromFiles} from '../utils/utils.js';

const HELP_DIR = resolve('help');

/** Localization class */
class L10N extends Collection {
  /**
   * Constructor
   * @param {null|Array} entries - Language
   * @param {string[]} filePaths -File paths (.json files)
   */
  constructor(entries) {
    super(entries);
    /**
     * Default (fallback) language
     * @type {string}
     */
    this.defaultLang = '';

    /**
     * Storage space for file paths of command files
     * @type {Collection}
     * @private
     */
    this.sources = new Collection();

    this.s = this.getResource; // function short-hand
  }

  /**
   * Load language files
   * @param {string} lang - Language
   * @param {string[]} filePaths -File paths (.json files)
   */
  loadLanguageFiles(lang, filePaths) {
    lang = String(lang).toLowerCase().trim();
    const data = createFlattenedCollectionFromFiles(filePaths);
    if (this.has(lang)) {
      const langCollection = this.get(lang).concat(data);
      const srcCollection = this.sources.get(lang).concat(filePaths);
      this.set(lang, langCollection);
      this.sources.set(lang, srcCollection);
    } else {
      this.set(lang, data);
      this.sources.set(lang, filePaths.slice());

      // If default language is not defined, then use the first
      // loaded language as the default language
      if (!this.defaultLang) this.defaultLang = lang;
    }
  }

  /**
   * Load language files
   * @param {string} lang - Language
   * @return {boolean} - Result (true if successful)
   */
  reloadLanguage(lang) {
    lang = String(lang).toLowerCase().trim();
    if (this.has(lang)) {
      const newCollection =
          createFlattenedCollectionFromFiles(this.sources.get(lang));
      this.set(lang, newCollection);
      return true;
    } else {
      return false;
    }
  }

  /**
   * Get content of a resource key
   * @param {string} lang - language
   * @param {string} resourceKey - resource key
   * @return {string} string template
   */
  getResource(lang, resourceKey) {
    const template =
      (this.get(lang)?.get(resourceKey)) ||
      (this.get(this.defaultLang).get(resourceKey)) ||
      undefined;
    return template;
  }

  /**
   * Get the canonical name from an alias
   * @param {string} lang - Language
   * @param {string} keyPath - Key path of the alias look-up array
   * @param {string} alias - Alias
   * @return {string}
   */
  getCanonicalName(lang, keyPath, alias) {
    alias = alias.toLowerCase();
    // keyPath = 'aliases.' + keyPath;
    let searchArray = this.get(lang)?.get(keyPath);
    if (searchArray) {
      const found = searchArray.find((el)=>el.includes(alias));
      if (found) return found[0];
    }
    if (lang == this.defaultLang) return '';
    searchArray = this.get(this.defaultLang)?.get(keyPath);
    if (searchArray) {
      const found = searchArray.find((el)=>el.includes(alias));
      if (found) return found[0];
    }
    return '';
  }

  /**
   * Translate from a string template
   * @param {string} lang - language
   * @param {string} resourceKey - Resource key of the string template
   * @param {string[]} strings
   * @return {string} translated string
   */
  t(lang, resourceKey, ...strings) {
    // try to get the string template
    const template = this.getResource(lang, resourceKey);

    if (typeof template == 'undefined') return '';
    return this.r(template, ...strings);
  }

  /**
   * Replace strings in a template
   * @param {string} template - string template
   * @param {string[]} strings
   * @return {string} resultant string
   */
  r(template, ...strings) {
    let result = template;
    const args = [].slice.call(strings);
    for (let i = 0; i < args.length; i=i+2) {
      result = result.replaceAll(args[i], args[i+1]);
    }
    return result;
  }

  /**
   * Join a list
   * @param {string} lang - language
   * @param {string[]} source - source array
   * @return {string} list of strings separated by delimiters
   */
  join(lang, source) {
    return source.join(this.getResource(lang, 'delimiter'));
  }

  /**
   * Get command help text
   * @param {string} lang -Language
   * @param {string} cmdName -Canonical command name
   * @return {string|undefined}
   */
  getCommandHelp(lang, cmdName) {
    let helpFilePath;

    helpFilePath = resolve(HELP_DIR, lang, cmdName + '.md');
    if (fs.existsSync(helpFilePath)) {
      return fs.readFileSync(helpFilePath, 'utf8');
    }

    helpFilePath = resolve(HELP_DIR, lang, cmdName + '.txt');
    if (fs.existsSync(helpFilePath)) {
      return '```' + fs.readFileSync(helpFilePath, 'utf8') + '```';
    }

    if (lang == this.defaultLang) return undefined;

    helpFilePath = resolve(HELP_DIR, this.defaultLang, cmdName + '.md');
    if (fs.existsSync(helpFilePath)) {
      return fs.readFileSync(helpFilePath, 'utf8');
    }

    helpFilePath = resolve(HELP_DIR, this.defaultLang, cmdName + '.txt');
    if (fs.existsSync(helpFilePath)) {
      return '```' + fs.readFileSync(helpFilePath, 'utf8') + '```';
    }

    return undefined;
  }
}

export default L10N;
