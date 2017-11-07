var config = {
	"logger": {
		"level": "trace"
	},
	"notifications": {
		"enabled": true,
		"autoRestart": true,
		"url": "/Citrix/STORENAME/AWLCitrixClientHandler.ashx/signalr",
		"debug": true
	},
	"dashboard": {
		"url": "/Citrix/STORENAME/AWLCitrixClientHandler.ashx/dashboard",
		"caching": {
			"enabled": false
		}
	}
};

module.exports = config;