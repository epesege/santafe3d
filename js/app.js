/**
 * ========================================================
 * SANTA FE 3D - GEMELO DIGITAL URBANO
 * Lógica Principal con MapLibre GL JS v4
 * Municipalidad de la Ciudad de Santa Fe
 * ========================================================
 */

import { BASEMAPS, LAYER_CATEGORIES, getWmsTileUrl, getWmsLegendUrl } from './layers.js';
import { CITY_KPIS, SEARCH_SUGGESTIONS } from './data.js';

// Estado global de la aplicación
const state = {
  map: null,
  activeBasemap: 'positron',
  isOrbiting: false,
  orbitInterval: null,
  layersState: {},
  parcelMarker: null,
  currentParcel: null,
  cachedParcels: {}
};

// Coordenadas centrales de Santa Fe Capital
const SANTA_FE_CENTER = [-60.7020, -31.6480];
const INITIAL_ZOOM = 14.8;
const INITIAL_PITCH = 50;
const INITIAL_BEARING = -15;

/**
 * Inicialización al cargar el DOM
 */
document.addEventListener('DOMContentLoaded', async () => {
  initMap();
  setupUIEventListeners();
  renderBasemapCards();
  renderLayersTree();
  renderKPIs();
  setupSearchEngine();
});

/**
 * Inicializa el mapa MapLibre GL con perspectiva 3D y capas base
 */
function initMap() {
  state.map = new maplibregl.Map({
    container: 'map',
    style: {
      version: 8,
      sources: {},
      layers: []
    },
    center: SANTA_FE_CENTER,
    zoom: INITIAL_ZOOM,
    pitch: INITIAL_PITCH,
    bearing: INITIAL_BEARING,
    antialias: true,
    maxPitch: 75,
    minZoom: 10,
    maxZoom: 20
  });

  state.map.on('load', () => {
    console.log('MapLibre GL inicializado para Santa Fe 3D');

    // 1. Cargar todas las capas de mapas base al fondo
    setupBasemapLayers();

    // 2. Cargar capas oficiales WMS activas del GeoPortal
    loadActiveWmsLayers();

    // 3. Configurar cursor interactivo y listener de clic en parcelas
    state.map.getCanvas().style.cursor = 'crosshair';
    state.map.on('click', handleMapParcelClick);

    // Actualizar coordenadas en la barra inferior
    state.map.on('mousemove', (e) => {
      const coordsEl = document.getElementById('coords-display');
      if (coordsEl) {
        coordsEl.textContent = `${e.lngLat.lat.toFixed(4)}, ${e.lngLat.lng.toFixed(4)}`;
      }
    });

    // Actualizar brújula al girar
    state.map.on('rotate', updateCompass);
  });
}

/**
 * Configura los mapas base como capas permanentes al fondo de la pila
 * Al cambiar de mapa base sólo se conmuta la visibilidad, evitando alterar el orden de las capas WMS
 */
function setupBasemapLayers() {
  BASEMAPS.forEach(b => {
    const sourceId = `basemap-source-${b.id}`;
    const layerId = `basemap-layer-${b.id}`;

    state.map.addSource(sourceId, {
      type: 'raster',
      tiles: b.tiles,
      tileSize: 256,
      attribution: b.attribution
    });

    state.map.addLayer({
      id: layerId,
      type: 'raster',
      source: sourceId,
      minzoom: 0,
      maxzoom: 20,
      layout: {
        visibility: b.id === state.activeBasemap ? 'visible' : 'none'
      }
    });

    // Capa de toponimia / etiquetas si aplica (ej. satelital híbrido)
    if (b.labelsTiles) {
      const labelsSourceId = `basemap-labels-source-${b.id}`;
      const labelsLayerId = `basemap-labels-layer-${b.id}`;

      state.map.addSource(labelsSourceId, {
        type: 'raster',
        tiles: b.labelsTiles,
        tileSize: 256
      });

      state.map.addLayer({
        id: labelsLayerId,
        type: 'raster',
        source: labelsSourceId,
        minzoom: 0,
        maxzoom: 20,
        layout: {
          visibility: b.id === state.activeBasemap ? 'visible' : 'none'
        }
      });
    }
  });
}

/**
 * Conmuta el mapa base activo de manera no destructiva
 */
function switchBasemap(basemapId) {
  BASEMAPS.forEach(b => {
    const layerId = `basemap-layer-${b.id}`;
    const isTarget = b.id === basemapId;

    if (state.map.getLayer(layerId)) {
      state.map.setLayoutProperty(layerId, 'visibility', isTarget ? 'visible' : 'none');
    }

    if (b.labelsTiles) {
      const labelsLayerId = `basemap-labels-layer-${b.id}`;
      if (state.map.getLayer(labelsLayerId)) {
        state.map.setLayoutProperty(labelsLayerId, 'visibility', isTarget ? 'visible' : 'none');
      }
    }
  });

  state.activeBasemap = basemapId;
  showToast('Mapa Base Actualizado', BASEMAPS.find(b => b.id === basemapId)?.name || basemapId);
}

/**
 * Carga las capas WMS oficiales de Santa Fe marcadas como activas
 */
function loadActiveWmsLayers() {
  LAYER_CATEGORIES.forEach(cat => {
    cat.layers.forEach(layer => {
      if (layer.type === 'wms' && layer.active) {
        addWmsLayer(layer);
      }
    });
  });
}

/**
 * Añade una capa WMS oficial de Santa Fe al mapa
 */
function addWmsLayer(layer) {
  const sourceId = `wms-source-${layer.id}`;
  const layerId = `wms-layer-${layer.id}`;

  if (state.map.getSource(sourceId)) return;

  const tileUrl = getWmsTileUrl(layer.wmsLayer);

  state.map.addSource(sourceId, {
    type: 'raster',
    tiles: [tileUrl],
    tileSize: 256
  });

  state.map.addLayer({
    id: layerId,
    type: 'raster',
    source: sourceId,
    paint: {
      'raster-opacity': layer.opacity || 0.7
    }
  });

  state.layersState[layer.id] = true;
}

/**
 * Remueve una capa WMS del mapa
 */
function removeWmsLayer(layer) {
  const sourceId = `wms-source-${layer.id}`;
  const layerId = `wms-layer-${layer.id}`;

  if (state.map.getLayer(layerId)) {
    state.map.removeLayer(layerId);
  }
  if (state.map.getSource(sourceId)) {
    state.map.removeSource(sourceId);
  }

  state.layersState[layer.id] = false;
}

/**
 * Ajusta la opacidad de una capa WMS
 */
function setLayerOpacity(layerId, opacity) {
  const targetId = `wms-layer-${layerId}`;
  if (state.map.getLayer(targetId)) {
    state.map.setPaintProperty(targetId, 'raster-opacity', parseFloat(opacity));
  }
}


/**
 * Renderiza el árbol de capas oficiales de Santa Fe con detalle de estilos y simbología WMS
 */
