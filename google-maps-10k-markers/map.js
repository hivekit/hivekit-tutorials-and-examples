import HivekitClient from 'https://cdn.jsdelivr.net/npm/@hivekit/client-js@latest/dist/hivekit.js'
import MarkerRenderer from './marker-renderer.js';
import IconCache from './icon-cache.js';

export default class Map {
    constructor(config) {
        this.config = config;
        this.iconCache = new IconCache(this);
        this.markerRenderer = new MarkerRenderer(this);
        this.subscription = null;
        this.subscriptionUpdateScheduled = false;
        this.hivekitClient = null;
        this.googleMap = null;
        this.realm = null;
    }

    async init() {
        this.googleMap = new google.maps.Map(this.config.containerElement, {
            zoom: this.config.mapZoom,
            center: this.config.mapCenter,
            minZoom: this.config.mapMinZoom,
        });

        this.hivekitClient = new HivekitClient();
        await this.hivekitClient.connect(this.config.hivekitUrl);
        await this.hivekitClient.authenticate(this.config.hivekitJwt);
        this.realm = await this.hivekitClient.realm.get(this.config.hivekitRealmId);
        await this.iconCache.init();
        this.markerRenderer.init();

        this.subscription = await this.realm.object.subscribe({
            executeImmediately: true
        });
        this.subscription.on('update', objects => {
            this.markerRenderer.setObjects(objects);
        });
    }
}