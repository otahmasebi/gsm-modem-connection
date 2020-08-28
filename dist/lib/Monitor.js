"use strict";
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __values = (this && this.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Monitor = void 0;
var AccessPoint_1 = require("./AccessPoint");
var recordIfNum_1 = require("./recordIfNum");
var knownVendorIds = Object.keys(recordIfNum_1.recordIfNum);
var udev = require("udev");
var evt_1 = require("evt");
var trackable_map_1 = require("trackable-map");
var delayModemReady = 4000;
function buildAccessPointId(udevEvt_ID_PATH) {
    return udevEvt_ID_PATH.slice(0, -1) + "x";
}
;
function isRelevantUdevEvt(udevEvt) {
    return (knownVendorIds.indexOf(udevEvt.ID_VENDOR_ID) >= 0 &&
        udevEvt.hasOwnProperty("ID_USB_INTERFACE_NUM") &&
        udevEvt.SUBSYSTEM === "tty");
}
var Monitor = /** @class */ (function () {
    function Monitor(log) {
        var e_1, _a;
        var _this = this;
        this.evtModemConnect = new evt_1.Evt();
        this.evtModemDisconnect = new evt_1.Evt();
        this.pendingAccessPoints = new Map();
        this.accessPoints = new trackable_map_1.TrackableMap();
        this.monitor = udev.monitor();
        this.accessPoints.evtSet.attach(function (_a) {
            var _b = __read(_a, 1), accessPoint = _b[0];
            log("<MODEM CONNECT:>", accessPoint.toString());
            _this.evtModemConnect.post(accessPoint);
        });
        this.accessPoints.evtDelete.attach(function (_a) {
            var _b = __read(_a, 1), accessPoint = _b[0];
            log("<MODEM DISCONNECT:>", accessPoint.toString());
            _this.evtModemDisconnect.post(accessPoint);
        });
        var evtAdd = new evt_1.Evt();
        var evtRemove = new evt_1.Evt();
        this.monitor.on("add", function (udevEvt) {
            if (!isRelevantUdevEvt(udevEvt)) {
                return;
            }
            evtAdd.post(udevEvt);
        });
        this.monitor.on("remove", function (udevEvt) {
            if (!isRelevantUdevEvt(udevEvt)) {
                return;
            }
            evtRemove.post(udevEvt);
        });
        var ctxById = new Map();
        evtAdd.attach(function (udevEvt) {
            var id = buildAccessPointId(udevEvt.ID_PATH);
            if (_this.pendingAccessPoints.has(id)) {
                return;
            }
            var accessPoint = new AccessPoint_1.AccessPoint(id, udevEvt.ID_VENDOR_ID, udevEvt.ID_MODEL_ID);
            accessPoint.ifPathByNum[parseInt(udevEvt.ID_USB_INTERFACE_NUM)] = udevEvt.DEVNAME;
            var ctx = evt_1.Evt.newCtx();
            ctxById.set(id, ctx);
            evtAdd.attach(function (udevEvt) { return buildAccessPointId(udevEvt.ID_PATH) === id; }, ctx, function (udevEvt) {
                accessPoint.ifPathByNum[parseInt(udevEvt.ID_USB_INTERFACE_NUM)] = udevEvt.DEVNAME;
            });
            _this.pendingAccessPoints.set(id, setTimeout(function () {
                _this.pendingAccessPoints.delete(id);
                evtAdd.detach(ctx);
                _this.accessPoints.set(id, accessPoint);
            }, delayModemReady));
        });
        evtRemove.attach(function (udevEvt) {
            var _a;
            var id = buildAccessPointId(udevEvt.ID_PATH);
            if (_this.pendingAccessPoints.has(id)) {
                clearTimeout(_this.pendingAccessPoints.get(id));
                _this.pendingAccessPoints.delete(id);
                ;
                (_a = ctxById.get(id)) === null || _a === void 0 ? void 0 : _a.done();
            }
            ctxById.delete(id);
            _this.accessPoints.delete(id);
        });
        try {
            for (var _b = __values(udev.list()), _c = _b.next(); !_c.done; _c = _b.next()) {
                var udevEvt = _c.value;
                this.monitor.emit("add", udevEvt);
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_1) throw e_1.error; }
        }
    }
    Monitor.getInstance = function (log) {
        if (log === void 0) { log = function () { }; }
        if (this.instance) {
            return this.instance;
        }
        this.instance = new Monitor(log);
        return this.getInstance();
    };
    Object.defineProperty(Monitor, "hasInstance", {
        get: function () {
            return !!this.instance;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Monitor.prototype, "connectedModems", {
        get: function () {
            return this.accessPoints.valueSet();
        },
        enumerable: false,
        configurable: true
    });
    Monitor.prototype.stop = function () {
        this.monitor.close();
        Monitor.instance = undefined;
    };
    Monitor.instance = undefined;
    return Monitor;
}());
exports.Monitor = Monitor;
