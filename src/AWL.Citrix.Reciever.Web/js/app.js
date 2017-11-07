"use strict";

var config = require('../config');
var fs = require('fs');
var store = require('store');
var expirePlugin = require('store/plugins/expire');
var log = require('console-log-level')({
	prefix: function(level) {
		return new Date().toISOString() + ': '
	},
	level: config.logger.level
});

var notificationHub = require('./notificationHub.js');
var backgroundImages = fs.readdirSync("images/backgrounds");

store.addPlugin(expirePlugin);

// A simple templating method for replacing placeholders enclosed in curly braces.
if (!String.prototype.supplant) {
	String.prototype.supplant = function (o) {
		return this.replace(/{([^{}]*)}/g,
			function (a, b) {
				var r = o[b];
				return typeof r === 'string' || typeof r === 'number' ? r : a;
			});
	};
}

var notificationTemplate = '<div class="{class}" data-id="{id}">{content}</div>',
	tagTemplate			 = '<span class="{class}">{content}</span>',
	tagPopupTemplate	 = '<span data-balloon="{popup}" data-balloon-pos="{pos}" data-balloon-length="medium" class="{class}">{content}</span>',
	$notifications 		 = $('#customTop'),
	loadingDashboard	 = false,
	currentView			 = null;

function setRandomBackground() {
	var background = backgroundImages[Math.floor(Math.random() * backgroundImages.length)];
	$('.web-screen').css({
		'background': 'url(custom/images/' + background + ') no-repeat center center fixed',
		'background-size': 'cover'
	});
}

function getHiddenNotifications() {
	var hiddenNotifications = store.get('hiddenNotifications');
	if (!hiddenNotifications) {
		hiddenNotifications = [];
	}
	return hiddenNotifications;
}

function getDashboard(callback) {
	var dashboard = store.get('dashboard');
	if (dashboard == null) {
		CTXS.ExtensionAPI.proxyRequest({
			url: config.dashboard.url,
			dataType: "json",
			cache: false,
			success: function(response) {
				dashboard = response;
				setDashboard(dashboard);
				callback(dashboard);
			},
			error: function(response) {
				log.error(response);
			}
		});
	} else {
		callback(dashboard);
	}
}

function setHiddenNotifications(notifications) {
	store.set('hiddenNotifications', notifications);
}

function setDashboard(dashboard) {
	if (config.dashboard.caching.enabled) {
		var expiration = new Date().getTime() + config.dashboard.caching.duration;
		store.set('dashboard', dashboard, expiration);
	} else {
		store.set('dashboard', dashboard, new Date().getTime());
	}
}

function formatNotification(notification) {
	var className = "notification";
	switch (notification.Type) {
		case 1:
			className += " is-primary";
			break;
		case 2:
			className += " is-info";
			break;
		case 3:
			className += " is-success";
			break;
		case 4:
			className += " is-warning";
			break;
		case 5:
			className += " is-danger";
			break;
	}

	var content = notification.Message;
	if (notification.Closable) {
		content = '<button class="delete"></button> ' + content;
	}

	return notificationTemplate.supplant({
		class: className,
		id: notification.ID,
		content: content
	});
}

function formatDesktopStatus(desktop, additionalClass) {
	var className = 'tag ',
	    tag 	  = null,
		pos 	  = 'down',
		popup     = null,
		content   = null;

	if (additionalClass) {
		className += additionalClass + ' ';
	}
	if (desktop.UnderMaintenance) {
		content   = "Under Maintenance";
		className += 'is-warning';
	} else if (desktop.IsDisconnected) {
		if (desktop.SessionOpen) {
			popup = "Your session is still running for " + desktop.SessionOpen + ". Please log out?";
		} else {
			popup = "Your session is still running. Please log out?";
		}
		content   = "Session Disconnected";
		className += 'is-danger';
	} else if (desktop.HasSession) {
		content   = "Session Connected";
		className += 'is-success';
	} else if (desktop.SessionSupport === 1) {
		if (desktop.MachinesAvailable === 0) {
			content   = "None Available";
			className += 'is-warning';
		} else {
			content   = "Available: " + desktop.MachinesAvailable;
			className += 'is-primary';
		}
	}

	if (content) {
		if (popup) {
			tag = tagPopupTemplate.supplant({
				class: className,
				content: content,
				popup: popup,
				pos: pos
			});
		} else {
			tag = tagTemplate.supplant({
				class: className,
				content: content
			});
		}
	}
	return tag;
}



function addNotification(notification) {
	$notifications.append(formatNotification(notification));
}

