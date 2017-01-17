import { ModemWatcher } from "../lib/index";

let modemWatcher = new ModemWatcher();

console.log("Awaiting GSM modem connections");

modemWatcher.evtConnect.attach(modem => console.log("CONNECT", modem.infos));

modemWatcher.evtDisconnect.attach(modem => console.log("DISCONNECT", modem.infos));