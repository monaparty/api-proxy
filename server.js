const http      = require('http');
const httpProxy = require('http-proxy');
const auth      = require('http-auth');
const express   = require('express');
const cors      = require('cors');

/* ReverseProxy */
const proxy = httpProxy.createProxyServer({
	target: {
		host: process.env.BACKEND_HOST,
		port: process.env.BACKEND_PORT,
		proxyTimeout: 1800000 /* 30min */
	}
});

const basic = auth.basic({
		realm: "Authentication"
	}, (user, pass, callback) => {
		callback(user === process.env.USER && pass === process.env.PASS);
	}
);

//const le = require('letsencrypt').create({
//// server: 'https://acme-v01.api.letsencrypt.org/directory'
//  server: 'staging'
//});
//
//const opts = {
//  email: process.env.EMAIL,
//  agreeTos: true,
//  domains: [ process.env.DOMAIN ],
//};
//
//function register() {
//  le.register(opts)
//    .then(certs => {
//      console.log(certs);
//    })
//    .catch(err => {
//      console.error(err);
//      setTimeout(register, 30000, "Will retry to register...");
//    });
//}
//register();

const app = express();
app.use(cors());

//app.all('/.well-known/acme-challenge/*', le.middleware());
app.all('/healthz', (req, res) => {
  res.send("Living");
});

app.all('/*', auth.connect(basic), (req, res) => {
  proxy.web(req, res);
});

const proxyServer = http.createServer(app);

proxyServer.on('upgrade', (req, socket, head) => {
  proxy.ws(req, socket, head);
});

proxyServer.listen(process.env.PORT || 5000, () => {
  console.log('Server listening');
});
