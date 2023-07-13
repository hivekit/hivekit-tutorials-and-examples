/**
 * This class adds a canvas on top of the google map,
 * renders markers onto it and handles mouse events.
 * 
 * @extends google.maps.OverlayView
 */
export default class MarkerRenderer extends google.maps.OverlayView {

    /**
     * The class is initialised by a separate init() call
     * 
     * @param {Map} map 
     * @constructor
     */
    constructor(map) {
        super();
        this.parentMap = map;
        this.objects = null;
        this.isInitialised = false;
        this.hoveredObjectId = null;
        this.selectedObjectId = null;
    }

    /**
     * Initialises the class and loads the selection rectangle image
     */
    async init() {
        this.setMap(this.parentMap.googleMap);
        this.selectionRectangle = await this.parentMap.iconCache.loadImage('selection-rectangle.png');
        this.isInitialised = true;
        this.draw();
    }

    /**
     * This method is part of the google.maps.OverlayView interface.
     * It is called when the overlay is added to the map.
     * 
     * However, this is designed for DOM elements that move together with
     * the map. Instead of doing that, we're adding the a canvas to the parent
     * element directly.
     */
    onAdd() {
        this.canvas = document.createElement('canvas');
        this.canvas.style.position = 'absolute';
        this.canvas.style.top = 0;
        this.canvas.style.left = 0;
        this.canvas.style.width = this.parentMap.config.containerElement.offsetWidth + 'px';
        this.canvas.style.height = this.parentMap.config.containerElement.offsetHeight + 'px';
        this.canvas.style.pointerEvents = 'none';
        this.canvas.style.zIndex = 2;
        this.getPanes().floatPane.parentNode.parentNode.appendChild(this.canvas);
        this.ctx = this.canvas.getContext('2d');
        this.onMouseMoveFn = this.onMouseMove.bind(this);
        this.onClickFn = this.onClick.bind(this);

        window.addEventListener('mousemove', this.onMouseMoveFn, true);
        window.addEventListener('click', this.onClickFn, true);
    }

    /**
     * This method is called whenever the Hivekit subscription
     * receives new data.
     * 
     * @param {Map} objects a map with objectId to object data
     */
    setObjects(objects) {
        this.objects = objects;
        this.draw();
    }

    /**
     * This method is part of the google.maps.OverlayView interface.
     * It is called whenever the map is panned or zoomed by the Google Maps API
     * or whenever Hivekit receives new data or the mouse position changes.
     */
    draw() {

        // nothing to do yet
        if (!this.objects || !this.isInitialised) {
            return;
        }

        // the projection class gives us access to the google maps projection.
        // this is needed to convert lat/lng coordinates to pixel coordinates
        const projection = this.getProjection();
        const width = this.canvas.offsetWidth;
        const height = this.canvas.offsetHeight;
        this.canvas.width = width;
        this.canvas.height = height;

        if (!projection) {
            return;
        }

        // clear the canvas
        this.ctx.clearRect(0, 0, width, height);

        // we keep an array of markers that are actually visible on the screen
        // together with their screen coordinates. This makes finding a marker
        // for mouse events later much quicker
        this.visibleMarkers = {};

        for (let id in this.objects) {

            // iterate through all the objects and figure out
            // whether they are visible on the canvas.
            let obj = this.objects[id];

            let point = projection.fromLatLngToContainerPixel({
                lat: obj.location.latitude,
                lng: obj.location.longitude
            });

            // if the projection can not resolve the coordinates, the object is not visible
            if (!point) {
                continue;
            }

            // if the object is outside the visible screen, we don't need to draw it
            if (point.x < 0 || point.y < 0 || point.x > width || point.y > height) {
                continue;
            }

            // store the screen coordinates of the object
            this.visibleMarkers[id] = point;

            // we read the icon and color from the Hivekit object data. This
            // way we can combine different icons and colors here
            let icon = obj.data.icon || 'fighter-jet';
            let color = obj.data.color || '#FF00FF';
            let iconSize = this.parentMap.config.iconSize;
            let image = this.parentMap.iconCache.get(icon, color);

            // in order to rotate the icon, we need to get its angle in radians
            let angleInRadians = ((obj.location.heading || 0) - 90) * Math.PI / 180;

            // we translate and rotate the canvas context to draw the rotated icon
            this.ctx.translate(point.x, point.y);
            this.ctx.rotate(angleInRadians);
            this.ctx.drawImage(image, -iconSize / 2, -iconSize / 2, iconSize, iconSize);
            this.ctx.rotate(-angleInRadians);
            this.ctx.translate(-point.x, -point.y);
        }

        // add a translucent rectangle when you hover over an object
        if (this.hoveredObjectId) {
            this.drawSelectionRectangle(this.hoveredObjectId, 0.5);
        }

        // add a solid rectangle when you click an object
        if (this.selectedObjectId) {
            this.drawSelectionRectangle(this.selectedObjectId, 1);
        }
    }

    /**
     * Window mousemove callback
     * 
     * @param {DOM Event} e 
     */
    onMouseMove(e) {
        const hoveredObjectId = this.getMarkerIdForMouseEvent(e);
        if (this.hoveredObjectId !== hoveredObjectId) {
            this.hoveredObjectId = hoveredObjectId;

            if (this.hoveredObjectId) {
                document.body.classList.add('hovered');
            } else {
                document.body.classList.remove('hovered');
            }
            this.draw();
        }
    }

    /**
     * Window click callback
     * 
     * @param {DOM Event} e 
     */
    onClick(e) {
        const selectedObjectId = this.getMarkerIdForMouseEvent(e);
        if (this.selectedObjectId !== selectedObjectId) {
            this.selectedObjectId = selectedObjectId;
            this.draw();
        }
    }

    /**
     * This iterates through the screen coordinates of all visible markers
     * and returns the id of the marker that is closest to the mouse position
     * if the distance is smaller than the icon size.
     * 
     * @param {DOM Event} e 
     * @returns {String} objectId
     */
    getMarkerIdForMouseEvent(e) {
        var closestMarkerId = null;
        var minDistance = Infinity;
        const x = e.clientX - this.canvas.offsetLeft;
        const y = e.clientY - this.canvas.offsetLeft;

        for (let id in this.visibleMarkers) {
            let marker = this.visibleMarkers[id];
            let distance = Math.sqrt(Math.pow(marker.x - x, 2) + Math.pow(marker.y - y, 2));

            if (distance < minDistance) {
                minDistance = distance;
                closestMarkerId = id;
            }
        }

        if (minDistance < this.parentMap.config.iconSize / 2) {
            return closestMarkerId;
        } else {
            return null;
        }
    }

    /**
     * Draws a selection rectangle around the object with the given id
     * 
     * @param {String} objectId
     * @param {Number} alpha
     * @returns {void}
     */
    drawSelectionRectangle(objectId, alpha) {
        if (!this.visibleMarkers[objectId]) {
            return;
        }
        this.ctx.globalAlpha = alpha;
        this.ctx.drawImage(
            this.selectionRectangle,
            this.visibleMarkers[objectId].x - this.parentMap.config.selectionRectangleSize / 2,
            this.visibleMarkers[objectId].y - this.parentMap.config.selectionRectangleSize / 2);
        this.ctx.globalAlpha = 1;
    }

    /** 
     * This method is part of the google.maps.OverlayView interface.
     * It is called when the overlay is removed from the map.
     */
    onRemove() {
        this.canvas.parentNode.removeChild(this.canvas);
        this.canvas = null;
        window.removeEventListener('mousemove', this.onMouseMoveFn, true);
        window.removeEventListener('click', this.onClickFn, true);
    }
}