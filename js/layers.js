/**
 * Configuración de Capas del Gemelo Digital de la Ciudad de Santa Fe
 * Basado en las capas oficiales del GeoPortal / GeoVisualizador Municipal (SITMAX)
 * Endpoint GeoServer WMS: https://geoserver.santafeciudad.gov.ar/geoserver/sitmax/wms
 */

export const SANTA_FE_GEOSERVER_WMS = 'https://geoserver.santafeciudad.gov.ar/geoserver/sitmax/wms';

export const BASEMAPS = [
  {
    id: 'positron',
    name: 'Ciudad 3D Claro (Positron)',
    desc: 'Estilo Ciudad 3D optimizado para volumetrías y zonificación',
    icon: 'ph-sun-dim',
    tiles: [
      'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}'
    ],
    labelsTiles: [
      'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Reference/MapServer/tile/{z}/{y}/{x}'
    ],
    attribution: '&copy; Esri, HERE, Garmin, OpenStreetMap'
  },
  {
    id: 'satellite',
    name: 'Satelital Híbrido (Ortofoto)',
    desc: 'Imágenes satelitales de alta resolución con hidrografía real',
    icon: 'ph-globe-hemisphere-west',
    tiles: [
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
    ],
    labelsTiles: [
      'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}'
    ],
    attribution: '&copy; Esri, Maxar'
  },
  {
    id: 'dark',
    name: 'Carto Dark Matter (Noche)',
    desc: 'Visualización nocturna de alta tecnología con luces urbanas',
    icon: 'ph-moon-stars',
    tiles: [
      'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}'
    ],
    labelsTiles: [
      'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}'
    ],
    attribution: '&copy; Esri, HERE, OpenStreetMap'
  },
  {
    id: 'osm',
    name: 'OpenStreetMap Oficial',
    desc: 'Cartografía vial y topografía detallada',
    icon: 'ph-map-trifold',
    tiles: [
      'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
    ],
    attribution: '&copy; OpenStreetMap'
  }
];

