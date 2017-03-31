const http      = require('http');
const httpProxy = require('http-proxy');
const auth      = require('http-auth');
const express   = require('express');

/* ReverseProxy */
const proxy = httpProxy.createProxyServer({
	target: {
		host: process.env.BACKEND_HOST,
		port: process.env.BACKEND_PORT
	}
});

const basic = auth.basic({
		realm: "Authentication"
	}, (user, pass, callback) => {
		callback(user === process.env.USER && pass === process.env.PASS);
	}
);

const le = require('letsencrypt').create(
  { server: 'https://acme-v01.api.letsencrypt.org/directory'
});

const opts = {
  email: process.env.EMAIL,
  agreeTos: true,
  domains: [ process.env.DOMAIN ],
};

function register() {
  le.register(opts).then((certs) => {
      console.log(certs);
    }, function (err) {
      console.error(err);
      setTimeout(register, 30000, "Will retry to register...");
    }
  );
}
register();

const app = express()
app.all('/.well-known/acme-challenge/*', le.middleware());
app.all('/healthz', (req, res) => {
  res.send("Living");
});

app.all('/wsmaster/api/*', auth.connect(basic), (req, res) => {
  proxy.web(req, res);
});

app.all('/*', (req, res) => {
  proxy.web(req, res);
});

const proxyServer = http.createServer(app);

proxyServer.on('upgrade', (req, socket, head) => {
  proxy.ws(req, socket, head);
});

/* Avoid CORS. */
proxyServer.on('proxyRes', (proxyRes, req, res) => {
	res.setHeader('Access-Control-Allow-Origin', '*');
	res.setHeader('Access-Control-Request-Method', '*');
	res.setHeader('Access-Control-Allow-Methods', 'POST, GET, DELETE, OPTIONS');
	res.setHeader('Access-Control-Allow-Headers', 'authorization, content-type');
	if (req.method === 'OPTIONS') {
		res.writeHead(200);
		res.end();
		return;
	}
});

proxyServer.listen(process.env.PORT || 5000);
