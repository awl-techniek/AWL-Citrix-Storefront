var config = {
	"logger": {
		"level": "info"
	},
	"notifications": {
		"enabled": true,
		"autoRestart": true,
		"url": "AWLServiceProxyHandler.ashx/signalr",
		"debug": false
	},
	"dashboard": {
		"url": "AWLServiceProxyHandler.ashx/dashboard",
		"caching": {
			"enabled": true,
			"duration": 10000
		}
	}
};

module.exports = config;