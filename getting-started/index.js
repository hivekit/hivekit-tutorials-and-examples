import HivekitClient from "@hivekit/client-js";
import jwt from 'jsonwebtoken'

// initially, the client is neither connected nor authenticated
const client = new HivekitClient();

// let's log connection status changes
client.on('connectionStatusChanged', () => {
    console.log('client connection status is: ' + client.connectionStatus);
});

// connect to our local server
await client.connect('ws://localhost:8090/ws');

// we create a JWT with the secret `CHANGE_ME`
await client.authenticate(jwt.sign({ sub: 'Johndoe' }, 'CHANGE_ME'));
// client is now ready for use and connectionstatus should be "authenticated"

// for this tutorial, we assume that a realm with id="berlin" was created via the admin app
const realm = await client.realm.get('berlin');

// OK, let's create an
await realm.object.create('scooter/a14', {
    label: 'Scooter A14',
    location: {
        latitude: 52.524177684357596,
        longitude: 13.384164394801328
    },
    data: {
        // this scooter's battery has 50% charge
        charge: 0.5,
        type: 'scooter',

        // data properties starting with $hkt for "hivekit" tell the admin dashboard how do display things
        $hkt_icon: {
            color: "#46eca4",
            category: "transportation",
            filename: "motorcycle-delivery-single-box.svg"
        }
    }
});

// ok, let's slowly move our object north
// var lat = 52.524;
// setInterval(async () => {
//     lat += 0.001; // by 0.001 degree every half second
//     await realm.object.update('scooter/a14', {
//         location: {
//             latitude: lat,
//             longitude: 13.385
//         }
//     })
// }, 500);

// to see these object updates on any connected client, you can subscribe
const subscription = await realm.object.subscribe();
subscription.on('update', data => {
    console.log('UPDATE', data);
});

// cool, let's add a polygonal area that shows where Alexanderplatz is in Berlin
realm.area.create('alexanderplatz', {
    label: 'Alexanderplatz',
    shape: {
        points: [
            { x: 13.405068, y: 52.519991 },
            { x: 13.408768, y: 52.521836 },
            { x: 13.412211, y: 52.523811 },
            { x: 13.416132, y: 52.52199 },
            { x: 13.414398, y: 52.520547 },
            { x: 13.41072, y: 52.518546 },
            { x: 13.408913, y: 52.517068 }
        ]
    },
    data: {
        // tell the admin dashboard to show this area in purple
        $hkt_color: '#c546ec'
    }
})

// Finally, we'll create an instruction that changes the area's color, based on whether a scooter is in it
realm.instruction.create('highligh-area-with-scooter', {
    label: 'Changes an areas color to green if there is at least one scooter in it',
    instructionString: `
    when
        area().containing(type=scooter)
    then
        set($hkt_color, \\#62ec46)
    until
        set($hkt_color, \\#c546ec) 
    `
})