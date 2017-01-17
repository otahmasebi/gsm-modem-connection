import { readFileSync, writeFileSync, unlinkSync } from "fs";
import { spawnSync } from "child_process";
import { modemDatabase } from "./Modem";

let config = JSON.parse(readFileSync(__dirname + "/../../config.json", { "encoding": "utf8" }));
let pathRules = "/etc/udev/rules.d/99-ts-gsm-connection.rules";

switch (process.argv[2]) {
    case "set": set(); break;
    case "remove": remove(); break;
    default: process.exit(1);
}

function remove() {

    try {
        unlinkSync(pathRules);
    } catch (error) { }

    try {
        unlinkSync(config.pathSetModem);
    } catch (error) { }

    try {
        unlinkSync(config.pathLogFile);
    } catch (error) { }

    console.log("Successfully uninstalled");

    process.exit(0);

}

function set() {

    let nodePath = spawnSync("which", ["node"], { "encoding": "utf8" }).stdout.slice(0, -1);

    if (!config.user) config.user = process.env.SUDO_USER;

    let rules = "";

    for (let vendorId of Object.keys(modemDatabase).map(function (elem) { return parseInt(elem) })) {

        let match = [
            `ENV{ID_VENDOR_ID}=="${vendorId.toString(16)}", `,
            `ENV{ID_USB_DRIVER}!="usb-storage", `,
            `ENV{ID_USB_INTERFACE_NUM}=="[0-9]*", `
        ].join("");

        rules += [
            match + `RUN+="/bin/su ${config.user} -c '${nodePath} ${__dirname}/udevScript'"`,
            match + `ACTION=="add" MODE="0666", GROUP="root"`
        ].join("\n");

        rules += `\n`;

    }

    writeFileSync(pathRules, rules, { "encoding": "utf8", "flag": "w" });

    console.log([
        `Rules written in ${pathRules}\n${rules}`,
        `Success, Watch ${config.pathSetModem} to know what GSM modem is connected to your machine in real time`
    ].join("\n"));

    process.exit(0);

}