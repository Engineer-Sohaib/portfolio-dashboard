export function closeAllCardMenus() {
  document.querySelectorAll('.pa-card-menu.open').forEach((m) => m.classList.remove('open'));
}

/**
 * Toggle one card's menu open, closing any other open menu first.
 * @param {HTMLElement} menu
 */
export function toggleCardMenu(menu) {
  const isOpen = menu.classList.contains('open');
  closeAllCardMenus();
  if (!isOpen) menu.classList.add('open');
}
