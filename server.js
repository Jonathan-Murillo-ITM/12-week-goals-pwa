const http = require('http');
const fs = require('fs');
const path = require('path');

const port = 3000;

// MIME types
const mimeTypes = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    
    // Permitir CORS para desarrollo
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    // Deshabilitar cache para desarrollo
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }
    
    let filePath = '.' + req.url;
    if (filePath === './') {
        filePath = './index.html';
    }
    
    const extname = String(path.extname(filePath)).toLowerCase();
    const contentType = mimeTypes[extname] || 'application/octet-stream';
    
    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code === 'ENOENT') {
                // Archivo no encontrado - servir index.html para SPA routing
                fs.readFile('./index.html', (error, content) => {
                    if (error) {
                        res.writeHead(500);
                        res.end('Error interno del servidor');
                        return;
                    }
                    res.writeHead(200, { 'Content-Type': 'text/html' });
                    res.end(content, 'utf-8');
                });
            } else {
                res.writeHead(500);
                res.end('Error interno del servidor: ' + error.code);
            }
        } else {
            // Headers adicionales para archivos específicos
            if (extname === '.js' || extname === '.css' || extname === '.html') {
                res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
                res.setHeader('Pragma', 'no-cache');
                res.setHeader('Expires', '0');
            }
            
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

server.listen(port, () => {
    console.log('🚀 PWA Server iniciado!');
    console.log(`📱 Abre: http://localhost:${port}`);
    console.log(`🌐 Desde tu celular: http://TU_IP:${port}`);
    console.log('');
    console.log('📋 Pasos para instalar en iPhone:');
    console.log('1. Abre Safari en tu iPhone');
    console.log('2. Ve a la URL de arriba');
    console.log('3. Toca el botón "Compartir" 📤');
    console.log('4. Selecciona "Añadir a pantalla de inicio"');
    console.log('5. ¡Ya tienes la app! 🎉');
    console.log('');
    console.log('Presiona Ctrl+C para detener el servidor');
});

// Manejar cierre graceful
process.on('SIGINT', () => {
    console.log('\n👋 Cerrando servidor...');
    server.close(() => {
        console.log('✅ Servidor cerrado');
        process.exit(0);
    });
});
