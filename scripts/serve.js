const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const PUBLIC_DIR = path.join(__dirname, '..', 'output');

const mimeTypes = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
};

http.createServer(function (req, res) {
    console.log(`${req.method} ${req.url}`);

    // Normalize URL
    let url = decodeURIComponent(req.url);
    if (url === '/') url = '/index.html';

    // Prevent directory traversal
    let filePath;
    if (url.startsWith('/photos/')) {
        // Serve photos from the project root photos directory
        filePath = path.join(__dirname, '..', url).replace(/\.\./g, '');
    } else {
        // Serve other files from output directory
        filePath = path.join(PUBLIC_DIR, url).replace(/\.\./g, '');
    }

    const ext = path.extname(filePath);
    const contentType = mimeTypes[ext] || 'application/octet-stream';

    fs.readFile(filePath, function (error, content) {
        if (error) {
            if (error.code == 'ENOENT') {
                res.writeHead(404, { 'Content-Type': 'text/html' });
                res.end('<h1>404 Not Found</h1><p>The requested file was not found.</p>', 'utf-8');
            }
            else {
                res.writeHead(500);
                res.end('Sorry, check with the site admin for error: ' + error.code + ' ..\n');
            }
        }
        else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });

}).listen(PORT);

console.log(`\n🚀 Server running at http://localhost:${PORT}/`);
console.log(`📂 Serving directory: ${PUBLIC_DIR}`);
console.log('Press Ctrl+C to stop.\n');