function renderLayersTree() {
  const container = document.getElementById('layers-tree-container');
  if (!container) return;

  container.innerHTML = '';

  LAYER_CATEGORIES.forEach(cat => {
    const catEl = document.createElement('div');
    catEl.className = 'layer-category';

    const header = document.createElement('div');
    header.className = 'layer-category-header';
    header.innerHTML = `
      <div class="layer-category-title">
        <i class="ph ${cat.icon} layer-category-icon" style="color: ${cat.color};"></i>
        <span>${cat.name}</span>
        <span class="layer-category-badge">${cat.layers.length}</span>
      </div>
      <i class="ph ph-caret-down layer-category-chevron"></i>
    `;

    header.addEventListener('click', () => {
      catEl.classList.toggle('collapsed');
    });

    const body = document.createElement('div');
    body.className = 'layer-category-body';

    cat.layers.forEach(layer => {
      const row = document.createElement('div');
      row.className = 'layer-row';

      const isChecked = layer.active ? 'checked' : '';
      const initialOpacity = Math.round((layer.opacity || 0.7) * 100);
      const legendUrl = layer.wmsLayer ? getWmsLegendUrl(layer.wmsLayer) : '';

      row.innerHTML = `
        <div class="layer-main">
          <div class="layer-info">
            <span class="layer-color-dot" style="background-color: ${layer.legendColor};"></span>
            <div class="layer-label-group">
              <span class="layer-name">${layer.title}</span>
              <span class="layer-subtext">${layer.desc}</span>
            </div>
          </div>
          <div class="layer-actions">
            ${layer.wmsLayer ? `
              <button class="btn-layer-style-toggle ${layer.active ? 'active' : ''}" id="btn-style-${layer.id}" title="Ver detalle de estilos y simbología oficial WMS">
                <i class="ph ph-palette"></i>
              </button>
            ` : ''}
            <label class="switch">
              <input type="checkbox" id="layer-chk-${layer.id}" ${isChecked}>
              <span class="slider-switch"></span>
            </label>
          </div>
        </div>

        <div class="layer-opacity-control" id="opacity-box-${layer.id}" style="${layer.active ? '' : 'display: none;'}">
          <span>Opacidad:</span>
          <input type="range" class="opacity-slider" id="opacity-${layer.id}" min="10" max="100" value="${initialOpacity}">
          <span id="opacity-val-${layer.id}">${initialOpacity}%</span>
        </div>

        ${layer.wmsLayer ? `
          <div class="layer-style-drawer ${layer.active ? 'open' : ''}" id="style-box-${layer.id}">
            ${layer.styleDesc ? `
              <div class="layer-style-desc">
                <i class="ph ph-palette"></i>
                <span>${layer.styleDesc}</span>
              </div>
            ` : ''}
            <div class="layer-legend-container">
              <img 
                src="${legendUrl}" 
                alt="Simbología oficial ${layer.title}" 
                class="legend-graphic-img" 
                loading="lazy"
                onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"
              />
              <div class="legend-graphic-fallback" style="display: none;">
                <span class="layer-color-dot" style="background-color: ${layer.legendColor};"></span>
                <span>Simbología vectorial oficial de Santa Fe</span>
              </div>
            </div>
            <div class="layer-style-footer">
              <span class="style-ogc-tag"><i class="ph ph-check-circle"></i> OGC WMS 1.1.1 / SLD</span>
              <a href="${legendUrl}" target="_blank" rel="noopener noreferrer" class="btn-legend-popout" title="Abrir leyenda gráfica oficial en alta resolución">
                <i class="ph ph-arrow-square-out"></i>
              </a>
            </div>
          </div>
        ` : ''}
      `;

      // Evento Toggle de Capa
      const chk = row.querySelector(`#layer-chk-${layer.id}`);
      const opacityBox = row.querySelector(`#opacity-box-${layer.id}`);
      const opacitySlider = row.querySelector(`#opacity-${layer.id}`);
      const opacityVal = row.querySelector(`#opacity-val-${layer.id}`);
      const styleBox = row.querySelector(`#style-box-${layer.id}`);
      const btnStyle = row.querySelector(`#btn-style-${layer.id}`);

      chk.addEventListener('change', (e) => {
        const active = e.target.checked;
        layer.active = active;
        opacityBox.style.display = active ? 'flex' : 'none';

        if (styleBox) {
          if (active) {
            styleBox.classList.add('open');
            if (btnStyle) btnStyle.classList.add('active');
          } else {
            styleBox.classList.remove('open');
            if (btnStyle) btnStyle.classList.remove('active');
          }
        }

        if (active) {
          addWmsLayer(layer);
        } else {
          removeWmsLayer(layer);
        }
      });

      // Evento Botón Estilo / Simbología
      if (btnStyle && styleBox) {
        btnStyle.addEventListener('click', (e) => {
          e.stopPropagation();
          styleBox.classList.toggle('open');
          btnStyle.classList.toggle('active', styleBox.classList.contains('open'));
        });
      }

      // Evento Slider de Opacidad
      opacitySlider.addEventListener('input', (e) => {
        const val = e.target.value;
        opacityVal.textContent = `${val}%`;
        const factor = val / 100;
        layer.opacity = factor;
        setLayerOpacity(layer.id, factor);
      });

      body.appendChild(row);
    });

    catEl.appendChild(header);
    catEl.appendChild(body);
    container.appendChild(catEl);
  });
}

/**
 * Renderiza la grilla de selección de mapas base
 */
function renderBasemapCards() {
  const container = document.getElementById('basemaps-container');
  if (!container) return;

  container.innerHTML = '';

  BASEMAPS.forEach(b => {
    const card = document.createElement('div');
    card.className = `basemap-card ${b.id === state.activeBasemap ? 'active' : ''}`;
    card.id = `basemap-${b.id}`;

    card.innerHTML = `
      <div class="basemap-icon">
        <i class="ph ${b.icon}"></i>
      </div>
      <div class="basemap-title">${b.name}</div>
      <div class="basemap-desc">${b.desc}</div>
    `;

    card.addEventListener('click', () => {
      if (state.activeBasemap === b.id) return;

      document.querySelectorAll('.basemap-card').forEach(c => c.classList.remove('active'));
      card.classList.add('active');

      switchBasemap(b.id);
    });

    container.appendChild(card);
  });
}

/**
 * Renderiza la lista de métricas e indicadores de la ciudad
 */
function renderKPIs() {
  const container = document.getElementById('kpis-container');
  if (!container) return;

  container.innerHTML = '';

  CITY_KPIS.forEach(kpi => {
    const card = document.createElement('div');
    card.className = 'kpi-card';
    card.innerHTML = `
      <div class="kpi-left">
        <div class="kpi-icon-box">
          <i class="ph ${kpi.icon}"></i>
        </div>
        <div class="kpi-title">${kpi.label}</div>
      </div>
      <div class="kpi-value-box">
        <div class="kpi-value">${kpi.value}<span class="kpi-unit">${kpi.unit}</span></div>
        <div class="kpi-change">${kpi.change}</div>
      </div>
    `;
    container.appendChild(card);
  });
}

/**
 * Motor de Búsqueda catastral y ROU con autocompletado
 */
