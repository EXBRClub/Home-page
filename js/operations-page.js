import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js';
import {
  Timestamp,
  collection,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  writeBatch
} from 'https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js';
import { auth, db } from './firebase-client.js';
import { DEFAULT_AVATAR_ID, normalizeAvatarId } from './avatar-catalog.js?v=20260912-1';
import { archiveImage, shouldArchiveImage } from './cloudinary-images.js?v=20260912-1';
import { applyMedalImage, normalizeMedalIcon } from './medal-images.js?v=20260911-1';

const list = document.querySelector('[data-operations-list]');
const feedback = document.querySelector('[data-operations-feedback]');
const createButton = document.querySelector('[data-operation-create]');
const editor = document.querySelector('[data-operation-editor]');
const editorForm = document.querySelector('[data-operation-form]');
const editorTitle = document.querySelector('#operation-editor-title');
const editorClose = document.querySelector('[data-operation-close]');
const editorFeedback = document.querySelector('[data-operation-editor-feedback]');
const medalSelect = document.querySelector('[data-operation-medal-select]');
const medalPreview = document.querySelector('[data-operation-medal-preview]');
const fallbackImage = '../assets/icons/dock/operacoes.png';

let operations = [];
let medalCatalog = [];
let currentUser = null;
let currentProfile = null;
let appliedOperationIds = new Set();

const isAdmin = () => currentProfile?.role === 'admin';
const setFeedback = (message, state = 'info') => {
  if (!feedback) return;
  feedback.textContent = message;
  feedback.dataset.state = state;
};

const normalizeDate = value => {
  if (!value) return 'Data e horário em definição';
  const date = value?.toDate?.() || new Date(value);
  if (Number.isNaN(date.getTime())) return 'Data e horário em definição';
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long', timeStyle: 'short' }).format(date);
};

const localDateParts = (value = new Date()) => {
  const date = value?.toDate?.() || (value instanceof Date ? value : new Date(value));
  if (Number.isNaN(date.getTime())) return { date: '', time: '20:00' };
  const pad = number => String(number).padStart(2, '0');
  return {
    date: `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`,
    time: `${pad(date.getHours())}:${pad(date.getMinutes())}`
  };
};

const selectedMedal = () => medalCatalog.find(medal => medal.id === medalSelect?.value);

const updateMedalPreview = () => {
  if (!medalPreview) return;
  const medal = selectedMedal();
  medalPreview.replaceChildren();
  medalPreview.hidden = !medal;
  if (!medal) return;
  const image = document.createElement('img');
  applyMedalImage(image, medal.iconUrl);
  const copy = document.createElement('div');
  const name = document.createElement('strong');
  name.textContent = medal.nome;
  const description = document.createElement('small');
  description.textContent = medal.description || 'Condecoração oficial da EXBR.';
  copy.append(name, description);
  medalPreview.append(image, copy);
};

const renderMedalSelector = (catalogId = '', medalName = '') => {
  if (!medalSelect) return;
  medalSelect.replaceChildren();
  const empty = document.createElement('option');
  empty.value = '';
  empty.textContent = 'Sem medalha prevista';
  medalSelect.append(empty);
  medalCatalog.forEach(medal => {
    const option = document.createElement('option');
    option.value = medal.id;
    option.textContent = medal.nome;
    medalSelect.append(option);
  });
  const matchingMedal = medalCatalog.find(medal => medal.id === catalogId)
    || medalCatalog.find(medal => medal.nome === medalName);
  medalSelect.value = matchingMedal?.id || '';
  updateMedalPreview();
};

const loadOperationMedals = async () => {
  const response = await fetch('../data/medalhas.json');
  const data = await response.json();
  const fallback = data.medalhas || [];
  try {
    const snapshot = await getDocs(collection(db, 'medalCatalog'));
    medalCatalog = snapshot.empty ? fallback : snapshot.docs.map(item => ({ id: item.id, ...item.data() }));
  } catch (error) {
    medalCatalog = fallback;
  }
  medalCatalog.sort((first, second) => first.nome.localeCompare(second.nome, 'pt-BR'));
  renderMedalSelector();
};

