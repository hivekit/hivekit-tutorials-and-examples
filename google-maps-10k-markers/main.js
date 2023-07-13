import Map from './map.js';

const map = new Map({
    // the dom element that will contain the map
    containerElement: document.getElementById('map-container'),

    // you can create a JWT on the access management page at https://hivekit.io/account/#/access-management
    hivekitJwt: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6Ims1anN3VzB6c0kydTFvVldNRV9VbCJ9.eyJzdWIiOiJzZXJ2aWNlIiwidG5kIjoiQmJzRHpaeDBvSHpERzVjVm9GNUdBIiwiZXhwIjo0ODQyODM1NDM0LCJwZXIiOnsicmVhbG0tbUpRWjlHNVFBVGhLX2VvcTZfUDh5Ijp7IioiOiJDUlVEUCJ9fSwiaWF0IjoxNjg5MjM1NDcxLCJpc3MiOiJwbGF0Zm9ybS5oaXZla2l0LmlvIiwianRpIjoiekdaNFg5Zk1RbmtRSDh4SmU4dUFWIn0.InspvvRqHqBQ6r_OTNJnNCBVSU3NgQjueQFzOaV1kTU',

    // you can find your realm ids at https://hivekit.io/account/#/realms
    hivekitRealmId: 'realm-mJQZ9G5QAThK_eoq6_P8y',

    // hivekit's public API endpoint for WebSocket Connections
    hivekitUrl: 'wss://api.hivekit.io/v1/ws',

    // the size of the icons on the sprite sheet. All icons must be square.
    iconSize: 24,

    // the size of the selection rectangle in pixels
    selectionRectangleSize: 35,

    // the initial zoom level of the map
    mapZoom: 3,

    // the minimum zoom level of the map
    mapMinZoom: 2,

    // the initial center of the map
    mapCenter: {
        lat: 52.52342348479236,
        lng: 13.39661463291715
    }
});

await map.init();