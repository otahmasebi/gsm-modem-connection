import * as net from "net";
import { readFileSync, writeFileSync, statSync } from "fs";

export let config: {
    pathSetModem: string,
    pathLogFile: string,
    user: string
} = JSON.parse(readFileSync(__dirname + "/../../config.json", { 
    "encoding": "utf8" 
}));

export let modemDatabase: {
    [vendorId: number]: {
        [modelId: number]: {
            audio: number,
            at: number,
            total: number
        }
    }
} = (() => {

    let raw = readFileSync(__dirname + "/../../knownModem.json", { 
        "encoding": "utf8" 
    });

    let obj = JSON.parse(raw, function (key, value) {

        if (key === "_comment") return undefined;
        else return value;

    });

    let out: any = {};

    let vendorId: number;
    let modelId: number;

    for (let vendorIdStr of Object.keys(obj)) {
        vendorId = Number(vendorIdStr);
        out[vendorId] = {};
        for (let modelIdStr of Object.keys(obj[vendorIdStr])) {
            modelId = Number(modelIdStr);
            out[vendorId][modelId] = obj[vendorIdStr][modelIdStr];
        }
    }

    return out;

})();

export let delayReady = 2000;

export interface SetModem {
    [id: string]: Modem
}

export interface ModemInterfaces {
    [component: number]: string
}

export interface Env {
    DEVNAME: string;
    ACTION: "add" | "remove";
    ID_USB_INTERFACE_NUM: string;
    ID_PATH: string;
    ID_MODEL_ID: string;
    ID_VENDOR_ID: string;
    [key: string]: string;
}


export interface ModemDescriptor {
    id: string;
    vendorId: number,
    modelId: number;
    interfaces: ModemInterfaces;
    upSince: string;
    readableInfos: Object
}


export class Modem {

    public readonly interfaces: ModemInterfaces = {};
    public upSince: Date;

    private readonly currentDate: Date;
    constructor(
        public readonly id: string,
        public readonly vendorId: number,
        public readonly modelId: number,
        timeStamp: Date,
    ) {
        this.upSince = timeStamp;
        this.currentDate = new Date();

    }

    public get fullyBooted(): boolean {

        if (this.isKnownModel)
            return (modemDatabase[this.vendorId][this.modelId].total === Object.keys(this.interfaces).length);
        else
            return ((this.currentDate.getTime() - this.upSince.getTime()) > delayReady);

    }

    public get audioInterface(): string {

        if( !this.fullyBooted ) return "";

        if (this.isKnownModel)
            return this.interfaces[modemDatabase[this.vendorId][this.modelId].audio];
        else {
            switch(Object.keys(this.interfaces).length){
                case 2: return this.interfaces[0];
                case 3: return this.interfaces[1];
                default: throw new Error("Unsupported modem");
            }

        }

    }

    public get atInterface(): string {

        if( !this.fullyBooted ) return "";

        let modelInfo = Modem.getModelInfo(this.modelId);

        if (this.isKnownModel)
            return this.interfaces[modemDatabase[this.vendorId][this.modelId].at];
        else {
            switch(Object.keys(this.interfaces).length){
                case 2: return this.interfaces[1];
                case 3: return this.interfaces[2];
                default: throw new Error("Unsupported modem");
            }
        }

    }

    public get descriptor(): ModemDescriptor {

        let descriptor: ModemDescriptor = {
            "id": this.id,
            "vendorId": this.vendorId,
            "modelId": this.modelId,
            "upSince": this.upSince.toString(),
            "interfaces": {},
            "readableInfos": this.infos
        };

        Object.assign(descriptor.interfaces, this.interfaces);

        return descriptor;

    }

    public get rpiPort(): number | undefined {

        try {

            return parseInt(this.id.split(":")[1].split(".")[1]);

        } catch (error) {
            return undefined;
        }

    }

    public addInterface(component: number, path: string): void {

        this.interfaces[component] = path;

        this.upSince = new Date();

    }

    public removeInterface(component: number): void {

        delete this.interfaces[component];

        this.upSince = new Date();

    }


    public get isKnownModel(): boolean {

        return modemDatabase[this.vendorId].hasOwnProperty(this.modelId);

    }

    public get infos(): Object {

        return {
            "vendorIdHex": "0x" + this.vendorId.toString(16),
            "modelIdHex": "0x" + this.modelId.toString(16),
            "isKnowModel": this.isKnownModel,
            "rpiPort": this.rpiPort,
            "atInterface": this.atInterface,
            "audioInterface": this.audioInterface,
            "isFullyBooted": this.fullyBooted
        };
    }


    private static getModelInfo(modelId: number): {
        audio: number;
        at: number;
        total: number;
    } | undefined {

        switch (modelId) {
            case 0x1001: return { "audio": 1, "at": 2, total: 3 };
            case 0x1003: return { "audio": 0, "at": 1, total: 2 };
            default: return undefined;
        }

    }

    public static getIdFromEnv(env: Env): string {
        return env.ID_PATH.slice(0, -1) + "x";
    }


    public static createFromEnv(env: Env): Modem {

        let modem = new Modem(
            Modem.getIdFromEnv(env),
            Number("0x" + env.ID_VENDOR_ID),
            Number("0x" + env.ID_MODEL_ID),
            new Date()
        );

        modem.addInterface(parseInt(env.ID_USB_INTERFACE_NUM), env.DEVNAME);

        return modem;

    }

    public static createFromDescriptor(modemDescriptor: ModemDescriptor): Modem {

        let modem = new Modem(
            modemDescriptor.id,
            modemDescriptor.vendorId,
            modemDescriptor.modelId,
            new Date(Date.parse(modemDescriptor.upSince)));

        Object.assign(modem.interfaces, modemDescriptor.interfaces);

        return modem;

    }

    private static readonly currentBootId: string = (() => {
        return readFileSync("/proc/sys/kernel/random/boot_id", {
            "encoding": "utf8"
        }).slice(0, -1);
    })();


    public static importSetModem(): SetModem {

        try {

            let setModem: SetModem = {};

            let modemDescriptors: ModemDescriptor[]= [];
            let bootId: string;

            try {

                let obj = JSON.parse(readFileSync(config.pathSetModem, { "encoding": "utf8" }));

                modemDescriptors = obj.modemDescriptors as ModemDescriptor[];
                bootId = obj.bootId as string;

            } catch (error) {

                bootId = "";
            }

            if (Modem.currentBootId !== bootId) modemDescriptors = [];


            for (let modemDescriptor of modemDescriptors)
                setModem[modemDescriptor.id] = Modem.createFromDescriptor(modemDescriptor);

            return setModem;


        } catch (error) {
            console.log("error in import set modem", error.message);
            throw error;
        }

    }

    public static exportSetModem(setModem: SetModem): void {

        try {

            var out = {
                "modemDescriptors": [] as ModemDescriptor[],
                "bootId": Modem.currentBootId
            };

            for (let id of Object.keys(setModem))
                out.modemDescriptors.push(setModem[id].descriptor);

            writeFileSync(config.pathSetModem, JSON.stringify(out, null, 2), {
                "encoding": "utf8",
                "flag": "w"
            });

        } catch (error) {

            console.log("error in export set modem", error.message);
            throw error;

        }

    }

}