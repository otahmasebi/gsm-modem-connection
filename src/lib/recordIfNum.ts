export let recordIfNum: {
    [ vendorId: string ]: { 
        [ modelId: string]: { 
            audio: number; 
            data: number; 
        } 
    };
} = {
    //Huawei
    "12d1": {
        //E169, K3765, K3520, E1550, E160E firmware 11.609
        "1001": {
            "audio": 1,
            "data": 2
        },
        //E160E firmware 11.604
        "1003": {
            "audio": 0,
            "data": 1
        },
        //E17xx,
        "140c": {
            "audio": 2,
            "data": 3
        },
        //E1750
        "1436": {
            "audio": 3,
            "data": 4
        },
        //E171 firmware 21.x
        "1506": {
            "audio": 2,
            "data": 1
        }
    }
};