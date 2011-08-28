function settingsClosing(event) {
	if (event.closeAction === event.Action.commit) {
		System.Gadget.Settings.writeString("username", username.value);
		System.Gadget.Settings.writeString("password", password.value);
	}
}

function loadSettings() {
	System.Gadget.onSettingsClosing = settingsClosing;
	
	username.value = System.Gadget.Settings.readString("username");
	password.value = System.Gadget.Settings.readString("password");
}