const createOperationCard = operation => {
  const card = document.createElement('article');
  card.className = 'operation-card';
  card.id = operation.id;

  const identity = document.createElement('div');
  identity.className = 'operation-identity';
  const imageArea = document.createElement('div');
  imageArea.className = 'operation-image';
  const image = document.createElement('img');
  image.src = operation.imageUrl || fallbackImage;
  image.alt = operation.imageUrl ? `Imagem da ${operation.title}` : '';
  image.addEventListener('error', () => {
    if (!image.src.endsWith('/operacoes.png')) image.src = fallbackImage;
  });
  imageArea.append(image);

  const nameplate = document.createElement('div');
  nameplate.className = 'operation-nameplate';
  const kicker = document.createElement('span');
  kicker.textContent = operation.kicker || 'Coordenação';
  const title = document.createElement('h2');
  title.textContent = operation.title || 'Operação EXBR';
  nameplate.append(kicker, title);
  identity.append(imageArea, nameplate);

  const content = document.createElement('div');
  content.className = 'operation-content';
  const description = document.createElement('p');
  description.className = 'operation-description';
  description.textContent = operation.description || 'Informações da operação serão publicadas pela coordenação.';
  const details = document.createElement('p');
  details.className = 'operation-details';
  details.textContent = operation.details || 'Aguarde a confirmação dos objetivos e da formação dos esquadrões.';
  const date = document.createElement('time');
  date.className = 'operation-date';
  date.textContent = normalizeDate(operation.startsAt);

  const reward = document.createElement('div');
  reward.className = 'operation-reward';
  const rewardIcon = document.createElement('span');
  rewardIcon.className = 'operation-reward-icon';
  rewardIcon.setAttribute('aria-hidden', 'true');
  const currentMedal = medalCatalog.find(medal => medal.id === operation.medalCatalogId);
  const rewardImage = document.createElement('img');
  applyMedalImage(rewardImage, currentMedal?.iconUrl || operation.medalIconUrl);
  rewardIcon.append(rewardImage);
  const rewardName = document.createElement('strong');
  rewardName.textContent = currentMedal?.nome || operation.medalName || 'Medalha a definir';
  reward.append(rewardIcon, rewardName);

  const actions = document.createElement('div');
  actions.className = 'operation-actions';
  const edit = document.createElement('button');
  edit.className = 'operation-edit';
  edit.type = 'button';
  edit.textContent = 'Editar';
  edit.hidden = !isAdmin();
  edit.addEventListener('click', () => openEditor(operation));

  const apply = document.createElement('button');
  apply.className = 'operation-apply';
  apply.type = 'button';
  const applied = appliedOperationIds.has(operation.id);
  apply.dataset.applied = String(applied);
  if (applied) {
    apply.textContent = 'Participação registrada';
    apply.disabled = true;
  } else if (operation.status !== 'open') {
    apply.textContent = 'Inscrições encerradas';
    apply.disabled = true;
  } else if (!currentUser) {
    apply.textContent = 'Entrar para participar';
  } else {
    apply.textContent = 'Participar';
  }
  apply.addEventListener('click', () => applyToOperation(operation, apply));
  actions.append(edit, apply);
  content.append(description, details, date, reward, actions);
  card.append(identity, content);
  return card;
};

const render = () => {
  if (!list) return;
  const visible = operations.filter(operation => operation.status !== 'archived' || isAdmin());
  list.replaceChildren();
  if (!visible.length) {
    const empty = document.createElement('p');
    empty.className = 'operations-empty';
    empty.textContent = 'Nenhuma operação publicada no momento.';
    list.append(empty);
    return;
  }
  visible.forEach(operation => list.append(createOperationCard(operation)));
  setFeedback(`${visible.length} operação${visible.length === 1 ? '' : 'ões'} no setor.`, 'success');

  const targetId = decodeURIComponent(window.location.hash.slice(1));
  if (targetId) window.setTimeout(() => document.getElementById(targetId)?.scrollIntoView({ block: 'center' }), 0);
};

