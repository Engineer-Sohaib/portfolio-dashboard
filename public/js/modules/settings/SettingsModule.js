import { Module } from '../../core/Module.js';
import { $id, $all } from '../../utils/dom.js';
import { showToast } from '../shell/toast.js';
import { addNotification } from '../shell/notifications.js';

export class SettingsModule extends Module {
  constructor() {
    super({
      name: 'Settings',
      storageKey: 'pa_settings',
      initialState: {
        activeTab: 'general',
      },
    });
  }

  async load() {
    const saved = await this.loadRecords(() => ({
      siteTitle: 'My Portfolio',
      siteTagline: 'Building digital experiences that matter',
    }));
    this.store.set('settings', saved);
  }

  render() {
    this.syncUI();
  }

  bindEvents() {
    const tabButtons = document.querySelectorAll('.pa-view-btn[data-tab]');
    tabButtons.forEach((btn) => {
      this.on(btn, 'click', () => {
        const tab = btn.dataset.tab;
        this.switchTab(tab);
      });
    });

    const saveGeneralBtn = document.querySelector('[data-save="general"]');
    if (saveGeneralBtn) {
      this.on(saveGeneralBtn, 'click', () => this.saveGeneralSettings());
    }

    const saveOtherBtn = document.querySelector('[data-save="other"]');
    if (saveOtherBtn) {
      this.on(saveOtherBtn, 'click', () => this.saveOtherSettings());
    }

    const saveSecurityBtn = document.querySelector('[data-save="security"]');
    if (saveSecurityBtn) {
      this.on(saveSecurityBtn, 'click', () => this.updatePassword());
    }

    const saveNotificationsBtn = document.querySelector('[data-save="notifications"]');
    if (saveNotificationsBtn) {
      this.on(saveNotificationsBtn, 'click', () => this.saveNotificationPreferences());
    }

    const profileSaveBtn = $id('profileSaveBtn');
    if (profileSaveBtn) {
      this.on(profileSaveBtn, 'click', () => this.saveProfile());
    }

    const fullNameInput = $id('profileFullName');
    if (fullNameInput) {
      this.on(fullNameInput, 'input', (e) => {
        const preview = $id('previewName');
        if (preview) preview.textContent = e.target.value || 'Admin User';
      });
    }

    const usernameInput = $id('profileUsername');
    if (usernameInput) {
      this.on(usernameInput, 'input', (e) => {
        const preview = $id('previewUsername');
        if (preview) preview.textContent = '@' + (e.target.value || 'adminuser');
      });
    }

    const bioInput = $id('profileBio');
    if (bioInput) {
      this.on(bioInput, 'input', (e) => {
        const preview = $id('previewBio');
        if (preview) preview.textContent = e.target.value || 'No bio yet';
      });
    }

    const locationInput = $id('profileLocation');
    if (locationInput) {
      this.on(locationInput, 'input', (e) => {
        const preview = $id('previewLocation');
        if (preview) preview.textContent = e.target.value || 'Not set';
      });
    }

    const websiteInput = $id('profileWebsite');
    if (websiteInput) {
      this.on(websiteInput, 'input', (e) => {
        const preview = $id('previewWebsite');
        if (preview) preview.textContent = e.target.value || 'Not set';
      });
    }

    const coverUpload = $id('coverUpload');
    const coverFileInput = $id('coverFileInput');
    if (coverUpload && coverFileInput) {
      this.on(coverUpload, 'click', () => coverFileInput.click());
      this.on(coverFileInput, 'change', (e) => {
        const file = e.target.files?.[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (ev) => {
            const coverImage = $id('coverImage');
            if (coverImage) coverImage.src = ev.target.result;
            showToast('Cover image uploaded successfully!', 'success');
          };
          reader.readAsDataURL(file);
        }
        coverFileInput.value = '';
      });
    }

    const viewProfileBtn = $id('viewPublicProfile');
    if (viewProfileBtn) {
      this.on(viewProfileBtn, 'click', () => {
        showToast('Opening public profile in new tab...', 'info');
        window.open('#', '_blank');
      });
    }

    const addSocialBtn = $id('addSocialBtn');
    if (addSocialBtn) {
      this.on(addSocialBtn, 'click', () => this.addSocialLink());
    }

    const container = $id('socialLinksContainer');
    if (container) {
      this.on(container, 'click', (e) => {
        const removeBtn = e.target.closest('.pa-social-remove');
        if (removeBtn) {
          const group = removeBtn.closest('.pa-social-group');
          if (group && container.children.length > 1) {
            group.remove();
            showToast('Social link removed', 'info');
          } else {
            showToast('You need at least one social link', 'info');
          }
        }
      });
    }

    const updatePasswordBtn = $id('updatePasswordBtn');
    if (updatePasswordBtn) {
      this.on(updatePasswordBtn, 'click', () => this.updatePassword());
    }

    const disable2faBtn = $id('disable2faBtn');
    if (disable2faBtn) {
      this.on(disable2faBtn, 'click', () => {
        showToast('2FA has been disabled', 'success');
        const badge = document.querySelector('.pa-badge');
        if (badge) {
          badge.innerHTML = '<i class="ri-close-line"></i> Disabled';
          badge.style.background = 'var(--pa-red-dim)';
          badge.style.color = 'var(--pa-red)';
        }
      });
    }

    const setup2faBtn = $id('setup2faBtn');
    if (setup2faBtn) {
      this.on(setup2faBtn, 'click', () => {
        showToast('Opening 2FA setup wizard...', 'info');
      });
    }

    const logoutAllBtn = $id('logoutAllBtn');
    if (logoutAllBtn) {
      this.on(logoutAllBtn, 'click', () => {
        showToast('Logged out of all devices except this one', 'success');
        addNotification('Logged out of all other devices', 'ri-shield-check-line');
      });
    }

    const refreshSessionsBtn = $id('refreshSessionsBtn');
    if (refreshSessionsBtn) {
      this.on(refreshSessionsBtn, 'click', () => {
        showToast('Sessions refreshed', 'info');
      });
    }

    const logoutAllDevicesBtn = $id('logoutAllDevicesBtn');
    if (logoutAllDevicesBtn) {
      this.on(logoutAllDevicesBtn, 'click', () => {
        showToast('Logged out of all devices', 'success');
      });
    }

    const deleteAccountBtn = $id('deleteAccountBtn');
    if (deleteAccountBtn) {
      this.on(deleteAccountBtn, 'click', () => {
        if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
          showToast('Account deletion request submitted', 'danger');
        }
      });
    }

