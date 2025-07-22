// Generar manifest dinámicamente basado en el entorno
const isGitHubPages = window.location.hostname.includes('github.io');
const basePath = isGitHubPages ? '/12-week-goals-pwa' : '';

const manifestData = {
  "name": "12 Week Goals",
  "short_name": "12WeekGoals", 
  "description": "Crea listas de tareas de 12 semanas en Microsoft To Do",
  "start_url": basePath + "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#007AFF",
  "orientation": "portrait-primary",
  "categories": ["productivity", "planning"],
  "lang": "es",
  "icons": [
    {
      "src": basePath + "/icons/icon.svg",
      "sizes": "any",
      "type": "image/svg+xml"
    },
    {
      "src": basePath + "/icons/icon-192x192.svg",
      "sizes": "192x192",
      "type": "image/svg+xml"
    },
    {
      "src": basePath + "/icons/icon-512x512.svg",
      "sizes": "512x512",
      "type": "image/svg+xml"
    }
  ],
  "shortcuts": [
    {
      "name": "Crear Metas",
      "short_name": "Crear",
      "description": "Crear nuevas metas de 12 semanas",
      "url": basePath + "/?action=create",
      "icons": [{ "src": basePath + "/icons/icon.svg", "sizes": "any" }]
    }
  ]
};

// Crear el blob del manifest y actualizar el link
const manifestBlob = new Blob([JSON.stringify(manifestData, null, 2)], { type: 'application/json' });
const manifestUrl = URL.createObjectURL(manifestBlob);

// Actualizar el link del manifest en el HTML
const manifestLink = document.querySelector('link[rel="manifest"]');
if (manifestLink) {
    manifestLink.href = manifestUrl;
    console.log('📱 Manifest actualizado para:', isGitHubPages ? 'GitHub Pages' : 'Desarrollo local');
}
