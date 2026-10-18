/**
 * Datos para el Gemelo Digital de Santa Fe
 * Indicadores urbanos y sugerencias de búsqueda catastral
 */

export const CITY_KPIS = [
  { label: 'Población Estimada', value: '425.200', unit: 'hab.', icon: 'ph-users', change: '+1.4%' },
  { label: 'Parcelas Catastrales', value: '84.620', unit: 'activas', icon: 'ph-square-half', change: '100% Digital' },
  { label: 'Superficie Relevada', value: '268', unit: 'km²', icon: 'ph-bounding-box', change: 'Ejido Total' },
  { label: 'Inmuebles Patrimoniales', value: '1.450', unit: 'catalogados', icon: 'ph-landmark', change: 'Ley ROU' },
  { label: 'Cota Media Urbana', value: '15.4', unit: 'm s.n.m.', icon: 'ph-trend-up', change: 'Red IGM' },
  { label: 'Anillo de Defensas', value: '184', unit: 'km', icon: 'ph-shield-check', change: 'Monitoreo 24/7' },
  { label: 'Espacio Verde', value: '9.8', unit: 'm²/hab.', icon: 'ph-tree-evergreen', change: 'Meta ONU: 10m²' }
];

export const SEARCH_SUGGESTIONS = [
  { title: 'Bv. Gálvez 1420 (Candioti Sur)', category: 'Dirección ROU', icon: 'ph-map-pin', center: [-60.6945, -31.6372] },
  { title: 'San Jerónimo 2140 (Centro)', category: 'Dirección ROU', icon: 'ph-map-pin', center: [-60.7100, -31.6505] },
  { title: 'Padrón 142850 (Manzana 112)', category: 'Catastro', icon: 'ph-file-text', center: [-60.7075, -31.6530] },
  { title: 'Padrón 215107 (Manzana 3515)', category: 'Catastro', icon: 'ph-file-text', center: [-60.6960, -31.6370] },
  { title: '25 de Mayo 1830 (Recoleta)', category: 'Dirección ROU', icon: 'ph-map-pin', center: [-60.7040, -31.6420] },
  { title: 'Salta 2951 (Centro Cívico)', category: 'Dirección ROU', icon: 'ph-map-pin', center: [-60.7106, -31.6496] },
  { title: 'Distrito C1 - Centro Comercial', category: 'Zonificación ROU', icon: 'ph-buildings', center: [-60.7088, -31.6494] },
  { title: 'Distrito CP - Corredor Bulevar', category: 'Zonificación ROU', icon: 'ph-buildings', center: [-60.6960, -31.6368] },
  { title: 'Distrito R1 - Residencial Alta Densidad', category: 'Zonificación ROU', icon: 'ph-buildings', center: [-60.7120, -31.6550] }
];