    const saveQuietHours = $id('saveQuietHours');
    if (saveQuietHours) {
      this.on(saveQuietHours, 'click', () => {
        showToast('Quiet hours saved successfully!', 'success');
      });
    }

    const sendTestNotification = $id('sendTestNotification');
    if (sendTestNotification) {
      this.on(sendTestNotification, 'click', () => {
        addNotification('This is a test notification from your settings!', 'ri-notification-3-line');
        showToast('Test notification sent!', 'success');
      });
    }

    const connectButtons = ['githubConnectBtn', 'slackConnectBtn', 'zapierConnectBtn', 'webhookConnectBtn'];
    connectButtons.forEach((id) => {
      const btn = $id(id);
      if (btn) {
        this.on(btn, 'click', () => {
          const name = btn.id.replace('ConnectBtn', '');
          showToast(`Connecting to ${name}...`, 'info');
          setTimeout(() => {
            showToast(`Successfully connected to ${name}!`, 'success');
            const item = btn.closest('.pa-integration-item');
            if (item) {
              const statusEl = item.querySelector('.pa-int-status');
              if (statusEl) {
                statusEl.textContent = 'Connected';
                statusEl.style.background = 'var(--pa-green-dim)';
                statusEl.style.color = 'var(--pa-green)';
              }
              const actions = item.querySelector('.pa-int-actions');
              if (actions) {
                actions.innerHTML = `
                  <button class="pa-btn-sm primary">Configure</button>
                  <button class="pa-btn-sm danger">Disconnect</button>
                `;
                const configureBtn = actions.querySelector('.pa-btn-sm.primary');
                if (configureBtn) {
                  this.on(configureBtn, 'click', () => {
                    showToast(`Configuring ${name}...`, 'info');
                  });
                }
                const disconnectBtn = actions.querySelector('.pa-btn-sm.danger');
                if (disconnectBtn) {
                  this.on(disconnectBtn, 'click', () => {
                    showToast(`Disconnected from ${name}`, 'danger');
                    statusEl.textContent = 'Disconnected';
                    statusEl.style.background = 'var(--pa-red-dim)';
                    statusEl.style.color = 'var(--pa-red)';
                  });
                }
              }
            }
          }, 1500);
        });
      }
    });

