const CLOUDINARY_ROOT = 'https://res.cloudinary.com/uofznsju/image/upload';

export const DEFAULT_AVATAR_ID = 'NS_light_assault';

export const LEGACY_AVATAR_ALIASES = {
  assalto: 'NS_light_assault',
  pesado: 'NS_heavy_assault',
  reconhecimento: 'NS_infiltrator'
};

export const AVATAR_GROUPS = ['NC', 'TR', 'VS', 'NS', 'Personalizados'];

export const AVATAR_CATALOG = [
  { id: 'Nc_temperate_forest_light_assault', name: 'NC Light Assault', group: 'NC', version: 1789231964 },
  { id: 'Nc_temperate_forest_heavy_assault', name: 'NC Heavy Assault', group: 'NC', version: 1789231962 },
  { id: 'Nc_temperate_forest_infiltrator', name: 'NC Infiltrator', group: 'NC', version: 1789231963 },
  { id: 'Nc_temperate_forest_engineer', name: 'NC Engineer', group: 'NC', version: 1789231961 },
  { id: 'Nc_temperate_forest_combat_medic', name: 'NC Combat Medic', group: 'NC', version: 1789231960 },
  { id: 'Nc_temperate_forest_max', name: 'NC MAX', group: 'NC', version: 1789231965 },
  { id: 'Tr_temperate_forest_light_assault', name: 'TR Light Assault', group: 'TR', version: 1789231975 },
  { id: 'Tr_temperate_forest_heavy_assault', name: 'TR Heavy Assault', group: 'TR', version: 1789231972 },
  { id: 'Tr_temperate_forest_infiltrator', name: 'TR Infiltrator', group: 'TR', version: 1789231974 },
  { id: 'Tr_temperate_forest_engineer', name: 'TR Engineer', group: 'TR', version: 1789231972 },
  { id: 'Tr_temperate_forest_combat_medic', name: 'TR Combat Medic', group: 'TR', version: 1789231971 },
  { id: 'Tr_temperate_forest_max', name: 'TR MAX', group: 'TR', version: 1789231954 },
  { id: 'Vs_temperate_forest_light_assault', name: 'VS Light Assault', group: 'VS', version: 1789231958 },
  { id: 'Vs_temperate_forest_heavy_assault', name: 'VS Heavy Assault', group: 'VS', version: 1789231956 },
  { id: 'Vs_temperate_forest_infiltrator', name: 'VS Infiltrator', group: 'VS', version: 1789231957 },
  { id: 'Vs_temperate_forest_engineer', name: 'VS Engineer', group: 'VS', version: 1789231955 },
  { id: 'Vs_temperate_forest_combat_medic', name: 'VS Combat Medic', group: 'VS', version: 1789231955 },
  { id: 'Vs_temperate_forest_max', name: 'VS MAX', group: 'VS', version: 1789231959 },
  { id: 'NS_light_assault', name: 'NS Light Assault', group: 'NS', version: 1789231970 },
  { id: 'NS_heavy_assault', name: 'NS Heavy Assault', group: 'NS', version: 1789231968 },
  { id: 'NS_infiltrator', name: 'NS Infiltrator', group: 'NS', version: 1789231969 },
  { id: 'NS_engineer', name: 'NS Engineer', group: 'NS', version: 1789231967 },
  { id: 'NS_combat_medic', name: 'NS Combat Medic', group: 'NS', version: 1789231966 },
  { id: 'personalizado_assalto', name: 'Personalizado Assalto', group: 'Personalizados', local: '../assets/profile/avatars/assalto.webp' },
  { id: 'personalizado_pesado', name: 'Personalizado Pesado', group: 'Personalizados', local: '../assets/profile/avatars/pesado.webp' },
  { id: 'personalizado_reconhecimento', name: 'Personalizado Reconhecimento', group: 'Personalizados', local: '../assets/profile/avatars/reconhecimento.webp' }
];

const avatarMap = new Map(AVATAR_CATALOG.map(avatar => [avatar.id, avatar]));

export const normalizeAvatarId = avatarId => {
  const normalized = LEGACY_AVATAR_ALIASES[avatarId] || avatarId;
  return avatarMap.has(normalized) ? normalized : DEFAULT_AVATAR_ID;
};

export const avatarDefinition = avatarId => avatarMap.get(normalizeAvatarId(avatarId)) || avatarMap.get(DEFAULT_AVATAR_ID);

export const avatarSource = (avatarId, size = 'profile') => {
  const avatar = avatarDefinition(avatarId);
  if (avatar.local) return avatar.local;
  const transformation = size === 'thumb'
    ? 'f_auto,q_auto,c_limit,w_220,h_280'
    : 'f_auto,q_auto,c_limit,w_900,h_1100';
  return `${CLOUDINARY_ROOT}/${transformation}/v${avatar.version}/${avatar.id}`;
};

export const avatarName = avatarId => avatarDefinition(avatarId)?.name || 'NS Light Assault';