const loadOperations = async () => {
  try {
    const snapshot = await getDocs(collection(db, 'operations'));
    operations = snapshot.docs.map(item => ({ id: item.id, source: 'firestore', ...item.data() }));
  } catch (error) {
    operations = [];
  }

  if (!operations.length) {
    const response = await fetch('../data/operacoes.json');
    const data = await response.json();
    operations = data.operacoes.map(operation => ({ ...operation, source: 'fallback' }));
  }

  operations.sort((first, second) => {
    const firstDate = first.startsAt?.seconds ? first.startsAt.seconds * 1000 : new Date(first.startsAt || 0).getTime();
    const secondDate = second.startsAt?.seconds ? second.startsAt.seconds * 1000 : new Date(second.startsAt || 0).getTime();
    return firstDate - secondDate;
  });
  render();
};

const loadParticipations = async () => {
  appliedOperationIds = new Set();
  if (!currentUser) return;
  const results = await Promise.allSettled(operations.map(operation => (
    getDoc(doc(db, 'users', currentUser.uid, 'participations', operation.id))
  )));
  results.forEach((result, index) => {
    if (result.status === 'fulfilled' && result.value.exists()) appliedOperationIds.add(operations[index].id);
  });
};

const applyToOperation = async (operation, button) => {
  if (!currentUser) {
    window.location.href = 'login.html';
    return;
  }
  if (appliedOperationIds.has(operation.id) || operation.status !== 'open') return;

  button.disabled = true;
  button.textContent = 'Registrando…';
  const participation = {
    operationId: operation.id,
    title: operation.title || 'Operação EXBR',
    startsAt: operation.startsAt || null,
    status: 'confirmed',
    userId: currentUser.uid,
    displayName: currentProfile?.displayName || currentUser.displayName || currentUser.email || 'Membro EXBR',
    joinedAt: serverTimestamp()
  };

  try {
    const batch = writeBatch(db);
    batch.set(doc(db, 'users', currentUser.uid, 'participations', operation.id), participation);
    batch.set(doc(db, 'operations', operation.id, 'participants', currentUser.uid), participation);
    await batch.commit();
    try {
      const publicReference = doc(db, 'publicProfiles', currentUser.uid);
      const publicSnapshot = await getDoc(publicReference);
      const recentActivities = [participation, ...(publicSnapshot.data()?.recentActivities || [])]
        .filter((activity, index, items) => items.findIndex(item => item.operationId === activity.operationId) === index)
        .slice(0, 3);
      await setDoc(publicReference, {
        displayName: currentProfile?.displayName || currentUser.displayName || 'Membro EXBR',
        rankId: currentProfile?.rankId || 'soldado',
        avatarId: normalizeAvatarId(currentProfile?.avatarId || DEFAULT_AVATAR_ID),
        bannerId: currentProfile?.bannerId || 'brasil',
        featuredMedals: publicSnapshot.data()?.featuredMedals || [],
        recentActivities,
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (error) {
      // A participação principal foi salva; o resumo público será sincronizado no próximo acesso.
    }
    appliedOperationIds.add(operation.id);
    button.dataset.applied = 'true';
    button.textContent = 'Participação registrada';
    setFeedback(`Sua participação em ${operation.title} foi registrada no perfil.`, 'success');
  } catch (error) {
    button.disabled = false;
    button.textContent = 'Participar';
    setFeedback('Não foi possível registrar a participação. Verifique as regras do Firestore.', 'error');
  }
};

const openEditor = (operation = null) => {
  if (!editor || !editorForm || !isAdmin()) return;
  editorForm.reset();
  editorForm.elements.operationId.value = operation?.id || '';
  editorForm.elements.title.value = operation?.title || '';
  editorForm.elements.kicker.value = operation?.kicker || 'Coordenação';
  editorForm.elements.description.value = operation?.description || '';
  editorForm.elements.details.value = operation?.details || '';
  const dateParts = localDateParts(operation?.startsAt || new Date());
  editorForm.elements.operationDate.value = dateParts.date;
  editorForm.elements.operationTime.value = dateParts.time || '20:00';
  editorForm.elements.status.value = operation?.status || 'open';
  editorForm.elements.imageUrl.value = operation?.imageUrl || '';
  renderMedalSelector(operation?.medalCatalogId || '', operation?.medalName || '');
  if (editorTitle) editorTitle.textContent = operation ? 'Editar operação' : 'Nova operação';
  if (editorFeedback) editorFeedback.textContent = 'As alterações serão publicadas ao salvar.';
  editor.showModal();
};

const saveOperation = async event => {
  event.preventDefault();
  if (!editorForm || !isAdmin()) return;
  const submit = editorForm.querySelector('[type="submit"]');
  const id = editorForm.elements.operationId.value || doc(collection(db, 'operations')).id;
  const operationDate = editorForm.elements.operationDate.value;
  const operationTime = editorForm.elements.operationTime.value || '20:00';
  const medal = selectedMedal();
  const imageUrlInput = editorForm.elements.imageUrl.value.trim();
  const operation = {
    title: editorForm.elements.title.value.trim(),
    kicker: editorForm.elements.kicker.value.trim(),
    description: editorForm.elements.description.value.trim(),
    details: editorForm.elements.details.value.trim(),
    startsAt: Timestamp.fromDate(new Date(`${operationDate}T${operationTime}:00`)),
    status: editorForm.elements.status.value,
    imageUrl: imageUrlInput,
    medalCatalogId: medal?.id || '',
    medalName: medal?.nome || '',
    medalDescription: medal?.description || '',
    medalIconUrl: medal ? normalizeMedalIcon(medal.iconUrl) : '',
    updatedAt: serverTimestamp()
  };

  submit.disabled = true;
  if (editorFeedback) editorFeedback.textContent = imageUrlInput ? 'Arquivando imagem e salvando operação…' : 'Salvando operação…';
  try {
    if (imageUrlInput) operation.imageUrl = await archiveImage(imageUrlInput);
    await setDoc(doc(db, 'operations', id), operation, { merge: true });
    editor.close();
    await loadOperations();
    setFeedback(`${operation.title} salva e publicada.`, 'success');
  } catch (error) {
    if (editorFeedback) editorFeedback.textContent = error.message || 'Não foi possível arquivar e salvar a operação.';
  } finally {
    submit.disabled = false;
  }
};

const migrateOperationImages = async () => {
  if (!isAdmin()) return;
  let changed = false;
  operations = await Promise.all(operations.map(async operation => {
    if (operation.source !== 'firestore' || !shouldArchiveImage(operation.imageUrl)) return operation;
    try {
      const imageUrl = await archiveImage(operation.imageUrl);
      await setDoc(doc(db, 'operations', operation.id), { imageUrl, updatedAt: serverTimestamp() }, { merge: true });
      changed = true;
      return { ...operation, imageUrl };
    } catch (error) {
      return operation;
    }
  }));
  if (changed) render();
};

createButton?.addEventListener('click', () => openEditor());
medalSelect?.addEventListener('change', updateMedalPreview);
[...document.querySelectorAll('input[type="date"], input[type="time"]')].forEach(field => field.addEventListener('click', () => {
  try { field.showPicker?.(); } catch (error) { /* Mantém a edição manual em navegadores sem showPicker. */ }
}));
editorClose?.addEventListener('click', () => editor?.close());
editor?.addEventListener('click', event => { if (event.target === editor) editor.close(); });
editorForm?.addEventListener('submit', saveOperation);

await loadOperations();

onAuthStateChanged(auth, async user => {
  currentUser = user;
  currentProfile = null;
  if (user) {
    try {
      const snapshot = await getDoc(doc(db, 'users', user.uid));
      if (snapshot.exists()) currentProfile = snapshot.data();
    } catch (error) {
      currentProfile = null;
    }
  }
  if (user) await loadOperationMedals();
  if (isAdmin()) await migrateOperationImages();
  if (createButton) createButton.hidden = !isAdmin();
  await loadParticipations();
  render();
});
