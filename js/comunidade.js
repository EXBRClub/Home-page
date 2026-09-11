import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js';
import { collection, doc, getDoc, getDocs, serverTimestamp, setDoc } from 'https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js';
import { auth, db } from './firebase-client.js';
import { applyMedalImage, normalizeMedalIcon } from './medal-images.js?v=20260911-1';

const list = document.querySelector('[data-community-list]');
const search = document.querySelector('[data-community-search]');
const feedback = document.querySelector('[data-community-feedback]');
const avatarSources = {
  assalto: '../assets/profile/avatars/assalto.webp',
  pesado: '../assets/profile/avatars/pesado.webp',
  reconhecimento: '../assets/profile/avatars/reconhecimento.webp'
};

let members = [];
let ranks = new Map();
let medalDefinitions = new Map();

const setFeedback = (message, state = 'info') => {
  if (!feedback) return;
  feedback.textContent = message;
  feedback.dataset.state = state;
};

const publicMedal = medal => ({
  catalogId: medal.catalogId || '',
  name: medal.name || 'Medalha EXBR',
  description: medal.description || '',
  operationName: medal.operationName || 'Operação EXBR',
  operationDate: medal.operationDate || null,
  iconUrl: normalizeMedalIcon(medal.iconUrl)
});

const publicActivity = participation => ({
  operationId: participation.operationId || participation.id || '',
  title: participation.title || 'Operação EXBR',
  status: participation.status || 'confirmed',
  startsAt: participation.startsAt || null,
  joinedAt: participation.joinedAt || null
});

const ensureViewerPublicProfile = async user => {
  const profileSnapshot = await getDoc(doc(db, 'users', user.uid));
  if (!profileSnapshot.exists()) return;
  const profile = profileSnapshot.data();
  const [medalsSnapshot, participationsSnapshot] = await Promise.all([
    getDocs(collection(db, 'users', user.uid, 'medals')),
    getDocs(collection(db, 'users', user.uid, 'participations'))
  ]);
  const medals = medalsSnapshot.docs.map(item => ({ id: item.id, ...item.data() }))
    .sort((a, b) => (b.operationDate?.seconds || 0) - (a.operationDate?.seconds || 0))
    .slice(0, 5)
    .map(publicMedal);
  const activities = participationsSnapshot.docs.map(item => ({ id: item.id, ...item.data() }))
    .sort((a, b) => (b.joinedAt?.seconds || 0) - (a.joinedAt?.seconds || 0))
    .slice(0, 3)
    .map(publicActivity);
  await setDoc(doc(db, 'publicProfiles', user.uid), {
    displayName: profile.displayName || user.displayName || 'Membro EXBR',
    rankId: profile.rankId || 'soldado',
    avatarId: profile.avatarId || 'assalto',
    bannerId: profile.bannerId || 'brasil',
    featuredMedals: medals,
    recentActivities: activities,
    updatedAt: serverTimestamp()
  }, { merge: true });
};

const createMedal = storedMedal => {
  const definition = medalDefinitions.get(storedMedal.catalogId);
  const medal = definition ? {
    ...storedMedal,
    name: definition.nome || storedMedal.name,
    iconUrl: definition.iconUrl || storedMedal.iconUrl
  } : storedMedal;
  const slot = document.createElement('span');
  slot.className = 'community-medal';
  slot.title = medal.name || 'Medalha EXBR';
  const image = document.createElement('img');
  applyMedalImage(image, medal.iconUrl, medal.name || 'Medalha EXBR');
  slot.append(image);
  return slot;
};

const render = () => {
  if (!list) return;
  const term = search?.value.trim().toLocaleLowerCase('pt-BR') || '';
  const visible = members.filter(member => `${member.displayName || ''} ${ranks.get(member.rankId) || ''}`.toLocaleLowerCase('pt-BR').includes(term));
  list.replaceChildren();
  if (!visible.length) {
    const empty = document.createElement('div');
    empty.className = 'community-empty';
    empty.textContent = term ? 'Nenhum membro encontrado.' : 'Nenhum perfil público disponível no momento.';
    list.append(empty);
    return;
  }

  visible.forEach(member => {
    const card = document.createElement('article');
    card.className = 'community-member';
    const avatar = document.createElement('img');
    avatar.className = 'community-avatar';
    avatar.src = avatarSources[member.avatarId] || avatarSources.assalto;
    avatar.alt = '';

    const identity = document.createElement('div');
    identity.className = 'community-identity';
    const name = document.createElement('strong');
    name.textContent = member.displayName || 'Membro EXBR';
    const rank = document.createElement('span');
    rank.className = 'community-rank';
    rank.textContent = ranks.get(member.rankId) || 'Soldado';
    const activity = document.createElement('span');
    activity.className = 'community-activity';
    const latest = member.recentActivities?.[0];
    if (latest) {
      activity.append('Atividade recente: ');
      const activityName = document.createElement('b');
      activityName.textContent = latest.title || 'Operação EXBR';
      activity.append(activityName);
    } else {
      activity.textContent = 'Disponível na comunidade';
    }
    identity.append(name, rank, activity);

    const featured = document.createElement('div');
    featured.className = 'community-featured';
    const featuredLabel = document.createElement('span');
    featuredLabel.className = 'community-featured-label';
    featuredLabel.textContent = 'Medalhas em destaque';
    const medals = document.createElement('div');
    medals.className = 'community-medals';
    (member.featuredMedals || []).slice(0, 5).forEach(medal => medals.append(createMedal(medal)));
    for (let index = medals.children.length; index < 5; index += 1) {
      const empty = document.createElement('span');
      empty.className = 'community-medal community-medal-empty';
      empty.setAttribute('aria-hidden', 'true');
      medals.append(empty);
    }
    featured.append(featuredLabel, medals);

    const profile = document.createElement('a');
    profile.className = 'community-profile-link';
    profile.href = `perfil.html?uid=${encodeURIComponent(member.id)}`;
    profile.textContent = 'Ver perfil';
    card.append(avatar, identity, featured, profile);
    list.append(card);
  });
  setFeedback(`${visible.length} membro${visible.length === 1 ? '' : 's'} na rede EXBR.`, 'success');
};

const loadCommunity = async user => {
  try { await ensureViewerPublicProfile(user); } catch (error) { /* O restante da comunidade ainda pode ser carregado. */ }
  const [rankResponse, snapshot, catalogSnapshot] = await Promise.all([
    fetch('../data/patentes.json'),
    getDocs(collection(db, 'publicProfiles')),
    getDocs(collection(db, 'medalCatalog'))
  ]);
  const rankData = await rankResponse.json();
  ranks = new Map(rankData.patentes.map(rank => [rank.id, rank.nome]));
  medalDefinitions = new Map(catalogSnapshot.docs.map(item => [item.id, item.data()]));
  members = snapshot.docs.map(item => ({ id: item.id, ...item.data() }))
    .sort((a, b) => (a.displayName || '').localeCompare(b.displayName || '', 'pt-BR'));
  render();
};

search?.addEventListener('input', render);
onAuthStateChanged(auth, async user => {
  if (!user) {
    window.location.replace('login.html');
    return;
  }
  try {
    await loadCommunity(user);
  } catch (error) {
    setFeedback('Não foi possível carregar a comunidade. Publique as regras atualizadas do Firestore.', 'error');
    if (list) list.innerHTML = '<div class="community-empty">Registro comunitário indisponível.</div>';
  }
});
