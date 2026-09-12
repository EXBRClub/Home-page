export const defaultMedalIcon = '../assets/icons/dock/recrutamento.png';

const siteRoot = new URL('../', import.meta.url);
const fallbackDisplayUrl = new URL('assets/icons/dock/recrutamento.png?v=20260911-1', siteRoot).href;

const githubRawUrl = url => {
  if (url.hostname !== 'github.com') return url;
  const parts = url.pathname.split('/').filter(Boolean);
  if (parts.length < 5 || parts[2] !== 'blob') return url;
  return new URL(`https://raw.githubusercontent.com/${parts[0]}/${parts[1]}/${parts[3]}/${parts.slice(4).join('/')}`);
};

const localAssetPath = value => {
  const normalized = value.replace(/\\/g, '/').replace(/^\.\//, '');
  const match = normalized.match(/^(?:\.\.\/)*\/?assets\/(.+)$/i);
  return match ? `../assets/${match[1]}` : null;
};

export const isValidPngUrl = value => {
  if (!value?.trim()) return false;
  if (localAssetPath(value.trim())) return true;
  try {
    const url = githubRawUrl(new URL(value.trim(), window.location.href));
    return url.protocol === 'https:' && decodeURIComponent(url.pathname).toLocaleLowerCase().endsWith('.png');
  } catch (error) {
    return false;
  }
};

export const isImportableMedalImage = value => {
  if (!value?.trim()) return false;
  if (localAssetPath(value.trim())) return true;
  try {
    return new URL(value.trim()).protocol === 'https:';
  } catch (error) {
    return false;
  }
};

export const normalizeMedalIcon = value => {
  if (!value?.trim()) return defaultMedalIcon;
  const local = localAssetPath(value.trim());
  if (local) return local;
  try {
    const url = githubRawUrl(new URL(value.trim(), window.location.href));
    if (url.protocol !== 'https:' || !decodeURIComponent(url.pathname).toLocaleLowerCase().endsWith('.png')) {
      return defaultMedalIcon;
    }
    return url.href;
  } catch (error) {
    return defaultMedalIcon;
  }
};

export const resolveMedalIcon = value => {
  const normalized = normalizeMedalIcon(value);
  if (normalized === defaultMedalIcon) return fallbackDisplayUrl;
  const local = localAssetPath(normalized);
  return local ? new URL(local.replace(/^\.\.\//, ''), siteRoot).href : normalized;
};

export const applyMedalImage = (image, value, alt = '') => {
  if (!image) return;
  const source = resolveMedalIcon(value);
  let fallbackApplied = source === fallbackDisplayUrl;
  image.alt = alt;
  image.decoding = 'async';
  image.referrerPolicy = 'no-referrer';
  image.onerror = () => {
    if (fallbackApplied) return;
    fallbackApplied = true;
    image.src = fallbackDisplayUrl;
  };
  image.src = source;
};
