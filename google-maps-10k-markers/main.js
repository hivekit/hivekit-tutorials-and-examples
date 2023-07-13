import Map from './map.js';

const map = new Map({
    containerElement: document.getElementById('map-container'),
    hivekitJwt: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6Ims1anN3VzB6c0kydTFvVldNRV9VbCJ9.eyJzdWIiOiJzZXJ2aWNlIiwidG5kIjoiQmJzRHpaeDBvSHpERzVjVm9GNUdBIiwiZXhwIjo0ODQyODM1NDM0LCJwZXIiOnsicmVhbG0tbUpRWjlHNVFBVGhLX2VvcTZfUDh5Ijp7IioiOiJDUlVEUCJ9fSwiaWF0IjoxNjg5MjM1NDcxLCJpc3MiOiJwbGF0Zm9ybS5oaXZla2l0LmlvIiwianRpIjoiekdaNFg5Zk1RbmtRSDh4SmU4dUFWIn0.InspvvRqHqBQ6r_OTNJnNCBVSU3NgQjueQFzOaV1kTU',
    hivekitRealmId: 'realm-mJQZ9G5QAThK_eoq6_P8y',
    hivekitUrl: 'wss://api.hivekit.io/v1/ws',
    iconSize: 24,
    mapZoom: 5,
    mapMinZoom: 3,
    mapCenter: {
        lat: 52.52342348479236,
        lng: 13.39661463291715
    }
});

await map.init();