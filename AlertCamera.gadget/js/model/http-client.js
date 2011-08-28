// HTTP client abstraction.
// Dependencies:
// spec.logger
// spec.prefsService
var httpClientCtor = function(spec) {

	var authToken = "";
	var defaultHost = "alert.logitech.com";
	var logger = spec.logger;

	var setAuthToken = function(token) {
		authToken = token;
	};

	var getHost = function() {
		if (spec.prefsService.useServerOverrides) {
			var hostOverride = spec.prefsService.webServerOverride;
			if (hostOverride && hostOverride.length > 0) {
				return hostOverride;
			} 
		}
		return defaultHost;
	};

	var getBaseURL = function(secure) {
		var host = getHost();
		var baseURL = null;
		
		// Disable HTTPS if we've got server overrides so that
		// we can also use self-signed certs.
		if (spec.prefsService.useServerOverrides) {
			secure = false;
		}
		
		if (secure) {
			baseURL = "https://" + host + "/Services/";
		} else {
			baseURL = "http://" + host + "/Services/";
		}
		return baseURL;
	};

	var resolveURL = function(relativeURL, secure, addAuth) {
		var url = getBaseURL(secure) + relativeURL;
		if (addAuth) {
			url += "?_auth=" + authToken;
		}
		return url;
	};

	var addAuthorization = function(headers) {
		if (authToken !== null && authToken.length > 0) {
			headers.Authorization = authToken;
		}
	};

	var handleException = function(response, e) {
		logger.log("HTTP request exception: %0", e.message);
	};

	var handleComplete = function(response) {
		logger.log("HTTP request complete: %0 %1 URL: %2",
			response.status, response.statusText, response.request.url);
	};

	var sendRequest = function(relativeURL, options) {
		var url = resolveURL(relativeURL, options.secure, false);
		options.requestHeaders = options.requestHeaders || {};
		addAuthorization(options.requestHeaders);
		options.onException = handleException;
		options.onComplete = handleComplete;
		var request = new Ajax.Request(url, options);
	};

// TODO: Object specifier rather than lots of parameters
	var post = function(relativeURL, headers, data, secure, onSuccess, onFailure) {
		sendRequest(relativeURL, {
				secure: secure,
				method: "post",
				contentType: "application/xml",
				postBody: data,
				requestHeaders: headers,
				onSuccess: onSuccess,
				onFailure: onFailure,
				onException: handleException,
				onComplete: handleComplete
		});
	};

// TODO: Object specifier rather than lots of parameters
	var get = function(relativeURL, headers, secure, onSuccess, onFailure) {
		sendRequest(relativeURL, {
				secure: secure,
				method: "get",
				requestHeaders: headers,
				onSuccess: onSuccess,
				onFailure: onFailure,
				onException: handleException,
				onComplete: handleComplete
			});
	};


// TODO: Object specifier rather than lots of parameters
	var getExternal = function(url, headers, onSuccess, onFailure) {
		headers = headers || {};
		var request = new Ajax.Request(url, 
			{
				method: "get",
				requestHeaders: headers,
				onSuccess: onSuccess,
				onFailure: onFailure,
				onException: handleException,
				onComplete: handleComplete
			});
	};


	// Public Interface -------------------------------------
	return {
		setAuthToken: setAuthToken,
		post: post,
		get: get,
		getExternal: getExternal,
		resolveURL: resolveURL
	};
};
