// Logger with a single "log" method. Parameter replacement is supported.
// Examples:
//   logger.log("Hello, world!");
//   logger.log("%0, %0, %0 starts with %1", "cookie", "C");
// 
// This implementation outputs to the Windows debug console.
var loggerCtor = function() {

	var MAX_DUMP_DEPTH = 10;

	var output = function(text) {
		System.Debug.outputString(text);
	}
	
	// Based on a function found at:
	// http://geekswithblogs.net/svanvliet/archive/2006/03/23/simple-javascript-object-dump-function.aspx  
	function dumpObj(obj, name, indent, depth) {
		indent = indent || "";
		if (depth > MAX_DUMP_DEPTH) {
			   return indent + name + ": <Maximum Depth Reached>\n";
		}
		if (typeof obj == "object") {
			var child = null;
			var result = indent + name + "\n";
			indent += "    ";
			for (var item in obj) {
				try {
					child = obj[item];
				} catch (e) {
					child = "<Unable to Evaluate>";
				}
				if (typeof child == "object") {
					result += dumpObj(child, item, indent, depth + 1);
				} else if (typeof child == "function") {
					result += indent + item + ": function\n";
				} else {
					result += indent + item + ": " + child + "\n";
				}
			}
			return result;
		} else {
			return obj;
		}
	}


	var log = function() {
		if (typeof arguments == "undefined") return;
		if (arguments.length == 0) return;
		if (typeof arguments[0] != "string") return;
		
		var message = arguments[0];
		for (var i = 1; i < arguments.length; ++i) {
			var regexp = new RegExp("%" + (i - 1), "g");
			var arg = (typeof arguments[i] != "object") ? arguments[i] : dumpObj(arguments[i], "");
			message = message.replace(regexp, arg);
		}
		output(message);
	};
	
	return {
		log: log
	}
};