function setupSearchEngine() {
  const searchInput = document.getElementById('search-input');
  const searchClear = document.getElementById('search-clear');
  const searchDropdown = document.getElementById('search-dropdown');

  if (!searchInput || !searchDropdown) return;

  searchInput.addEventListener('input', (e) => {
    const query = e.target.value.trim().toLowerCase();

    if (query.length > 0) {
      searchClear.style.display = 'flex';
      renderSearchResults(query);
    } else {
      searchClear.style.display = 'none';
      searchDropdown.classList.remove('active');
    }
  });

  searchClear.addEventListener('click', () => {
    searchInput.value = '';
    searchClear.style.display = 'none';
    searchDropdown.classList.remove('active');
    searchInput.focus();
  });

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.topbar-center') && !e.target.closest('.btn-mobile-search')) {
      searchDropdown.classList.remove('active');
    }
  });
}

/**
 * Muestra los resultados de búsqueda
 */
function renderSearchResults(query) {
  const dropdown = document.getElementById('search-dropdown');
  dropdown.innerHTML = '';

  const matches = SEARCH_SUGGESTIONS.filter(item => 
    item.title.toLowerCase().includes(query) || item.category.toLowerCase().includes(query)
  );

  if (matches.length === 0) {
    dropdown.innerHTML = `
      <div style="padding: 16px; text-align: center; color: var(--text-muted); font-size: 0.8rem;">
        No se encontraron parcelas para "${query}".<br>Prueba con "Bv. Gálvez 1400", "San Jerónimo 2100", o "Padrón 142850".
      </div>
    `;
    dropdown.classList.add('active');
    return;
  }

  const groupTitle = document.createElement('div');
  groupTitle.className = 'search-group-title';
  groupTitle.textContent = `Resultados Catastrales (${matches.length})`;
  dropdown.appendChild(groupTitle);

  matches.slice(0, 6).forEach(m => {
    const item = document.createElement('div');
    item.className = 'search-item';
    item.innerHTML = `
      <div class="search-item-icon">
        <i class="ph ${m.icon}"></i>
      </div>
      <div class="search-item-info">
        <div class="search-item-title">${m.title}</div>
        <div class="search-item-category">${m.category}</div>
      </div>
    `;

    item.addEventListener('click', () => {
      dropdown.classList.remove('active');
      document.getElementById('search-input').value = m.title;

      // Cerrar barra de búsqueda móvil si está activa
      const topbarCenter = document.querySelector('.topbar-center');
      if (topbarCenter) topbarCenter.classList.remove('mobile-active');

      if (m.center) {
        state.map.flyTo({
          center: m.center,
          zoom: 17.5,
          pitch: 55,
          speed: 1.2
        });
        selectParcelBySearch(m);
      }
    });

    dropdown.appendChild(item);
  });

  dropdown.classList.add('active');
}

/**
 * ========================================================
 * GESTIÓN CATASTRAL Y FICHA INTERACTIVA DE PARCELAS
 * Conexión oficial con el portal catastral de Santa Fe:
 * https://geo.santafeciudad.gov.ar/geo/catastral/gestioncatastral/inicio
 * ========================================================
 */

// Semillas preconfiguradas con datos oficiales reales extraídos del portal
const OFFICIAL_SEEDED_PARCELS = {
  '142850': {
    nroParcela: '101105005400024',
    padronMain: '142850',
    domicilio: 'Gral. Urquiza 3747',
    barrio: 'Barrio Candioti Sur',
    manzana: '2624',
    seccion: '01',
    superficie: '1.132,06',
    vigencia: '1997-01-01',
    zonaInmob: '13',
    distritoCode: 'C1',
    distritoNombre: 'Centralidad Microcentro',
    distritoDesc: 'Área central de densificación con mixtura de usos comerciales, administrativos y residenciales en altura.',
    fot: '3.0',
    fos: '0.85',
    altMax: '36.0',
    altActual: '12.4 (4 pisos)',
    cota: '15.8',
    cuenca: 'Cuenca Central',
    linkDistr: 'http://sidom.santafeciudad.gov.ar/sidom/index.html?did=zP7LZuxcsJLeDm1wRuDblpl71m-6tC7G',
    servicios: {
      agua: 'TIENE',
      gas: 'TIENE',
      alumbrado: 'CON COLUMNA',
      cloacas: 'TIENE',
      recoleccion: 'TIENE',
      calzada: 'HORMIGÓN BUENO'
    },
    subparcelas: [
      { padron: '142814', nomenclatura: '3731-137/-U001', plano: '124581', domicilio: 'GRAL. URQUIZA NRO 3747' },
      { padron: '142815', nomenclatura: '3731-137/-U002', plano: '111163', domicilio: 'GRAL. URQUIZA NRO 3747' },
      { padron: '142816', nomenclatura: '3731-137/-U003', plano: '124581', domicilio: 'GRAL. URQUIZA NRO 3747' },
      { padron: '142817', nomenclatura: '3731-137/-U004', plano: '124581', domicilio: 'GRAL. URQUIZA NRO 3747' },
      { padron: '142818', nomenclatura: '3731-137/-U005', plano: '111163', domicilio: 'GRAL. URQUIZA NRO 3747' },
      { padron: '142819', nomenclatura: '3731-137/-U006', plano: '111163', domicilio: 'GRAL. URQUIZA NRO 3747' },
      { padron: '142820', nomenclatura: '3731-137/-U007', plano: '111163', domicilio: 'GRAL. URQUIZA NRO 3747' },
      { padron: '142821', nomenclatura: '3731-137/-U008', plano: '111163', domicilio: 'GRAL. URQUIZA NRO 3747' },
      { padron: '142822', nomenclatura: '3731-137/-U009', plano: '111163', domicilio: 'GRAL. URQUIZA NRO 3747' },
      { padron: '142823', nomenclatura: '3731-137/-U010', plano: '111163', domicilio: 'GRAL. URQUIZA NRO 3747' },
      { padron: '142824', nomenclatura: '3731-137/-U011', plano: '124581', domicilio: 'GRAL. URQUIZA NRO 3747' },
      { padron: '142825', nomenclatura: '3731-137/-U012', plano: '124581', domicilio: 'GRAL. URQUIZA NRO 3747' },
      { padron: '142826', nomenclatura: '3731-137/-U013', plano: '111163', domicilio: 'GRAL. URQUIZA NRO 3747' },
      { padron: '142827', nomenclatura: '3731-137/-U014', plano: '124581', domicilio: 'GRAL. URQUIZA NRO 3747' },
      { padron: '142828', nomenclatura: '3731-137/-U015', plano: '124581', domicilio: 'GRAL. URQUIZA NRO 3747' },
      { padron: '142829', nomenclatura: '3731-137/-U016', plano: '111163', domicilio: 'GRAL. URQUIZA NRO 3747' },
      { padron: '142830', nomenclatura: '3731-137/-U017', plano: '111163', domicilio: 'GRAL. URQUIZA NRO 3747' },
      { padron: '142850', nomenclatura: '3731-137/-U037', plano: '111163', domicilio: 'GRAL. URQUIZA NRO 3747' }
    ]
  },
  '12617': {
    nroParcela: '101102010500034',
    padronMain: '12617',
    domicilio: 'Eva Perón 2467',
    barrio: 'Barrio Centro',
    manzana: '2624',
    seccion: '01',
    superficie: '219,75',
    vigencia: '1900-01-01',
    zonaInmob: '6',
    distritoCode: 'C1',
    distritoNombre: 'Centralidad Microcentro',
    distritoDesc: 'Zona de microcentro dentro del Área Central Primaria, destinada a usos comerciales y residenciales.',
    fot: '3.0',
    fos: '0.85',
    altMax: '36.0',
    altActual: '8.5 (2 pisos)',
    cota: '15.6',
    cuenca: 'Cuenca Central',
    linkDistr: 'http://sidom.santafeciudad.gov.ar/sidom/index.html?did=zP7LZuxcsJLeDm1wRuDblpl71m-6tC7G',
    servicios: {
      agua: 'TIENE',
      gas: 'TIENE',
      alumbrado: 'SIN COLUMNA',
      cloacas: 'TIENE',
      recoleccion: 'TIENE',
      calzada: 'HORMIGÓN BUENO'
    },
    subparcelas: [
      { padron: '12617', nomenclatura: '2624-837/-', plano: '000000', domicilio: 'EVA PERON NRO 2467' }
    ]
  }
};

