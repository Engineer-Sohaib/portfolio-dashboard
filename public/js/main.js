import { PAGE } from './core/router.js';
import { ShellModule } from './modules/shell/ShellModule.js';
import { DashboardModule } from './modules/dashboard/DashboardModule.js';
import { ProjectsModule } from './modules/projects/ProjectsModule.js';
import { CategoriesModule } from './modules/categories/CategoriesModule.js';
import { TechnologiesModule } from './modules/technologies/TechnologiesModule.js';
import { MediaModule } from './modules/media/MediaModule.js';
import { TestimonialsModule } from './modules/testimonials/TestimonialsModule.js';
import { BlogModule } from './modules/blog/BlogModule.js';
import { ExperienceModule } from './modules/experience/ExperienceModule.js';
import { ContactMessagesModule } from './modules/contact-messages/ContactMessagesModule.js';
import { SettingsModule } from './modules/settings/SettingsModule.js';
import { LoginModule } from './modules/auth/LoginModule.js';
import { ForgotPasswordModule } from './modules/auth/ForgotPasswordModule.js';
import { ResetPasswordModule } from './modules/auth/ResetPasswordModule.js';
import { $id, $all } from './utils/dom.js';
import { closePanels } from './modules/shell/panels.js';

const MODULE_BY_PAGE = {
  dashboard: DashboardModule,
  projects: ProjectsModule,
  categories: CategoriesModule,
  technologies: TechnologiesModule,
  media: MediaModule,
  testimonials: TestimonialsModule,
  blogposts: BlogModule,
  experience: ExperienceModule,
  'contact-messages': ContactMessagesModule,
  settings: SettingsModule,
  login: LoginModule,
  'forgot-password': ForgotPasswordModule,
  'reset-password': ResetPasswordModule,
};

function bindGlobalPanelChrome() {
  $all('.pa-panel-tab').forEach((btn) => {
    btn.addEventListener('click', () => {
      import('./modules/shell/panels.js').then(({ activateTab }) => activateTab(btn.dataset.panel, btn.dataset.tab));
    });
  });
  $id('paPanelOverlay')?.addEventListener('click', (e) => {
    if (e.target.id === 'paPanelOverlay') closePanels();
  });
}

async function main() {
  const isAuthPage = ['login', 'forgot-password', 'reset-password'].includes(PAGE);
  
  if (!isAuthPage) {
    const shell = new ShellModule();
    await shell.init();
  } else {
    const { initConfirmDialog } = await import('./modules/shell/confirm.js');
    initConfirmDialog();
  }

  const ModuleClass = MODULE_BY_PAGE[PAGE];
  if (!ModuleClass) {
    console.warn(`[main] no module registered for page "${PAGE}"`);
    return;
  }

  const pageModule = new ModuleClass();
  await pageModule.init();
  
  if (!isAuthPage) {
    bindGlobalPanelChrome();

    import('./modules/shell/panels.js').then(({ registerPanel, openPanel, closePanels }) => {
      registerPanel('paQuickAddPanel');
      
      const addNewBtn = document.getElementById('paAddNewBtn');
      if (addNewBtn) {
        addNewBtn.addEventListener('click', () => {
          openPanel('paQuickAddPanel');
          import('./modules/shell/panels.js').then(({ activateTab }) => {
            activateTab('quickAdd', 'project');
          });
          setTimeout(() => {
            const firstInput = document.querySelector('#paQuickAddPanel input:not([type="file"])');
            if (firstInput) firstInput.focus();
          }, 320);
        });
      }
      
      const closeBtn = document.getElementById('paQuickAddPanelClose');
      if (closeBtn) {
        closeBtn.addEventListener('click', closePanels);
      }
    });
  }
  
  window.__paDebug = { pageModule, page: PAGE };
}

function boot() {
  main().catch((err) => console.error('[main] fatal error during boot:', err));
}
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}