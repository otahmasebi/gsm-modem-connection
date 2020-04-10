import { AccessPoint } from "./AccessPoint";
export declare class Monitor {
    private static instance;
    static getInstance(log?: typeof console.log): Monitor;
    static get hasInstance(): boolean;
    readonly evtModemConnect: import("evt/dist/lib/types").Evt<AccessPoint>;
    readonly evtModemDisconnect: import("evt/dist/lib/types").Evt<AccessPoint>;
    get connectedModems(): Set<AccessPoint>;
    stop(): void;
    private readonly pendingAccessPoints;
    private readonly accessPoints;
    private readonly monitor;
    private constructor();
}
