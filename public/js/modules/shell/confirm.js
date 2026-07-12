import { $id } from '../../utils/dom.js';
import { eventBus } from '../../core/EventBus.js';
import { closePanels } from './panels.js';

let pendingId = null;
let pendingType = null;

let pendingBulkConfirm = null;
let bulkTitleBackup = null;

/**
 * Open the confirm dialog.
 * @param {string|number} id
 * @param {string} type Matches the `type` a module listens for on `confirm:confirmed`.
 * @param {string} name Display name interpolated into the confirmation copy.
 * @param {string} [extraInfo] Extra sentence appended (e.g. "This category has 3 projects.").
 */
export function requestDelete(id, type, name, extraInfo = '') {
  pendingId = id;
  pendingType = type;
  let text = `This will permanently remove <strong>${name}</strong>.`;
  if (extraInfo) text += ` ${extraInfo}`;
  text += ' This action cannot be undone.';
  const textEl = $id('paConfirmText');
  if (textEl) textEl.innerHTML = text;
  $id('paConfirmOverlay')?.classList.add('visible');
}

/**
 * Open the same shared confirm dialog for a bulk (multi-item) delete.
 * Used by {@link BulkSelectController} so every page's "Delete Selected"
 * action reuses `#paConfirmOverlay` instead of needing its own bulk dialog.
 * @param {object} opts
 * @param {string} [opts.title] Temporarily replaces the dialog title; restored on close.
 * @param {string} opts.message HTML for the confirmation copy.
 * @param {() => void} opts.onConfirm Called once the user confirms.
 */
export function requestBulkAction({ title, message, onConfirm }) {
  pendingBulkConfirm = onConfirm;
  const titleEl = $id('paConfirmTitle');
  const textEl = $id('paConfirmText');
  if (titleEl && title) {
    if (bulkTitleBackup === null) bulkTitleBackup = titleEl.textContent;
    titleEl.textContent = title;
  }
  if (textEl) textEl.innerHTML = message;
  $id('paConfirmOverlay')?.classList.add('visible');
}

function restoreBulkTitle() {
  if (bulkTitleBackup !== null) {
    const titleEl = $id('paConfirmTitle');
    if (titleEl) titleEl.textContent = bulkTitleBackup;
    bulkTitleBackup = null;
  }
}

export function closeConfirm() {
  $id('paConfirmOverlay')?.classList.remove('visible');
  pendingId = null;
  pendingType = null;
  if (pendingBulkConfirm) {
    pendingBulkConfirm = null;
    restoreBulkTitle();
  }
}

function performDelete() {
  if (pendingBulkConfirm) {
    const cb = pendingBulkConfirm;
    pendingBulkConfirm = null;
    $id('paConfirmOverlay')?.classList.remove('visible');
    restoreBulkTitle();
    cb();
    return;
  }
  if (pendingId == null || pendingType == null) return;
  const { id, type } = { id: pendingId, type: pendingType };
  closeConfirm();
  closePanels();
  eventBus.emit('confirm:confirmed', { id, type });
}

export function initConfirmDialog() {
  $id('paConfirmCancel')?.addEventListener('click', closeConfirm);
  $id('paConfirmOk')?.addEventListener('click', performDelete);
  $id('paConfirmOverlay')?.addEventListener('click', (e) => {
    if (e.target.id === 'paConfirmOverlay') closeConfirm();
  });
}

export function isConfirmOpen() {
  return !!$id('paConfirmOverlay')?.classList.contains('visible');
}
