import { collection, getDocs } from 'https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js';
import { db } from './firebase-client.js';

const container = document.querySelector('[data-home-operations]');
const fallbackImage = 'assets/icons/dock/operacoes.png';

const normalizeDate = value => {
  if (!value) return '';
  const date = value?.toDate?.() || new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(date);
};

const render = operations => {
  if (!container) return;
  container.replaceChildren();

  operations.slice(0, 3).forEach(operation => {
    const link = document.createElement('a');
    link.className = 'operation-preview-card';
    link.href = `pages/operacoes.html#${encodeURIComponent(operation.id)}`;
    link.setAttribute('aria-label', `Abrir ${operation.title}`);

    const imageArea = document.createElement('span');
    imageArea.className = 'operation-preview-image';
    const image = document.createElement('img');
    image.src = operation.imageUrl || fallbackImage;
    image.alt = operation.imageUrl ? `Imagem da ${operation.title}` : '';
    image.addEventListener('error', () => { image.src = fallbackImage; });
    imageArea.append(image);

    const kicker = document.createElement('p');
    kicker.className = 'module-kicker';
    kicker.textContent = operation.kicker || 'Coordenação';
    const title = document.createElement('h3');
    title.textContent = operation.title || 'Operação EXBR';
    const description = document.createElement('p');
    description.textContent = operation.description || 'Informações serão publicadas pela coordenação.';
    const date = document.createElement('span');
    date.className = 'operation-preview-meta';
    date.textContent = normalizeDate(operation.startsAt) || 'Data em definição';
    const open = document.createElement('span');
    open.className = 'operation-preview-open';
    open.textContent = 'Ver operação ↗';

    link.append(imageArea, kicker, title, description, date, open);
    container.append(link);
  });
};

const load = async () => {
  if (!container) return;
  let operations = [];
  try {
    const snapshot = await getDocs(collection(db, 'operations'));
    operations = snapshot.docs
      .map(item => ({ id: item.id, ...item.data() }))
      .filter(operation => operation.status !== 'archived');
  } catch (error) {
    // O arquivo local mantém a Home útil se o Firebase estiver indisponível.
  }

  if (!operations.length) {
    const response = await fetch('data/operacoes.json');
    const data = await response.json();
    operations = data.operacoes;
  }

  operations.sort((a, b) => {
    const first = a.startsAt?.seconds ? a.startsAt.seconds * 1000 : new Date(a.startsAt || 0).getTime();
    const second = b.startsAt?.seconds ? b.startsAt.seconds * 1000 : new Date(b.startsAt || 0).getTime();
    return first - second;
  });
  render(operations);
};

load().catch(() => {
  if (container) container.innerHTML = '<p class="operations-loading">Operações temporariamente indisponíveis.</p>';
});
