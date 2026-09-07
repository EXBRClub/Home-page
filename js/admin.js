import { onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js';
import {
  Timestamp,
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch
} from 'https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js';
import { auth, db } from './firebase-client.js';

const list = document.querySelector('[data-soldier-list]');
const search = document.querySelector('[data-soldier-search]');
const feedback = document.querySelector('[data-admin-feedback]');
const logoutButton = document.querySelector('[data-admin-logout]');
const dialog = document.querySelector('[data-medal-dialog]');
const dialogClose = document.querySelector('[data-medal-dialog-close]');
const medalTarget = document.querySelector('[data-medal-target]');
const medalSearch = document.querySelector('[data-medal-search]');
const medalCatalog = document.querySelector('[data-medal-catalog]');
const medalFeedback = document.querySelector('[data-medal-feedback]');
const operationField = document.querySelector('[data-medal-operation]');
const dateField = document.querySelector('[data-medal-date]');
const medalCreate = document.querySelector('[data-medal-create]');
const medalEditor = document.querySelector('[data-medal-editor]');
const medalEditorForm = document.querySelector('[data-medal-editor-form]');
const medalEditorTitle = document.querySelector('#medal-editor-title');
const medalEditorClose = document.querySelector('[data-medal-editor-close]');
const medalEditorFeedback = document.querySelector('[data-medal-editor-feedback]');

const defaultMedalIcon = '../assets/icons/dock/recrutamento.png';

const avatarSources = {
  assalto: '../assets/profile/avatars/assalto.webp',
  pesado: '../assets/profile/avatars/pesado.webp',
  reconhecimento: '../assets/profile/avatars/reconhecimento.webp'
};

let users = [];
let ranks = [];
let medals = [];
let selectedUser = null;

const setFeedback = (message, state = 'info') => {
  if (!feedback) return;
  feedback.textContent = message;
  feedback.dataset.state = state;
};

const setMedalFeedback = (message, state = 'info') => {
  if (!medalFeedback) return;
  medalFeedback.textContent = message;
  medalFeedback.dataset.state = state;
};

const rankName = rankId => ranks.find(rank => rank.id === rankId)?.nome || 'Soldado';

const isValidPngUrl = value => {
  if (!value?.trim()) return false;
  try {
    return new URL(value.trim(), window.location.href).pathname.toLocaleLowerCase().endsWith('.png');
  } catch (error) {
    return false;
  }
};

const resolveMedalIcon = value => isValidPngUrl(value) ? value.trim() : defaultMedalIcon;

const publicProfileData = user => ({
  displayName: user.displayName || user.email?.split('@')[0] || 'Membro EXBR',
  rankId: user.rankId || 'soldado',
  avatarId: user.avatarId || 'assalto',
  bannerId: user.bannerId || 'brasil',
  updatedAt: serverTimestamp()
});

const publicMedal = medal => ({
  catalogId: medal.catalogId || '',
  name: medal.name || 'Medalha EXBR',
  description: medal.description || '',
  operationName: medal.operationName || 'Operação EXBR',
  operationDate: medal.operationDate || null,
  iconUrl: resolveMedalIcon(medal.iconUrl)
});

const syncPublicMedals = async userId => {
  const snapshot = await getDocs(collection(db, 'users', userId, 'medals'));
  const featuredMedals = snapshot.docs.map(item => ({ id: item.id, ...item.data() }))
    .sort((a, b) => (b.operationDate?.seconds || 0) - (a.operationDate?.seconds || 0))
    .slice(0, 5)
    .map(publicMedal);
  await setDoc(doc(db, 'publicProfiles', userId), { featuredMedals, updatedAt: serverTimestamp() }, { merge: true });
};

const openProfile = uid => {
  window.location.href = `perfil.html?uid=${encodeURIComponent(uid)}`;
};

const renderUsers = () => {
  if (!list) return;
  const term = search?.value.trim().toLocaleLowerCase('pt-BR') || '';
  const visibleUsers = users.filter(user => {
    const searchable = `${user.displayName || ''} ${user.email || ''} ${rankName(user.rankId)}`.toLocaleLowerCase('pt-BR');
    return searchable.includes(term);
  });

  list.replaceChildren();
  if (!visibleUsers.length) {
    const empty = document.createElement('div');
    empty.className = 'admin-empty';
    empty.textContent = term ? 'Nenhum soldado encontrado.' : 'Nenhum membro cadastrado.';
    list.append(empty);
    return;
  }

  visibleUsers.forEach(user => {
    const row = document.createElement('article');
    row.className = 'soldier-row';
    row.tabIndex = 0;
    row.setAttribute('aria-label', `${user.displayName || 'Membro EXBR'}, ${rankName(user.rankId)}. Pressione Enter para abrir o perfil.`);

    const avatar = document.createElement('img');
    avatar.src = avatarSources[user.avatarId] || avatarSources.assalto;
    avatar.alt = '';

    const copy = document.createElement('div');
    copy.className = 'soldier-copy';
    const name = document.createElement('strong');
    name.textContent = user.displayName || user.email || 'Membro EXBR';
    const currentRank = document.createElement('span');
    currentRank.textContent = rankName(user.rankId);
    copy.append(name, currentRank);

    const select = document.createElement('select');
    select.className = 'rank-select';
    select.setAttribute('aria-label', `Alterar patente de ${name.textContent}`);
    ranks.forEach(rank => {
      const option = document.createElement('option');
      option.value = rank.id;
      option.textContent = rank.nome;
      option.selected = rank.id === user.rankId;
      select.append(option);
    });
    select.addEventListener('click', event => event.stopPropagation());
    select.addEventListener('dblclick', event => event.stopPropagation());
    select.addEventListener('change', async event => {
      event.stopPropagation();
      const previousRank = user.rankId;
      select.disabled = true;
      setFeedback(`Atualizando patente de ${name.textContent}…`);
      try {
        await updateDoc(doc(db, 'users', user.id), {
          rankId: select.value,
          updatedAt: serverTimestamp()
        });
        user.rankId = select.value;
        currentRank.textContent = rankName(user.rankId);
        try {
          await setDoc(doc(db, 'publicProfiles', user.id), publicProfileData(user), { merge: true });
        } catch (error) {
          // A patente privada foi salva e o perfil público será sincronizado depois.
        }
        setFeedback(`Patente de ${name.textContent} salva automaticamente.`, 'success');
      } catch (error) {
        select.value = previousRank;
        setFeedback('Não foi possível alterar a patente.', 'error');
      } finally {
        select.disabled = false;
      }
    });

    const medalButton = document.createElement('button');
    medalButton.className = 'add-medal-button';
    medalButton.type = 'button';
    medalButton.textContent = '+ Adicionar medalha';
    medalButton.addEventListener('click', event => {
      event.stopPropagation();
      openMedalDialog(user);
    });
    medalButton.addEventListener('dblclick', event => event.stopPropagation());

    row.addEventListener('dblclick', () => openProfile(user.id));
    row.addEventListener('keydown', event => {
      if (event.key === 'Enter') openProfile(user.id);
    });
    row.append(avatar, copy, select, medalButton);
    list.append(row);
  });
};

const renderMedals = () => {
  if (!medalCatalog) return;
  const term = medalSearch?.value.trim().toLocaleLowerCase('pt-BR') || '';
  const visibleMedals = medals.filter(medal => medal.nome.toLocaleLowerCase('pt-BR').includes(term));
  medalCatalog.replaceChildren();

  visibleMedals.forEach(medal => {
    const item = document.createElement('article');
    item.className = 'catalog-medal';

    const icon = document.createElement('span');
    icon.className = 'catalog-medal-icon';
    icon.setAttribute('aria-hidden', 'true');
    const image = document.createElement('img');
    image.src = resolveMedalIcon(medal.iconUrl);
    image.alt = '';
    image.addEventListener('error', () => {
      if (!image.src.endsWith('/recrutamento.png')) image.src = defaultMedalIcon;
    });
    icon.append(image);

    const copy = document.createElement('span');
    copy.className = 'catalog-medal-copy';
    const name = document.createElement('strong');
    name.textContent = medal.nome;
    const detail = document.createElement('small');
    detail.textContent = medal.description || 'Condecoração oficial da EXBR.';
    copy.append(name, detail);

    const actions = document.createElement('span');
    actions.className = 'catalog-medal-actions';
    const edit = document.createElement('button');
    edit.className = 'catalog-medal-edit';
    edit.type = 'button';
    edit.textContent = '✎';
    edit.setAttribute('aria-label', `Editar ${medal.nome}`);
    edit.addEventListener('click', () => openMedalEditor(medal));
    const add = document.createElement('button');
    add.className = 'catalog-medal-add';
    add.type = 'button';
    add.textContent = '+';
    add.setAttribute('aria-label', `Conceder ${medal.nome}`);
    add.addEventListener('click', () => addMedal(medal, add));
    actions.append(edit, add);
    item.append(icon, copy, actions);
    medalCatalog.append(item);
  });
};

const addMedal = async (medal, button) => {
  if (!selectedUser) return;
  button.disabled = true;
  setMedalFeedback(`Adicionando ${medal.nome}…`);

  try {
    const dateValue = dateField?.value || new Date().toISOString().slice(0, 10);
    const operationDate = Timestamp.fromDate(new Date(`${dateValue}T12:00:00`));
    await addDoc(collection(db, 'users', selectedUser.id, 'medals'), {
      catalogId: medal.id,
      name: medal.nome,
      description: medal.description || '',
      operationName: operationField?.value.trim() || medal.operationName || 'Operação EXBR',
      operationDate,
      iconUrl: resolveMedalIcon(medal.iconUrl),
      awardedAt: serverTimestamp()
    });
    try {
      await syncPublicMedals(selectedUser.id);
    } catch (error) {
      // A concessão permanece válida mesmo se o resumo comunitário estiver indisponível.
    }
    setMedalFeedback(`${medal.nome} adicionada ao perfil. É possível concedê-la novamente em outra operação.`, 'success');
    button.disabled = false;
  } catch (error) {
    setMedalFeedback('Não foi possível salvar a medalha.', 'error');
    button.disabled = false;
  }
};

const openMedalEditor = (medal = null) => {
  if (!medalEditor || !medalEditorForm) return;
  medalEditorForm.reset();
  medalEditorForm.elements.medalId.value = medal?.id || '';
  medalEditorForm.elements.name.value = medal?.nome || '';
  medalEditorForm.elements.description.value = medal?.description || '';
  medalEditorForm.elements.iconUrl.value = medal?.iconUrl === defaultMedalIcon ? '' : (medal?.iconUrl || '');
  if (medalEditorTitle) medalEditorTitle.textContent = medal ? 'Editar medalha' : 'Nova medalha';
  if (medalEditorFeedback) {
    medalEditorFeedback.textContent = medal ? 'Altere os dados e salve o catálogo.' : 'Cadastre uma nova condecoração para a EXBR.';
    medalEditorFeedback.dataset.state = 'info';
  }
  medalEditor.showModal();
};

const saveMedalDefinition = async event => {
  event.preventDefault();
  if (!medalEditorForm) return;
  const iconUrlInput = medalEditorForm.elements.iconUrl.value.trim();
  if (iconUrlInput && !isValidPngUrl(iconUrlInput)) {
    medalEditorFeedback.textContent = 'Informe um caminho ou URL terminado em .png, ou deixe o campo vazio.';
    medalEditorFeedback.dataset.state = 'error';
    return;
  }

  const submit = medalEditorForm.querySelector('[type="submit"]');
  const existingId = medalEditorForm.elements.medalId.value;
  const reference = existingId ? doc(db, 'medalCatalog', existingId) : doc(collection(db, 'medalCatalog'));
  const definition = {
    nome: medalEditorForm.elements.name.value.trim(),
    description: medalEditorForm.elements.description.value.trim(),
    iconUrl: resolveMedalIcon(iconUrlInput),
    updatedAt: serverTimestamp()
  };
  if (!existingId) definition.createdAt = serverTimestamp();

  submit.disabled = true;
  medalEditorFeedback.textContent = 'Salvando medalha…';
  medalEditorFeedback.dataset.state = 'info';
  try {
    await setDoc(reference, definition, { merge: true });
    const saved = { id: reference.id, ...definition, updatedAt: null, createdAt: null };
    const index = medals.findIndex(medal => medal.id === reference.id);
    if (index >= 0) medals[index] = { ...medals[index], ...saved };
    else medals.push(saved);
    medals.sort((first, second) => first.nome.localeCompare(second.nome, 'pt-BR'));
    renderMedals();
    medalEditor.close();
    setMedalFeedback(`${definition.nome} salva no catálogo.`, 'success');
  } catch (error) {
    medalEditorFeedback.textContent = 'Não foi possível salvar. Publique as novas regras do Firestore e tente novamente.';
    medalEditorFeedback.dataset.state = 'error';
  } finally {
    submit.disabled = false;
  }
};

const loadMedalCatalog = async () => {
  const response = await fetch('../data/medalhas.json');
  const data = await response.json();
  const defaults = data.medalhas.map(medal => ({ ...medal, iconUrl: resolveMedalIcon(medal.iconUrl) }));
  let snapshot;
  try {
    snapshot = await getDocs(collection(db, 'medalCatalog'));
    if (!snapshot.empty) return snapshot.docs.map(item => ({ id: item.id, ...item.data() }));
  } catch (error) {
    return defaults;
  }

  const batch = writeBatch(db);
  defaults.forEach(medal => {
    const { id, ...definition } = medal;
    batch.set(doc(db, 'medalCatalog', id), {
      ...definition,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  });
  try {
    await batch.commit();
  } catch (error) {
    setMedalFeedback('Catálogo local carregado. Publique as regras do Firestore para habilitar a edição.', 'error');
  }
  return defaults;
};

const openMedalDialog = user => {
  if (!dialog) return;
  selectedUser = user;
  if (medalTarget) medalTarget.textContent = user.displayName || user.email || 'Membro EXBR';
  if (medalSearch) medalSearch.value = '';
  if (operationField) operationField.value = 'Operação EXBR';
  if (dateField) dateField.value = new Date().toISOString().slice(0, 10);
  setMedalFeedback('Use + para conceder uma medalha. A remoção é feita no perfil do membro.');
  dialog.showModal();
  renderMedals();
};

const loadData = async () => {
  const [rankResponse, medalDefinitions, usersSnapshot] = await Promise.all([
    fetch('../data/patentes.json'),
    loadMedalCatalog(),
    getDocs(collection(db, 'users'))
  ]);
  const rankData = await rankResponse.json();
  ranks = [...rankData.patentes].sort((a, b) => a.ordem - b.ordem);
  medals = medalDefinitions.sort((first, second) => first.nome.localeCompare(second.nome, 'pt-BR'));
  users = usersSnapshot.docs.map(item => ({ id: item.id, ...item.data() }));
  users.sort((a, b) => (a.displayName || a.email || '').localeCompare(b.displayName || b.email || '', 'pt-BR'));
  const publicBatch = writeBatch(db);
  users.forEach(user => publicBatch.set(doc(db, 'publicProfiles', user.id), publicProfileData(user), { merge: true }));
  if (users.length) await publicBatch.commit();
  renderUsers();
  setFeedback(`${users.length} membro${users.length === 1 ? '' : 's'} no registro. Duplo clique abre o perfil.`, 'success');
};

search?.addEventListener('input', renderUsers);
medalSearch?.addEventListener('input', renderMedals);
medalCreate?.addEventListener('click', () => openMedalEditor());
dialogClose?.addEventListener('click', () => dialog?.close());
dialog?.addEventListener('click', event => {
  if (event.target === dialog) dialog.close();
});
medalEditorClose?.addEventListener('click', () => medalEditor?.close());
medalEditor?.addEventListener('click', event => {
  if (event.target === medalEditor) medalEditor.close();
});
medalEditorForm?.addEventListener('submit', saveMedalDefinition);
logoutButton?.addEventListener('click', async () => {
  logoutButton.disabled = true;
  await signOut(auth);
  window.location.replace('login.html');
});

onAuthStateChanged(auth, async user => {
  if (!user) {
    window.location.replace('login.html');
    return;
  }

  try {
    const snapshot = await getDoc(doc(db, 'users', user.uid));
    if (!snapshot.exists() || snapshot.data().role !== 'admin') {
      window.location.replace('perfil.html');
      return;
    }
    await loadData();
  } catch (error) {
    setFeedback('Não foi possível abrir o painel administrativo.', 'error');
  }
});
