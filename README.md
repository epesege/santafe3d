# Santa Fe 3D — Gemelo Digital Urbano (Mockup / Prototipo)

Plataforma tridimensional e interactiva de visualización urbanística para la **Ciudad de Santa Fe**, inspirada en la arquitectura y experiencia de usuario de **Ciudad 3D** (Gobierno de la Ciudad de Buenos Aires), adaptada a la identidad visual de Santa Fe (verde agua institucional) y conectada a las capas oficiales del **GeoPortal Municipal** y el **Reglamento de Ordenamiento Urbano (ROU)**.

---

## 🏛️ Características Principales

### 1. Visualización y Motor 3D (MapLibre GL JS)
- **Volumetría Edilicia 3D**: Renderizado tridimensional interactivo con extrusiones de altura real, pisos y diferenciación visual de distritos.
- **Envolvente Máxima ROU en 3D**: Simulación visual del volumen máximo constructivo teórico que permite el código urbanístico sobre cada parcela (altura máxima y retiros).
- **Controles Unificados en el Mapa**: Dock vertical lateral integrado directamente sobre el lienzo del mapa que agrupa:
  - Alternador del panel de **Capas**
  - Conmutador de perspectiva **2D / 3D**
  - Modo **Órbita 360°** para sobrevuelo panorámico automático
  - Controles de **Zoom (+ / -)**
  - Brújula interactiva con restablecimiento de orientación al **Norte**
  - Modo **Pantalla Completa**

### 2. Capas Oficiales del GeoPortal de Santa Fe
Conexión directa mediante estándares OGC (WMS / WFS) con el **GeoServer Municipal de Santa Fe**:
- **Planeamiento Urbano (ROU)**: Distritos ROU (Zonificación), Áreas Ribereñas, Centralidades Comerciales, Áreas de Desarrollo Urbano.
- **Catastro**: Manzanas Catastrales oficiales, Manzanero Puerto, Ejido Municipal, Zonas Inmobiliarias.
- **Gestión Hídrica & Ambiental**: Zonas de Seguridad Hídrica, Red de Desagües Pluviales, Reservorios y Estaciones de Bombeo, Curvas de Nivel / Topografía, Espacios Verdes Catastrales.
- **Movilidad & Transporte**: Recorridos de Colectivos (STP), Paradas "Cuándo Pasa", Terminales Automáticas SUBE, Estado del Pavimento.
- **Patrimonio & Equipamiento**: Inmuebles Catalogados de Protección Patrimonial, Efectores de Salud / Hospitales, Clubes y Deporte.
- **Servicios Urbanos**: Alumbrado Público LED, Cobertura Cloacal ASSA, Recolección de Residuos.

### 3. Ficha Urbanística 3D (Dossier Catastral y ROU)
Al hacer clic sobre cualquier edificio o buscar una dirección/padrón:
- **Relación de Alturas ROU**: Gráfico comparativo animado entre la altura edificada actual vs la altura máxima permitida.
- **Indicadores Urbanísticos**: F.O.T. admisible / máximo, F.O.S., superficie de parcela, capacidad edificable remanente en m².
- **Condición Hídrica**: Cota IGM de terreno (m s.n.m.), estado de protección por terraplén/anillo de defensas, cuenca pluvial y arbolado en vereda.
- **Certificado ROU**: Generador de constancia preliminar imprimible o descargable en PDF.

---

## 🎨 Identidad Visual y Colores de Santa Fe

- **Verde Agua Institucional**: `#00c08b` y `#00a884` (colores emblemáticos de la Municipalidad de Santa Fe).
- **Azul Institucional**: `#003366` y `#07172b`.
- **Menta / Resplandor 3D**: `#00f0a0` y `#3dd9b6`.
- **Tipografía**: *Encode Sans* (fuente oficial del GeoPortal) combinada con *Inter*.
- **Logo Oficial**: Ubicado en `img/HEADER_LogoSF-01.png`.

---

## 🚀 Cómo Ejecutar Localmente

### Opción A (Recomendada con Vite)
```bash
npm run dev
```
Abrirá automáticamente el servidor local en:
`http://localhost:5173/`

### Opción B (Servidor estático)
Cualquier servidor web estático (como `npx serve`, Live Server de VS Code, Python `python -m http.server 8000`, etc.) servirá la aplicación de forma inmediata sin dependencias complejas.

---

## 📁 Estructura del Proyecto

```
SantaFe3D/
├── css/
│   └── style.css                 # Diseño visual, glassmorphism, paleta verde agua y paneles
├── img/
│   └── HEADER_LogoSF-01.png      # Logo oficial de la Municipalidad de Santa Fe
├── js/
│   ├── app.js                    # Controlador principal, MapLibre GL, 3D, búsqueda e interacción
│   ├── layers.js                 # Configuración de capas WMS oficiales y mapas base
│   └── data.js                   # Vistas rápidas, KPIs urbanos y sugerencias de búsqueda
├── index.html                    # Estructura de la aplicación
├── package.json                  # Scripts y dependencias (Vite)
└── README.md                     # Documentación técnica
```
