const CLOUDINARY_ROOT = 'https://res.cloudinary.com/uofznsju/image/upload';

export const DEFAULT_BANNER_ID = 'Bunner_022';

const BANNER_VERSIONS = [
  ['Bunner_01', 1789234589],
  ['Bunner_02', 1789234590],
  ['Bunner_03', 1789234590],
  ['Bunner_04', 1789234592],
  ['Bunner_05', 1789234593],
  ['Bunner_06', 1789234595],
  ['Bunner_07', 1789234596],
  ['Bunner_08', 1789234597],
  ['Bunner_09', 1789234599],
  ['Bunner_010', 1789234600],
  ['Bunner_011', 1789234602],
  ['Bunner_012', 1789234603],
  ['Bunner_013', 1789234605],
  ['Bunner_014', 1789234606],
  ['Bunner_015', 1789234607],
  ['Bunner_016', 1789234609],
  ['Bunner_017', 1789234610],
  ['Bunner_018', 1789234611],
  ['Bunner_019', 1789234613],
  ['Bunner_020', 1789234614],
  ['Bunner_021', 1789234615],
  ['Bunner_022', 1789234617]
];

export const BANNER_CATALOG = BANNER_VERSIONS.map(([id, version], index) => ({
  id,
  version,
  name: `Banner ${String(index + 1).padStart(2, '0')}`
}));

const LEGACY_BANNER_ALIASES = new Map([
  ['brasil', DEFAULT_BANNER_ID],
  ['comando', DEFAULT_BANNER_ID],
  ['noturna', DEFAULT_BANNER_ID]
]);

const BANNERS_BY_ID = new Map(BANNER_CATALOG.map(banner => [banner.id, banner]));

export const normalizeBannerId = bannerId => {
  const normalized = LEGACY_BANNER_ALIASES.get(bannerId) || bannerId;
  return BANNERS_BY_ID.has(normalized) ? normalized : DEFAULT_BANNER_ID;
};

export const bannerDefinition = bannerId => BANNERS_BY_ID.get(normalizeBannerId(bannerId));

export const bannerSource = (bannerId, variant = 'profile') => {
  const banner = bannerDefinition(bannerId);
  const transformation = variant === 'thumb'
    ? 'f_auto,q_auto,c_fill,w_240,h_150'
    : 'f_auto,q_auto,c_limit,w_1800,h_1800';
  return `${CLOUDINARY_ROOT}/${transformation}/v${banner.version}/${banner.id}`;
};
