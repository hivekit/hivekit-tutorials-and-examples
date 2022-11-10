import needle from "needle";
import jwt from 'jsonwebtoken'

const method = 'post';
const url = 'http://localhost:8090/api/v1';
const data = [{ // every message is an array of actions
    typ: 'obj', // type = object
    act: 'set', // action = set (UPSERT without write confirmation)
    id: 'deliveryRiders/johndoe-123', // id for the object
    rea: 'berlin', // id for the realm
    loc: { // location
        lon: 13.414677, // longitude
        lat: 52.525407 // latitude
    },
    dat: {// charge
        charge: 0.3 // arbitrary data
    }
}];
const tokenData = {
    sub: 'johndoe@example.com', // unique user identifier
    per: { // permissions
        "berlin": { // for realm berlin
            "deliveryRiders/*": "R", // this client can (R)ead all data of delivery riders
            "deliveryRiders/johndoe-123": "CU" // this client can (C)reate and (U)pdate only data for himself
        }
    },
    "dpv": { // data provider
        "berlin": [ // realm
            "deliveryRiders/johndoe-123" // this client is a data provider for the object representing him
        ]
    }

}
const token = jwt.sign(tokenData, 'CHANGE_ME')
const options = {
    json: true,
    headers: {
        Authorization: 'Bearer ' + token
    }
}
await needle(method, url, data, options);