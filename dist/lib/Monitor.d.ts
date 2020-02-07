import { AccessPoint } from "./AccessPoint";
import { Evt } from "ts-evt";
export declare class Monitor {
    private static instance;
    static getInstance(log?: typeof console.log): Monitor;
    static readonly hasInstance: boolean;
    readonly evtModemConnect: Evt<AccessPoint>;
    readonly evtModemDisconnect: Evt<AccessPoint>;
    readonly connectedModems: Set<AccessPoint>;
    stop(): void;
    private readonly pendingAccessPoints;
    private readonly accessPoints;
    private readonly monitor;
    private constructor();
}
