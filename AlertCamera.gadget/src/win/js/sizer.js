// Gadget sizer that handles "docked" and "undocked", which
// in Windows 7 is really "Larger size" and "Smaller size".
var sizerCtor = function() {
    var updateSize = function() {
        if (System.Gadget.docked) {
			$(document.body).setStyle({
				width: 130,
				height: 100
			});
			System.Gadget.background = "url(img/background-docked.png)";
			$("snapshot").setStyle({
				'width': 120,
				'height': 90
			});
			$("container").setStyle({
				'padding-top': 5,
				'padding-left': 4
			});
			$("message").className = "message-docked";
        } else {
			$(document.body).setStyle({
				width: 360,
				height: 280
			});
			System.Gadget.background = "url(img/background-undocked.png)";
			$("snapshot").setStyle({
				'width': 319,
				'height': 240
			});
			$("container").setStyle({
				'padding-top': 16,
				'padding-left': 17
			});
			$("message").className = "message-undocked";
        }
    };

    System.Gadget.onDock = updateSize;
    System.Gadget.onUndock = updateSize;
  
};