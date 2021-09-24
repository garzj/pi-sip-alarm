const pkg = require('../package.json');
const proxy = require('http-proxy-middleware');

module.exports = (app) => {
  if (pkg.proxy) {
    app.use(proxy('/api', { target: pkg.proxy, ws: true, changeOrigin: true }));
  }
};
