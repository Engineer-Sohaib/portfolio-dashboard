import { AuthModule } from './AuthModule.js';
import { $id } from '../../utils/dom.js';

export class ForgotPasswordModule extends AuthModule {
  constructor() {
    super({
      name: 'ForgotPassword',
      storageKey: null,
    });
    this.resendTimer = null;
  }

  async load() {
  }

  render() {
  }

  bindEvents() {
    if (this._boundEvents) return;
    this._boundEvents = true;

    const form = $id('paForgotForm');
    const emailInput = $id('paForgotEmail');
    const submitBtn = $id('paForgotSubmit');
    const resendBtn = $id('paResendBtn');

    this.on(emailInput, 'input', () => {
      this.clearFieldError('paForgotEmail', 'paForgotEmailError');
    });

    this.handleEnterSubmit('paForgotEmail', 'paForgotForm');

    this.on(form, 'submit', (e) => {
      e.preventDefault();
      this.handleForgotSubmit();
    });

    this.on(resendBtn, 'click', (e) => {
      e.preventDefault();
      this.handleResend();
    });
  }

  handleForgotSubmit() {
    const emailInput = $id('paForgotEmail');
    const submitBtn = $id('paForgotSubmit');
    const emailValue = emailInput.value.trim();

    if (!emailValue || !this.isValidEmail(emailValue)) {
      this.setFieldError('paForgotEmail', 'paForgotEmailError', true);
      emailInput.focus();
      return;
    }
    this.clearFieldError('paForgotEmail', 'paForgotEmailError');

    this.setButtonLoading('paForgotSubmit', true);

    const form = $id('paForgotForm');
    form.dispatchEvent(new CustomEvent('pa:forgot-submit', {
      bubbles: true,
      detail: { email: emailValue },
    }));

    setTimeout(() => {
      this.setButtonLoading('paForgotSubmit', false);
      
      const successEmail = $id('paSuccessEmail');
      if (successEmail) successEmail.textContent = emailValue;
      
      this.showSuccess('paSuccessBox', 'paForgotForm');
      this.showSuccessToast(`Password reset link sent to ${emailValue}`);
    }, 1200);
  }

  handleResend() {
    const resendBtn = $id('paResendBtn');
    const emailInput = $id('paForgotEmail');
    const emailValue = emailInput.value.trim();

    if (!emailValue || !this.isValidEmail(emailValue)) {
      this.showError('Please enter a valid email address.');
      return;
    }

    this.setButtonLoading('paResendBtn', true);

    setTimeout(() => {
      this.setButtonLoading('paResendBtn', false);
      this.showSuccessToast(`Reset link resent to ${emailValue}`);
    }, 800);
  }

  destroy() {
    if (this.resendTimer) {
      clearTimeout(this.resendTimer);
      this.resendTimer = null;
    }
    super.destroy();
  }
}