    document.querySelectorAll('.pa-integration-item .pa-int-actions').forEach((actions) => {
      const configBtn = actions.querySelector('.pa-btn-sm.primary');
      const disconnectBtn = actions.querySelector('.pa-btn-sm.danger');
      const item = actions.closest('.pa-integration-item');
      const nameEl = item?.querySelector('.pa-int-name');
      const name = nameEl?.textContent || 'Integration';

      if (configBtn) {
        this.on(configBtn, 'click', () => {
          showToast(`Configuring ${name}...`, 'info');
        });
      }

      if (disconnectBtn) {
        this.on(disconnectBtn, 'click', () => {
          const statusEl = item?.querySelector('.pa-int-status');
          if (statusEl) {
            statusEl.textContent = 'Disconnected';
            statusEl.style.background = 'var(--pa-red-dim)';
            statusEl.style.color = 'var(--pa-red)';
          }
          showToast(`Disconnected from ${name}`, 'danger');
        });
      }
    });

    document.querySelectorAll('.pa-toggle-switch input[type="checkbox"]').forEach((checkbox) => {
      this.on(checkbox, 'change', (e) => {
        const label = checkbox.closest('.pa-toggle-wrap')?.querySelector('.pa-toggle-label');
        const state = e.target.checked ? 'enabled' : 'disabled';
        if (label) {
          showToast(`${label.textContent} ${state}`, 'info');
        }
      });
    });

