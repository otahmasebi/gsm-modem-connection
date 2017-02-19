import { statSync, writeFileSync, watch, FSWatcher } from "fs";
import { Modem, SetModem, config, delayReady } from "./Modem";
import { SyncEvent, AsyncEvent, VoidSyncEvent } from "ts-events-extended";


export class ModemWatcher {

    public readonly evtConnect = new SyncEvent<Modem>();
    public readonly evtDisconnect = new SyncEvent<Modem>();
    public setModem: SetModem = {};


    private timer: NodeJS.Timer | null= null;
    private readonly watcher: FSWatcher;
    constructor() {

        try{ 
            statSync(config.pathSetModem);
        }catch(error){
            Modem.exportSetModem(this.setModem);
        }


        this.watcher= watch(config.pathSetModem, (event, filename) => {

            if (this.timer) clearTimeout(this.timer)

            this.timer = setTimeout(() => {

                this.timer = null;

                this.update();

            }, delayReady);

        });

        this.update();
    }

    public stop(): void{
        this.watcher.close();
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