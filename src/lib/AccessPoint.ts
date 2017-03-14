import { recordIfNum } from "./recordIfNum";



export class AccessPoint {

    public readonly ifPathByNum: { [num: number]: string }= {};

    constructor(
        public readonly id: string,
        public readonly vendorId: string,
        public readonly modelId: string
    ) { }

    public toString(): string {
        return JSON.stringify({
            "ACCESS POINT UNIQ ID": this.id,
            "VENDOR ID": "0x" + this.vendorId,
            "MODEL ID": "0x" + this.modelId,
            "IS KNOWN MODEL": this.isKnownModel,
            "PATH TO AUDIO INTERFACE": this.audioIfPath,
            "PATH TO DATA INTERFACE": this.dataIfPath,
            "INTERFACE COUNT": Object.keys(this.ifPathByNum).length
        }, null, 2);
    }


    public get audioIfPath(): string {

        if (this.isKnownModel)
            return this.ifPathByNum[
                recordIfNum[this.vendorId][this.modelId].audio
            ];
        else
            return this.ifPathByNum[
                Object.keys(this.ifPathByNum).length - 2
            ];

    }

    public get dataIfPath(): string {

        if (this.isKnownModel)
            return this.ifPathByNum[recordIfNum[this.vendorId][this.modelId].data];
        else
            return this.ifPathByNum[Object.keys(this.ifPathByNum).length - 1];
    }


    public get rpiPort(): number {

        try {
            return parseInt(this.id.split(":")[1].split(".")[1]);
        } catch (error) {
            return NaN;
        }

    }




    public get isKnownModel(): boolean {

        return (recordIfNum[this.vendorId] && recordIfNum[this.vendorId][this.modelId]) ? true : false;

    }






}