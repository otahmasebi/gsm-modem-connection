"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var AccessPoint_1 = require("./AccessPoint");
var recordIfNum_1 = require("./recordIfNum");
var knownVendorIds = Object.keys(recordIfNum_1.recordIfNum);
var udev = require("udev");
var ts_events_extended_1 = require("ts-events-extended");
var trackable_map_1 = require("trackable-map");
var delayModemReady = 4000;
var monitor = udev.monitor();
var accessPoints = new trackable_map_1.TrackableMap();
var Monitor = (function () {
    function Monitor() {
    }
    Object.defineProperty(Monitor, "connectedModems", {
        get: function () { return accessPoints.valuesAsArray(); },
        enumerable: true,
        configurable: true
    });
    Monitor.stop = function () { monitor.close(); };
    return Monitor;
}());
Monitor.evtModemConnect = new ts_events_extended_1.SyncEvent();
Monitor.evtModemDisconnect = new ts_events_extended_1.SyncEvent();
exports.Monitor = Monitor;
accessPoints.evtSet.attach(function (_a) {
    var accessPoint = _a[0];
    return Monitor.evtModemConnect.post(accessPoint);
});
accessPoints.evtDelete.attach(function (_a) {
    var accessPoint = _a[0];
    return Monitor.evtModemDisconnect.post(accessPoint);
});
function buildAccessPointId(udevEvt_ID_PATH) {
    return udevEvt_ID_PATH.slice(0, -1) + "x";
}
;
function isRelevantUdevEvt(udevEvt) {
    return (knownVendorIds.indexOf(udevEvt.ID_VENDOR_ID) >= 0 &&
        udevEvt.hasOwnProperty("ID_USB_INTERFACE_NUM") &&
        udevEvt.ID_USB_DRIVER !== "usb-storage");
}
var pendingAccessPoints = {};
monitor.on("add", function (udevEvt) {
    if (!isRelevantUdevEvt(udevEvt))
        return;
    var id = buildAccessPointId(udevEvt.ID_PATH);
    if (pendingAccessPoints[id])
        return;
    var accessPoint = new AccessPoint_1.AccessPoint(id, udevEvt.ID_VENDOR_ID, udevEvt.ID_MODEL_ID);
    accessPoint.ifPathByNum[parseInt(udevEvt.ID_USB_INTERFACE_NUM)] = udevEvt.DEVNAME;
    var onAdd = function (udevEvt) {
        if (!isRelevantUdevEvt(udevEvt) ||
            buildAccessPointId(udevEvt.ID_PATH) !== id)
            return;
        accessPoint.ifPathByNum[parseInt(udevEvt.ID_USB_INTERFACE_NUM)] = udevEvt.DEVNAME;
    };
    monitor.on("add", onAdd);
    pendingAccessPoints[id] = setTimeout(function () {
        monitor.removeListener("add", onAdd);
        delete pendingAccessPoints[id];
        accessPoints.set(id, accessPoint);
    }, delayModemReady);
});
monitor.on("remove", function (udevEvt) {
    if (!isRelevantUdevEvt(udevEvt))
        return;
    var id = buildAccessPointId(udevEvt.ID_PATH);
    if (pendingAccessPoints[id]) {
        clearTimeout(pendingAccessPoints[id]);
        delete pendingAccessPoints[id];
    }
    accessPoints.delete(id);
});
for (var _i = 0, _a = udev.list(); _i < _a.length; _i++) {
    var udevEvt = _a[_i];
    monitor.emit("add", udevEvt);
}