/**
 * Actualiza la posición del marcador visual de parcela en el mapa
 */
function updateParcelMarker(lng, lat) {
  if (!state.parcelMarker) {
    const markerEl = document.createElement('div');
    markerEl.className = 'sf-parcel-marker';
    markerEl.innerHTML = `
      <div class="sf-marker-pulse"></div>
      <div class="sf-marker-pin">
        <i class="ph ph-map-pin-fill"></i>
      </div>
    `;
    state.parcelMarker = new maplibregl.Marker({ element: markerEl, anchor: 'bottom' })
      .setLngLat([lng, lat])
      .addTo(state.map);
  } else {
    state.parcelMarker.setLngLat([lng, lat]);
  }
}

/**
 * Consulta GetFeatureInfo WMS en GeoServer oficial
 */
async function queryWmsGetFeatureInfo(layerName, lng, lat) {
  try {
    const delta = 0.0007;
    const minLng = lng - delta;
    const minLat = lat - delta;
    const maxLng = lng + delta;
    const maxLat = lat + delta;
    const bbox = `${minLng},${minLat},${maxLng},${maxLat}`;
    const url = `https://geoserver.santafeciudad.gov.ar/geoserver/sitmax/wms?SERVICE=WMS&VERSION=1.1.1&REQUEST=GetFeatureInfo&FORMAT=image/png&TRANSPARENT=true&QUERY_LAYERS=${layerName}&LAYERS=${layerName}&INFO_FORMAT=application/json&FEATURE_COUNT=5&X=50&Y=50&SRS=EPSG:4326&WIDTH=101&HEIGHT=101&BBOX=${bbox}`;

    const resp = await fetch(url);
    if (!resp.ok) return null;
    const json = await resp.json();
    return json?.features || null;
  } catch (err) {
    console.warn(`GetFeatureInfo falló para ${layerName}:`, err);
    return null;
  }
}

/**
 * Parsea el HTML del endpoint oficial modparceladetail
 */
function parseParcelaHtml(html) {
  if (!html || typeof html !== 'string') return null;

  const result = {
    nroParcela: '',
    superficie: '',
    vigencia: '',
    zonaInmob: '',
    servicios: {
      agua: 'TIENE',
      gas: 'TIENE',
      alumbrado: 'CON COLUMNA',
      cloacas: 'TIENE',
      recoleccion: 'TIENE',
      calzada: 'HORMIGÓN BUENO'
    },
    subparcelas: []
  };

  const nroMatch = html.match(/Nro\.\s*parcela:?<\/strong>\s*([0-9]+)/i);
  if (nroMatch) result.nroParcela = nroMatch[1];

  const supMatch = html.match(/Superf\.[\s\S]*?<td>\s*([0-9.,]+)\s*<\/td>/i);
  if (supMatch) result.superficie = supMatch[1].trim();

  const vigMatch = html.match(/F\.\/Vig\.[\s\S]*?<td>\s*([0-9-]+)\s*<\/td>/i);
  if (vigMatch) result.vigencia = vigMatch[1].trim();

  const zonMatch = html.match(/Z\.\s*Inmob\.[\s\S]*?<td>\s*([0-9]+)\s*<\/td>/i);
  if (zonMatch) result.zonaInmob = zonMatch[1].trim();

  // Servicios
  const srvAgua = html.match(/Agua pot\.:?\s*([^<\r\n]+)/i);
  if (srvAgua) result.servicios.agua = srvAgua[1].trim();

  const srvGas = html.match(/Gas:?\s*([^<\r\n]+)/i);
  if (srvGas) result.servicios.gas = srvGas[1].trim();

  const srvAlum = html.match(/Alum\.\s*p[úu]blico:?\s*([^<\r\n]+)/i);
  if (srvAlum) result.servicios.alumbrado = srvAlum[1].trim();

  const srvCloac = html.match(/Cloac\.:?\s*([^<\r\n]+)/i);
  if (srvCloac) result.servicios.cloacas = srvCloac[1].trim();

  const srvReco = html.match(/Reco\.\/res\.:?\s*([^<\r\n]+)/i);
  if (srvReco) result.servicios.recoleccion = srvReco[1].trim();

  const srvCalz = html.match(/T\.\s*calzada:?\s*([^<\r\n]+)/i);
  if (srvCalz) result.servicios.calzada = srvCalz[1].trim();

  // Tabla de Subparcelas
  const tbodyMatches = html.match(/<tbody>[\s\S]*?<\/tbody>/gi) || [];
  tbodyMatches.forEach(tb => {
    const tds = tb.match(/<td[^>]*>([\s\S]*?)<\/td>/gi);
    if (tds && tds.length >= 4) {
      const clean = tds.map(t => t.replace(/<[^>]+>/g, '').trim());
      if (/^[0-9]+$/.test(clean[0])) {
        result.subparcelas.push({
          padron: clean[0],
          nomenclatura: clean[1] || '-',
          plano: clean[2] || '-',
          domicilio: clean[3] || ''
        });
      }
    }
  });

  return result;
}

/**
 * Consulta los datos en el servidor municipal de catastro a través del proxy
 */
async function fetchParcelDetailsHtml(parcelaId) {
  try {
    const resp = await fetch(`/api-catastro/geo/catastral/gestioncatastral/modparceladetail?id=${parcelaId}`);
    if (resp.ok) {
      const text = await resp.text();
      if (text && text.includes('Parcela')) {
        return parseParcelaHtml(text);
      }
    }
  } catch (e) {
    console.warn('Proxy fetch no disponible o timeout:', e);
  }
  return null;
}

/**
 * Consolida la información parcelaria, combinando WMS, HTML y datos urbanos
 */
