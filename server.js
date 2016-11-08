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
	res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
});

proxyServer.listen(process.env.PORT || 5000);
