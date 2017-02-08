var http      = require('http');
var httpProxy = require('http-proxy');
var auth      = require('http-auth');
var express   = require('express');

/* ReverseProxy */
var proxy = httpProxy.createProxyServer({
	target: {
		host: process.env.BACKEND_HOST,
		port: process.env.BACKEND_PORT
	}
});

var basic = auth.basic({
		realm: "Authentication"
	}, (user, pass, callback) => {
		callback(user === process.env.USER && pass === process.env.PASS);
	}
);

var le = require('letsencrypt').create(
  { server: 'https://acme-v01.api.letsencrypt.org/directory'
});

var opts = {
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

var app = express()
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

var proxyServer = http.createServer(app);

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