function removeNotification(notification) {
	var $notification = $('#customTop .notification[data-id="' + notification.ID + '"');
	if ($notification) {
		$notification.remove();
	}
}

function updateNotification(notification) {
	var $notification = $('#customTop .notification[data-id="' + notification.ID + '"');
	if ($notification) {
		$notification.replaceWith(formatNotification(notification));
	}
}

function loadNotifications(notifications) {
	var hiddenNotifications = getHiddenNotifications();
	$.each(notifications, function(i, notification) {
		// Don't show if hidden
		if ($.inArray(notification.ID, hiddenNotifications) >= 0) {
			return;
		}
		// Don't show if already visible
		if ($('#customTop .notification[data-id="' + notification.ID + '"').length) {
			return;
		}
		addNotification(notification);
	});
	CTXS.ExtensionAPI.resize();
}

function loadDashboard(dashboard) {
	var desktops = CTXS.Store.getDesktops(),
		re 		 = /\$S(\d+)-\d/,
		id 		 = null,
		result	 = null,
		tag      = null,
		$desktop = null;

	$.each(desktops, function(i, desktop) {
		id = re.exec(desktop.id);
		if (!id || id.length < 1) return;
		id = id[1];
		result = $.grep(dashboard.Desktops, function(e) { return e.ID == id; });

		if (result.length == 0) return;

		result   = result[0];
		//$desktop = $(".storeapp-name:contains('" + desktop.name + "')");
		$desktop = $(".storeapp-name").filter(function() {
			return $(this).text() === desktop.name;
		})
		tag 	 = formatDesktopStatus(result, 'storeapp-status');

		if (tag) {
			$desktop.parent().parent().append(tag);
		}
	});
	CTXS.ExtensionAPI.resize();
	loadingDashboard = false;
}

function showAppInfo(dashboard) {
	var desktops = CTXS.Store.getDesktops(),
		re 		 = /\$S(\d+)-\d/,
		id 		 = null,
		result	 = null,
		tag      = null,
		desktop  = null,
		$desktop = $(".appInfoName");

		desktop = $.grep(desktops, function(e) { return e.name == $desktop.text(); });

		if (desktop.length == 0) return;

		desktop = desktop[0];
		id 	    = re.exec(desktop.id);
		if (!id || id.length < 1) return;
		id 	    = id[1];
		
		result  = $.grep(dashboard.Desktops, function(e) { return e.ID == id; });

		if (result.length == 0) return;

		result = result[0];
		tag    = formatDesktopStatus(result, 'appInfoStatus');

		if (tag) {
			$desktop.parent().append(tag);
		}
}

function initNotificationHub () {
	var url   = config.notifications.url,
		debug = config.notifications.debug,
		hub   = notificationHub(url, debug);

	hub.on('addNotification', function(notification) {
		addNotification(notification);
		CTXS.ExtensionAPI.resize();
	});
	hub.on('removeNotification', function(notification) {
		removeNotification(notification);
		CTXS.ExtensionAPI.resize();
	});
	hub.on('updateNotification', function(notification) {
		updateNotification(notification);
		CTXS.ExtensionAPI.resize();
	});

	hub.start().done(function() {
		hub.getNotifications().done(function(notifications) {
			loadNotifications(notifications);
			CTXS.ExtensionAPI.resize();
		});
	});
}

$('#customTop').on('click', '.delete', function() {	
	var $parent 		    = $(this).parent(),
		hiddenNotifications = getHiddenNotifications(),
		id 				    = $parent.data('id');

		if ($.inArray(id, hiddenNotifications) === -1) {
			hiddenNotifications.push(id);
			setHiddenNotifications(hiddenNotifications);
		}
		$parent.remove();
		CTXS.ExtensionAPI.resize();
	});

CTXS.Extensions.beforeDisplayHomeScreen = function(callback) {
	if (config.notifications.enabled) {
		initNotificationHub();
	}
	defaultfn();
};

CTXS.Extensions.beforeLogon = function(callback) {
	setRandomBackground();
	defaultfn();
};

CTXS.Extensions.onViewChange = function(view) {
	if ((view === "desktops" || view === "myapps") && view !== "search") {
		CTXS.Extensions.onAppHTMLGeneration = function() {
			if (!loadingDashboard) {
				loadingDashboard = true;
				getDashboard(loadDashboard);
			}
		}
	} else if (view === "appinfo") {
		$('.appInfoStatus').remove();
		getDashboard(showAppInfo);
	}
	currentView = view;
}