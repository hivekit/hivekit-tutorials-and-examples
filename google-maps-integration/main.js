/**
 * The following is a simple integration with Google Maps that shows how to 
 * dynamically add markers for Hivekit objects 
 */
import HivekitClient from 'https://cdn.jsdelivr.net/npm/@hivekit/client-js@latest/dist/hivekit.js'

// I'm using a hardcoded JWT for this example. You will want to swap this for your own, generated JWT
const testJWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNjcyMzMyODY4fQ.AbM5wkeZ9e2wCsKbavHiEa2aptk6LiMIehMm21SHUHM';

// The realm we'll be subscribing to
const realmId = 'google-integration-test-realm';

var mapSubscriptionUpdateScheduled = false;
var mapSubscription;
var isInitialised = false;

const map = new google.maps.Map(document.getElementById('map-container'), {
    zoom: 14,
    center: {
        lat: 52.52342348479236,
        lng: 13.39661463291715
    }
});

const client = new HivekitClient({ logMessages: true });
client.on('connectionStatusChanged', status => {
    console.log(status);
});
// change for your server url
await client.connect('ws://127.0.0.1:8090/ws');
await client.authenticate(testJWT);

map.addListener('tilesloaded', async () => {
    // make sure we only run this once when the map is first loaded
    if (isInitialised) {
        return;
    }
    isInitialised = true;

    createMapSubscription();
    map.addListener('bounds_changed', () => {
        // this event fires for every frame the user pans or zooms. We don't want to
        // update our subscription this frequently, so let's throttle it to max twice a second
        if (!mapSubscriptionUpdateScheduled) {
            mapSubscriptionUpdateScheduled = true;
            setTimeout(updateMapSubscription, 500);
        }
    });
});

function updateMapSubscription() {
    mapSubscriptionUpdateScheduled = false;
    mapSubscription.update({
        // the shape data with north, east, south and west coordinates returned
        // by google map's getBounds().toJSON() method happens to be the exact
        // format that Hivekit can use to specify rectangles. For other map libraries
        // you might need to do some translation
        shape: map.getBounds().toJSON()
    })
}

async function createMapSubscription() {
    const realm = await client.realm.get(realmId);

    mapSubscription = await realm.object.subscribe({
        shape: map.getBounds().toJSON()
    })

    mapSubscription.on('update', updateMapMarkers)
}

// Each object in the realm will be represented by a map marker that updates its
// position whenever the object moves. We'll keep a map of object id to map marker here
const markers = {};

function updateMapMarkers(objects) {
    // first, we iterate through the list of objects that are within the subscribed radius.
    for (let id in objects) {
        let position = new google.maps.LatLng(objects[id].location.latitude, objects[id].location.longitude)

        if (markers[id]) {
            // we have the marker already
            if (!markers[id].position.equals(position)) {
                // update if position has changed
                markers[id].setPosition(position)
            }
        } else {
            // we don't have a marker representing this object yet. Let's create one
            markers[id] = new google.maps.Marker({
                position: position,
                map: map,
                title: objects[id].label,
            });
        }
    }

    // lastly, let's iterate through the map of markers we already have
    // and see which ones are no longer part of the subscription
    for (let id in markers) {
        if (!objects[id]) {
            markers[id].setMap(null);
            delete markers[id];
        }
    }
}