const imageExtensions = /\.(?:avif|gif|jpe?g|png|webp)(?:$|[?#])/i;
const videoExtensions = /\.(?:m4v|mov|mp4|og[gv]|webm)(?:$|[?#])/i;

export const normalizeExternalUrl = value => {
  try {
    const url = new URL(value?.trim());
    return url.protocol === 'https:' ? url.href : '';
  } catch (error) {
    return '';
  }
};

const youtubeId = url => {
  if (url.hostname === 'youtu.be') return url.pathname.split('/').filter(Boolean)[0] || '';
  if (!/(^|\.)youtube\.com$/.test(url.hostname)) return '';
  if (url.pathname === '/watch') return url.searchParams.get('v') || '';
  const parts = url.pathname.split('/').filter(Boolean);
  return ['embed', 'shorts', 'live'].includes(parts[0]) ? (parts[1] || '') : '';
};

const vimeoId = url => {
  if (!/(^|\.)vimeo\.com$/.test(url.hostname)) return '';
  return url.pathname.split('/').filter(Boolean).find(part => /^\d+$/.test(part)) || '';
};

export const inferMediaType = (value, preferred = 'auto') => {
  const normalized = normalizeExternalUrl(value);
  if (!normalized) return '';
  const url = new URL(normalized);
  if (preferred === 'image') return 'image';
  if (preferred === 'video') return 'video';
  if (youtubeId(url) || vimeoId(url) || videoExtensions.test(normalized)) return 'video';
  if (imageExtensions.test(normalized)) return 'image';
  return '';
};

export const createMediaElement = (item, options = {}) => {
  const normalized = normalizeExternalUrl(item.url);
  const type = inferMediaType(normalized, item.type);
  if (!normalized || !type) return null;
  const url = new URL(normalized);
  const title = item.title || 'Registro da comunidade EXBR';
  const youtube = youtubeId(url);
  const vimeo = vimeoId(url);

  if (youtube || vimeo) {
    const frame = document.createElement('iframe');
    frame.src = youtube
      ? `https://www.youtube-nocookie.com/embed/${encodeURIComponent(youtube)}`
      : `https://player.vimeo.com/video/${encodeURIComponent(vimeo)}`;
    frame.title = title;
    frame.loading = 'lazy';
    frame.referrerPolicy = 'strict-origin-when-cross-origin';
    frame.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
    frame.allowFullscreen = true;
    return frame;
  }

  if (type === 'video') {
    const video = document.createElement('video');
    video.src = normalized;
    video.controls = true;
    video.preload = 'metadata';
    video.playsInline = true;
    video.title = title;
    video.referrerPolicy = 'no-referrer';
    return video;
  }

  const image = document.createElement('img');
  image.src = normalized;
  image.alt = title;
  image.loading = 'lazy';
  image.decoding = 'async';
  image.referrerPolicy = 'no-referrer';
  image.addEventListener('error', () => options.onError?.(image), { once: true });
  return image;
};
