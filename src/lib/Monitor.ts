import { AccessPoint } from "./AccessPoint";
import { recordIfNum } from "./recordIfNum";
const knownVendorIds = Object.keys(recordIfNum);

import * as udev from "udev";

import { SyncEvent } from "ts-events-extended";
import { TrackableMap } from "trackable-map";

const delayModemReady= 4000;

interface UdevEvt {
    DEVNAME: string;
    ACTION: "add" | "remove";
    ID_USB_INTERFACE_NUM: string;
    ID_PATH: string;
    ID_MODEL_ID: string;
    ID_VENDOR_ID: string;
    ID_USB_DRIVER: string;
    SUBSYSTEM: "tty";
    [key: string]: string;
}

const monitor: { close(); } & NodeJS.EventEmitter= udev.monitor();

const accessPoints= new TrackableMap<string, AccessPoint>();

export class Monitor {

    public static readonly evtModemConnect = new SyncEvent<AccessPoint>();

    public static readonly evtModemDisconnect = new SyncEvent<AccessPoint>();

    public static get connectedModems() { return accessPoints.valuesAsArray(); }

    public static stop(): void { monitor.close(); }

}

accessPoints.evtSet.attach(([accessPoint]) => Monitor.evtModemConnect.post(accessPoint));
accessPoints.evtDelete.attach(([accessPoint]) => Monitor.evtModemDisconnect.post(accessPoint));

function buildAccessPointId(udevEvt_ID_PATH: string): string {
    return udevEvt_ID_PATH.slice(0, -1) + "x";
};

function isRelevantUdevEvt(udevEvt: any): udevEvt is UdevEvt {

    return (
        knownVendorIds.indexOf(udevEvt.ID_VENDOR_ID) >= 0 &&
        udevEvt.hasOwnProperty("ID_USB_INTERFACE_NUM") &&
        udevEvt.SUBSYSTEM === "tty"
    );

}

const pendingAccessPoints: { [id: string]: NodeJS.Timer } = {};

monitor.on("add", udevEvt => {

    if (!isRelevantUdevEvt(udevEvt)) return;

    let id = buildAccessPointId(udevEvt.ID_PATH);

    if (pendingAccessPoints[id]) return;

    let accessPoint = new AccessPoint(id, udevEvt.ID_VENDOR_ID, udevEvt.ID_MODEL_ID);

    accessPoint.ifPathByNum[parseInt(udevEvt.ID_USB_INTERFACE_NUM)] = udevEvt.DEVNAME;

    let onAdd = udevEvt => {

        if (
            !isRelevantUdevEvt(udevEvt) ||
            buildAccessPointId(udevEvt.ID_PATH) !== id
        ) return;

        accessPoint.ifPathByNum[parseInt(udevEvt.ID_USB_INTERFACE_NUM)] = udevEvt.DEVNAME;

    };

    monitor.on("add", onAdd);

    pendingAccessPoints[id] = setTimeout(() => {

        monitor.removeListener("add", onAdd);

        delete pendingAccessPoints[id];

        accessPoints.set(id, accessPoint);

    }, delayModemReady);

});

monitor.on("remove", udevEvt => {

    if (!isRelevantUdevEvt(udevEvt)) return;

    let id = buildAccessPointId(udevEvt.ID_PATH);

    if (pendingAccessPoints[id]) {
        clearTimeout(pendingAccessPoints[id]);
        delete pendingAccessPoints[id];
    }

    accessPoints.delete(id);

});

for (let udevEvt of udev.list())
    monitor.emit("add", udevEvt);