// Gadget version checker
// Dependencies:
// spec.logger
// spec.versionURL
var versionCheckCtor = function (spec) {

	var logger = spec.logger;
	var url = spec.versionURL;

	var check = function(onNewVersion) {
		logger.log("Checking %0 for new version...", url);
		var request = new Ajax.Request(url, {
				method: 'GET',
				requestHeaders: {Accept: 'application/json'},
				onSuccess: function (response) {
					try {
						var gadgetVersion = System.Gadget.version;
						logger.log("Gadget version: %0", gadgetVersion);
						var json = response.responseText.evalJSON(true);
						var onlineVersion = json.version;
						
						// If we wanted to get the version from the page (less
						// maintenance, but wasting bandwidth) we could do it
						// something like this:
						// var data = new Element("div").update(response.responseText);
						// var onlineVersion = data.down("#version").innerText;

						logger.log("Online version: %0", onlineVersion);
						
						if (gadgetVersion !== onlineVersion && onNewVersion) {
							onNewVersion(json);
						}
					}
					catch (err) {
						logger.log("Error in version check response:");
						logger.log("%0", err);
					}
				},
				
				onFailure: function (response) {
					logger.log("Version check failed. %0 %1",
							   response.status, response.statusText);
				}
			}
		);
	};
	
	return {
		check: check
	};
}