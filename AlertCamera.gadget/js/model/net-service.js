
function NetService() {
	this.ipAddressRegExp = /([0-9]+)\.([0-9]+)\.([0-9]+)\.([0-9]+)/; // liberal match

	this.httpClient = null;
	this.isInternetConnectionAvailable = false;
	this.ipExternal = null;

	this.init();
}

NetService.prototype.init = function() {
	this.isInternetConnectionAvailable = navigator.onLine;
};

NetService.prototype.refreshIPExternal = function() {
};
