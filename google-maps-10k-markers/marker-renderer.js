
export default class MarkerRenderer extends google.maps.OverlayView {
    constructor(map) {
        super();
        this.parentMap = map;
        this.objects = null;
        this.isInitialised = false;
        this.hoveredObjectId = null;
        this.selectedObjectId = null;
    }
    init() {
        this.setMap(this.parentMap.googleMap);
        this.isInitialised = true;
        this.draw();
    }

    onAdd() {
        this.canvas = document.createElement('canvas');
        this.canvas.style.position = 'absolute';
        this.canvas.style.top = 0;
        this.canvas.style.left = 0;
        this.canvas.style.width = '100%';
        this.canvas.style.height = '100%';
        this.canvas.style.pointerEvents = 'none';
        this.canvas.style.zIndex = 2;
        this.parentMap.config.containerElement.appendChild(this.canvas);
        this.ctx = this.canvas.getContext('2d');
    }

    setObjects(objects) {
        this.objects = objects;
        this.draw();
    }

    draw() {
        if (!this.objects || !this.isInitialised) {
            return;
        }

        const projection = this.getProjection();
        const width = this.canvas.offsetWidth;
        const height = this.canvas.offsetHeight;
        this.canvas.width = width;
        this.canvas.height = height;

        if (!projection) {
            return;
        }

        this.ctx.clearRect(0, 0, width, height);
        this.visibleMarkers = {};

        for (let id in this.objects) {
            let obj = this.objects[id];

            let latlng = {
                lat: obj.location.latitude,
                lng: obj.location.longitude
            };

            let point = projection.fromLatLngToContainerPixel(latlng);

            if (!point) {
                continue;
            }

            if (point.x < 0 || point.y < 0 || point.x > width || point.y > height) {
                continue;
            }

            this.visibleMarkers[id] = point;
            let icon = obj.data.icon || 'fighter-jet';
            let color = obj.data.color || '#FF00FF';
            let iconSize = this.parentMap.config.iconSize;
            let image = this.parentMap.iconCache.get(icon, color);
            let angleInRadians = ((obj.location.heading || 0) - 90) * Math.PI / 180;

            this.ctx.translate(point.x, point.y);
            this.ctx.rotate(angleInRadians);
            this.ctx.drawImage(image, -iconSize / 2, -iconSize / 2, iconSize, iconSize);
            this.ctx.rotate(-angleInRadians);
            this.ctx.translate(-point.x, -point.y);
        }

        if (this.hoveredObjectId) {
            this.drawSelectionRectangle(this.hoveredObjectId, 0.5);
        }

        if (this.selectedObjectId) {
            this.drawSelectionRectangle(this.selectedObjectId, 1);
        }
    }

    drawSelectionRectangle(objectId, alpha) {
        if (!this.visibleMarkers[objectId]) {
            return;
        }
        this.ctx.globalAlpha = alpha;
        this.ctx.drawImage(
            this.selectionRectangle,
            this.visibleMarkers[objectId].x - SELECTION_RECTANGLE_SIZE / 2,
            this.visibleMarkers[objectId].y - SELECTION_RECTANGLE_SIZE / 2);
        this.ctx.globalAlpha = 1;
    }

    onRemove() {
        this.canvas.parentNode.removeChild(this.canvas);
        this.canvas = null;
    }
}