import { AuthModule } from './AuthModule.js';
import { $id } from '../../utils/dom.js';

export class LoginModule extends AuthModule {
  constructor() {
    super({
      name: 'Login',
      storageKey: null, 
    });
  }

  async load() {
  }

  render() {
  }

  bindEvents() {
    if (this._boundEvents) return;
    this._boundEvents = true;

    const form = $id('paLoginForm');
    const emailInput = $id('paLoginEmail');
    const passwordInput = $id('paLoginPassword');
    const submitBtn = $id('paLoginSubmit');
    const forgotLink = $id('paForgotPasswordLink');
    const createAccountLink = $id('paCreateAccountLink');

    this.setupPasswordToggle('paLoginPassword', 'paPassToggle');
    this.on(emailInput, 'input', () => {
      this.clearFieldError('paLoginEmail', 'paLoginEmailError');
    });
    this.on(passwordInput, 'input', () => {
      this.clearFieldError('paLoginPassword', 'paLoginPasswordError');
    });

    this.handleEnterSubmit('paLoginPassword', 'paLoginForm');

    this.on(forgotLink, 'click', (e) => {
      e.preventDefault();
      window.location.href = '/forget-password';
    });

    this.on(createAccountLink, 'click', (e) => {
      e.preventDefault();
      this.showToast('Account creation is not available in this demo.', 'info');
    });

    this.on(form, 'submit', (e) => {
      e.preventDefault();
      this.handleLogin();
    });
  }

  handleLogin() {
    const emailInput = $id('paLoginEmail');
    const passwordInput = $id('paLoginPassword');
    const submitBtn = $id('paLoginSubmit');
    const rememberCheck = $id('paRememberMe');

    let valid = true;

    const emailValue = emailInput.value.trim();
    if (!emailValue || !this.isValidEmail(emailValue)) {
      this.setFieldError('paLoginEmail', 'paLoginEmailError', true);
      valid = false;
    } else {
      this.clearFieldError('paLoginEmail', 'paLoginEmailError');
    }

    const passwordValue = passwordInput.value;
    if (!passwordValue || passwordValue.length < 6) {
      this.setFieldError('paLoginPassword', 'paLoginPasswordError', true);
      valid = false;
    } else {
      this.clearFieldError('paLoginPassword', 'paLoginPasswordError');
    }

    if (!valid) {
      const firstInvalid = document.querySelector('#paLoginForm .pa-form-input.error');
      if (firstInvalid) firstInvalid.focus();
      return;
    }

    this.setButtonLoading('paLoginSubmit', true);

    const form = $id('paLoginForm');
    form.dispatchEvent(new CustomEvent('pa:login-submit', {
      bubbles: true,
      detail: {
        email: emailValue,
        password: passwordValue,
        remember: rememberCheck ? rememberCheck.checked : false,
      },
    }));

    setTimeout(() => {
      this.setButtonLoading('paLoginSubmit', false);
      this.showSuccessToast('Login successful! Redirecting...');
      
      setTimeout(() => {
        this.redirectToDashboard();
      }, 800);
    }, 1200);
  }
}