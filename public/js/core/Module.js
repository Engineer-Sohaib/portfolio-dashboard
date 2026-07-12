import { eventBus } from './EventBus.js';
import { storage } from './StorageService.js';
import { StateStore } from './StateStore.js';
import { $, $all } from '../utils/dom.js';
import { showToast } from '../modules/shell/toast.js';
import { addNotification } from '../modules/shell/notifications.js';

/**
 * Module — base class every feature module (Projects, Categories, …) extends.
 *
 * Standardizes:
 *  - `storageKey` -> automatic load/save through {@link StorageService}.
 *  - a {@link StateStore} instance (`this.store`) for reactive local state.
 *  - DOM helpers scoped to `document` (`$`, `$all`) plus `on()` for listener
 *    registration that is auto-removed in `destroy()`.
 *  - `init() -> load() -> render() -> bindEvents()` as the standard startup
 *    sequence, invoked by the router in `main.js`.
 *  - `destroy()` for SPA-style teardown (unsubscribes bus + DOM listeners).
 *
 * Subclasses typically override: `seedData()`, `render()`, `bindEvents()`,
 * and any CRUD-specific methods.
 */
export class Module {
  /**
   * @param {object} opts
   * @param {string} opts.name Human-readable module name, used in logs.
   * @param {string} [opts.storageKey] localStorage/IndexedDB key for this module's records.
   * @param {object} [opts.initialState] seed for this.store
   */
  constructor({ name, storageKey = null, initialState = {} } = {}) {
    this.name = name || this.constructor.name;
    this.storageKey = storageKey;
    this.store = new StateStore(initialState);
    this._domListeners = [];
    this._destroyed = false;
    this.log(`constructed`);
  }

  async init() {
    this.log('init');
    await this.load();
    this.render();
    this.bindEvents();
  }

  async load() {}

  render() {}
  bindEvents() {}
  destroy() {
    if (this._destroyed) return;
    this._domListeners.forEach(({ el, type, handler, options }) => {
      el.removeEventListener(type, handler, options);
    });
    this._domListeners = [];
    eventBus.unsubscribeAll(this);
    this._destroyed = true;
    this.log('destroyed');
  }

  /**
   * Load this module's records from storage, falling back to `seedFn()`
   * (typically a function returning a copy of seed/demo data) when nothing
   * is persisted yet.
   * @param {() => any} seedFn
   */
  async loadRecords(seedFn) {
    if (!this.storageKey) throw new Error(`${this.name}: loadRecords() requires storageKey`);
    const value = await storage.get(this.storageKey, null);
    if (value !== null) return value;
    return seedFn();
  }

  async saveRecords(data) {
    if (!this.storageKey) throw new Error(`${this.name}: saveRecords() requires storageKey`);
    try {
      await storage.set(this.storageKey, data);
    } catch (err) {
      this.logError('save failed', err);
      showToast(`Could not save ${this.name.toLowerCase()}: storage quota exceeded.`, 'danger');
    }
  }

  $(selector, scope = document) {
    return $(selector, scope);
  }

  $all(selector, scope = document) {
    return $all(selector, scope);
  }

  /**
   * Add a DOM listener that is automatically removed in `destroy()`.
   * @param {EventTarget|null} el
   * @param {string} type
   * @param {Function} handler
   * @param {boolean|AddEventListenerOptions} [options]
   */
  on(el, type, handler, options) {
    if (!el) return;
    el.addEventListener(type, handler, options);
    this._domListeners.push({ el, type, handler, options });
  }

  onBus(event, handler) {
    eventBus.on(event, handler, { owner: this });
  }

  emit(event, payload) {
    eventBus.emit(event, payload);
  }

  toast(msg, type = 'info', duration) {
    showToast(msg, type, duration);
  }

  notify(text, icon) {
    addNotification(text, icon);
  }

  log(...args) {
  }

  logError(...args) {
    console.error(`[${this.name}]`, ...args);
  }
}