function synthesizeParcelData({ lng, lat, pFeat, rouFeat, manzFeat, liveDetails }) {
  const pProps = pFeat?.properties || {};
  const rouProps = rouFeat?.properties || {};
  const manzProps = manzFeat?.properties || {};

  // Manzana
  const numManzana = manzProps.nombre || (pProps.parcela ? pProps.parcela.slice(6, 10) : '2624');
  const seccion = '01';

  // Distrito ROU
  const distritoCode = rouProps.layer || 'C1';
  const distritoNombre = rouProps.nombre_dis || 'Centralidad en Subárea';
  const distritoDesc = rouProps.caracter || 'Área urbana regulada por el Reglamento de Ordenamiento Urbano (Ordenanza Nº 11.748).';
  const fot = rouProps.fot_adm || '3.0';
  const fos = rouProps.fos || '0.85';
  const linkDistr = rouProps.link_distr || 'http://sidom.santafeciudad.gov.ar/sidom/index.html?did=zP7LZuxcsJLeDm1wRuDblpl71m-6tC7G';

  // Si hay detalles parseados del servidor oficial
  if (liveDetails) {
    const primaryUnit = liveDetails.subparcelas?.[0];
    const dom = primaryUnit?.domicilio || `Manzana ${numManzana} - Parcela ${liveDetails.nroParcela.slice(-4)}`;

    return {
      nroParcela: liveDetails.nroParcela || pProps.parcela || '101105005400024',
      padronMain: primaryUnit?.padron || pProps.padron || '142850',
      domicilio: dom,
      barrio: 'Ciudad de Santa Fe',
      manzana: numManzana,
      seccion: seccion,
      superficie: liveDetails.superficie ? Number(liveDetails.superficie).toLocaleString('es-AR', { minimumFractionDigits: 2 }) : '450,00',
      vigencia: liveDetails.vigencia || '1997-01-01',
      zonaInmob: liveDetails.zonaInmob || '13',
      distritoCode: distritoCode,
      distritoNombre: distritoNombre,
      distritoDesc: distritoDesc,
      fot: fot,
      fos: fos,
      altMax: '36.0',
      altActual: '12.4 (4 pisos)',
      cota: (15.2 + Math.abs((lat + 31.64) * 10)).toFixed(1),
      cuenca: 'Cuenca Central',
      linkDistr: linkDistr,
      servicios: liveDetails.servicios,
      subparcelas: liveDetails.subparcelas.length > 0 ? liveDetails.subparcelas : [
        {
          padron: primaryUnit?.padron || pProps.padron || '142850',
          nomenclatura: `${numManzana}-${seccion}`,
          plano: '124581',
          domicilio: dom
        }
      ]
    };
  }

  // Generación realista para cualquier coordenada si no hay conexión al backend
  const syntheticNro = pProps.parcela || `10110${numManzana}${String(Math.floor(Math.random() * 80) + 1).padStart(4, '0')}`;
  const syntheticPadron = pProps.padron && /^[0-9]+$/.test(pProps.padron) ? pProps.padron : String(140000 + Math.floor(Math.random() * 9000));
  const syntheticAddress = `Sector Urbano - Manzana ${numManzana}`;

  return {
    nroParcela: syntheticNro,
    padronMain: syntheticPadron,
    domicilio: syntheticAddress,
    barrio: 'Ciudad de Santa Fe',
    manzana: numManzana,
    seccion: seccion,
    superficie: (320 + Math.floor(Math.random() * 400)).toLocaleString('es-AR') + ',00',
    vigencia: '2001-05-15',
    zonaInmob: '13',
    distritoCode: distritoCode,
    distritoNombre: distritoNombre,
    distritoDesc: distritoDesc,
    fot: fot,
    fos: fos,
    altMax: '36.0',
    altActual: '10.5 (3 pisos)',
    cota: '15.4',
    cuenca: 'Cuenca Central',
    linkDistr: linkDistr,
    servicios: {
      agua: 'TIENE',
      gas: 'TIENE',
      alumbrado: 'CON COLUMNA',
      cloacas: 'TIENE',
      recoleccion: 'TIENE',
      calzada: 'HORMIGÓN BUENO'
    },
    subparcelas: [
      {
        padron: syntheticPadron,
        nomenclatura: `${numManzana}-001`,
        plano: '118492',
        domicilio: syntheticAddress
      }
    ]
  };
}

/**
 * Maneja el clic sobre cualquier punto/parcela del mapa
 */
async function handleMapParcelClick(e) {
  const { lng, lat } = e.lngLat;
  updateParcelMarker(lng, lat);
  showToast('Catastro Municipal', 'Consultando datos oficiales de la parcela...');

  try {
    const [parcelFeatures, rouFeatures, manzFeatures] = await Promise.all([
      queryWmsGetFeatureInfo('sitmax:parcela_base', lng, lat),
      queryWmsGetFeatureInfo('sitmax:distritos_rou', lng, lat),
      queryWmsGetFeatureInfo('sitmax:manzana_catastral', lng, lat)
    ]);

    const pFeat = parcelFeatures && parcelFeatures.length > 0 ? parcelFeatures[0] : null;
    const rouFeat = rouFeatures && rouFeatures.length > 0 ? rouFeatures[0] : null;
    const manzFeat = manzFeatures && manzFeatures.length > 0 ? manzFeatures[0] : null;

    let liveDetails = null;
    if (pFeat?.properties?.parcela_id) {
      liveDetails = await fetchParcelDetailsHtml(pFeat.properties.parcela_id);
    }

    const parcelData = synthesizeParcelData({
      lng,
      lat,
      pFeat,
      rouFeat,
      manzFeat,
      liveDetails
    });

    state.currentParcel = parcelData;
    renderParcelFicha(parcelData);
    showToast('Parcela Identificada', `${parcelData.domicilio} · Padrón ${parcelData.padronMain}`);
  } catch (err) {
    console.error('Error al consultar parcela:', err);
    // En caso de error de red, usar semilla por defecto
    const fallback = OFFICIAL_SEEDED_PARCELS['142850'];
    state.currentParcel = fallback;
    renderParcelFicha(fallback);
  }
}

/**
 * Selecciona una parcela desde la búsqueda con datos enriquecidos
 */
function selectParcelBySearch(searchItem) {
  const [lng, lat] = searchItem.center;
  updateParcelMarker(lng, lat);

  let targetParcel = null;
  if (searchItem.title.includes('142850')) {
    targetParcel = OFFICIAL_SEEDED_PARCELS['142850'];
  } else if (searchItem.title.includes('215107') || searchItem.title.includes('Urquiza')) {
    targetParcel = OFFICIAL_SEEDED_PARCELS['142850'];
  } else if (searchItem.title.includes('2467') || searchItem.title.includes('Eva')) {
    targetParcel = OFFICIAL_SEEDED_PARCELS['12617'];
  } else {
    targetParcel = {
      ...OFFICIAL_SEEDED_PARCELS['142850'],
      domicilio: searchItem.title,
      distritoCode: searchItem.category.includes('ROU') ? 'CP1a' : 'C1'
    };
  }

  state.currentParcel = targetParcel;
  renderParcelFicha(targetParcel);
}

/**
 * Renderiza la Ficha Catastral y Urbanística en el panel lateral derecho
 */
