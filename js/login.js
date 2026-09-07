import { onAuthStateChanged, sendPasswordResetEmail, signInWithEmailAndPassword } from 'https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js';
import { auth } from './firebase-client.js';

const form = document.querySelector('[data-login-form]');
const emailField = document.querySelector('#login-email');
const passwordField = document.querySelector('#login-password');
const submitButton = document.querySelector('[data-login-submit]');
const resetButton = document.querySelector('[data-password-reset]');
const notice = document.querySelector('[data-login-notice]');
const terminalState = document.querySelector('[data-terminal-state]');
const accessTitle = document.querySelector('[data-access-title]');
const accessDetail = document.querySelector('[data-access-detail]');

const messages = {
  'auth/invalid-credential': 'E-mail ou senha inválidos.',
  'auth/invalid-email': 'Digite um endereço de e-mail válido.',
  'auth/missing-password': 'Digite sua senha.',
  'auth/too-many-requests': 'Muitas tentativas. Aguarde alguns minutos e tente novamente.',
  'auth/network-request-failed': 'Falha de conexão. Verifique sua internet e tente novamente.',
  'auth/user-disabled': 'Este acesso foi desativado pela administração.'
};

const showMessage = (message, state = 'info') => {
  if (!notice) return;
  notice.textContent = message;
  notice.dataset.state = state;
};

const setBusy = busy => {
  if (!submitButton || !emailField || !passwordField) return;
  submitButton.disabled = busy;
  emailField.readOnly = busy;
  passwordField.readOnly = busy;
  submitButton.classList.toggle('is-loading', busy);
  submitButton.firstChild.textContent = busy ? 'Autenticando ' : 'Entrar no sistema ';
  if (terminalState) terminalState.textContent = busy ? 'VERIFY' : 'ONLINE';
};

onAuthStateChanged(auth, user => {
  if (user) window.location.replace('perfil.html');
});

form?.addEventListener('submit', async event => {
  event.preventDefault();
  const email = emailField?.value.trim() || '';
  const password = passwordField?.value || '';

  if (!email || !password) {
    showMessage('Preencha o e-mail e a senha para continuar.', 'error');
    return;
  }

  setBusy(true);
  showMessage('Validando credenciais no canal seguro…', 'progress');

  try {
    await signInWithEmailAndPassword(auth, email, password);
    showMessage('Identificação confirmada. Abrindo o perfil…', 'success');
  } catch (error) {
    showMessage(messages[error.code] || 'Não foi possível entrar. Tente novamente.', 'error');
    setBusy(false);
  }
});

resetButton?.addEventListener('click', async () => {
  const email = emailField?.value.trim() || '';
  if (!email) {
    showMessage('Digite seu e-mail para solicitar a redefinição da senha.', 'error');
    emailField?.focus();
    return;
  }

  resetButton.disabled = true;
  try {
    await sendPasswordResetEmail(auth, email);
    showMessage('Se o e-mail estiver cadastrado, enviaremos as instruções de redefinição.', 'success');
  } catch (error) {
    showMessage(messages[error.code] || 'Não foi possível solicitar a redefinição agora.', 'error');
  } finally {
    resetButton.disabled = false;
  }
});

if (terminalState) terminalState.textContent = 'ONLINE';
if (accessTitle) accessTitle.textContent = 'Canal de acesso ativo';
if (accessDetail) accessDetail.textContent = 'Firebase Authentication · conexão protegida';
