import { $id } from '../../utils/dom.js';

const registeredPanelIds = new Set();

export function registerPanel(id) {
  registeredPanelIds.add(id);
}

export function anyPanelOpen() {
  return Array.from(registeredPanelIds).some((id) => $id(id)?.classList.contains('visible'));
}

export function closePanels() {
  $id('paPanelOverlay')?.classList.remove('visible');
  registeredPanelIds.forEach((id) => $id(id)?.classList.remove('visible'));
}

/**
 * Show one panel (and the shared overlay), hiding any other panel passed in
 * `hidePanelIds` first (typically its Add/Edit sibling).
 * @param {string} panelId
 * @param {string[]} [hidePanelIds]
 */
export function openPanel(panelId, hidePanelIds = []) {
  hidePanelIds.forEach((id) => $id(id)?.classList.remove('visible'));
  $id('paPanelOverlay')?.classList.add('visible');
  $id(panelId)?.classList.add('visible');
}

export function setButtonLoading(btnId, loading) {
  const btn = $id(btnId);
  if (!btn) return;
  btn.classList.toggle('loading', loading);
  btn.disabled = loading;
}

export function activateTab(panel, tab) {
  document.querySelectorAll(`.pa-panel-tab[data-panel="${panel}"]`).forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.tab === tab);
  });
  document.querySelectorAll(`.pa-tab-panel[data-panel="${panel}"]`).forEach((pane) => {
    pane.classList.toggle('active', pane.dataset.content === tab);
  });
  const panelId = document.querySelector(`.pa-panel[data-panel="${panel}"]`)?.id;
  const body = panelId ? document.querySelector(`#${panelId} .pa-panel-body`) : null;
  if (body) body.scrollTop = 0;
}
