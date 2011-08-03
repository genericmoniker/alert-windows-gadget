var settingsCtor = function() {

  var settingsClosed = function(event) {
    if (event.closeAction === event.Action.Commit) {
      // TODO: Raise event
    }
  };

  System.Gadget.settingsUI = "settings.html";
  System.Gadget.onSettingsClosed = settingsClosed;
  

  
};