"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var recordIfNum_1 = require("./recordIfNum");
var AccessPoint = /** @class */ (function () {
    function AccessPoint(id, vendorId, modelId) {
        this.id = id;
        this.vendorId = vendorId;
        this.modelId = modelId;
        this.ifPathByNum = {};
    }
    AccessPoint.prototype.toString = function () {
        return JSON.stringify({
            "ACCESS POINT UNIQ ID": this.id,
            "VENDOR ID": "0x" + this.vendorId,
            "MODEL ID": "0x" + this.modelId,
            "IS KNOWN MODEL": this.isKnownModel,
            "PATH TO AUDIO INTERFACE": this.audioIfPath,
            "PATH TO DATA INTERFACE": this.dataIfPath,
            "TTY INTERFACE COUNT": Object.keys(this.ifPathByNum).length
        }, null, 2);
    };
    Object.defineProperty(AccessPoint.prototype, "sortedIfNum", {
        get: function () {
            return Object.keys(this.ifPathByNum)
                .map(function (ifNum) { return parseInt(ifNum); })
                .sort(function (i, j) { return i - j; });
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(AccessPoint.prototype, "audioIfPath", {
        get: function () {
            if (this.isKnownModel)
                return this.ifPathByNum[recordIfNum_1.recordIfNum[this.vendorId][this.modelId].audio];
            else {
                var sortedIfNum = this.sortedIfNum;
                return this.ifPathByNum[sortedIfNum[sortedIfNum.length - 2]];
            }
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(AccessPoint.prototype, "dataIfPath", {
        get: function () {
            if (this.isKnownModel)
                return this.ifPathByNum[recordIfNum_1.recordIfNum[this.vendorId][this.modelId].data];
            else {
                var sortedIfNum = this.sortedIfNum;
                return this.ifPathByNum[sortedIfNum[sortedIfNum.length - 1]];
            }
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(AccessPoint.prototype, "rpiPort", {
        get: function () {
            try {
                return parseInt(this.id.split(":")[1].split(".")[1]);
            }
            catch (error) {
                return NaN;
            }
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(AccessPoint.prototype, "isKnownModel", {
        get: function () {
            return (recordIfNum_1.recordIfNum[this.vendorId] && recordIfNum_1.recordIfNum[this.vendorId][this.modelId]) ? true : false;
        },
        enumerable: true,
        configurable: true
    });
    return AccessPoint;
}());
exports.AccessPoint = AccessPoint;
