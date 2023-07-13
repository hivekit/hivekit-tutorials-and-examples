import iconList from "./icon-list.js";

export default class IconCache {
    constructor(map) {
        this.map = map;
        this.spriteSheet = null;
        this.icons = {};
    }

    async init() {
        this.spriteSheet = await this.loadImage('transportation-icons.png');
    }

    get(id, color) {
        const key = `${id}-${color}`;
        if (!this.icons[key]) {
            this.icons[key] = this.create(id, color);
        }
        return this.icons[key];
    }

    create(id, color) {
        const canvas = document.createElement('canvas');
        const iconSize = this.map.config.iconSize;
        canvas.width = iconSize;
        canvas.height = iconSize;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = color;
        ctx.fillRect(0, 0, iconSize, iconSize);

        // set composite mode
        ctx.globalCompositeOperation = "destination-in";

        // draw image
        const x = iconList.indexOf(id) * iconSize;
        ctx.drawImage(this.spriteSheet, x, 0, iconSize, iconSize, 0, 0, iconSize, iconSize);
        return canvas;
    }

    async loadImage(url) {
        return new Promise(resolve => {
            const img = new Image();
            img.addEventListener('load', () => {
                resolve(img);
            }, false);
            img.src = url;
        });
    }
}

