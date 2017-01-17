import { statSync, writeFileSync, watch } from "fs";
import { Modem, SetModem, config, delayReady } from "./Modem";
import { SyncEvent, AsyncEvent, VoidSyncEvent } from "ts-events";


export class ModemWatcher {

    public readonly evtConnect = new SyncEvent<Modem>();
    public readonly evtDisconnect = new SyncEvent<Modem>();
    public setModem: SetModem = {};

    private timer: NodeJS.Timer = null;
    constructor() {

        try{ 
            statSync(config.pathSetModem);
        }catch(error){
            Modem.exportSetModem(this.setModem);
        }

        watch(config.pathSetModem, (event, filename) => {

            if (this.timer) clearTimeout(this.timer)

            this.timer = setTimeout(() => {

                this.timer = null;

                this.update();

            }, delayReady);

        });

        this.update();
    }

    private update(): void {

        let oldSetModem = this.setModem;

        this.setModem = Modem.importSetModem();


        for (let id of Object.keys(this.setModem))
            if ((!oldSetModem[id] || !oldSetModem[id].fullyBooted) && this.setModem[id].fullyBooted)
                process.nextTick(() => this.evtConnect.post(this.setModem[id]));


        for (let id of Object.keys(oldSetModem))
            if (!this.setModem[id]) {
                this.evtDisconnect.post(oldSetModem[id]);
            }

    }

}