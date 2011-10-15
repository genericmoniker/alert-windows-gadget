// Local storage implementation backed by nothing (could use cookies).
// Dependencies:
// spec.logger
var browserLocalStorageCtor = function (spec) {
	var logger = spec.logger;
	
	var getValue = function (name) {
		return "";
	};
	
	var setValue = function (name, value) {
	};
	
	var remove = function (name) {
	};
	
	return {
		getValue: getValue,
		setValue: setValue,
		remove: remove
	};
};


function BrowserServiceLocator() {
    
    // Create services
    this.logger = loggerCtor();
    this.localStorage = browserLocalStorageCtor({ logger: this.logger });
    this.prefsService = {};
    this.httpClient = httpClientCtor({ logger: this.logger, prefsService: this.prefsService });
    this.authService = authServiceCtor({ httpClient: this.httpClient, localStorage: this.localStorage, logger: this.logger });
    this.siteService = siteServiceCtor({ httpClient: this.httpClient, logger: this.logger, prefsService: this.prefsService });
    this.clipService = clipServiceCtor({ httpClient: this.httpClient, logger: this.logger});
    this.netService = new NetService();
    
    // Resolve dependencies
    this.prefsService.localStorage = this.localStorage;
    this.netService.httpClient = this.httpClient;
    
    // Other setup
}


// Authentication/authorization service.
// Dependencies:
// spec.httpClient
// spec.localStorage
// spec.logger
var authServiceCtor = function (spec) {

    var userIsAuthenticated = false;
    var username = "";
    
    var logger = spec.logger;

    // TODO: This belongs somewhere else
    var xmlEscape = function (string) {
        string.replace(/&/g, "&amp;");
        string.replace(/</g, "&lt;");
        return string;
    };

    var authenticateFromStorage = function (onSuccess, onFailure, onCredentialsNeeded) {
        var authToken = spec.localStorage.getValue("authToken");
        
        // Note: We don't check for null to handle undefined case too.
        if (authToken) {
            username = spec.localStorage.getValue("username");
            spec.httpClient.setAuthToken(authToken);
            spec.httpClient.get("membership.svc/validate", null, false, 
                // Success
                function (transport) {
                    userIsAuthenticated = true;
                    onSuccess(transport);
                },
                
                // Failure
                onFailure);
        } else {
            if (onCredentialsNeeded) {
                onCredentialsNeeded();
            }
        }
    };
    
     var authenticate = function (username, password, persist, onSuccess, onFailure) {
    
        var authInfo = "<AuthInfo><UserName>" +
            xmlEscape(username) + 
            "</UserName><Password>" +
            xmlEscape(password) +
            "</Password></AuthInfo>"; 
            
        spec.httpClient.post("membership.svc/authenticate", null, authInfo, true,
    
            // Success
            function (transport) {
                var authToken = transport.getHeader("X-Authorization-Token");
                if (authToken) {
                    logger.log("Authenticate succeeded: %0  Token: %1", transport.status, authToken);
                    spec.httpClient.setAuthToken(authToken);
                    if (persist) {
                        spec.localStorage.setValue("authToken", authToken);
                        spec.localStorage.setValue("username", username);
                    }
                    userIsAuthenticated = true;
                    if (onSuccess) {
                        onSuccess(transport);
                    }
                } else {
                    logger.log("HTTPClient reports success, but no auth token.");
                    onFailure(transport);
                }
            },
            
            // Failure
            onFailure);
    };

    var logout = function () {
        spec.localStorage.remove("authToken");
        spec.localStorage.remove("username");
        userIsAuthenticated = false;
        username = "";
    };

    var getUserIsAuthenticated = function () {
        return userIsAuthenticated;
    };

    var getUsername = function () {
        return username;
    };

    // Public Interface
    return {
        authenticateFromStorage: authenticateFromStorage,
        authenticate: authenticate,
        logout: logout,
        getUserIsAuthenticated: getUserIsAuthenticated,
        getUsername: getUsername
    };
};