    const docButtons = ['viewDocsBtn', 'viewDocsBtn2', 'manageDataAccessBtn', 'revokeAccessBtn'];
    docButtons.forEach((id) => {
      const btn = $id(id);
      if (btn) {
        this.on(btn, 'click', () => {
          if (id === 'viewDocsBtn' || id === 'viewDocsBtn2') {
            showToast('Opening documentation...', 'info');
          } else if (id === 'manageDataAccessBtn') {
            showToast('Opening data access settings...', 'info');
          } else if (id === 'revokeAccessBtn') {
            if (confirm('Are you sure you want to revoke access for all integrations?')) {
              showToast('All integration access revoked', 'danger');
            }
          }
        });
      }
    });
  }

  switchTab(tab) {
    window.location.hash = tab;
    document.querySelectorAll('.pa-view-btn[data-tab]').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.tab === tab);
      btn.setAttribute('aria-selected', btn.dataset.tab === tab ? 'true' : 'false');
    });
    document.querySelectorAll('.pa-tab-panel[data-panel="settings"]').forEach((panel) => {
      panel.classList.toggle('active', panel.dataset.content === tab);
    });

    this.store.set('activeTab', tab);
  }

  syncUI() {
    const activeTab = this.store.get('activeTab') || 'general';
    this.switchTab(activeTab);
  }

  saveGeneralSettings() {
    const title = $id('siteTitle')?.value || '';
    const tagline = $id('siteTagline')?.value || '';
    const url = $id('siteUrl')?.value || '';
    const email = $id('adminEmail')?.value || '';
    const description = $id('siteDescription')?.value || '';

    const settings = this.store.get('settings') || {};
    Object.assign(settings, { title, tagline, url, email, description });
    this.store.set('settings', settings);
    this.persist();

    showToast('General settings saved successfully!', 'success');
    addNotification('General settings were updated', 'ri-settings-3-line');
  }

  saveOtherSettings() {
    const itemsPerPage = $id('itemsPerPage')?.value || '';
    const defaultView = $id('defaultView')?.value || '';
    const language = $id('language')?.value || '';
    const maintenanceMode = $id('maintenanceMode')?.checked || false;

    const settings = this.store.get('settings') || {};
    Object.assign(settings, { itemsPerPage, defaultView, language, maintenanceMode });
    this.store.set('settings', settings);
    this.persist();

    showToast('Other settings saved successfully!', 'success');
  }

  saveProfile() {
    const fullName = $id('profileFullName')?.value || '';
    const username = $id('profileUsername')?.value || '';
    const email = $id('profileEmail')?.value || '';
    const role = $id('profileRole')?.value || '';
    const phone = $id('profilePhone')?.value || '';
    const dob = $id('profileDob')?.value || '';
    const bio = $id('profileBio')?.value || '';
    const location = $id('profileLocation')?.value || '';
    const website = $id('profileWebsite')?.value || '';

    const socialLinks = [];
    document.querySelectorAll('.pa-social-group').forEach((group) => {
      const input = group.querySelector('.pa-form-input');
      if (input && input.value.trim()) {
        socialLinks.push(input.value.trim());
      }
    });

    const settings = this.store.get('settings') || {};
    Object.assign(settings, {
      fullName,
      username,
      email,
      role,
      phone,
      dob,
      bio,
      location,
      website,
      socialLinks,
    });
    this.store.set('settings', settings);
    this.persist();

    showToast('Profile updated successfully!', 'success');
    addNotification('Profile information was updated', 'ri-user-settings-line');
  }

  addSocialLink() {
    const container = $id('socialLinksContainer');
    if (!container) return;

    const lastGroup = container.querySelector('.pa-social-group:last-child');
    if (lastGroup) {
      const newGroup = lastGroup.cloneNode(true);
      const input = newGroup.querySelector('.pa-form-input');
      if (input) input.value = '';
      const removeBtn = newGroup.querySelector('.pa-social-remove');
      if (removeBtn) {
        removeBtn.style.display = '';
        this.on(removeBtn, 'click', () => {
          if (container.children.length > 1) {
            newGroup.remove();
            showToast('Social link removed', 'info');
          } else {
            showToast('You need at least one social link', 'info');
          }
        });
      }
      container.appendChild(newGroup);
      showToast('New social link added', 'info');
    }
  }

  updatePassword() {
    const current = $id('secCurrentPassword')?.value || '';
    const newPass = $id('secNewPassword')?.value || '';
    const confirm = $id('secConfirmPassword')?.value || '';

    if (!current) {
      showToast('Please enter your current password', 'danger');
      return;
    }

    if (!newPass || newPass.length < 8) {
      showToast('New password must be at least 8 characters long', 'danger');
      return;
    }

    if (newPass !== confirm) {
      showToast('Passwords do not match', 'danger');
      return;
    }

    showToast('Password updated successfully!', 'success');
    addNotification('Your password was changed', 'ri-lock-2-line');

    // Clear fields
    ['secCurrentPassword', 'secNewPassword', 'secConfirmPassword'].forEach((id) => {
      const el = $id(id);
      if (el) el.value = '';
    });
  }

  saveNotificationPreferences() {
    showToast('Notification preferences saved!', 'success');
    addNotification('Notification preferences were updated', 'ri-notification-3-line');
  }

  async persist() {
    await this.saveRecords(this.store.get('settings'));
  }
}