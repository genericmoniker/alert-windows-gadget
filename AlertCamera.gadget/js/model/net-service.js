
function NetService() {
	this.ipAddressRegExp = /([0-9]+)\.([0-9]+)\.([0-9]+)\.([0-9]+)/; // liberal match

	this.httpClient = null;
	this.isInternetConnectionAvailable = false;
	this.ipExternal = null;

	this.init();
}

NetService.prototype.init = function() {
		this.request = new Mojo.Service.Request('palm://com.palm.connectionmanager', {
		method: 'getstatus',
		parameters: {
			subscribe: true 
		},
		onSuccess: function(result) {
			this.isInternetConnectionAvailable = result.isInternetConnectionAvailable;
			if (this.isInternetConnectionAvailable) {
				this.refreshIPExternal();
			}
		}.bind(this),
		onFailure: function(result) {
			Mojo.Log.error("Failed to get network status. " + Object.toJSON(result));
		}.bind(this)
	});
};

NetService.prototype.refreshIPExternal = function() {
	// Using a third-party web service for IP address -- be careful not to abuse it.
	this.httpClient.getExternal("http://checkip.dyndns.com/", null,
		// success
		function(transport) {
			this.ipExternal = transport.responseText.match(this.ipAddressRegExp)[0];
			Mojo.Log.info("Device external IP address: " + this.ipExternal);
		}.bind(this),
		// failure
		function(transport) {
			Mojo.Log.error("Failed to get external IP address. " + Object.toJSON(transport));
		}
	);
};
