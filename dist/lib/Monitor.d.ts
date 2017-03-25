import { AccessPoint } from "./AccessPoint";
import { SyncEvent } from "ts-events-extended";
export declare class Monitor {
    static readonly evtModemConnect: SyncEvent<AccessPoint>;
    static readonly evtModemDisconnect: SyncEvent<AccessPoint>;
    static readonly connectedModems: AccessPoint[];
    static stop(): void;
}
