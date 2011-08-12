// Local storage implementation backed by Gadget Settings.
// http://msdn.microsoft.com/en-us/library/ff486214.aspx
function LocalStorage() {
}

LocalStorage.prototype.getValue = function(name) {
	return System.Gadget.Settings.readString(name);
};

LocalStorage.prototype.setValue = function(name, value) {
	System.Gadget.Settings.writeString(name, value);
};

LocalStorage.prototype.remove = function(name) {
	System.Gadget.Settings.writeString(name, null);
}