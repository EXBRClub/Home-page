document.addEventListener('DOMContentLoaded', () => {
  const card = document.querySelector('[data-profile-card]');
  const avatarImage = document.querySelector('[data-member-avatar]');
  const avatarClass = document.querySelector('[data-avatar-class]');
  const avatarOptions = [...document.querySelectorAll('[data-avatar-option]')];
  const bannerOptions = [...document.querySelectorAll('[data-banner-option]')];
  const feedback = document.querySelector('[data-profile-feedback]');
  const editToggle = document.querySelector('[data-profile-edit-toggle]');
  const editLabel = document.querySelector('[data-profile-edit-label]');
  const customizer = document.querySelector('#profile-customizer');

  if (!card || !avatarImage || !avatarClass) return;

  const storageKeys = {
    avatar: 'exbr.profile.avatar',
    banner: 'exbr.profile.banner'
  };

  const readPreference = key => {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      return null;
    }
  };

  const savePreference = (key, value) => {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (error) {
      return false;
    }
  };

  let feedbackTimer = 0;
  const announce = message => {
    if (!feedback) return;
    window.clearTimeout(feedbackTimer);
    feedback.textContent = message;
    feedbackTimer = window.setTimeout(() => {
      feedback.textContent = 'Configuração salva neste navegador.';
    }, 2200);
  };

  const applyAvatar = (option, persist = true) => {
    if (!option) return;
    const avatar = option.dataset.avatar;
    const name = option.dataset.avatarName;
    const source = option.dataset.avatarSrc;

    card.classList.add('is-changing');
    window.setTimeout(() => {
      avatarImage.src = source;
      avatarImage.alt = `Avatar selecionado: soldado da classe ${name}`;
      avatarClass.textContent = `Classe ${name}`;
      avatarOptions.forEach(button => button.setAttribute('aria-pressed', String(button === option)));
      card.classList.remove('is-changing');
    }, 180);

    if (persist) {
      const saved = savePreference(storageKeys.avatar, avatar);
      announce(saved ? `Soldado ${name} selecionado.` : `Soldado ${name} selecionado nesta sessão.`);
    }
  };

  const applyBanner = (option, persist = true) => {
    if (!option) return;
    const banner = option.dataset.banner;
    card.dataset.banner = banner;
    bannerOptions.forEach(button => button.setAttribute('aria-pressed', String(button === option)));

    if (persist) {
      const saved = savePreference(storageKeys.banner, banner);
      announce(saved ? `Bandeira ${option.textContent.trim()} selecionada.` : 'Bandeira selecionada nesta sessão.');
    }
  };

  avatarOptions.forEach(option => option.addEventListener('click', () => applyAvatar(option)));
  bannerOptions.forEach(option => option.addEventListener('click', () => applyBanner(option)));

  editToggle?.addEventListener('click', () => {
    if (!customizer) return;
    const willOpen = editToggle.getAttribute('aria-expanded') !== 'true';
    editToggle.setAttribute('aria-expanded', String(willOpen));
    customizer.hidden = !willOpen;
    if (editLabel) editLabel.textContent = willOpen ? 'Fechar edição' : 'Editar perfil';
    if (willOpen) customizer.querySelector('button')?.focus({ preventScroll: true });
  });

  const storedAvatar = readPreference(storageKeys.avatar);
  const storedBanner = readPreference(storageKeys.banner);
  applyAvatar(avatarOptions.find(option => option.dataset.avatar === storedAvatar) || avatarOptions[0], false);
  applyBanner(bannerOptions.find(option => option.dataset.banner === storedBanner) || bannerOptions[0], false);

  document.querySelectorAll('[data-medal-icon]').forEach(icon => {
    const iconFile = icon.dataset.medalIcon;
    if (!iconFile) return;
    icon.style.setProperty('--medal-image', `url("${iconFile}")`);
    icon.classList.add('has-image');
  });
});
