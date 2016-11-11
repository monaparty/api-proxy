var http      = require('http');
var httpProxy = require('http-proxy');

var proxy = httpProxy.createProxyServer({
	target: {
		host: 'eclipse-che.default.svc.cluster.local',
		port: 8080
	}
});

var proxyServer = http.createServer(function (req, res) {
	proxy.web(req, res);
});

proxyServer.on('upgrade', function(req, socket, head) {
	proxy.ws(req, socket, head);
});

/* Avoid CORS. */
proxyServer.on('proxyRes', function(proxyRes, req, res) {
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
