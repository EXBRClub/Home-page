import { onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  updateDoc
} from 'https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js';
import { auth, db } from './firebase-client.js';
import { applyMedalImage, normalizeMedalIcon } from './medal-images.js?v=20260911-1';

document.addEventListener('DOMContentLoaded', () => {
  const card = document.querySelector('[data-profile-card]');
  const identityZone = document.querySelector('.identity-zone');
  const avatarImage = document.querySelector('[data-member-avatar]');
  const avatarClass = document.querySelector('[data-avatar-class]');
  const avatarOptions = [...document.querySelectorAll('[data-avatar-option]')];
  const bannerOptions = [...document.querySelectorAll('[data-banner-option]')];
  const classOptions = [...document.querySelectorAll('[data-class-option]')];
  const factionOptions = [...document.querySelectorAll('[data-faction-option]')];
  const favoriteClass = document.querySelector('[data-favorite-class]');
  const favoriteFaction = document.querySelector('[data-favorite-faction]');
  const memberBio = document.querySelector('[data-member-bio]');
  const bioInput = document.querySelector('[data-member-bio-input]');
  const bioSave = document.querySelector('[data-member-bio-save]');
  const feedback = document.querySelector('[data-profile-feedback]');
  const editToggle = document.querySelector('[data-profile-edit-toggle]');
  const editLabel = document.querySelector('[data-profile-edit-label]');
  const customizer = document.querySelector('#profile-customizer');
  const memberName = document.querySelector('[data-member-name]');
  const memberRank = document.querySelector('[data-member-rank]');
  const memberRole = document.querySelector('[data-member-role]');
  const memberStatus = document.querySelector('[data-member-status]');
  const commandBar = document.querySelector('[data-member-command-bar]');
  const adminAccess = document.querySelector('[data-admin-access]');
  const logoutButtons = [...document.querySelectorAll('[data-logout]')];
  const medalsList = document.querySelector('[data-medals-list]');
  const medalsCount = document.querySelector('[data-medals-count]');
  const medalsLabel = document.querySelector('[data-medals-label]');
  const memberOperationsList = document.querySelector('[data-member-operations-list]');
  const medalDetail = document.querySelector('[data-medal-detail]');
  const medalDetailClose = document.querySelector('[data-medal-detail-close]');
  const medalDetailName = document.querySelector('[data-medal-detail-name]');
  const medalDetailImage = document.querySelector('[data-medal-detail-image]');
  const medalDetailDescription = document.querySelector('[data-medal-detail-description]');
  const medalDetailOperation = document.querySelector('[data-medal-detail-operation]');
  const medalDetailDate = document.querySelector('[data-medal-detail-date]');

  if (!card || !avatarImage || !avatarClass) return;

  const avatars = new Map(avatarOptions.map(option => [option.dataset.avatar, option]));
  const banners = new Map(bannerOptions.map(option => [option.dataset.banner, option]));
  const classes = new Map(classOptions.map(option => [option.dataset.classOption, option]));
  const factions = new Map(factionOptions.map(option => [option.dataset.factionOption, option]));
  const requestedUid = new URLSearchParams(window.location.search).get('uid');
  let currentUser = null;
  let currentProfile = null;
  let currentProfileUid = null;
  let viewerProfile = null;
  let isOwner = false;
  let ranks = new Map();
  let medalDefinitions = new Map();
  let feedbackTimer = 0;
  let editVisibilityTimer = 0;

  const medalDate = medal => medal.operationDate?.toDate?.().toLocaleDateString('pt-BR') || medal.operationDate || 'Data não informada';
  const classNames = {
    infiltrador: 'Infiltrador',
    'assalto-leve': 'Assalto leve',
    medico: 'Médico de combate',
    engenheiro: 'Engenheiro',
    'assalto-pesado': 'Assalto pesado',
    max: 'MAX'
  };
  const factionNames = { tr: 'Terran Republic', nc: 'New Conglomerate', vs: 'Vanu Sovereignty', nso: 'Nanite Systems Operatives' };

  const effectiveMedal = medal => {
    const definition = medalDefinitions.get(medal.catalogId);
    return definition ? {
      ...medal,
      name: definition.nome || medal.name,
      description: definition.description || medal.description,
      iconUrl: definition.iconUrl || medal.iconUrl
    } : medal;
  };

  const publicMedal = storedMedal => {
    const medal = effectiveMedal(storedMedal);
    return {
      catalogId: medal.catalogId || '',
      name: medal.name || 'Medalha EXBR',
      description: medal.description || '',
      operationName: medal.operationName || 'Operação EXBR',
      operationDate: medal.operationDate || null,
      iconUrl: normalizeMedalIcon(medal.iconUrl)
    };
  };

  const loadMedalDefinitions = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'medalCatalog'));
      medalDefinitions = new Map(snapshot.docs.map(item => [item.id, item.data()]));
    } catch (error) {
      medalDefinitions = new Map();
    }
  };

  const publicActivity = participation => ({
    operationId: participation.operationId || participation.id || '',
    title: participation.title || 'Operação EXBR',
    status: participation.status || 'confirmed',
    startsAt: participation.startsAt || null,
    joinedAt: participation.joinedAt || null
  });

  const fillMedalDetail = (medal, definition = {}) => {
    const name = definition.nome || medal.name || 'Medalha EXBR';
    const description = definition.description || medal.description || 'Condecoração oficial concedida pela EXBR.';
    if (medalDetailName) medalDetailName.textContent = name;
    if (medalDetailDescription) medalDetailDescription.textContent = description;
    if (medalDetailOperation) medalDetailOperation.textContent = medal.operationName || 'Operação EXBR';
    if (medalDetailDate) medalDetailDate.textContent = medalDate(medal);
    if (medalDetailImage) {
      applyMedalImage(medalDetailImage, definition.iconUrl || medal.iconUrl, `Imagem ampliada da medalha ${name}`);
    }
  };

  const openMedalDetail = async medal => {
    if (!medalDetail) return;
    fillMedalDetail(medal);
    medalDetail.showModal();
    if (!medal.catalogId) return;
    try {
      const snapshot = await getDoc(doc(db, 'medalCatalog', medal.catalogId));
      if (snapshot.exists() && medalDetail.open) fillMedalDetail(medal, snapshot.data());
    } catch (error) {
      // Mantém os dados gravados na concessão quando o catálogo estiver indisponível.
    }
  };

  medalDetailClose?.addEventListener('click', () => medalDetail?.close());
  medalDetail?.addEventListener('click', event => {
    if (event.target === medalDetail) medalDetail.close();
  });

  const announce = (message, persistent = false) => {
    if (!feedback) return;
    window.clearTimeout(feedbackTimer);
    feedback.textContent = message;
    if (!persistent) {
      feedbackTimer = window.setTimeout(() => {
        feedback.textContent = 'Configuração vinculada à sua conta EXBR.';
      }, 2400);
    }
  };

  const loadRanks = async () => {
    try {
      const response = await fetch('../data/patentes.json');
      const data = await response.json();
      ranks = new Map(data.patentes.map(rank => [rank.id, rank.nome]));
    } catch (error) {
      ranks = new Map([['soldado', 'Soldado']]);
    }
  };

  const applyAvatar = (option, animate = true) => {
    if (!option) return;
    const name = option.dataset.avatarName;
    const source = option.dataset.avatarSrc;
    if (animate) card.classList.add('is-changing');
    window.setTimeout(() => {
      avatarImage.src = source;
      avatarImage.alt = `Avatar selecionado: soldado da classe ${name}`;
      avatarClass.textContent = `Classe ${name}`;
      avatarOptions.forEach(button => button.setAttribute('aria-pressed', String(button === option)));
      card.classList.remove('is-changing');
    }, animate ? 180 : 0);
  };

  const applyBanner = option => {
    if (!option) return;
    card.dataset.banner = option.dataset.banner;
    bannerOptions.forEach(button => button.setAttribute('aria-pressed', String(button === option)));
  };

  const renderFavoriteMarker = (marker, symbol, label, name) => {
    if (!marker) return;
    const icon = marker.querySelector('span');
    const caption = marker.querySelector('small');
    if (icon) icon.textContent = symbol;
    if (caption) caption.textContent = label;
    marker.title = name ? `${label} favorita: ${name}` : `${label} favorita não definida`;
    marker.dataset.active = String(Boolean(name));
  };

  const savePreference = async (field, value, successMessage) => {
    if (!currentUser || !currentProfileUid || !isOwner) return;
    announce('Sincronizando perfil…', true);
    try {
      const profileUpdate = { [field]: value, updatedAt: serverTimestamp() };
      if (['bio', 'favoriteClass', 'favoriteFaction'].includes(field)) {
        profileUpdate.bio = currentProfile.bio || '';
        profileUpdate.favoriteClass = currentProfile.favoriteClass || '';
        profileUpdate.favoriteFaction = currentProfile.favoriteFaction || '';
        profileUpdate[field] = value;
      }
      await updateDoc(doc(db, 'users', currentProfileUid), {
        ...profileUpdate
      });
      currentProfile[field] = value;
      try {
        await setDoc(doc(db, 'publicProfiles', currentProfileUid), {
          [field]: value,
          updatedAt: serverTimestamp()
        }, { merge: true });
      } catch (error) {
        // A preferência privada permanece salva mesmo se o espelho público estiver indisponível.
      }
      announce(successMessage);
    } catch (error) {
      announce('Não foi possível salvar esta alteração.', true);
    }
  };

  avatarOptions.forEach(option => option.addEventListener('click', () => {
    if (!isOwner) return;
    applyAvatar(option);
    savePreference('avatarId', option.dataset.avatar, `Soldado ${option.dataset.avatarName} selecionado.`);
  }));

  bannerOptions.forEach(option => option.addEventListener('click', () => {
    if (!isOwner) return;
    applyBanner(option);
    savePreference('bannerId', option.dataset.banner, `Bandeira ${option.textContent.trim()} selecionada.`);
  }));

  classOptions.forEach(option => option.addEventListener('click', () => {
    if (!isOwner) return;
    const value = option.dataset.classOption;
    classOptions.forEach(button => button.setAttribute('aria-pressed', String(button === option)));
    renderFavoriteMarker(favoriteClass, option.dataset.symbol, 'Classe', classNames[value]);
    savePreference('favoriteClass', value, `${classNames[value]} definida como classe favorita.`);
  }));

  factionOptions.forEach(option => option.addEventListener('click', () => {
    if (!isOwner) return;
    const value = option.dataset.factionOption;
    factionOptions.forEach(button => button.setAttribute('aria-pressed', String(button === option)));
    renderFavoriteMarker(favoriteFaction, option.dataset.symbol, 'Facção', factionNames[value]);
    savePreference('favoriteFaction', value, `${factionNames[value]} definida como facção favorita.`);
  }));

  bioSave?.addEventListener('click', async () => {
    if (!isOwner || !bioInput) return;
    const value = bioInput.value.trim().slice(0, 220);
    bioSave.disabled = true;
    if (memberBio) memberBio.textContent = value || 'Nenhuma transmissão pessoal registrada.';
    await savePreference('bio', value, 'Transmissão pessoal atualizada.');
    bioSave.disabled = false;
  });

  const hideOwnerControls = () => {
    window.clearTimeout(editVisibilityTimer);
    if (customizer) customizer.hidden = true;
    if (editToggle) {
      editToggle.hidden = true;
      editToggle.setAttribute('aria-expanded', 'false');
    }
    if (editLabel) editLabel.textContent = 'Editar perfil';
  };

  const refreshEditTimer = () => {
    if (!isOwner || editToggle?.hidden) return;
    window.clearTimeout(editVisibilityTimer);
    editVisibilityTimer = window.setTimeout(hideOwnerControls, 30000);
  };

  const revealOwnerControls = () => {
    if (!isOwner || !editToggle) return;
    editToggle.hidden = false;
    refreshEditTimer();
  };

  avatarImage.addEventListener('click', revealOwnerControls);
  avatarImage.addEventListener('keydown', event => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    revealOwnerControls();
    editToggle?.focus();
  });
  identityZone?.addEventListener('pointerdown', refreshEditTimer);
  identityZone?.addEventListener('keydown', refreshEditTimer);

  editToggle?.addEventListener('click', () => {
    if (!customizer || !isOwner) return;
    const willOpen = editToggle.getAttribute('aria-expanded') !== 'true';
    editToggle.setAttribute('aria-expanded', String(willOpen));
    customizer.hidden = !willOpen;
    if (editLabel) editLabel.textContent = willOpen ? 'Fechar edição' : 'Editar perfil';
    refreshEditTimer();
    if (willOpen) customizer.querySelector('button')?.focus({ preventScroll: true });
  });

  logoutButtons.forEach(button => button.addEventListener('click', async event => {
    event.preventDefault();
    button.disabled = true;
    await signOut(auth);
    window.location.replace('login.html');
  }));

  const renderMedals = medals => {
    if (!medalsList || !medalsCount) return;
    medalsList.replaceChildren();
    medalsCount.textContent = String(medals.length).padStart(2, '0');
    if (medalsLabel) medalsLabel.textContent = medals.length ? 'Registro oficial' : 'Aguardando condecorações';
    if (!medals.length) {
      const empty = document.createElement('li');
      empty.className = 'medals-empty';
      empty.innerHTML = '<span aria-hidden="true">◇</span><strong>Nenhuma medalha registrada</strong><small>Participe das operações oficiais da EXBR.</small>';
      medalsList.append(empty);
      return;
    }

    medals.forEach(storedMedal => {
      const medal = effectiveMedal(storedMedal);
      const item = document.createElement('li');
      item.className = 'medal-entry';
      const date = medalDate(medal);
      const icon = document.createElement('span');
      icon.className = 'medal-icon';
      icon.setAttribute('aria-hidden', 'true');
      const image = document.createElement('img');
      applyMedalImage(image, medal.iconUrl);
      icon.classList.add('has-image');
      icon.append(image);
      const copy = document.createElement('span');
      copy.className = 'medal-copy';
      const name = document.createElement('strong');
      name.textContent = medal.name || 'Medalha EXBR';
      const detail = document.createElement('small');
      detail.textContent = `${medal.operationName || 'Operação'} · ${date}`;
      copy.append(name, detail);
      const open = document.createElement('button');
      open.className = 'medal-open';
      open.type = 'button';
      open.setAttribute('aria-label', `Ver detalhes de ${name.textContent}`);
      open.append(icon, copy);
      open.addEventListener('click', () => openMedalDetail(medal));
      item.append(open);

      if (viewerProfile?.role === 'admin') {
        item.classList.add('can-manage');
        const remove = document.createElement('button');
        remove.className = 'medal-remove';
        remove.type = 'button';
        remove.textContent = '×';
        remove.setAttribute('aria-label', `Remover ${name.textContent} de ${memberName?.textContent || 'membro'}`);
        remove.addEventListener('click', async () => {
          if (!currentProfileUid || !window.confirm(`Remover a medalha ${name.textContent} deste perfil?`)) return;
          remove.disabled = true;
          try {
            await deleteDoc(doc(db, 'users', currentProfileUid, 'medals', medal.id));
            const remainingMedals = await loadMedals(currentProfileUid);
            await setDoc(doc(db, 'publicProfiles', currentProfileUid), {
              featuredMedals: remainingMedals.slice(0, 5).map(publicMedal),
              updatedAt: serverTimestamp()
            }, { merge: true });
            announce(`${name.textContent} removida do perfil.`);
          } catch (error) {
            remove.disabled = false;
            announce('Não foi possível remover esta medalha.', true);
          }
        });
        item.append(remove);
      }
      medalsList.append(item);
    });
  };

  const loadMedals = async uid => {
    try {
      const snapshot = await getDocs(collection(db, 'users', uid, 'medals'));
      const medals = snapshot.docs.map(item => ({ id: item.id, ...item.data() }));
      medals.sort((a, b) => (b.operationDate?.seconds || 0) - (a.operationDate?.seconds || 0));
      renderMedals(medals);
      return medals;
    } catch (error) {
      renderMedals([]);
      if (medalsLabel) medalsLabel.textContent = 'Registro indisponível';
      return [];
    }
  };

  const renderParticipations = participations => {
    if (!memberOperationsList) return;
    memberOperationsList.replaceChildren();
    if (!participations.length) {
      const empty = document.createElement('p');
      empty.className = 'member-operations-empty';
      empty.textContent = 'Nenhuma participação registrada.';
      memberOperationsList.append(empty);
      return;
    }

    participations.forEach(participation => {
      const item = document.createElement('a');
      item.className = 'member-operation-entry';
      item.href = `operacoes.html#${encodeURIComponent(participation.operationId)}`;
      const title = document.createElement('strong');
      title.textContent = participation.title || 'Operação EXBR';
      const status = document.createElement('span');
      const date = participation.startsAt?.toDate?.().toLocaleString('pt-BR') || 'Data em definição';
      status.textContent = `${participation.status === 'confirmed' ? 'Participação confirmada' : 'Registrada'} · ${date}`;
      item.append(title, status);
      memberOperationsList.append(item);
    });
  };

  const loadParticipations = async uid => {
    try {
      const snapshot = await getDocs(collection(db, 'users', uid, 'participations'));
      const participations = snapshot.docs.map(item => ({ id: item.id, ...item.data() }));
      participations.sort((a, b) => (b.joinedAt?.seconds || 0) - (a.joinedAt?.seconds || 0));
      renderParticipations(participations);
      return participations;
    } catch (error) {
      renderParticipations([]);
      return [];
    }
  };

  const syncPublicProfile = async (medals, participations) => {
    if (!isOwner || !currentProfileUid || !currentProfile) return;
    await setDoc(doc(db, 'publicProfiles', currentProfileUid), {
      displayName: currentProfile.displayName || 'Membro EXBR',
      rankId: currentProfile.rankId || 'soldado',
      avatarId: currentProfile.avatarId || 'assalto',
      bannerId: currentProfile.bannerId || 'brasil',
      bio: currentProfile.bio || '',
      favoriteClass: currentProfile.favoriteClass || '',
      favoriteFaction: currentProfile.favoriteFaction || '',
      featuredMedals: medals.slice(0, 5).map(publicMedal),
      recentActivities: participations.slice(0, 3).map(publicActivity),
      updatedAt: serverTimestamp()
    }, { merge: true });
  };

  const ensureProfile = async user => {
    const reference = doc(db, 'users', user.uid);
    const snapshot = await getDoc(reference);
    if (snapshot.exists()) {
      const stored = snapshot.data();
      const profile = { bio: '', favoriteClass: '', favoriteFaction: '', ...stored };
      if (!Object.hasOwn(stored, 'bio') || !Object.hasOwn(stored, 'favoriteClass') || !Object.hasOwn(stored, 'favoriteFaction')) {
        try {
          await updateDoc(reference, {
            bio: profile.bio,
            favoriteClass: profile.favoriteClass,
            favoriteFaction: profile.favoriteFaction,
            updatedAt: serverTimestamp()
          });
        } catch (error) {
          // Mantém compatibilidade enquanto as novas regras ainda não foram publicadas.
        }
      }
      return profile;
    }
    const displayName = user.displayName || user.email?.split('@')[0] || 'Membro EXBR';
    const profile = {
      email: user.email || '',
      displayName,
      role: 'member',
      rankId: 'soldado',
      avatarId: 'assalto',
      bannerId: 'brasil',
      bio: '',
      favoriteClass: '',
      favoriteFaction: '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    try {
      await setDoc(reference, profile);
    } catch (error) {
      const { bio, favoriteClass, favoriteFaction, ...legacyProfile } = profile;
      await setDoc(reference, legacyProfile);
    }
    return { ...profile, createdAt: null, updatedAt: null };
  };

  const renderProfile = profile => {
    const role = profile.role === 'admin' ? 'admin' : 'member';
    if (memberName) memberName.textContent = (profile.displayName || 'Membro EXBR').toUpperCase();
    if (memberRank) {
      memberRank.textContent = ranks.get(profile.rankId) || 'Soldado';
      memberRank.dataset.rankId = profile.rankId || 'soldado';
    }
    if (memberRole) {
      memberRole.textContent = role === 'admin' ? 'Administrador' : 'Membro';
      memberRole.dataset.role = role;
    }
    if (memberStatus) memberStatus.textContent = isOwner ? 'Perfil ativo' : 'Registro consultado';
    document.body.dataset.userRole = viewerProfile?.role === 'admin' ? 'admin' : 'member';
    applyAvatar(avatars.get(profile.avatarId) || avatarOptions[0], false);
    applyBanner(banners.get(profile.bannerId) || bannerOptions[0]);
    const selectedClass = classes.get(profile.favoriteClass);
    const selectedFaction = factions.get(profile.favoriteFaction);
    classOptions.forEach(option => option.setAttribute('aria-pressed', String(option === selectedClass)));
    factionOptions.forEach(option => option.setAttribute('aria-pressed', String(option === selectedFaction)));
    renderFavoriteMarker(favoriteClass, selectedClass?.dataset.symbol || '◇', 'Classe', classNames[profile.favoriteClass]);
    renderFavoriteMarker(favoriteFaction, selectedFaction?.dataset.symbol || '◇', 'Facção', factionNames[profile.favoriteFaction]);
    if (memberBio) memberBio.textContent = profile.bio?.trim() || 'Nenhuma transmissão pessoal registrada.';
    if (bioInput) bioInput.value = profile.bio || '';

    if (isOwner) {
      avatarImage.setAttribute('role', 'button');
      avatarImage.setAttribute('tabindex', '0');
      avatarImage.setAttribute('aria-label', 'Mostrar opções de edição do perfil');
    } else {
      avatarImage.removeAttribute('role');
      avatarImage.removeAttribute('tabindex');
      avatarImage.removeAttribute('aria-label');
      hideOwnerControls();
    }
  };

  loadRanks().then(() => {
    onAuthStateChanged(auth, async user => {
      if (!user) {
        window.location.replace('login.html');
        return;
      }

      currentUser = user;
      try {
        viewerProfile = await ensureProfile(user);
        await loadMedalDefinitions();
        const viewingAnotherProfile = Boolean(requestedUid && requestedUid !== user.uid);
        currentProfileUid = viewingAnotherProfile ? requestedUid : user.uid;
        isOwner = currentProfileUid === user.uid;
        if (viewingAnotherProfile) {
          const collectionName = viewerProfile.role === 'admin' ? 'users' : 'publicProfiles';
          const targetSnapshot = await getDoc(doc(db, collectionName, currentProfileUid));
          if (!targetSnapshot.exists()) {
            window.location.replace('comunidade.html');
            return;
          }
          currentProfile = viewerProfile.role === 'admin'
            ? targetSnapshot.data()
            : { ...targetSnapshot.data(), role: 'member' };
        } else {
          currentProfile = viewerProfile;
        }

        if (commandBar) commandBar.hidden = false;
        if (adminAccess) adminAccess.hidden = viewerProfile.role !== 'admin';
        renderProfile(currentProfile);
        if (viewingAnotherProfile && viewerProfile.role !== 'admin') {
          renderMedals(currentProfile.featuredMedals || []);
          renderParticipations(currentProfile.recentActivities || []);
        } else {
          const [medals, participations] = await Promise.all([loadMedals(currentProfileUid), loadParticipations(currentProfileUid)]);
          if (isOwner) {
            try { await syncPublicProfile(medals, participations); } catch (error) { /* Perfil privado continua disponível. */ }
          }
        }
        document.body.classList.add('profile-ready');
      } catch (error) {
        announce('Não foi possível carregar o perfil. Tente entrar novamente.', true);
      }
    });
  });
});
