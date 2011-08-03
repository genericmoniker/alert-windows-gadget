var sizerCtor = function() {
    var gadgetWidth = 130;
    var gadgetHeight = 98;

    // Amount to scale gadget when docked or undocked.
    var scaleDocked = 1;
    var scaleUndocked = 2;

    var updateSize = function() {
        var bodyStyle = document.body.style;
        if (System.Gadget.docked) {
            bodyStyle.width = gadgetWidth * scaleDocked;
            bodyStyle.height = gadgetHeight * scaleDocked;
        } else {
            bodyStyle.width = gadgetWidth * scaleUndocked;
            bodyStyle.height = gadgetHeight * scaleUndocked;
        }
    };

    System.Gadget.onDock = updateSize;
    System.Gadget.onUndock = updateSize;
  
};