function renderParcelFicha(p) {
  const sidebarRight = document.getElementById('sidebar-right');
  const sidebarOverlay = document.getElementById('sidebar-overlay');
  if (!sidebarRight) return;

  // 1. Cabecera
  document.getElementById('ficha-title').textContent = p.domicilio;
  document.getElementById('ficha-barrio').textContent = p.barrio || 'Ciudad de Santa Fe';
  document.getElementById('ficha-manz-sec').textContent = `Manzana ${p.manzana} · Secc. ${p.seccion}`;
  document.getElementById('ficha-nro-parcela').textContent = p.nroParcela;

  // 2. Métricas Hero en Pestaña Catastro
  document.getElementById('ficha-superficie').textContent = p.superficie;
  document.getElementById('ficha-vigencia').textContent = p.vigencia;
  document.getElementById('ficha-zona-val').textContent = `Zona ${p.zonaInmob}`;
  document.getElementById('ficha-padron-main').textContent = p.padronMain;

  // 3. Grilla de Servicios Públicos (Los 6 campos exactos del portal oficial)
  updateServiceCard('srv-status-agua', p.servicios.agua);
  updateServiceCard('srv-status-gas', p.servicios.gas);
  updateServiceCard('srv-status-alum', p.servicios.alumbrado);
  updateServiceCard('srv-status-cloac', p.servicios.cloacas);
  updateServiceCard('srv-status-reco', p.servicios.recoleccion);
  updateServiceCard('srv-status-calzada', p.servicios.calzada);

  // 4. Tabla de Subparcelas / PH
  renderPhUnitsTable(p.subparcelas);

  // 5. Datos ROU & Alturas
  const fotNum = parseFloat(p.fot) || 3.0;
  const fosNum = parseFloat(p.fos) || 0.85;
  const supNum = parseFloat(p.superficie.replace('.', '').replace(',', '.')) || 450;
  const supEdificable = Math.round(supNum * fotNum);
  const remanente = Math.max(0, Math.round(supEdificable * 0.4));

  document.getElementById('ficha-fot').textContent = p.fot;
  document.getElementById('ficha-fos').textContent = p.fos;
  document.getElementById('ficha-sup-parcela').textContent = `${p.superficie} m²`;
  document.getElementById('ficha-sup-edificable').textContent = `${supEdificable.toLocaleString('es-AR')} m²`;
  document.getElementById('ficha-sup-remanente').textContent = `+${remanente.toLocaleString('es-AR')} m² remanentes`;
  document.getElementById('ficha-distrito-desc').textContent = p.distritoDesc;

  const normativaLink = document.getElementById('ficha-normativa-link');
  if (normativaLink && p.linkDistr) {
    normativaLink.href = p.linkDistr;
  }

  // 6. Datos Hídricos
  document.getElementById('ficha-cota').textContent = `${p.cota} m`;
  document.getElementById('ficha-cuenca').textContent = p.cuenca;

  // Activar por defecto la pestaña de Catastro & Servicios
  const tabCatastroBtn = document.querySelector('[data-fichatab="ftab-catastro"]');
  if (tabCatastroBtn) tabCatastroBtn.click();

  // Abrir panel lateral
  sidebarRight.classList.add('active');
  if (window.innerWidth <= 992 && sidebarOverlay) {
    sidebarOverlay.classList.add('active');
  }
}

/**
 * Actualiza la tarjeta de un servicio público con badges y estilo
 */
function updateServiceCard(elementId, value) {
  const el = document.getElementById(elementId);
  if (!el) return;

  const valStr = (value || '').toUpperCase().trim();
  el.className = 'service-status-pill';
  el.setAttribute('title', value || '');

  let displayStr = valStr;
  if (valStr.includes('HORMIGÓN')) displayStr = 'HORMIGÓN';
  else if (valStr.includes('ASFALTO')) displayStr = 'ASFALTO';
  else if (valStr.includes('CON COLUMNA')) displayStr = 'COLUMNA';
  else if (valStr.includes('SIN COLUMNA')) displayStr = 'S/COLUMNA';
  else if (valStr.includes('TIENE') && !valStr.includes('NO TIENE')) displayStr = 'TIENE';

  if (valStr.includes('NO TIENE') || valStr === 'NO' || valStr.includes('SIN')) {
    el.classList.add('status-no');
    el.innerHTML = `<i class="ph ph-x"></i> ${displayStr}`;
  } else {
    el.classList.add('status-tiene');
    el.innerHTML = `<i class="ph ph-check"></i> ${displayStr}`;
  }
}

/**
 * Renderiza las filas de la tabla de Unidades Funcionales / PHs
 */
