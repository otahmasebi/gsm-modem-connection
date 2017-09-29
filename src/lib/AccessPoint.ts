import { recordIfNum } from "./recordIfNum";
import * as md5 from "md5";

export class AccessPoint {

    public readonly ifPathByNum: { [num: number]: string }= {};

    constructor(
        public readonly id: string,
        public readonly vendorId: string,
        public readonly modelId: string
    ) { }

    public toString(): string {
        return [
            ``,
            `ACCESS POINT UNIQ ID: '${this.id}'`,
            `FRIENDLY ID": '${this.friendlyId}'`,
            `VENDOR ID": '0x${this.vendorId}'`,
            `MODEL ID": '0x${this.modelId}'`,
            `IS KNOWN MODEL": '${this.isKnownModel}'`,
            `PATH TO AUDIO INTERFACE": '${this.audioIfPath}'`,
            `PATH TO DATA INTERFACE": '${this.dataIfPath}'`,
            `TTY INTERFACE COUNT": '${Object.keys(this.ifPathByNum).length}'`,
            ``
        ].join("\n");
    }

    private get sortedIfNum(): number[] {

        return Object.keys(this.ifPathByNum)
            .map(ifNum => parseInt(ifNum)!)
            .sort((i, j) => i - j);

    }

    public get audioIfPath(): string {

        if (this.isKnownModel)
            return this.ifPathByNum[
                recordIfNum[this.vendorId][this.modelId].audio
            ];
        else{

            let sortedIfNum= this.sortedIfNum;

            return this.ifPathByNum[
                sortedIfNum[sortedIfNum.length-2]
            ];
        }

    }

    public get dataIfPath(): string {

        if (this.isKnownModel)
            return this.ifPathByNum[recordIfNum[this.vendorId][this.modelId].data];
        else{

            let sortedIfNum= this.sortedIfNum;

            return this.ifPathByNum[
                sortedIfNum[sortedIfNum.length-1]
            ];

        }
    }

    public get rpiPort(): number {

        try {
            return parseInt(this.id.split(":")[1].split(".")[1]);
        } catch (error) {
            return NaN;
        }

    }

    public get friendlyId(): string {

        let { audioIfPath } = this;

        let match = audioIfPath.match(/^\/dev\/ttyUSB([0-9]+)$/);

        return `Dongle${match ? match[1] : md5(audioIfPath).substring(0, 6)}`;

    }

    public get isKnownModel(): boolean {

        return (recordIfNum[this.vendorId] && recordIfNum[this.vendorId][this.modelId]) ? true : false;

    }

}