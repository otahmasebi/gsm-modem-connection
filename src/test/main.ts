import { Monitor } from "../lib/index";

Monitor.evtModemConnect.attach( accessPoint => console.log("CONNECT", accessPoint.toString()) );

Monitor.evtModemDisconnect.attach( accessPoint => console.log("DISCONNECT", accessPoint.toString()));


setTimeout(()=>{

    console.log("TIMEOUT!");

    for( let accessPoint of Monitor.connectedModems )
        console.log(accessPoint.toString());
    
    Monitor.stop();

}, 60000);


