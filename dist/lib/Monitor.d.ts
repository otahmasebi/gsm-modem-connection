import { AccessPoint } from "./AccessPoint";
import { SyncEvent } from "ts-events-extended";
export declare class Monitor {
    private static instance;
    static getInstance(): Monitor;
    readonly evtModemConnect: SyncEvent<AccessPoint>;
    readonly evtModemDisconnect: SyncEvent<AccessPoint>;
    readonly connectedModems: Set<AccessPoint>;
    stop(): void;
    private readonly pendingAccessPoints;
    private readonly accessPoints;
    private readonly monitor;
    private constructor();
}
