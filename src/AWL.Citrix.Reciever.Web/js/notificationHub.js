"use strict";

require('signalr');
require('./hubs.js');

var inherits = require('inherits');
var events = require('events').EventEmitter;

// Bug in signalr client (https://github.com/SignalR/SignalR/issues/3776)
var getUrl = $.signalR.transports._logic.getUrl;
$.signalR.transports._logic.getUrl = function (connection, transport, reconnecting, poll, ajaxPost) {
	var url = getUrl(connection, transport, reconnecting, poll, ajaxPost);
	return connection.url + url.substring(url.indexOf(connection.appRelativeUrl) + connection.appRelativeUrl.length);
};

inherits(NotificationHub, events);
module.exports = NotificationHub;

function NotificationHub (url, logging) {
	if (!(this instanceof NotificationHub)) {
		return new NotificationHub(url, logging);
	}
	var _this = this;

	this.hub = $.connection.hub;
	this.hub.url = url;
	this.hub.logging = logging;

	this.notificationHub = $.connection.notificationHub;

	this.notificationHub.client.addNotification = function (notification) {
		_this.emit('addNotification', notification);
	}
	this.notificationHub.client.updateNotification = function (notification) {
		_this.emit('updateNotification', notification);
	}
	this.notificationHub.client.removeNotification = function (notification) {
		_this.emit('removeNotification', notification);
	}
}

NotificationHub.prototype.start = function (autoRestore) {
	var _this = this;

	if (autoRestore) {
		this.hub.disconnected(function () {
			_this.emit('disconnected');
			setTimeout(function () {
				_this.hub.start().done(function () {
					_this.emit('connected');
				});
        	}, 5000); // Restart connection after 5 seconds.
		});
	}

	this.hub.error(function (error) {
		_this.emit('error', error);
	});

	return this.hub.start();
};

NotificationHub.prototype.stop = function () {
	return this.hub.stop();
}

NotificationHub.prototype.getNotifications = function () {
	return this.notificationHub.server.getAllNotifications();
}