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
  updateDoc
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
    if (medal.iconUrl) icon.style.setProperty('--medal-image', `url("${medal.iconUrl}")`);
    else icon.textContent = medal.emoji || '🏅';

    const copy = document.createElement('span');
    copy.className = 'catalog-medal-copy';
    const name = document.createElement('strong');
    name.textContent = medal.nome;
    const detail = document.createElement('small');
    detail.textContent = medal.operationName || 'Operação EXBR';
    copy.append(name, detail);

    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.textContent = '+';
    toggle.setAttribute('aria-label', `Adicionar ${medal.nome}`);
    toggle.addEventListener('click', () => addMedal(medal, toggle));
    item.append(icon, copy, toggle);
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
      operationName: operationField?.value.trim() || medal.operationName || 'Operação EXBR',
      operationDate,
      emoji: medal.emoji || '🏅',
      iconUrl: medal.iconUrl || '',
      awardedAt: serverTimestamp()
    });
    setMedalFeedback(`${medal.nome} adicionada ao perfil. É possível concedê-la novamente em outra operação.`, 'success');
    button.disabled = false;
  } catch (error) {
    setMedalFeedback('Não foi possível salvar a medalha.', 'error');
    button.disabled = false;
  }
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
  const [rankResponse, medalResponse, usersSnapshot] = await Promise.all([
    fetch('../data/patentes.json'),
    fetch('../data/medalhas.json'),
    getDocs(collection(db, 'users'))
  ]);
  const rankData = await rankResponse.json();
  const medalData = await medalResponse.json();
  ranks = [...rankData.patentes].sort((a, b) => a.ordem - b.ordem);
  medals = medalData.medalhas;
  users = usersSnapshot.docs.map(item => ({ id: item.id, ...item.data() }));
  users.sort((a, b) => (a.displayName || a.email || '').localeCompare(b.displayName || b.email || '', 'pt-BR'));
  renderUsers();
  setFeedback(`${users.length} membro${users.length === 1 ? '' : 's'} no registro. Duplo clique abre o perfil.`, 'success');
};

search?.addEventListener('input', renderUsers);
medalSearch?.addEventListener('input', renderMedals);
dialogClose?.addEventListener('click', () => dialog?.close());
dialog?.addEventListener('click', event => {
  if (event.target === dialog) dialog.close();
});
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
