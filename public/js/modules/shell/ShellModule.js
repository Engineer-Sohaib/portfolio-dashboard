import { Module } from '../../core/Module.js';
import { $id } from '../../utils/dom.js';
import { PAGE, getLoginPath } from '../../core/router.js';
import { eventBus } from '../../core/EventBus.js';
import { renderNotifications, clearNotifications } from './notifications.js';
import { showToast } from './toast.js';
import { closeConfirm, isConfirmOpen, initConfirmDialog } from './confirm.js';
import { anyPanelOpen, closePanels } from './panels.js';
import { closeAllCardMenus } from './cardMenu.js';
import { CustomizationModule } from './CustomizationModule.js';

const KNOWN_NAV_LABELS = [
  'Projects', 'Categories', 'Technologies', 'Media Library', 'Testimonials',
  'Blog Posts', 'Experience', 'Dashboard', 'Contact Messages',
];

export class ShellModule extends Module {
  constructor() {
    super({ name: 'Shell' });
    this.customization = new CustomizationModule();
  }

  async init() {
    await this.customization.init();
    renderNotifications();
    initConfirmDialog();
    this.bindEvents();
  }

  bindEvents() {
    const sidebar = $id('paSidebar');
    const overlay = $id('paSidebarOverlay');
    const toggle = $id('paMobileToggle');

    const closeMobileSidebar = () => {
      sidebar?.classList.remove('mobile-open');
      overlay?.classList.remove('visible');
    };
    this._closeMobileSidebar = closeMobileSidebar;

    this.on(toggle, 'click', () => {
      sidebar?.classList.add('mobile-open');
      overlay?.classList.add('visible');
    });
    this.on(overlay, 'click', closeMobileSidebar);

    document.querySelectorAll('.pa-nav-item').forEach((item) => {
      this.on(item, 'click', (e) => {
        const href = item.getAttribute('href');
        if (href === '#') e.preventDefault();
        document.querySelectorAll('.pa-nav-item').forEach((i) => i.classList.remove('active'));
        item.classList.add('active');
        const label = item.dataset.nav;
        if (label && !KNOWN_NAV_LABELS.includes(label)) {
          showToast(`"${label}" section is not implemented in this demo`, 'info');
        }
        closeMobileSidebar();
      });
    });

    const userMenu = $id('paUserMenu');
    this._userMenu = userMenu;
    if (userMenu) {
      this.on(userMenu, 'click', (e) => {
        e.stopPropagation();
        userMenu.classList.toggle('open');
      });
      userMenu.querySelectorAll('.pa-user-dropdown-item').forEach((item) => {
        this.on(item, 'click', (e) => {
          e.stopPropagation();
          const spec = item.dataset.toast;
          if (spec) {
            const [type, msg] = spec.split(':');
            showToast(msg, type);
          }
          userMenu.classList.remove('open');
        });
      });
    }

    const logoutBtn = $id('paLogoutBtn');
    if (logoutBtn) {
      this.on(logoutBtn, 'click', () => this.handleLogout());
    }

    const notifWrap = $id('paNotifWrap');
    const notifBtn = $id('paNotifBtn');
    this._notifWrap = notifWrap;
    if (notifBtn && notifWrap) {
      this.on(notifBtn, 'click', (e) => {
        e.stopPropagation();
        notifWrap.classList.toggle('open');
      });
      this.on(notifBtn, 'keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          notifWrap.classList.toggle('open');
        }
      });
      this.on($id('paNotifClearBtn'), 'click', (e) => {
        e.stopPropagation();
        clearNotifications();
        showToast('Notifications cleared', 'info', 1800);
      });
    }

    this.on(document, 'click', (e) => {
      if (userMenu && !userMenu.contains(e.target)) userMenu.classList.remove('open');
      if (notifWrap && !notifWrap.contains(e.target)) notifWrap.classList.remove('open');
      if (!e.target.closest('.pa-card-actions')) closeAllCardMenus();
    });

    this.on(document, 'keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        const search = $id('paSearchInput') || $id('paCatSearchInput');
        search?.focus();
      }
      if (e.key === 'Escape') {
        if (isConfirmOpen()) {
          closeConfirm();
        } else if ($id('paBulkConfirmOverlay')?.classList.contains('visible')) {
          eventBus.emit('bulk-confirm:close');
        } else if (anyPanelOpen()) {
          closePanels();
        } else {
          closeAllCardMenus();
          userMenu?.classList.remove('open');
          notifWrap?.classList.remove('open');
          closeMobileSidebar();
        }
      }
      if (
        e.key.toLowerCase() === 'n' &&
        !anyPanelOpen() &&
        !document.activeElement.matches('input, textarea, select, [contenteditable]')
      ) {
        eventBus.emit('shortcut:new-item', { page: PAGE });
      }
    });
  }

  handleLogout() {
    const confirmOverlay = $id('paConfirmOverlay');
    const confirmText = $id('paConfirmText');
    const confirmTitle = $id('paConfirmTitle');
    const confirmOk = $id('paConfirmOk');
    const confirmCancel = $id('paConfirmCancel');

    if (confirmOverlay && confirmText) {
      if (confirmTitle) confirmTitle.textContent = 'Logout?';
      confirmText.innerHTML = 'Are you sure you want to logout? You will need to sign in again to access the admin panel.';
      confirmOk.innerHTML = 'Logout';
      confirmOverlay.classList.add('visible');
      const performLogout = () => {
        confirmOverlay.classList.remove('visible');
        showToast('Logging out...', 'info', 1500);
        setTimeout(() => {
          window.location.href = getLoginPath();
        }, 800);
      };

      const newConfirmOk = confirmOk.cloneNode(true);
      const newConfirmCancel = confirmCancel.cloneNode(true);
      
      if (confirmOk && confirmOk.parentNode) {
        confirmOk.parentNode.replaceChild(newConfirmOk, confirmOk);
        this.on(newConfirmOk, 'click', performLogout);
      }
      
      if (confirmCancel && confirmCancel.parentNode) {
        confirmCancel.parentNode.replaceChild(newConfirmCancel, confirmCancel);
        this.on(newConfirmCancel, 'click', () => {
          confirmOverlay.classList.remove('visible');
          showToast('Logout cancelled', 'info', 1500);
        });
      }

      this.on(confirmOverlay, 'click', (e) => {
        if (e.target === confirmOverlay) {
          confirmOverlay.classList.remove('visible');
          showToast('Logout cancelled', 'info', 1500);
        }
      });

    } else {
      if (confirm('Are you sure you want to logout?')) {
        showToast('Logging out...', 'info');
        setTimeout(() => {
          window.location.href = getLoginPath();
        }, 500);
      }
    }
  }

  destroy() {
    this.customization.destroy();
    super.destroy();
  }
}