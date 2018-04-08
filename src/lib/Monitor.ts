import { AccessPoint } from "./AccessPoint";
import { recordIfNum } from "./recordIfNum";
const knownVendorIds = Object.keys(recordIfNum);

import * as udev from "udev";

import { SyncEvent } from "ts-events-extended";
import { TrackableMap } from "trackable-map";

const delayModemReady = 4000;

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


export class Monitor {

    private static instance: Monitor | undefined = undefined;

    public static getInstance(
        log: false | typeof console.log= console.log.bind(console)
    ): Monitor {

        if (this.instance){
             return this.instance;
        }

        this.instance = new Monitor(log || (()=> {}));

        return this.getInstance();

    }


    public readonly evtModemConnect = new SyncEvent<AccessPoint>();
    public readonly evtModemDisconnect = new SyncEvent<AccessPoint>();

    public get connectedModems() {
        return this.accessPoints.valueSet()
    }

    public stop(): void {
        this.monitor.close();
        Monitor.instance= undefined;
    }

    private readonly pendingAccessPoints = new Map<string, NodeJS.Timer>();
    private readonly accessPoints = new TrackableMap<string, AccessPoint>();

    private readonly monitor: { close(); } & NodeJS.EventEmitter = udev.monitor();

    private constructor(log: typeof console.log) {

        this.accessPoints.evtSet.attach(([accessPoint]) => { 

            log("<MODEM CONNECT:>", accessPoint.toString());
            
            this.evtModemConnect.post(accessPoint); 
        
        
        });

        this.accessPoints.evtDelete.attach(([accessPoint]) => { 

            log("<MODEM DISCONNECT:>",accessPoint.toString());

            this.evtModemDisconnect.post(accessPoint);

        });

        let evtAdd = new SyncEvent<UdevEvt>();
        let evtRemove = new SyncEvent<UdevEvt>();

        this.monitor.on("add", udevEvt => {

            if (!isRelevantUdevEvt(udevEvt)){ 
                return;
            }

            evtAdd.post(udevEvt);

        });

        this.monitor.on("remove", udevEvt => {

            if (!isRelevantUdevEvt(udevEvt)){ 
                return;
            }

            evtRemove.post(udevEvt);

        });

        evtAdd.attach(udevEvt => {

            let id = buildAccessPointId(udevEvt.ID_PATH);

            if (this.pendingAccessPoints.has(id)){
                 return;
            }

            let accessPoint = new AccessPoint(id, udevEvt.ID_VENDOR_ID, udevEvt.ID_MODEL_ID);

            accessPoint.ifPathByNum[parseInt(udevEvt.ID_USB_INTERFACE_NUM)] = udevEvt.DEVNAME;

            evtAdd.attach(
                udevEvt=> buildAccessPointId(udevEvt.ID_PATH) === id,
                id,
                udevEvt => {

                    accessPoint.ifPathByNum[parseInt(udevEvt.ID_USB_INTERFACE_NUM)] = udevEvt.DEVNAME;

                }
            );

            this.pendingAccessPoints.set(id, setTimeout(() => {

                this.pendingAccessPoints.delete(id);

                evtAdd.detach({ "boundTo": id });

                this.accessPoints.set(id, accessPoint);

            }, delayModemReady));

        });

        evtRemove.attach(udevEvt => {

            let id = buildAccessPointId(udevEvt.ID_PATH);

            if (this.pendingAccessPoints.has(id)) {

                clearTimeout(this.pendingAccessPoints.get(id)!);
                this.pendingAccessPoints.delete(id);;
                evtAdd.detach({ "boundTo": id });

            }

            this.accessPoints.delete(id);

        });

        for (let udevEvt of udev.list()){

            this.monitor.emit("add", udevEvt);

        }

    }

}
