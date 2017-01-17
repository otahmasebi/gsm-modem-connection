import { Modem, ModemDescriptor, Env, config } from "./Modem";
import { writeFileSync } from "fs";
import * as lockFile from "lockfile";

/*
log("call", {
    "action": (<Env>process.env).ACTION,
    "modelId": "0x" + (<Env>process.env).ID_MODEL_ID
});
*/

let pathLock = config.pathSetModem + ".lock";

lockFile.lock(pathLock, { "wait": 5000 }, error => {

    if (error) { return log("error lock", error.message); }

    try {

        let setModem = Modem.importSetModem();

        let env = <Env>process.env;

        let id = Modem.getIdFromEnv(env);

        switch (env.ACTION) {
            case "add":
                if (!setModem[id]) setModem[id] = Modem.createFromEnv(env);
                else setModem[id].addInterface(parseInt(env.ID_USB_INTERFACE_NUM), env.DEVNAME);
                break;
            case "remove":
                setModem[id].removeInterface(parseInt(env.ID_USB_INTERFACE_NUM));
                if (Object.keys(setModem[id].interfaces).length === 0)
                    delete setModem[Modem.getIdFromEnv(env)];
                break;
            default: throw new Error("unexpected udev action: " + env.ACTION);
        }


        Modem.exportSetModem(setModem);

        lockFile.unlock(pathLock, error => {
            if (error) log("error unlock", error.message);
        });

    } catch (error) {
        log("Internal error: ", error.message);
    }



});


function log(...inputs: any[]): void {

    for (let input of inputs) __log__(input);
}

function __log__(input: any): void {

    let raw: string;

    if (!input || typeof (input) === "string") raw = input;
    else {
        try {
            raw = JSON.stringify(input, null, 2);
        } catch (error) {
            raw = input;
        }
    }

    writeFileSync(config.pathLogFile, raw + "\n", {
        "encoding": "utf8",
        "flag": "a"
    });
}