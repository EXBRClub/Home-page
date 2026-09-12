export const cloudinaryConfig = Object.freeze({
  cloudName: 'uofznsju',
  uploadPreset: 'exbr_site_images'
});

const uploadEndpoint = `https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/image/upload`;
const localImagePattern = /^(?:\.\.\/|\.\/|\/)?assets\//i;

const parseHttpsUrl = value => {
  try {
    const url = new URL(String(value || '').trim());
    return url.protocol === 'https:' ? url : null;
  } catch (error) {
    return null;
  }
};

const directSourceUrl = value => {
  const url = parseHttpsUrl(value);
  if (!url || url.hostname !== 'github.com') return url;
  const parts = url.pathname.split('/').filter(Boolean);
  if (parts.length < 5 || parts[2] !== 'blob') return url;
  return new URL(`https://raw.githubusercontent.com/${parts[0]}/${parts[1]}/${parts[3]}/${parts.slice(4).join('/')}`);
};

export const isLocalSiteImage = value => localImagePattern.test(String(value || '').trim());

export const isManagedCloudinaryImage = value => {
  const url = parseHttpsUrl(value);
  return Boolean(url
    && url.hostname === 'res.cloudinary.com'
    && url.pathname.startsWith(`/${cloudinaryConfig.cloudName}/image/upload/`));
};

export const isImportableImage = value => isLocalSiteImage(value) || Boolean(parseHttpsUrl(value));

export const cloudinaryPngUrl = value => {
  const url = parseHttpsUrl(value);
  if (!url || !isManagedCloudinaryImage(url.href)) return String(value || '').trim();
  const marker = '/image/upload/';
  const markerIndex = url.pathname.indexOf(marker);
  let assetPath = url.pathname.slice(markerIndex + marker.length);
  if (!assetPath.startsWith('f_png/')) assetPath = `f_png/${assetPath}`;
  assetPath = assetPath.replace(/\.[a-z0-9]+$/i, '.png');
  url.pathname = `${url.pathname.slice(0, markerIndex)}${marker}${assetPath}`;
  return url.href;
};

export const shouldArchiveImage = value => {
  const trimmed = String(value || '').trim();
  return Boolean(trimmed && !isLocalSiteImage(trimmed) && !isManagedCloudinaryImage(trimmed) && parseHttpsUrl(trimmed));
};

export const archiveImage = async value => {
  const trimmed = String(value || '').trim();
  if (!trimmed || isLocalSiteImage(trimmed)) return trimmed;
  if (isManagedCloudinaryImage(trimmed)) return cloudinaryPngUrl(trimmed);
  const sourceUrl = directSourceUrl(trimmed);
  if (!sourceUrl) throw new Error('Informe uma URL HTTPS válida para a imagem.');

  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 45000);
  const body = new FormData();
  body.append('file', sourceUrl.href);
  body.append('upload_preset', cloudinaryConfig.uploadPreset);

  try {
    const response = await fetch(uploadEndpoint, { method: 'POST', body, signal: controller.signal });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || !result.secure_url) {
      throw new Error(result.error?.message || 'O Cloudinary não conseguiu importar esta imagem.');
    }
    return cloudinaryPngUrl(result.secure_url);
  } catch (error) {
    if (error.name === 'AbortError') throw new Error('A importação da imagem demorou demais. Tente novamente.');
    throw error;
  } finally {
    window.clearTimeout(timeout);
  }
};
