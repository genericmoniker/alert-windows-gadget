
var SWITCH_INTERVAL = 10000;

var settings = null;
var sizer = null;
var services = null;
var cameras = [];
var cameraIndex = 0;
var intervalId = null;
var logger;

function showMessage(message) {
	$("message").show().innerHTML += message + " ";
}

function showCameraSnapshot() {
	$("message").hide();
	$("snapshot").show().src = cameras[cameraIndex].snapshotURL;
	logger.log(cameras[cameraIndex].snapshotURL);
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
	showMessage("login failure");
}

function onCredentialsNeeded() {
	showMessage("Please click the options icon to log in to your account.");
	// TEMPORARY!
	login("ericsmith@byu.net", "video.1");
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

function loadMain() {
	services = new ServiceLocator();
	logger = services.logger;
	System.Gadget.settingsUI = "settings.html";
	System.Gadget.onSettingsClosed = settingsClosed;	
	sizer = sizerCtor();
  
	login();
}
