import { AccessPoint } from "./AccessPoint";
import { Evt } from "evt";
export declare class Monitor {
    private static instance;
    static getInstance(log?: typeof console.log): Monitor;
    static get hasInstance(): boolean;
    readonly evtModemConnect: Evt<AccessPoint>;
    readonly evtModemDisconnect: Evt<AccessPoint>;
    get connectedModems(): Set<AccessPoint>;
    stop(): void;
    private readonly pendingAccessPoints;
    private readonly accessPoints;
    private readonly monitor;
    private constructor();
}
