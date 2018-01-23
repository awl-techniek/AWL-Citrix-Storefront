var config = {
	"logger": {
		"level": "trace"
	},
	"notifications": {
		"enabled": true,
		"autoRestart": true,
		"url": "AWLServiceProxyHandler.ashx/signalr",
		"debug": true
	},
	"dashboard": {
		"url": "AWLServiceProxyHandler.ashx/dashboard",
		"caching": {
			"enabled": false
		}
	}
};

module.exports = config;