// Service for recorded clips.
// Dependencies:
// spec.httpClient
// spec.logger
var clipServiceCtor = function (spec) {
    
    var logger = spec.logger;

    // We want String trim below. Could belong elsewhere.
    var trim = function (str) {
        return str.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
    };

    var formatDatePath = function (date) {
        var result = 
            "/" + date.getUTCFullYear().toString() +
            "/" + (date.getUTCMonth() + 1).toString() +
            "/" + date.getUTCDate().toString();
        logger.log("Date path: " + result);
        return result;
    };
    
    // TODO: Share with clip service
    var getChildText = function (element, childName) {
        var text = element.getElementsByTagName(childName)[0].childNodes[0].nodeValue;
        return trim(text);
    };
    
    var getClipURL = function (clip) {
        var url = spec.httpClient.resolveURL(
            "clip.svc/" + clip.mac + "/" + clip.id, false, true);
        url += "&format=mjpeg";
        return url;
    };
    
    var parseClip = function (clipElement) {
        var clip = {
          id: getChildText(clipElement, "ClipId"),
          mac: getChildText(clipElement, "MacAddress"),
          start: getChildText(clipElement, "StartTime")
        };
        clip.url = getClipURL(clip);
        return clip;
    };
    
    var parseClips = function (xml) {
		var c;
        var result = [];
        if (xml !== null) {
            var clipElements = xml.getElementsByTagName("Clip");
            for (c = 0; c < clipElements.length; ++c) {
                var clip = parseClip(clipElements[c]);
                result.push(clip);
            }
        } else {
            logger.log("No XML returned for this clip request.");
        }
        return result;
    };

    var getClipsForDate = function (mac, date, onSuccess, onFailure) {
        logger.log("Clip search date (camera local time): " + date.toString());
        spec.httpClient.get("search.svc/" + mac + formatDatePath(date),
            null, true,
            function (response) {
                var clips = parseClips(response.responseXML);
                onSuccess(clips);
            },
            onFailure
        );
    };
	
	var getClips = function (options) {
		options.date = options.date || getDefaultDate(); // TODO
		options.count = options.count || 10;
		options.thumbnail = options.thumbnail || false;
		
        logger.log("Clip search date (camera local time): " + options.date.toString());
		var url = "search.svc/" + options.mac + "/between?start=2000-01-01" +
			"&end=" + options.date + // TODO: ISO 8601
			"&results=" + options.count.toString() +
			"&thumbnail=" + options.thumbnail;
        spec.httpClient.get(url, null, true,
            function (response) {
                var clips = parseClips(response.responseXML);
                onSuccess(clips);
            },
            onFailure
        );
	};
    
    return {
        getClipsForDate: getClipsForDate
    };
};
// HTTP client abstraction.
// Dependencies:
// spec.logger
// spec.prefsService
var httpClientCtor = function (spec) {

	var authToken = "";
	var defaultHost = "alert.logitech.com";
	var logger = spec.logger;

	var setAuthToken = function (token) {
		authToken = token;
	};

	var getHost = function () {
		if (spec.prefsService.useServerOverrides) {
			var hostOverride = spec.prefsService.webServerOverride;
			if (hostOverride && hostOverride.length > 0) {
				return hostOverride;
			} 
		}
		return defaultHost;
	};

	var getBaseURL = function (secure) {
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

	var resolveURL = function (relativeURL, secure, addAuth) {
		var url = getBaseURL(secure) + relativeURL;
		if (addAuth) {
			url += "?_auth=" + authToken; // TODO: fix if the URL already has ?
		}
		return url;
	};

	var addAuthorization = function (headers) {
		if (authToken !== null && authToken.length > 0) {
			headers.Authorization = authToken;
		}
	};

	var handleException = function (response, e) {
		logger.log("HTTP request exception: %0", e.message);
	};

	var handleComplete = function (response) {
		logger.log("HTTP request complete: %0 %1 URL: %2",
			response.status, response.statusText, response.request.url);
	};

	var sendRequest = function (relativeURL, options) {
		var url = resolveURL(relativeURL, options.secure, false);
		options.requestHeaders = options.requestHeaders || {};
		addAuthorization(options.requestHeaders);
		options.onException = handleException;
		options.onComplete = handleComplete;
		var request = new Ajax.Request(url, options);
	};

// TODO: Object specifier rather than lots of parameters - maybe an options object
	var post = function (relativeURL, headers, data, secure, onSuccess, onFailure) {
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
	var get = function (relativeURL, headers, secure, onSuccess, onFailure) {
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
	var getExternal = function (url, headers, onSuccess, onFailure) {
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

// Logger with a single "log" method. Parameter replacement is supported.
// Dependencies:
//   spec.output - optional output function, default uses console.log.
// Examples:
//   logger.log("Hello, world!");
//   logger.log("%0, %0, %0 starts with %1", "cookie", "C");
// 
// This implementation outputs to the Windows debug console.
var loggerCtor = function (spec) {

	var MAX_DUMP_DEPTH = 10;

	spec = spec || {};

	var output = spec.output || function (text) {
		console.log(text);
	};
	
	// Based on a function found at:
	// http://geekswithblogs.net/svanvliet/archive/2006/03/23/simple-javascript-object-dump-function.aspx  
	var dumpObj = function (obj, name, indent, depth) {
		var item;
		indent = indent || "";
		if (depth > MAX_DUMP_DEPTH) {
			return indent + name + ": <Maximum Depth Reached>\n";
		}
		if (obj === null) {
			return indent + name + ": (null)\n";
		}
		
		if (typeof obj === "object") {
			var child = null;
			var result = indent + name + "\n";
			indent += "    ";
			for (item in obj) {
				if (obj.hasOwnProperty(item)) {
					try {
						child = obj[item];
					} catch (e) {
						child = "<Unable to Evaluate>";
					}
					if (child === null) {
						result += indent + item + ": (null)\n";
					} else if (typeof child === "object") {
						result += dumpObj(child, item, indent, depth + 1);
					} else if (typeof child === "function") {
						result += indent + item + ": function\n";
					} else {
						result += indent + item + ": " + child + "\n";
					}
				}
			}
			return result;
		} else {
			return obj.toString();
		}
	};


	var log = function (message) {
		if (typeof arguments === "undefined") { return };
		if (arguments.length === 0) { return };
		if (typeof message !== "string") { return };
		
		for (var i = 1; i < arguments.length; ++i) {
			var regexp = new RegExp("%" + (i - 1), "g");
			var arg = (typeof arguments[i] !== "object") ? arguments[i] : dumpObj(arguments[i], "");
			message = message.replace(regexp, arg);
		}
		output(message);
	};
	
	return {
		log: log
	}
};

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

function PrefsService() {

	this.VIDEO_MODE_AUTO = 0;
	this.VIDEO_MODE_DIRECT = 1;
	this.VIDEO_MODE_RELAY = 2;

	this.localStorage = null;
	this.resetToDefaults();
}

PrefsService.prototype.resetToDefaults = function() {
	this.videoMode = this.VIDEO_MODE_AUTO;
	this.useServerOverrides = false;
	this.webServerOverride = "";
	this.mediaServerOverride = "";
	this.selectedSite = "";
};

PrefsService.prototype.loadPref = function (name, defaultValue) {
	var value = this.localStorage.getValue(name);
	if (value) {
		return value;
	} else {
		return defaultValue;
	}
};

PrefsService.prototype.load = function() {
	Mojo.Log.info("Loading preferences");
	this.videoMode = parseInt(this.loadPref("videoMode", this.videoMode));
	this.useServerOverrides = this.loadPref("useServerOverrides", this.useServerOverrides);
	this.webServerOverride = this.loadPref("webServerOverride", this.webServerOverride);
	this.mediaServerOverride = this.loadPref("mediaServerOverride", this.mediaServerOverride);
	this.selectedSite = this.loadPref("selectedSite", this.selectedSite);
};

PrefsService.prototype.save = function() {
	Mojo.Log.info("Saving preferences");
	this.localStorage.setValue("videoMode", this.videoMode);
	this.localStorage.setValue("useServerOverrides", this.useServerOverrides);
	this.localStorage.setValue("webServerOverride", this.webServerOverride);
	this.localStorage.setValue("mediaServerOverride", this.mediaServerOverride);
	this.localStorage.setValue("selectedSite", this.selectedSite);
};


// Service for sites (and their cameras).
// Dependencies:
// spec.httpClient
// spec.logger
// spec.prefsService
var siteServiceCtor = function (spec) {

	var sites = null;
	var selectedSite = null;
	var logger = spec.logger;
	
	// We want String trim below. Could belong elsewhere.
	var trim = function (str) {
		return str.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
	};
	
	var stringToBoolean = function (s) {
		return (s === "true");
	};

	var findSiteById = function (siteId) {
		var s;
		for (s = 0; s < sites.length; ++s) {
			if (sites[s].id === siteId) {
				return sites[s];
			}
		}
		return null;
	};

	var getCameraSnapshotURL = function (camera) {
		return spec.httpClient.resolveURL(
			"camera2.svc/" + camera.mac + "/snapshotviewable", false, true);
	};

	var getCameraClassName = function (camera) {
		if (!camera.isOnline) {
			return "camera-offline";
		} else if (camera.productId === 17) { 
			return "camera-snowbird";
		} else {
			return "camera-alta";
		}
	};

	var getInitialSelectedSite = function () {
		var selectedSiteId = spec.prefsService.selectedSite;
		var site = findSiteById(selectedSiteId);
		if (site) {
			return site;
		}
		return sites[0];
	};

	var getSites = function () {
		return sites;
	};

	var getSelectedSite = function () {
		return selectedSite;
	};

	var selectSiteById = function (siteId) {
		var site = this.findSiteById(siteId);
		if (site) {
			this.selectedSite = site;
			this.prefsService.selectedSite = site.id;
		}
	};

	var getChildText = function (element, childName) {
		var text = element.getElementsByTagName(childName)[0].childNodes[0].nodeValue;
		return trim(text);
	};

	var parseCamera = function (cameraElement) {
		var camera = {
			mac: getChildText(cameraElement, "Mac"),
			name: getChildText(cameraElement, "Name"),
			isOnline: stringToBoolean(getChildText(cameraElement, "IsOnline")),
			ip: getChildText(cameraElement, "InternalIPAddress"),
			ipExternal: getChildText(cameraElement, "IPAddress"),
			productId: getChildText(cameraElement, "ProductId"),
			siteName: getChildText(cameraElement, "SiteName")
		};
		camera.snapshotURL = getCameraSnapshotURL(camera);
		// This seems to make the snapshots appear faster, but they also don't 
		// ever refresh anymore:
		// camera.snapshot = new Image();
		// camera.snapshot.src = camera.snapshotURL();
		camera.className = getCameraClassName(camera);
		logger.log("Camera: %0", camera);
		return camera;
	};

	var parseSite = function (siteElement) {
		var site = {
			name: getChildText(siteElement, "SiteName"),
			id: getChildText(siteElement, "SiteId")
		};
		var cameraElements = siteElement.getElementsByTagName("CameraInfo");
		site.cameras = [];
		for (var c = 0; c < cameraElements.length; ++c) {
			var camera = parseCamera(cameraElements[c]);
			site.cameras.push(camera);
		}
		return site;
	};

	var parseSites = function (xml) {
		var siteElements = xml.getElementsByTagName("SiteInfo");
		var result = [];
		for (var s = 0; s < siteElements.length; ++s) {
			var site = parseSite(siteElements[s]);
			result.push(site);
		}
		return result;
	};

	var loadSites = function (onSuccess, onFailure) {
		spec.httpClient.get("site.svc/?cameras=all&user=default", null, true,
			// Success
			function (response) {
				sites = parseSites(response.responseXML);
				selectedSite = getInitialSelectedSite();
				onSuccess(sites);
			},
			
			// Failure
			onFailure);
	};

	// Public Interface -------------------------------------
	return {
		loadSites: loadSites,
		getSites: getSites,
		selectSiteById: selectSiteById,
		getSelectedSite: getSelectedSite,
		findSiteById: findSiteById
	};
};

// Local storage implementation backed by Gadget Settings.
// http://msdn.microsoft.com/en-us/library/ff486214.aspx
// Dependencies:
// spec.logger
var gadgetLocalStorageCtor = function(spec) {
    var logger = spec.logger;
    
    var getValue = function(name) {
        var value = System.Gadget.Settings.readString(name);
        logger.log("getValue - %0: %1", name, value);
        return value;
    };
    
    var setValue = function(name, value) {
        System.Gadget.Settings.writeString(name, value);
    };
    
    var remove = function(name) {
        System.Gadget.Settings.writeString(name, null);
    };
    
    return {
        getValue: getValue,
        setValue: setValue,
        remove: remove
    };
}


function GadgetServiceLocator() {
    
    // Create services
    this.logger = loggerCtor({
		// override output for Windows debug console.
		output: function (text) {
			System.Debug.outputString(text);
		}
	});
    this.localStorage = gadgetLocalStorageCtor({ logger: this.logger });
    this.prefsService = {};
    this.httpClient = httpClientCtor({ logger: this.logger, prefsService: this.prefsService });
    this.authService = authServiceCtor({ httpClient: this.httpClient, localStorage: this.localStorage, logger: this.logger });
    this.siteService = siteServiceCtor({ httpClient: this.httpClient, logger: this.logger, prefsService: this.prefsService });
    this.clipService = clipServiceCtor({ httpClient: this.httpClient, logger: this.logger});
    this.netService = new NetService();
    
    // Resolve dependencies
    this.prefsService.localStorage = this.localStorage;
    this.netService.httpClient = this.httpClient;
    
    // Other setup
}


