/*  This example spins up a webhook server that processes
    updates for near passes, sent by the sentToUrl Hivekit function.

    It will be notified every time a vulnerable road user (type=vru)
    is within less than ten meters of a fleet vehicle (type=fleet).

    The associated HiveScript instruction looks as follows:

    when 
        object(type=vru).within(10, type=fleet)
    then
        sendToUrl(http://127.0.0.1:3000/process-near-pass)

    This will generate a POST request containing the following data structure:
[{
    "objects": [{
        "id": "object-LeI3VV_cV1GMAY9fXmlxi",
        "lab": "VRU 1",
        "loc": {
            "lon": 13.373282,
            "lat": 52.510881,
            // more location properties
        },
        "dat": {
            "type": "vru"
        },
        "lastExternalUpdate": "2022-11-16T16:55:36.1216553+01:00"
    }, {
        "id": "object-3VhKPfbdhIzofv5JRJnGr",
        "lab": "Fleet Vehicle",
        "loc": {
            "lon": 13.373323,
            "lat": 52.510848,
        },
        "dat": {
            "type": "fleet"
        },
        "lastExternalUpdate": "2022-11-16T16:56:58.1670607+01:00"
    }]
}, {
    ... more near passes
}]
*/

import express from 'express'
import haversine from 'haversine'
const app = express()
const port = 3000
app.use(express.json())

// set up a route handler for post requests to /process-near-pass
app.post('/process-near-pass', (req, res) => {
    req.body.forEach(msg => {

        // the order of the objects in the result array is arbitrary,
        // so lets order them by vulnerable road user / fleet vehicle
        if (msg.objects[0].dat.type === 'vru') {
            processNearPass(msg.objects[0], msg.objects[1]);
        } else {
            processNearPass(msg.objects[1], msg.objects[0]);
        }
    });

    res.send('OK')
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})

function getObjData(obj) {
    return {
        // the haversine library expects data in this format
        latitude: obj.loc.lat,
        longitude: obj.loc.lon,

        // parse the lastExternalUpdate timestamp
        time: new Date(obj.lastExternalUpdate)
    }
}

function processNearPass(vru, fleet) {
    const objA = getObjData(vru);
    const objB = getObjData(fleet);

    // We use the haversine formula to determine the distance between
    // two objects on the surface of a sphere
    const distance = haversine(objA, objB, { unit: 'meter' });

    // Both objects have a lastExternalUpdate timestamp. The later of these
    // two is the one that triggered the near pass notification
    const eventTime = new Date(Math.max(objA.time, objB.time));

    console.log(`Detected near pass between fleet vehicle ${fleet.id} and vru ${vru.id} 
    with a distance of ${distance.toFixed(2)}m at ${eventTime.toLocaleString()}`);

    if (distance > 5) {
        // handle passes more than five meters away
    } else {
        // handle passes less than five meters away
    }
}


