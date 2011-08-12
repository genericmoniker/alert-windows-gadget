// Authentication/authorization service.
// Dependencies:
// spec.httpClient
// spec.localStorage
var authServiceCtor = function(spec) {

	var userIsAuthenticated = false;
	var username = "";

	// TODO: This belongs somewhere else
	var xmlEscape = function(string) {
		string.replace(/&/g, "&amp;");
		string.replace(/</g, "&lt;");
		return string;
	};

	var authenticateFromStorage = function(onSuccess, onFailure, onCredentialsNeeded) {
		var authToken = spec.localStorage.getValue("authToken");
		
		// Note: We don't check for null to handle undefined case too.
		if (authToken) {
			username = spec.localStorage.getValue("username");
			spec.httpClient.setAuthToken(authToken);
			spec.httpClient.get("membership.svc/validate", null, false, 
				// Success
				function(transport) {
					userIsAuthenticated = true;
					onSuccess(transport);
				},
				
				// Failure
				onFailure);
		}	else {
			if (onCredentialsNeeded) {
				onCredentialsNeeded();
			}
		}
	};
	
	 var authenticate = function(username, password, persist, onSuccess, onFailure) {
	
		var authInfo = "<AuthInfo><UserName>" +
			xmlEscape(username) + 
			"</UserName><Password>" +
			xmlEscape(password) +
			"</Password></AuthInfo>"; 
			
		spec.httpClient.post("membership.svc/authenticate", null, authInfo, true,
	
			// Success
			function(transport) {
				var authToken = transport.getHeader("X-Authorization-Token");
				if (authToken) {
					Mojo.Log.info("Authenticate succeeded: %s", transport.status);
					spec.httpClient.authToken = authToken;
					if (persist) {
						spec.localStorage.setValue("authToken", authToken);
						spec.localStorage.setValue("username", username);
					}
					userIsAuthenticated = true;
					if (onSuccess) {
						onSuccess(transport);
					}
				} else {
					Mojo.Log.error("HTTPClient reports success, but no auth token.");
					onFailure(transport);
				}
			},
			
			// Failure
			onFailure);
	};

	var logout = function() {
		spec.localStorage.remove("authToken");
		spec.localStorage.remove("username");
		userIsAuthenticated = false;
		username = "";
	};

	var getUserIsAuthenticated = function() {
		return userIsAuthenticated;
	};

	var getUsername = function() {
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