export const LAYER_CATEGORIES = [
  {
    id: 'planeamiento',
    name: 'Planeamiento Urbano (ROU)',
    icon: 'ph-buildings',
    color: '#00a884',
    layers: [
      {
        id: 'distritos_rou',
        wmsLayer: 'sitmax:distritos_rou',
        title: 'Distritos ROU (Zonificación Urbana)',
        desc: 'Delimitación de distritos según Reglamento de Ordenamiento Urbano',
        geomType: 'Polígono',
        styleDesc: 'Zonificación clasificada por distrito (C1, R1, E2, etc.) con paleta municipal y tramados perimetrales',
        active: true,
        opacity: 0.65,
        legendColor: '#00c08b',
        type: 'wms'
      },
      {
        id: 'rou_areas_riberenias',
        wmsLayer: 'sitmax:rou_areas_riberenias',
        title: 'Áreas Ribereñas y Costanera',
        desc: 'Protección ambiental y desarrollo en bordes costeros Setúbal y Paraná',
        geomType: 'Polígono',
        styleDesc: 'Borde ribereño y faja de protección costera con relleno celeste traslúcido',
        active: false,
        opacity: 0.70,
        legendColor: '#008abd',
        type: 'wms'
      },
      {
        id: 'rou_centralidades',
        wmsLayer: 'sitmax:rou_centralidades',
        title: 'Centralidades y Corredores Comerciales',
        desc: 'Ejes comerciales y centros barriales',
        geomType: 'Polígono / Eje',
        styleDesc: 'Corredores comerciales y centralidades urbanas con color ámbar destacado',
        active: false,
        opacity: 0.70,
        legendColor: '#eb8a03',
        type: 'wms'
      },
      {
        id: 'rou_areas_desarrollo_urbano',
        wmsLayer: 'sitmax:rou_areas_desarrollo_urbano',
        title: 'Áreas de Desarrollo Urbano',
        desc: 'Sectores con proyectos estratégicos de reconversión',
        geomType: 'Polígono',
        styleDesc: 'Áreas estratégicas de desarrollo prioritario con trama púrpura',
        active: false,
        opacity: 0.60,
        legendColor: '#8703c4',
        type: 'wms'
      }
    ]
  },
  {
    id: 'catastro',
    name: 'Catastro y Parcelario',
    icon: 'ph-square-half',
    color: '#003366',
    layers: [
      {
        id: 'manzana_catastral',
        wmsLayer: 'sitmax:manzana_catastral',
        title: 'Manzanas Catastrales',
        desc: 'Polígonos de manzanas oficiales de la Municipalidad',
        geomType: 'Polígono',
        styleDesc: 'Trazo perimetral azul marino con etiquetas de número de manzana oficial',
        active: true,
        opacity: 0.85,
        legendColor: '#163252',
        type: 'wms'
      },
      {
        id: 'manzanero_puerto',
        wmsLayer: 'sitmax:manzanero_puerto',
        title: 'Manzanero Sector Portuario',
        desc: 'Jurisdicción del Ente Administrador Puerto Santa Fe',
        geomType: 'Polígono',
        styleDesc: 'Delimitación de parcelas e infraestructura portuaria con contorno cobrizo',
        active: false,
        opacity: 0.80,
        legendColor: '#c58940',
        type: 'wms'
      },
      {
        id: 'ejido_municipal',
        wmsLayer: 'sitmax:ejido_municipal',
        title: 'Límite del Ejido Municipal',
        desc: 'Frontera administrativa de la Ciudad de Santa Fe',
        geomType: 'Línea',
        styleDesc: 'Línea discontinua roja de demarcación de jurisdicción administrativa',
        active: true,
        opacity: 0.90,
        legendColor: '#c40340',
        type: 'wms'
      },
      {
        id: 'zonas_inmobiliarias',
        wmsLayer: 'sitmax:zonas_inmobiliarias',
        title: 'Zonas Inmobiliarias',
        desc: 'Valuación fiscal y categorías tributarias urbanas',
        geomType: 'Polígono',
        styleDesc: 'Zonificación fiscal con gradiente cromático según valor del suelo urbano',
        active: false,
        opacity: 0.60,
        legendColor: '#ffd700',
        type: 'wms'
      }
    ]
  },
  {
    id: 'hidrico_ambiente',
    name: 'Gestión Hídrica & Ambiente',
    icon: 'ph-drop',
    color: '#008abd',
    layers: [
      {
        id: 'zona_seguridad_hidrica',
        wmsLayer: 'sitmax:zona_seguridad_hidrica',
        title: 'Zonas de Seguridad Hídrica',
        desc: 'Delimitación de áreas de riesgo y anillos de defensa fluvial',
        geomType: 'Polígono',
        styleDesc: 'Anillos de terraplén defensivo y niveles de vulnerabilidad hídrica',
        active: true,
        opacity: 0.70,
        legendColor: '#008abd',
        type: 'wms'
      },
      {
        id: 'reservorios',
        wmsLayer: 'sitmax:reservorios',
        title: 'Reservorios y Estaciones de Bombeo',
        desc: 'Cuencos retardadores y casetas de bombeo hacia el Río Salado',
        geomType: 'Polígono',
        styleDesc: 'Lagunas de retardo pluvial y estaciones de bombeo de emergencia',
        active: false,
        opacity: 0.80,
        legendColor: '#1639f1',
        type: 'wms'
      },
      {
        id: 'desagues',
        wmsLayer: 'sitmax:desagues',
        title: 'Red de Desagües Pluviales',
        desc: 'Conductos troncales, ramales y canales a cielo abierto',
        geomType: 'Línea',
        styleDesc: 'Red hidrográfica pluvial artificial y conductos troncales principales',
        active: false,
        opacity: 0.85,
        legendColor: '#005b82',
        type: 'wms'
      },
      {
        id: 'curvas_nivel',
        wmsLayer: 'sitmax:curvas_nivel',
        title: 'Curvas de Nivel / Topografía',
        desc: 'Altimetría detallada del terreno (cotas IGM en metros)',
        geomType: 'Línea',
        styleDesc: 'Isolíneas altimétricas de elevación del terreno en metros s.n.m.',
        active: false,
        opacity: 0.75,
        legendColor: '#c58940',
        type: 'wms'
      },
      {
        id: 'espacios_verdes',
        wmsLayer: 'sitmax:view_espacios_verdes_catastrales',
        title: 'Espacios Verdes y Plazas',
        desc: 'Parques, paseos públicos, bulevares y arbolado urbano',
        geomType: 'Polígono',
        styleDesc: 'Polígonos verdes de parques, plazas barriales y reservas naturales',
        active: true,
        opacity: 0.80,
        legendColor: '#00c08b',
        type: 'wms'
      }
    ]
  },
  {
    id: 'movilidad',
    name: 'Movilidad & Transporte',
    icon: 'ph-bus',
    color: '#eb8a03',
    layers: [
      {
        id: 'stpcolectivos',
        wmsLayer: 'sitmax:stpcolectivos',
        title: 'Recorridos de Colectivos (STP)',
        desc: 'Trazas de las líneas de colectivos urbanos de Santa Fe',
        geomType: 'Línea',
        styleDesc: 'Trazas viales diferenciadas por línea del Sistema de Transporte Público',
        active: false,
        opacity: 0.90,
        legendColor: '#eb8a03',
        type: 'wms'
      },
      {
        id: 'paradas_cuando_pasa',
        wmsLayer: 'sitmax:paradas_cuando_pasa',
        title: 'Paradas "Cuándo Pasa"',
        desc: 'Puntos de ascenso y descenso con monitoreo en tiempo real',
        geomType: 'Punto',
        styleDesc: 'Marcadores puntuales con icono de garita y código de parada',
        active: false,
        opacity: 0.85,
        legendColor: '#c40340',
        type: 'wms'
      },
      {
        id: 'terminales_sube',
        wmsLayer: 'sitmax:terminales_automaticas_sube',
        title: 'Terminales Automáticas SUBE (TAS)',
        desc: 'Puntos de acreditación de carga y saldo SUBE',
        geomType: 'Punto',
        styleDesc: 'Puntos de ubicación de terminales de validación y carga SUBE',
        active: false,
        opacity: 0.85,
        legendColor: '#008abd',
        type: 'wms'
      },
      {
        id: 'servicio_pavimento',
        wmsLayer: 'sitmax:servicio_pavimento',
        title: 'Estado del Pavimento Urbano',
        desc: 'Calles asfaltadas, de hormigón, intertrabado y tierra',
        geomType: 'Línea',
        styleDesc: 'Ejes viales clasificados por materialidad de calzada y estado',
        active: false,
        opacity: 0.75,
        legendColor: '#6c757d',
        type: 'wms'
      }
    ]
  },
  {
    id: 'patrimonio_equipamiento',
    name: 'Patrimonio & Equipamiento',
    icon: 'ph-landmark',
    color: '#c40340',
    layers: [
      {
        id: 'inmuebles_patrimoniales',
        wmsLayer: 'sitmax:inmuebles_patrimoniales',
        title: 'Inmuebles Patrimoniales Catalogados',
        desc: 'Edificios con protección histórica, arquitectónica y cultural',
        geomType: 'Punto / Polígono',
        styleDesc: 'Edificaciones protegidas con grado de catalogación e inventario patrimonial',
        active: true,
        opacity: 0.90,
        legendColor: '#eb8a03',
        type: 'wms'
      },
      {
        id: 'efectores_salud',
        wmsLayer: 'sitmax:efectores_salud',
        title: 'Efectores de Salud y Hospitales',
        desc: 'Hospitales Cullen, Iturraspe, Alassia, CEMAFE y centros barriales',
        geomType: 'Punto',
        styleDesc: 'Iconos de centros asistenciales de salud de primer, segundo y tercer nivel',
        active: false,
        opacity: 0.90,
        legendColor: '#c40340',
        type: 'wms'
      },
      {
        id: 'clubes_relev_urbanismo',
        wmsLayer: 'sitmax:clubes_relev_urbanismo',
        title: 'Clubes y Entidades Deportivas',
        desc: 'Instituciones deportivas, sedes náuticas y polideportivos',
        geomType: 'Punto / Polígono',
        styleDesc: 'Equipamientos deportivos y recreativos de la ciudad',
        active: false,
        opacity: 0.85,
        legendColor: '#1639f1',
        type: 'wms'
      }
    ]
  },
  {
    id: 'servicios_urbanos',
    name: 'Servicios & Redes Urbanas',
    icon: 'ph-lightbulb-filament',
    color: '#ffd700',
    layers: [
      {
        id: 'servicio_alumbrado',
        wmsLayer: 'sitmax:servicio_alumbrado',
        title: 'Alumbrado Público Inteligente',
        desc: 'Luminarias LED y tendido de alumbrado urbano',
        geomType: 'Punto / Línea',
        styleDesc: 'Parque lumínico LED y tendido eléctrico de alumbrado público',
        active: false,
        opacity: 0.80,
        legendColor: '#ffd700',
        type: 'wms'
      },
      {
        id: 'cobertura_cloacas',
        wmsLayer: 'sitmax:cobertura_cloacas',
        title: 'Cobertura de Red Cloacal',
        desc: 'Zonas servidas por Aguas Santafesinas S.A. (ASSA)',
        geomType: 'Polígono',
        styleDesc: 'Área servida por la red de saneamiento y desagües cloacales ASSA',
        active: false,
        opacity: 0.75,
        legendColor: '#8703c4',
        type: 'wms'
      },
      {
        id: 'recoleccion_residuos',
        wmsLayer: 'sitmax:recoleccion_residuos',
        title: 'Rutas de Recolección de Residuos',
        desc: 'Días, frecuencias de recolección diurna y nocturna',
        geomType: 'Línea / Polígono',
        styleDesc: 'Zonas y circuitos del sistema de higiene y recolección de residuos',
        active: false,
        opacity: 0.75,
        legendColor: '#00c08b',
        type: 'wms'
      }
    ]
  }
];

/**
 * Genera la URL del WMS GetMap para MapLibre GL JS en EPSG:3857
 */
export function getWmsTileUrl(layerName) {
  return `${SANTA_FE_GEOSERVER_WMS}?SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&FORMAT=image/png&TRANSPARENT=true&LAYERS=${encodeURIComponent(layerName)}&SRS=EPSG:3857&WIDTH=256&HEIGHT=256&BBOX={bbox-epsg-3857}`;
}

/**
 * Genera la URL del WMS GetLegendGraphic para obtener la simbología oficial y estilos de capa
 */
export function getWmsLegendUrl(layerName) {
  return `${SANTA_FE_GEOSERVER_WMS}?REQUEST=GetLegendGraphic&VERSION=1.0.0&FORMAT=image/png&WIDTH=18&HEIGHT=18&LAYER=${encodeURIComponent(layerName)}&LEGEND_OPTIONS=fontName:Encode Sans;fontSize:11;dpi:90;forceLabels:on;fontAntiAliasing:true`;
}
