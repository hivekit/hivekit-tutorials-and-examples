import HivekitClient from 'https://cdn.jsdelivr.net/npm/@hivekit/client-js@latest/dist/hivekit.js'
import MarkerRenderer from './marker-renderer.js';
import IconCache from './icon-cache.js';

/**
 * This class is responsible for initializing the map and the marker renderer.
 *
 */
export default class Map {

    /**
     * Config is an object with the following structure
     * 
     * {
     *      containerElement: DOM element,
     *      hivekitJwt: string,
     *      hivekitRealmId: string,
     *      hivekitUrl: 'wss://api.hivekit.io/v1/ws',
     *      iconSize: 24,
     *      selectionRectangleSize: 35,
     *      mapZoom: 5,
     *      mapMinZoom: 3,
     *      mapCenter: {
     *          lat: 52.52342348479236,
     *          lng: 13.39661463291715
     *      }
     *  }
     * @param {Map} config 
     */
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

    /**
     * Initializes the map and the marker renderer.
     */
    async init() {
        // create the google map instance
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
        await this.markerRenderer.init();

        // We'll subscribe to the entire world straight away. This means we'll get more
        // date, but our markers will render more fluently
        this.subscription = await this.realm.object.subscribe({
            executeImmediately: true
        });
        this.subscription.on('update', objects => {
            this.markerRenderer.setObjects(objects);
        });
    }
}