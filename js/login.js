import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  updateProfile
} from 'https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js';
import { doc, serverTimestamp, setDoc } from 'https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js';
import { auth, db } from './firebase-client.js';

const TEMP_REGISTRATION_CODE = '070922';
const form = document.querySelector('[data-login-form]');
const emailField = document.querySelector('#login-email');
const passwordField = document.querySelector('#login-password');
const nameField = document.querySelector('#register-name');
const passwordConfirmField = document.querySelector('#register-password-confirm');
const submitButton = document.querySelector('[data-login-submit]');
const submitLabel = document.querySelector('[data-submit-label]');
const resetButton = document.querySelector('[data-password-reset]');
const notice = document.querySelector('[data-login-notice]');
const terminalState = document.querySelector('[data-terminal-state]');
const terminalTitle = document.querySelector('#terminal-title');
const accessTitle = document.querySelector('[data-access-title]');
const accessDetail = document.querySelector('[data-access-detail]');
const modeButtons = [...document.querySelectorAll('[data-auth-mode]')];
const registerFields = [...document.querySelectorAll('[data-register-field]')];
const registerRequiredFields = [...document.querySelectorAll('[data-register-required]')];
const codeSlots = [...document.querySelectorAll('[data-code-slot]')];
let currentMode = 'login';
let authActionInProgress = false;

const messages = {
  'auth/invalid-credential': 'E-mail ou senha inválidos.',
  'auth/invalid-email': 'Digite um endereço de e-mail válido.',
  'auth/missing-password': 'Digite sua senha.',
  'auth/email-already-in-use': 'Este e-mail já possui uma conta. Use a opção Entrar.',
  'auth/weak-password': 'Crie uma senha com pelo menos seis caracteres.',
  'auth/operation-not-allowed': 'O cadastro por e-mail está temporariamente indisponível.',
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
  authActionInProgress = busy;
  submitButton.disabled = busy;
  emailField.readOnly = busy;
  passwordField.readOnly = busy;
  if (nameField) nameField.readOnly = busy;
  if (passwordConfirmField) passwordConfirmField.readOnly = busy;
  codeSlots.forEach(slot => { slot.readOnly = busy; });
  modeButtons.forEach(button => { button.disabled = busy; });
  if (resetButton) resetButton.disabled = busy;
  submitButton.classList.toggle('is-loading', busy);
  if (submitLabel) {
    submitLabel.textContent = busy
      ? (currentMode === 'register' ? 'Criando identificação' : 'Autenticando')
      : (currentMode === 'register' ? 'Criar minha conta' : 'Entrar no sistema');
  }
  if (terminalState) terminalState.textContent = busy ? 'VERIFY' : 'ONLINE';
};

onAuthStateChanged(auth, user => {
  if (user && !authActionInProgress) window.location.replace('perfil.html');
});

const setMode = mode => {
  currentMode = mode === 'register' ? 'register' : 'login';
  const isRegister = currentMode === 'register';

  modeButtons.forEach(button => {
    const active = button.dataset.authMode === currentMode;
    button.setAttribute('aria-selected', String(active));
  });
  registerFields.forEach(field => { field.hidden = !isRegister; });
  registerRequiredFields.forEach(field => { field.required = isRegister; });

  if (passwordField) passwordField.autocomplete = isRegister ? 'new-password' : 'current-password';
  if (submitLabel) submitLabel.textContent = isRegister ? 'Criar minha conta' : 'Entrar no sistema';
  if (terminalTitle) terminalTitle.textContent = isRegister ? 'Novo operador' : 'Identifique-se';
  if (resetButton) resetButton.hidden = isRegister;

  showMessage(
    isRegister
      ? 'Sua conta será criada como Membro, com a patente inicial Soldado.'
      : 'Autenticação protegida pelo Firebase. A EXBR não armazena sua senha no site.'
  );
};

modeButtons.forEach(button => {
  button.addEventListener('click', () => setMode(button.dataset.authMode));
});

codeSlots.forEach((slot, index) => {
  slot.addEventListener('input', event => {
    const digits = event.target.value.replace(/\D/g, '');
    event.target.value = digits.slice(-1);
    if (event.target.value && codeSlots[index + 1]) codeSlots[index + 1].focus();
  });

  slot.addEventListener('keydown', event => {
    if (event.key === 'Backspace' && !slot.value && codeSlots[index - 1]) codeSlots[index - 1].focus();
  });

  slot.addEventListener('paste', event => {
    const digits = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, codeSlots.length);
    if (!digits) return;
    event.preventDefault();
    digits.split('').forEach((digit, digitIndex) => {
      if (codeSlots[digitIndex]) codeSlots[digitIndex].value = digit;
    });
    codeSlots[Math.min(digits.length, codeSlots.length) - 1]?.focus();
  });
});

form?.addEventListener('submit', async event => {
  event.preventDefault();
  const email = emailField?.value.trim() || '';
  const password = passwordField?.value || '';

  if (!email || !password) {
    showMessage('Preencha o e-mail e a senha para continuar.', 'error');
    return;
  }

  if (currentMode === 'register') {
    const displayName = nameField?.value.trim() || '';
    const passwordConfirm = passwordConfirmField?.value || '';
    const registrationCode = codeSlots.map(slot => slot.value).join('');

    if (!displayName) {
      showMessage('Informe seu nome de operador.', 'error');
      nameField?.focus();
      return;
    }
    if (password.length < 6) {
      showMessage('Crie uma senha com pelo menos seis caracteres.', 'error');
      return;
    }
    if (password !== passwordConfirm) {
      showMessage('As senhas informadas não coincidem.', 'error');
      passwordConfirmField?.focus();
      return;
    }
    if (registrationCode !== TEMP_REGISTRATION_CODE) {
      showMessage('Código de registro inválido.', 'error');
      codeSlots[0]?.focus();
      return;
    }

    setBusy(true);
    showMessage('Criando sua identificação de membro…', 'progress');

    try {
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(credential.user, { displayName });
      const profile = {
        email: credential.user.email || email,
        displayName,
        role: 'member',
        rankId: 'soldado',
        avatarId: 'assalto',
        bannerId: 'brasil',
        bio: '',
        favoriteClass: '',
        favoriteFaction: '',
        featuredMedalIds: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      try {
        await setDoc(doc(db, 'users', credential.user.uid), profile);
      } catch (profileError) {
        const { bio, favoriteClass, favoriteFaction, featuredMedalIds, ...legacyProfile } = profile;
        await setDoc(doc(db, 'users', credential.user.uid), legacyProfile);
      }
      showMessage('Conta criada. Preparando seu perfil de Soldado…', 'success');
      window.location.replace('perfil.html');
    } catch (error) {
      if (auth.currentUser) {
        showMessage('A conta foi criada. Concluindo o registro pelo seu Perfil…', 'progress');
        window.setTimeout(() => window.location.replace('perfil.html'), 900);
        return;
      }
      showMessage(messages[error.code] || 'Não foi possível criar a conta. Tente novamente.', 'error');
      setBusy(false);
    }
    return;
  }

  setBusy(true);
  showMessage('Validando credenciais no canal seguro…', 'progress');

  try {
    await signInWithEmailAndPassword(auth, email, password);
    showMessage('Identificação confirmada. Abrindo o perfil…', 'success');
    window.location.replace('perfil.html');
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
if (accessDetail) accessDetail.textContent = 'Login e cadastro de membros · conexão protegida';
