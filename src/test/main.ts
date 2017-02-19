import { ModemWatcher } from "../lib/index";

let modemWatcher = new ModemWatcher();

console.log("Awaiting GSM modem connections...");

modemWatcher.evtConnect.attach(modem => console.log("CONNECT", modem.infos));

modemWatcher.evtDisconnect.attachOnce(modem => {

    console.log(`DISCONNECT\n${JSON.stringify(modem.infos, null, 2)}\nEnd!`);

    modemWatcher.stop();

});








