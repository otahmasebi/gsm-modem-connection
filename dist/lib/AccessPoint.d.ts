export declare class AccessPoint {
    readonly id: string;
    readonly vendorId: string;
    readonly modelId: string;
    readonly ifPathByNum: {
        [num: number]: string;
    };
    constructor(id: string, vendorId: string, modelId: string);
    toString(): string;
    private readonly sortedIfNum;
    readonly audioIfPath: string;
    readonly dataIfPath: string;
    readonly rpiPort: number;
    readonly friendlyId: string;
    readonly isKnownModel: boolean;
}
