const http      = require('http');
const httpProxy = require('http-proxy');
const express   = require('express');
const cors      = require('cors');

/* ReverseProxy */
const proxy = httpProxy.createProxyServer({
	target: {
		host: process.env.BACKEND_HOST,
		port: process.env.BACKEND_PORT,
		proxyTimeout: 1800000 /* 30min */
	},
	auth: process.env.AUTH
});

const app = express();
app.use(cors());

//app.all('/.well-known/acme-challenge/*', le.middleware());
app.all('/healthz', (req, res) => {
  res.send("Living");
});

app.all('/*', (req, res) => {
  proxy.web(req, res);
});

const proxyServer = http.createServer(app);

proxyServer.on('upgrade', (req, socket, head) => {
  proxy.ws(req, socket, head);
});

proxyServer.listen(process.env.PORT || 5000, () => {
  console.log('Server listening');
});
