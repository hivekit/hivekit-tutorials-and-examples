import needle from "needle";
import jwt from 'jsonwebtoken'

const method = 'post';
const url = 'http://localhost:8090/api/v1';
const data = [{
    typ: 'obj',
    act: 'set',
    id: 'deliveryRiders/johndoe-123',
    rea: 'berlin',
    loc: { // location
        lon: 13.414677,
        lat: 52.525407
    },
    dat: {// charge
        charge: 0.3
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