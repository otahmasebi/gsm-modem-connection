import { Monitor } from "../lib/index";

let monitor = Monitor.getInstance();

monitor.evtModemConnect.attach(accessPoint => console.log("CONNECT"));

monitor.evtModemDisconnect.attach(accessPoint => console.log("DISCONNECT"));

setTimeout(() => {

    console.log("END OF TEST SESSION");

    for (let accessPoint of monitor.connectedModems){
        console.log(accessPoint.toString());
    }

    monitor.stop();

}, 30000);


