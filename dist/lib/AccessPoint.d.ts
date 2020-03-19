export declare class AccessPoint {
    readonly id: string;
    readonly vendorId: string;
    readonly modelId: string;
    readonly ifPathByNum: {
        [num: number]: string;
    };
    constructor(id: string, vendorId: string, modelId: string);
    toString(): string;
    private get sortedIfNum();
    get audioIfPath(): string;
    get dataIfPath(): string;
    get rpiPort(): number;
    get friendlyId(): string;
    get isKnownModel(): boolean;
}
