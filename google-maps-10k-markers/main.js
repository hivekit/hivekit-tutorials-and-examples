/**
 * The following is a simple integration with Google Maps that shows how to 
 * dynamically add markers for Hivekit objects 
 */
import HivekitClient from 'https://cdn.jsdelivr.net/npm/@hivekit/client-js@latest/dist/hivekit.js'

// I'm using a hardcoded JWT for this example. You will want to swap this for your own, generated JWT
const testJWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNjgwMzM1ODkyfQ.0cAgcZpm2T7YZDfT1zEj69RIRRJkdbP6XNO5xxPUU5M';

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
    // the first time we run this, the realm doesn't exist yet - so let's create it.
    // If the realm exists, realm.create will throw an error which we can safely ignore
    try {
        await client.realm.create(realmId)
    } catch (e) {
        if (e.code === 409) {
            //realm already exists
        } else {
            throw e;
        }
    }
    const realm = await client.realm.get(realmId);

    mapSubscription = await realm.object.subscribe({
        executeImmediately: true,
        shape: map.getBounds().toJSON()
    })

    mapSubscription.on('update', updateMapMarkers)

    //createTestObjects(realm);
}

// Each object in the realm will be represented by a map marker that updates its
// position whenever the object moves. We'll keep a map of object id to map marker here
const markers = {};

function updateMapMarkers(fullState, changes) {
    var id, obj;
    // add new markers
    for (id in changes.added) {
        obj = changes.added[id];
        markers[id] = new google.maps.Marker({
            position: new google.maps.LatLng(obj.location.latitude, obj.location.longitude),
            map: map,
            title: obj.label,
        });
    }

    // update existing markers
    for (id in changes.updated) {
        obj = changes.added[id];
        markers[id].setPosition(new google.maps.LatLng(obj.location.latitude, obj.location.longitude))
    }

    // delete removed markers
    for (id in changes.removed) {
        markers[id].setMap(null);
        delete markers[id];
    }
}

function createTestObjects(realm) {
    const centerLat = 52.52342348479236;
    const centerLng = 13.39661463291715

    for (var i = 0; i < 50; i++) {
        realm.object.set('test_object_' + i, {
            location: {
                latitude: centerLat + (Math.random() - 0.5) / 10,
                longitude: centerLng + (Math.random() - 0.5) / 10
            }
        })
    }
}