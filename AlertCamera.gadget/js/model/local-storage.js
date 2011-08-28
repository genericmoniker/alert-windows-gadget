// Local storage implementation backed by Gadget Settings.
// http://msdn.microsoft.com/en-us/library/ff486214.aspx
// Dependencies:
// spec.logger
var localStorageCtor = function(spec) {
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
