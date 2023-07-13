import iconList from "./icon-list.js";

/**
 * We load a sprite sheet with a black version of each icon upfront. The purpose of this class is to
 * create an individual image object with a colored version of a given icon on demand which can then
 * be placed as an image onto the canvas.
 */
export default class IconCache {
    /**
     * Since the initialisation needs to load the sprite sheet (which happens asynchronously)
     * we only set stuff up in the constructor and have a separate init() method.
     * 
     * @constructor
     * @param {Map} map 
     */
    constructor(map) {
        this.map = map;
        this.spriteSheet = null;
        this.icons = {};
    }

    /**
     * Loads the sprite sheet and stores it in the spriteSheet property.
     */
    async init() {
        this.spriteSheet = await this.loadImage('transportation-icons.png');
    }

    /**
     * Returns an image object with an individual, colored version of the given icon.
     * 
     * @param {string} id an icon id from the icon-list.js file
     * @param {string} color a color string, e.g. '#ff0000'
     * @returns IMAGE DOM object
     */
    get(id, color) {
        const key = `${id}-${color}`;
        if (!this.icons[key]) {
            this.icons[key] = this.create(id, color);
        }
        return this.icons[key];
    }

    /**
     * Creates a new canvas, renders the given icon in the given color
     *  onto it and returns the canvas.
     * 
     * @param {string} id 
     * @param {string} color 
     * @returns 
     */
    create(id, color) {
        const canvas = document.createElement('canvas');
        const iconSize = this.map.config.iconSize;
        canvas.width = iconSize;
        canvas.height = iconSize;
        const ctx = canvas.getContext('2d');

        // our icon is black with a transparent background. In
        // order to create a colored version, we first fill the
        // entire canvas with the desired color
        ctx.fillStyle = color;
        ctx.fillRect(0, 0, iconSize, iconSize);

        // then we set the way to pixels are blended on top of each other
        // to "destination-in". This means that the next thing we draw
        // will only affect the transparency of the existing solid color
        ctx.globalCompositeOperation = "destination-in";

        // Now we pick the icon from the spritesheet and draw it onto the canvas.
        const spriteSheetX = iconList.indexOf(id) * iconSize;
        ctx.drawImage(this.spriteSheet, spriteSheetX, 0, iconSize, iconSize, 0, 0, iconSize, iconSize);
        return canvas;
    }

    /**
     * Returns a promise that resolves to an image object once the image has been loaded.
     * 
     * @param {string} url 
     * @returns IMG object
     */
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

