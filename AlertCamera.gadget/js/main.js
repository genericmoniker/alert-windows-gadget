
var SWITCH_INTERVAL = 10000;

var settings = null;
var sizer = null;
var services = null;
var cameras = [];
var cameraIndex = 0;
var intervalId = null;
var logger;

function showMessage(message) {
	$("message").show();
//	$("message-icon").src = "img/info.png";
	$("message-text").innerText = " " + message;
}
function hideMessage() {
	$("message").hide();
}

function showCameraSnapshot() {
	var url = cameras[cameraIndex].snapshotURL;
	url += (url.indexOf("?") < 0) ? "?" : "&";
	url += "nocache=" + new Date().getTime();
	logger.log("Camera snapshot URL: %0", url.toString());
	$("message").hide();
	$("snapshot").show().src = url;
}

function switchCamera() {
	cameraIndex = ++cameraIndex % cameras.length;
	showCameraSnapshot();
}

function buildCameraList() {
	cameras = [];
	cameraIndex = 0;
	services.siteService.loadSites(
		function(sites) {
			for (var s = 0; s < sites.length; ++s) {
				cameras = cameras.concat(sites[s].cameras);
			}
			intervalId = setInterval(switchCamera, SWITCH_INTERVAL);
			logger.log("cameras: %0", cameras);
		},
		function() {
			// todo (failure)
		}
	);
}

function onLoginFailure() {
	// todo
	showMessage("Log in failed.");
}

function onCredentialsNeeded() {
	showMessage("Log in using the Options button.");
	// TEMPORARY!
	//login("username", "password");
}

function login(username, password) {
	if (services) {
		if (username) {
			services.authService.authenticate(
			  username, password, true, buildCameraList, onLoginFailure
			);
		} else {
			services.authService.authenticateFromStorage(
			  buildCameraList, onLoginFailure, onCredentialsNeeded
			);
		}
	}
}

function settingsClosed(event) {
	if (event.closeAction === event.Action.commit) {
		hideMessage();
		cameras = [];
		if (intervalId) {
			clearInterval(intervalId);
		}
		login(
		  services.localStorage.getValue("username"),
		  services.localStorage.getValue("password")
		);
	}
}

function mockForBrowser() {
	if (typeof System == "undefined") {
		System = {
			Gadget:{
				Settings: { readString: function(){}, writeString: function(){} }
			},
			Debug: {
				outputString: function(text) { console.log(text);}
			}
		};
	}
}


function loadMain() {
	mockForBrowser();
	services = new ServiceLocator();
	logger = services.logger;
	
	System.Gadget.settingsUI = "settings.html";
	System.Gadget.onSettingsClosed = settingsClosed;	
	
	sizer = sizerCtor();
  
	login();
}
