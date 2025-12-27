const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://localhost:5000',
      changeOrigin: true,
      secure: false,
      logLevel: 'debug',
      onError: (err, req, res) => {
        console.log('Proxy Error:', err.message);
        res.writeHead(500, {
          'Content-Type': 'text/plain',
        });
        res.end('Proxy Error: ' + err.message);
      },
      onProxyReq: (proxyReq, req, res) => {
        console.log(`[PROXY] ${req.method} ${req.url} -> http://localhost:5000${req.url}`);
      },
      onProxyRes: (proxyRes, req, res) => {
        console.log(`[PROXY] Response: ${proxyRes.statusCode} for ${req.method} ${req.url}`);
      }
    })
  );
};