
var SWITCH_INTERVAL = 10000;
var RETRY_TIMEOUT = 10000;

var settings = null;
var sizer = null;
var services = null;
var cameras = [];
var cameraIndex = 0;
var intervalId = null;
var siteLoadTry = 1;
var logger;

function showMessage(message) {
	$("message").show();
	$("message-icon").src = "img/info.png";
	$("message-text").update(" " + message);
	$("snapshot").hide();
}

function showBusyMessage() {
	$("message").show();
	$("message-icon").src = "img/busy.gif";
	$("message-text").update(" Loading data");
	$("snapshot").hide();
}

function hideMessage() {
	$("message").hide();
	$("snapshot").show();
}

function retry(what, when) {
	setTimeout(what, when);
}

function showCameraSnapshot() {
	var url = cameras[cameraIndex].snapshotURL;
	url += (url.indexOf("?") < 0) ? "?" : "&";
	url += "nocache=" + new Date().getTime();
	logger.log("Camera snapshot URL: %0", url.toString());
	$("snapshot").src = url;
}

function switchCamera() {
	cameraIndex = ++cameraIndex % cameras.length;
	showCameraSnapshot();
}

function buildCameraList() {
	cameras = [];
	cameraIndex = 0;
	logger.log("Loading sites/cameras...");
	services.siteService.loadSites(
		function (sites) {
			siteLoadTry = 0;
			for (var s = 0; s < sites.length; ++s) {
				cameras = cameras.concat(sites[s].cameras);
			}
			
			// Show the first camera and schedule to switch.
			showCameraSnapshot();
			intervalId = setInterval(switchCamera, SWITCH_INTERVAL);
			logger.log("cameras: %0", cameras);
		},
		function () {
			logger.log("Error loading sites/cameras. Try %0", siteLoadTry);
			showMessage("Problem loading data. Retrying in a few seconds. " + siteLoadTry++);
			retry(buildCameraList, RETRY_TIMEOUT);
		}
	);
}

function onLoginFailure() {
	// todo
	showMessage("Log in failed.<br>Try again.");
}

function onCredentialsNeeded() {
	showMessage("Please log in.");
	// TEMPORARY!
	//login("username", "password");
}

function login(username, password) {
	if (services) {
		showBusyMessage();
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
	else {
		showMessage("Internal error 1");
		logger.log("Services unexpectedly uninitialized.")
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

function setupHover() {
	$("container").observe("mouseenter", function (event) {
		$("caption").show();
	});
	
	$("container").observe("mouseleave", function (event) {
		$("caption").hide();
	});
}

function setupImageEvents() {
	$("snapshot").observe("load", function (event) {
		var name = cameras[cameraIndex].name;
		$("caption-text").update(name);
		$("snapshot").show();
		hideMessage();
	});
	$("snapshot").observe("error", function (event) {
		var name = cameras[cameraIndex].name;
		logger.log("Image load error. Assuming %0 is offline.", name);
		showMessage(name + "(offline)");
	});
}


function loadMain() {
	mockForBrowser();
	services = new GadgetServiceLocator();
	logger = services.logger;
	
	System.Gadget.settingsUI = "settings.html";
	System.Gadget.onSettingsClosed = settingsClosed;	
	
	sizer = sizerCtor();
  
//	setupHover();
	setupImageEvents();
	showBusyMessage();
	login();
}