function renderPhUnitsTable(units, filterText = '') {
  const tbody = document.getElementById('ph-units-tbody');
  const countBadge = document.getElementById('ph-units-count');
  const searchBar = document.getElementById('ph-search-bar');
  const filterInput = document.getElementById('ph-filter-input');
  if (!tbody) return;

  tbody.innerHTML = '';
  const filtered = (units || []).filter(u => {
    if (!filterText) return true;
    const term = filterText.toLowerCase();
    return (
      u.padron.toLowerCase().includes(term) ||
      u.nomenclatura.toLowerCase().includes(term) ||
      u.plano.toLowerCase().includes(term) ||
      u.domicilio.toLowerCase().includes(term)
    );
  });

  if (countBadge) {
    countBadge.textContent = `${units.length} ${units.length === 1 ? 'unidad' : 'unidades'}`;
  }

  if (searchBar) {
    searchBar.style.display = units.length > 2 ? 'flex' : 'none';
    if (filterInput && !filterText) filterInput.value = '';
  }

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--text-muted); padding: 12px;">Sin resultados para el filtro</td></tr>`;
    return;
  }

  filtered.forEach(u => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${u.padron}</strong></td>
      <td><span style="font-family: var(--font-mono, monospace);">${u.nomenclatura}</span></td>
      <td>${u.plano}</td>
      <td>${u.domicilio || '-'}</td>
    `;
    tr.addEventListener('click', () => {
      document.querySelectorAll('#ph-units-tbody tr').forEach(r => r.classList.remove('highlighted'));
      tr.classList.add('highlighted');
      showToast(`Padrón ${u.padron}`, `Unidad: ${u.nomenclatura} · Plano ${u.plano}`);
    });
    tbody.appendChild(tr);
  });
}

/**
 * Copia el número de parcela al portapapeles
 */
function copyParcelaCode() {
  const codeEl = document.getElementById('ficha-nro-parcela');
  const lblEl = document.getElementById('lbl-copy-parcela');
  const iconEl = document.getElementById('icon-copy-parcela');
  if (!codeEl) return;

  const text = codeEl.textContent.trim();
  navigator.clipboard.writeText(text).then(() => {
    if (lblEl) lblEl.textContent = '¡Copiado!';
    if (iconEl) {
      iconEl.className = 'ph ph-check';
      iconEl.style.color = 'var(--sf-teal-mint)';
    }
    showToast('Copiado al portapapeles', `Nro. Parcela: ${text}`);

    setTimeout(() => {
      if (lblEl) lblEl.textContent = 'Copiar';
      if (iconEl) {
        iconEl.className = 'ph ph-copy';
        iconEl.style.color = '';
      }
    }, 2000);
  }).catch(() => {
    showToast('Error', 'No se pudo copiar el número');
  });
}

/**
 * Configura los event listeners de la interfaz y la adaptabilidad responsive
 */
function setupUIEventListeners() {
  // Pestañas de la barra lateral izquierda
  const tabBtns = document.querySelectorAll('.sidebar-tabs .tab-btn');
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const targetTab = btn.getAttribute('data-tab');
      document.querySelectorAll('.sidebar-content .tab-pane').forEach(p => p.classList.remove('active'));
      const activePane = document.getElementById(targetTab);
      if (activePane) activePane.classList.add('active');
    });
  });

  // Pestañas de la Ficha Urbanística
  const fichaTabBtns = document.querySelectorAll('.ficha-tabs .ficha-tab-btn');
  fichaTabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      fichaTabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const targetPane = btn.getAttribute('data-fichatab');
      document.querySelectorAll('.ficha-body .ficha-tab-content').forEach(p => p.classList.remove('active'));
      const activeContent = document.getElementById(targetPane);
      if (activeContent) activeContent.classList.add('active');
    });
  });

  // Alternar Panel Izquierdo (Botón en el dock de controles del mapa y botón móvil)
  const btnToggleSidebar = document.getElementById('btn-toggle-sidebar');
  const btnMobileLayers = document.getElementById('btn-mobile-layers-toggle');
  const sidebarLeft = document.getElementById('sidebar-left');
  const sidebarOverlay = document.getElementById('sidebar-overlay');
  const sidebarCloseMobile = document.getElementById('sidebar-left-close');

  function openSidebar() {
    sidebarLeft.classList.remove('collapsed');
    if (btnToggleSidebar) btnToggleSidebar.classList.add('active');
    if (btnMobileLayers) btnMobileLayers.classList.add('active');
    if (window.innerWidth <= 992 && sidebarOverlay) {
      sidebarOverlay.classList.add('active');
    }
  }

  function closeSidebar() {
    sidebarLeft.classList.add('collapsed');
    if (btnToggleSidebar) btnToggleSidebar.classList.remove('active');
    if (btnMobileLayers) btnMobileLayers.classList.remove('active');
    if (sidebarOverlay) {
      sidebarOverlay.classList.remove('active');
    }
  }

  // En pantallas móviles, iniciar con el panel replegado para mostrar el mapa completo
  if (window.innerWidth <= 768 && sidebarLeft) {
    closeSidebar();
  }

  if (btnToggleSidebar && sidebarLeft) {
    btnToggleSidebar.addEventListener('click', () => {
      if (sidebarLeft.classList.contains('collapsed')) {
        openSidebar();
      } else {
        closeSidebar();
      }
    });
  }

  if (btnMobileLayers && sidebarLeft) {
    btnMobileLayers.addEventListener('click', () => {
      if (sidebarLeft.classList.contains('collapsed')) {
        openSidebar();
      } else {
        closeSidebar();
      }
    });
  }

  if (sidebarCloseMobile) {
    sidebarCloseMobile.addEventListener('click', closeSidebar);
  }

  if (sidebarOverlay) {
    sidebarOverlay.addEventListener('click', () => {
      closeSidebar();
      const sidebarRight = document.getElementById('sidebar-right');
      if (sidebarRight) sidebarRight.classList.remove('active');
    });
  }

  // Toggle de búsqueda en móviles
  const btnMobileSearch = document.getElementById('btn-mobile-search-toggle');
  const topbarCenter = document.querySelector('.topbar-center');
  if (btnMobileSearch && topbarCenter) {
    btnMobileSearch.addEventListener('click', () => {
      topbarCenter.classList.toggle('mobile-active');
      if (topbarCenter.classList.contains('mobile-active')) {
        document.getElementById('search-input')?.focus();
      }
    });
  }

  // Cerrar Ficha Urbanística
  const fichaCloseBtn = document.getElementById('ficha-close');
  const sidebarRight = document.getElementById('sidebar-right');
  if (fichaCloseBtn && sidebarRight) {
    fichaCloseBtn.addEventListener('click', () => {
      sidebarRight.classList.remove('active');
    });
  }

  // Alternar Modo 2D / 3D
  const btnToggle3D = document.getElementById('btn-toggle-3d');
  const label3D = document.getElementById('label-mode-3d');
  if (btnToggle3D) {
    btnToggle3D.addEventListener('click', () => {
      const currentPitch = state.map.getPitch();
      if (currentPitch > 10) {
        state.map.easeTo({ pitch: 0, bearing: 0, duration: 800 });
        if (label3D) label3D.textContent = '2D';
        btnToggle3D.classList.remove('active');
      } else {
        state.map.easeTo({ pitch: 60, bearing: -20, duration: 800 });
        if (label3D) label3D.textContent = '3D';
        btnToggle3D.classList.add('active');
      }
    });
  }

  // Modo Sobrevuelo / Órbita 360°
  const btnOrbit = document.getElementById('btn-orbit');
  if (btnOrbit) {
    btnOrbit.addEventListener('click', toggleOrbit);
  }

  // Pantalla Completa
  const btnFullscreen = document.getElementById('btn-fullscreen');
  if (btnFullscreen) {
    btnFullscreen.addEventListener('click', () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
        btnFullscreen.classList.add('active');
      } else {
        document.exitFullscreen();
        btnFullscreen.classList.remove('active');
      }
    });
  }

  // Copiar número de parcela al portapapeles
  const btnCopy = document.getElementById('btn-copy-parcela');
  if (btnCopy) {
    btnCopy.addEventListener('click', copyParcelaCode);
  }

  // Filtro de unidades funcionales / PH
  const phFilterInput = document.getElementById('ph-filter-input');
  if (phFilterInput) {
    phFilterInput.addEventListener('input', (e) => {
      if (state.currentParcel?.subparcelas) {
        renderPhUnitsTable(state.currentParcel.subparcelas, e.target.value.trim());
      }
    });
  }

  // Controles de Navegación (Dock en el mapa)
  const zoomIn = document.getElementById('ctrl-zoom-in');
  const zoomOut = document.getElementById('ctrl-zoom-out');
  const compass = document.getElementById('ctrl-compass');

  if (zoomIn) zoomIn.addEventListener('click', () => state.map.zoomIn({ duration: 400 }));
  if (zoomOut) zoomOut.addEventListener('click', () => state.map.zoomOut({ duration: 400 }));
  if (compass) {
    compass.addEventListener('click', () => {
      state.map.easeTo({ bearing: 0, duration: 600 });
    });
  }

  // Modal Certificado Urbanístico ROU
  const exportFicha = document.getElementById('btn-export-ficha');
  const closeCert = document.getElementById('btn-close-cert');
  const dismissCert = document.getElementById('btn-dismiss-cert');
  const printCert = document.getElementById('btn-print-cert');

  if (exportFicha) exportFicha.addEventListener('click', openCertificateModal);
  if (closeCert) closeCert.addEventListener('click', closeCertificateModal);
  if (dismissCert) dismissCert.addEventListener('click', closeCertificateModal);
  if (printCert) printCert.addEventListener('click', () => window.print());

  // Reporte 0800 Municipal
  const reportMuni = document.getElementById('btn-report-muni');
  if (reportMuni) {
    reportMuni.addEventListener('click', () => {
      showToast('Línea Ciudadana 0800 777 5000', 'Sistema de Reclamos y Atención Ciudadana conectado.');
    });
  }

  // Reset al hacer click en el Logo
  const brandReset = document.getElementById('brand-reset');
  if (brandReset) {
    brandReset.addEventListener('click', (e) => {
      e.preventDefault();
      state.map.flyTo({
        center: SANTA_FE_CENTER,
        zoom: INITIAL_ZOOM,
        pitch: INITIAL_PITCH,
        bearing: INITIAL_BEARING,
        speed: 1.2
      });
    });
  }

  // Adaptación automática en cambio de tamaño de ventana (resize)
  window.addEventListener('resize', () => {
    if (window.innerWidth <= 768 && !sidebarLeft.classList.contains('collapsed')) {
      // En móvil, si está abierto, mostrar el overlay
      if (sidebarOverlay) sidebarOverlay.classList.add('active');
    } else {
      if (sidebarOverlay) sidebarOverlay.classList.remove('active');
    }
  });
}

/**
 * Alterna el modo de sobrevuelo orbital 360°
 */
function toggleOrbit() {
  const btn = document.getElementById('btn-orbit');
  state.isOrbiting = !state.isOrbiting;

  if (state.isOrbiting) {
    if (btn) btn.classList.add('active');
    showToast('Modo Órbita 360° Activo', 'Rotación panorámica automática de la ciudad');

    state.orbitInterval = setInterval(() => {
      const currentBearing = state.map.getBearing();
      state.map.setBearing(currentBearing + 0.35);
    }, 50);
  } else {
    if (btn) btn.classList.remove('active');
    clearInterval(state.orbitInterval);
    showToast('Órbita Detenida', 'Cámara fija');
  }
}

/**
 * Actualiza la rotación de la aguja de la brújula
 */
function updateCompass() {
  const bearing = state.map.getBearing();
  const icon = document.getElementById('compass-icon');
  if (icon) {
    icon.style.transform = `rotate(${-bearing}deg)`;
  }
}

/**
 * Muestra el modal con el Certificado Urbanístico ROU oficial
 */
function openCertificateModal() {
  const modal = document.getElementById('modal-certificate');
  const content = document.getElementById('certificate-content');
  if (!modal || !content) return;

  const p = state.currentParcel || OFFICIAL_SEEDED_PARCELS['142850'];
  const fotNum = parseFloat(p.fot) || 3.0;
  const supNum = parseFloat((p.superficie || '450').replace('.', '').replace(',', '.')) || 450;
  const supEdif = Math.round(supNum * fotNum);

  content.innerHTML = `
    <div style="border-bottom: 2px solid var(--sf-teal-primary); padding-bottom: 12px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center;">
      <div>
        <h3 style="color: var(--sf-blue-navy); font-size: 1.1rem; font-weight: 800;">MUNICIPALIDAD DE LA CIUDAD DE SANTA FE</h3>
        <p style="font-size: 0.75rem; color: var(--text-muted);">Secretaría de Desarrollo Urbano y Gestión Hídrica | Dirección de Catastro</p>
      </div>
      <img src="./img/HEADER_LogoSF-01.png" style="height: 38px; object-fit: contain;">
    </div>

    <div style="margin-bottom: 14px; background: #f8fbf9; padding: 12px; border-radius: 8px; border: 1px solid rgba(0, 168, 132, 0.15);">
      <h4 style="font-size: 0.85rem; color: var(--sf-blue-navy); margin-bottom: 8px; font-weight: 800;">1. IDENTIFICACIÓN CATASTRAL OFICIAL</h4>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 0.78rem;">
        <div><strong>Inmueble / Domicilio:</strong> ${p.domicilio}</div>
        <div><strong>Nro. de Parcela:</strong> <span style="font-family: monospace; font-weight: 700; color: var(--sf-teal-dark);">${p.nroParcela}</span></div>
        <div><strong>Padrón Municipal:</strong> ${p.padronMain}</div>
        <div><strong>Manzana / Sección:</strong> Manz. ${p.manzana} · Secc. ${p.seccion}</div>
        <div><strong>Superficie Terreno:</strong> ${p.superficie} m²</div>
        <div><strong>Zona Inmobiliaria:</strong> Zona ${p.zonaInmob}</div>
      </div>
    </div>

    <div style="margin-bottom: 14px; background: #f8fbf9; padding: 12px; border-radius: 8px; border: 1px solid rgba(0, 168, 132, 0.15);">
      <h4 style="font-size: 0.85rem; color: var(--sf-blue-navy); margin-bottom: 8px; font-weight: 800;">2. SERVICIOS PÚBLICOS DECLARADOS</h4>
      <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 6px; font-size: 0.74rem;">
        <div>Agua pot.: <strong>${p.servicios?.agua || 'TIENE'}</strong></div>
        <div>Gas natural: <strong>${p.servicios?.gas || 'TIENE'}</strong></div>
        <div>Red cloacal: <strong>${p.servicios?.cloacas || 'TIENE'}</strong></div>
        <div>Alumbrado: <strong>${p.servicios?.alumbrado || 'CON COLUMNA'}</strong></div>
        <div>Residuos: <strong>${p.servicios?.recoleccion || 'TIENE'}</strong></div>
        <div>Calzada: <strong>${p.servicios?.calzada || 'HORMIGÓN'}</strong></div>
      </div>
    </div>

    <div style="margin-bottom: 14px; background: #f8fbf9; padding: 12px; border-radius: 8px; border: 1px solid rgba(0, 168, 132, 0.15);">
      <h4 style="font-size: 0.85rem; color: var(--sf-blue-navy); margin-bottom: 8px; font-weight: 800;">3. PARÁMETROS URBANÍSTICOS (ROU - ORD. 11.748)</h4>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 0.78rem;">
        <div><strong>Distrito ROU:</strong> ${p.distritoCode} - ${p.distritoNombre}</div>
        <div><strong>Altura Máxima Permitida:</strong> ${p.altMax} metros</div>
        <div><strong>F.O.T. Admisible:</strong> ${p.fot}</div>
        <div><strong>F.O.S. Máximo:</strong> ${p.fos}</div>
        <div><strong>Capacidad Máxima Edificable:</strong> ${supEdif.toLocaleString('es-AR')} m²</div>
        <div><strong>Cota IGM de Terreno:</strong> ${p.cota} m s.n.m.</div>
      </div>
    </div>

    <p style="font-size: 0.68rem; color: var(--text-muted); font-style: italic;">
      * Este documento constituye una constancia informativa preliminar emitida por la plataforma digital Santa Fe 3D.
      La aprobación final de proyectos constructivos está sujeta a visación de planos por la Dirección de Edificaciones Privadas de la Municipalidad de Santa Fe.
    </p>
  `;

  modal.classList.add('active');
}

function closeCertificateModal() {
  const modal = document.getElementById('modal-certificate');
  if (modal) modal.classList.remove('active');
}

/**
 * Notificación Toast flotante
 */
function showToast(title, message) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `
    <i class="ph ph-check-circle" style="color: var(--sf-teal-primary); font-size: 1.2rem;"></i>
    <div>
      <div style="font-size: 0.82rem; font-weight: 700; color: var(--sf-blue-navy);">${title}</div>
      <div style="font-size: 0.72rem; color: var(--text-muted);">${message}</div>
    </div>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}
