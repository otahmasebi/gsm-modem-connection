import { AccessPoint } from "../lib/AccessPoint";
import { recordIfNum } from "../lib/recordIfNum";
const knownVendorIds = Object.keys(recordIfNum);

import * as udev from "udev";

import { SyncEvent } from "ts-events-extended";
import { TrackableMap } from "trackable-map";


interface UdevEvt {
    DEVNAME: string;
    ACTION: "add" | "remove";
    ID_USB_INTERFACE_NUM: string;
    ID_PATH: string;
    ID_MODEL_ID: string;
    ID_VENDOR_ID: string;
    ID_USB_DRIVER: string;
    SUBSYSTEM: string;
    [key: string]: string;
}

const monitor: { close(); } & NodeJS.EventEmitter= udev.monitor();

const accessPoints= new TrackableMap<string, AccessPoint>();

function matchTty(udevEvt: any): udevEvt is UdevEvt {

    return (
        knownVendorIds.indexOf(udevEvt.ID_VENDOR_ID) >= 0 &&
        udevEvt.hasOwnProperty("ID_USB_INTERFACE_NUM") &&
        udevEvt.SUBSYSTEM === "tty"
    );

}

function matchBlock(udevEvt: any): udevEvt is UdevEvt {

    return (
        knownVendorIds.indexOf(udevEvt.ID_VENDOR_ID) >= 0 &&
        udevEvt.hasOwnProperty("ID_USB_INTERFACE_NUM") &&
        udevEvt.SUBSYSTEM === "block"
    );

}

function matchNet(udevEvt: any): udevEvt is UdevEvt {

    return (
        knownVendorIds.indexOf(udevEvt.ID_VENDOR_ID) >= 0 &&
        udevEvt.hasOwnProperty("ID_USB_INTERFACE_NUM") &&
        udevEvt.SUBSYSTEM === "net"
    );

}

monitor.on("add", udevEvt => {

    if( matchTty(udevEvt) ){

        console.log("======> tty");
        console.log(udevEvt);

    }

    if( matchBlock(udevEvt) ){

        console.log("======> Block");
        console.log(udevEvt);

    }

    if( matchNet(udevEvt) ){

        console.log("======> net");
        console.log(udevEvt);

    }



});

for (let udevEvt of udev.list())
    monitor.emit("add", udevEvt);
