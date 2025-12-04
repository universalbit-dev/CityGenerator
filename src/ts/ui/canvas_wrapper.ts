import * as log from 'loglevel';
import Vector from '../vector';
import { SVG } from '@svgdotjs/svg.js';
import Util from '../util';

export interface RoughOptions {
    roughness?: number;
    bowing?: number;
    seed?: number;
    stroke?: string;
    strokeWidth?: number;
    fill?: string;
    fillStyle?: string;
    fillWeight?: number;
    hachureAngle?: number;
    hachureGap?: number;
    dashOffset?: number;
    dashGap?: number;
    zigzagOffset?: number;
}

/**
 * Thin wrapper around HTML canvas, abstracts drawing functions so we can use the RoughJS canvas or the default one
 *
 * Important resizing/DPR rules:
 * - measure CSS size from canvas.getBoundingClientRect()
 * - compute CSS pixels * canvasScale
 * - set backing store size = Math.round(cssPixels * devicePixelRatio)
 * - set ctx.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0)
 * - draw in CSS pixels (no need to multiply coordinates by DPR)
 */
export default abstract class CanvasWrapper {
    protected svgNode: any;
    protected _width: number = 0;   // CSS pixels * scale
    protected _height: number = 0;  // CSS pixels * scale
    public needsUpdate: boolean = false;

    // canvas element (protected so subclasses can access)
    protected canvas: HTMLCanvasElement;

    // internal logical scale (e.g. for zoomBuildings)
    constructor(canvas: HTMLCanvasElement, protected _scale = 1, resizeToWindow = true) {
        this.canvas = canvas;
        this.setDimensions();
        this.resizeCanvas();
        if (resizeToWindow) {
            // handle window resize and orientation changes (debounced where used)
            window.addEventListener('resize', () => {
                this.setDimensions();
                this.resizeCanvas();
            });
            window.addEventListener('orientationchange', () => {
                // orientation often implies layout change
                setTimeout(() => {
                    this.setDimensions();
                    this.resizeCanvas();
                }, 50);
            });
        }
    }

    protected appendSvgNode(node: any): void {
        if (this.svgNode) {
            this.svgNode.appendChild(node);
        }
    }

    createSVG(svgElement: any): void {
        this.svgNode = svgElement;
    }

    abstract drawFrame(left: number, right: number, up: number, down: number): void;

    /**
     * Measure the canvas size in CSS pixels and apply the current wrapper scale.
     * Use the element's layout size (clientWidth / getBoundingClientRect) to correctly
     * account for containers, padding, and responsive layouts.
     */
    setDimensions(): void {
        try {
            // prefer bounding rect for sub-pixel accurate CSS width/height
            const rect = this.canvas.getBoundingClientRect();
            const cssWidth = rect.width || this.canvas.clientWidth || window.innerWidth;
            const cssHeight = rect.height || this.canvas.clientHeight || window.innerHeight;
            this._width = cssWidth * this._scale;
            this._height = cssHeight * this._scale;
        } catch (e) {
            // fallback
            this._width = window.innerWidth * this._scale;
            this._height = window.innerHeight * this._scale;
        }
    }

    get width(): number {
        return this._width;
    }

    get height(): number {
        return this._height;
    }

    get canvasScale(): number {
        return this._scale;
    }

    set canvasScale(s: number) {
        this._scale = s;
        this.setDimensions();
        this.resizeCanvas();
    }

    protected zoomVectors(vs: Vector[]): Vector[] {
        if (this._scale === 1) return vs;
        return vs.map(v => v.clone().multiplyScalar(this._scale));
    }

    /**
     * Default resize behaviour: set CSS size but let subclasses handle backing store
     * if they need DPR-aware backing store changes. Subclasses can override resizeCanvas().
     */
    protected resizeCanvas(): void {
        // Ensure CSS size matches layout (use CSS pixels)
        const cssWidth = this._width / this._scale;
        const cssHeight = this._height / this._scale;
        this.canvas.style.width = `${cssWidth}px`;
        this.canvas.style.height = `${cssHeight}px`;
        this.needsUpdate = true;
    }
}

/* DefaultCanvasWrapper handles DPR/backing store and 2D context transforms */
export class DefaultCanvasWrapper extends CanvasWrapper {
    private ctx: CanvasRenderingContext2D;
    private svg: any;
    private pixelRatio: number = window.devicePixelRatio || 1;
    private lastRectWidth = 0;
    private lastRectHeight = 0;

    constructor(canvas: HTMLCanvasElement, scale = 1, resizeToWindow = true) {
        super(canvas, scale, resizeToWindow);
        const c = canvas.getContext("2d");
        if (!c) throw new Error("Canvas 2D context not available");
        this.ctx = c;

        // initial backing store setup
        this.updateBackingStore(true);

        // sensible defaults
        this.ctx.fillStyle = 'black';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.lineJoin = 'round';
        this.ctx.lineCap = 'round';

        // Watch for DPR changes (e.g. window moved between monitors). There's no event for DPR,
        // so poll or re-check on resize/orientation in setDimensions() calls. We'll detect changes in updateBackingStore.
    }

    private getCssSize(): { cssWidth: number; cssHeight: number; rectWidth: number; rectHeight: number } {
        const rect = this.canvas.getBoundingClientRect();
        const rectWidth = rect.width || this.canvas.clientWidth || window.innerWidth;
        const rectHeight = rect.height || this.canvas.clientHeight || window.innerHeight;
        const cssWidth = rectWidth * this.canvasScale;
        const cssHeight = rectHeight * this.canvasScale;
        return { cssWidth, cssHeight, rectWidth, rectHeight };
    }

    /**
     * Update the backing store and transform so drawing can be done in CSS pixels.
     * If force === true, always re-create backing store.
     */
    private updateBackingStore(force = false): void {
        const dpr = window.devicePixelRatio || 1;
        const { cssWidth, cssHeight, rectWidth, rectHeight } = this.getCssSize();

        // detect if we need to update backing store:
        const needUpdate =
            force ||
            Math.round(cssWidth * dpr) !== this.canvas.width ||
            Math.round(cssHeight * dpr) !== this.canvas.height ||
            dpr !== this.pixelRatio ||
            rectWidth !== this.lastRectWidth ||
            rectHeight !== this.lastRectHeight;

        if (!needUpdate) return;

        this.pixelRatio = dpr;
        this.lastRectWidth = rectWidth;
        this.lastRectHeight = rectHeight;

        // backing store size in physical device pixels
        const backingWidth = Math.max(1, Math.round(cssWidth * dpr));
        const backingHeight = Math.max(1, Math.round(cssHeight * dpr));

        // set internal bitmap size
        this.canvas.width = backingWidth;
        this.canvas.height = backingHeight;

        // keep CSS layout size stable (CSS pixels)
        this.canvas.style.width = `${rectWidth * this.canvasScale}px`;
        this.canvas.style.height = `${rectHeight * this.canvasScale}px`;

        // Reset transform so 1 unit in drawing = 1 CSS pixel
        this.ctx.setTransform(this.pixelRatio, 0, 0, this.pixelRatio, 0, 0);

        // flag update
        this.needsUpdate = true;
    }

    createSVG(svgElement: any): void {
        super.createSVG(svgElement);
        this.svg = SVG(svgElement);
    }

    setFillStyle(colour: string): void {
        this.ctx.fillStyle = colour;
    }

    clearCanvas(): void {
        // Use updateBackingStore to ensure sizing correct just prior to drawing
        this.updateBackingStore();
        // Clear the logical CSS pixel rectangle
        const cssW = this.canvas.width / this.pixelRatio;
        const cssH = this.canvas.height / this.pixelRatio;
        this.ctx.clearRect(0, 0, cssW, cssH);

        if (this.svgNode) {
            const startW = window.innerWidth * (Util.DRAW_INFLATE_AMOUNT - 1) / 2;
            const startH = window.innerHeight * (Util.DRAW_INFLATE_AMOUNT - 1) / 2;
            this.drawRectangle(-startW, -startH, window.innerWidth * Util.DRAW_INFLATE_AMOUNT, window.innerHeight * Util.DRAW_INFLATE_AMOUNT);
        }
    }

    drawFrame(left: number, right: number, up: number, down: number): void {
        this.drawRectangle(0, 0, this._width / this._scale, up);
        this.drawRectangle(0, 0, left, this._height / this._scale);
        this.drawRectangle(this._width / this._scale - right, 0, right, this._height / this._scale);
        this.drawRectangle(0, this._height / this._scale - down, this._width / this._scale, down);
    }

    drawCityName(): void {
        const fontSize = 50 * this._scale;
        this.ctx.font = `small-caps ${fontSize}px Verdana`;
        this.ctx.textAlign = "center";
        this.ctx.fillText("san francisco", this._width / 2, this._height - (80 * this._scale - fontSize));
    }

    private snapX(x: number): number {
        return Math.round(x * this.pixelRatio) / this.pixelRatio;
    }
    private snapY(y: number): number {
        return Math.round(y * this.pixelRatio) / this.pixelRatio;
    }
    private snapPoint(v: Vector): Vector {
        return new Vector(this.snapX(v.x), this.snapY(v.y));
    }

    drawRectangle(x: number, y: number, width: number, height: number): void {
        // Ensure backing store correct
        this.updateBackingStore();

        if (this._scale !== 1) {
            x *= this._scale;
            y *= this._scale;
            width *= this._scale;
            height *= this._scale;
        }

        const sx = this.snapX(x);
        const sy = this.snapY(y);
        const sw = Math.round(width * this.pixelRatio) / this.pixelRatio;
        const sh = Math.round(height * this.pixelRatio) / this.pixelRatio;

        this.ctx.fillRect(sx, sy, sw, sh);

        if (this.svg) {
            this.svg.rect({
                fill: this.ctx.fillStyle,
                'fill-opacity': 1,
                stroke: this.ctx.strokeStyle,
                'stroke-width': this.ctx.lineWidth,
                x: sx,
                y: sy,
                width: sw,
                height: sh,
            });
        }
    }

    drawPolygon(polygon: Vector[]): void {
        if (!polygon || polygon.length === 0) return;

        this.updateBackingStore();
        polygon = this.zoomVectors(polygon);

        this.ctx.beginPath();
        const p0 = this.snapPoint(polygon[0]);
        this.ctx.moveTo(p0.x, p0.y);
        for (let i = 1; i < polygon.length; i++) {
            const pi = this.snapPoint(polygon[i]);
            this.ctx.lineTo(pi.x, pi.y);
        }
        this.ctx.lineTo(p0.x, p0.y);

        this.ctx.fill();
        if ((this.ctx.lineWidth || 0) > 0) this.ctx.stroke();

        if (this.svg) {
            const vectorArray = polygon.map(v => {
                const sv = this.snapPoint(v);
                return [sv.x, sv.y];
            });
            vectorArray.push(vectorArray[0]);
            this.svg.polyline(vectorArray).attr({
                fill: this.ctx.fillStyle,
                'fill-opacity': 1,
                stroke: (this.ctx.lineWidth || 0) > 0 ? this.ctx.strokeStyle : 'none',
                'stroke-width': this.ctx.lineWidth,
                'stroke-linejoin': 'round',
                'stroke-linecap': 'round'
            });
        }
    }

    drawCircle(centre: Vector, radius: number): void {
        this.updateBackingStore();
        const c = this.snapPoint(centre);
        const r = radius * this._scale;
        this.ctx.beginPath();
        this.ctx.arc(c.x, c.y, r, 0, Math.PI * 2);
        this.ctx.fill();
    }

    drawSquare(centre: Vector, radius: number): void {
        this.drawRectangle(centre.x - radius, centre.y - radius, 2 * radius, 2 * radius);
    }

    setLineWidth(width: number): void {
        if (this._scale !== 1) width *= this._scale;
        this.ctx.lineWidth = width;
    }

    setStrokeStyle(colour: string): void {
        this.ctx.strokeStyle = colour;
    }

    drawPolyline(line: Vector[]): void {
        if (!line || line.length < 2) return;
        this.updateBackingStore();
        line = this.zoomVectors(line);

        this.ctx.beginPath();
        const p0 = this.snapPoint(line[0]);
        this.ctx.moveTo(p0.x, p0.y);
        for (let i = 1; i < line.length; i++) {
            const pi = this.snapPoint(line[i]);
            this.ctx.lineTo(pi.x, pi.y);
        }
        this.ctx.stroke();

        if (this.svg) {
            const vectorArray = line.map(v => {
                const sv = this.snapPoint(v);
                return [sv.x, sv.y];
            });
            this.svg.polyline(vectorArray).attr({
                'fill-opacity': 0,
                stroke: this.ctx.strokeStyle,
                'stroke-width': this.ctx.lineWidth,
                'stroke-linejoin': 'round',
                'stroke-linecap': 'round'
            });
        }
    }
}

/* RoughCanvasWrapper left largely unchanged except for size handling being driven via base class */
export class RoughCanvasWrapper extends CanvasWrapper {
    private r = require('roughjs/bundled/rough.cjs');
    private rc: any;

    private options: RoughOptions = {
        roughness: 1,
        bowing: 1,
        stroke: '#000000',
        strokeWidth: 1,
        fill: '#000000',
        fillStyle: 'solid',
    };

    constructor(canvas: HTMLCanvasElement, scale = 1, resizeToWindow = true) {
        super(canvas, scale, resizeToWindow);
        this.rc = this.r.canvas(canvas);
    }

    createSVG(svgElement: any): void {
        super.createSVG(svgElement);
        this.rc = this.r.svg(this.svgNode);
    }

    drawFrame(left: number, right: number, up: number, down: number): void {

    }

    setOptions(options: RoughOptions): void {
        if (options.strokeWidth) {
            options.strokeWidth *= this._scale;
        }
        Object.assign(this.options, options);
    }

    clearCanvas(): void {
        // make sure sizing is up-to-date
        this.canvas.style.width = `${(this.canvas.getBoundingClientRect().width * this.canvasScale)}px`;
        this.canvas.style.height = `${(this.canvas.getBoundingClientRect().height * this.canvasScale)}px`;
        if (this.svgNode) {
            const startW = window.innerWidth * (Util.DRAW_INFLATE_AMOUNT - 1) / 2;
            const startH = window.innerHeight * (Util.DRAW_INFLATE_AMOUNT - 1) / 2;
            this.drawRectangle(-startW, -startH, window.innerWidth * Util.DRAW_INFLATE_AMOUNT, window.innerHeight * Util.DRAW_INFLATE_AMOUNT);
        } else {
            this.drawRectangle(0, 0, window.innerWidth, window.innerHeight);
        }
    }

    drawRectangle(x: number, y: number, width: number, height: number): void {
        if (this._scale !== 1) {
            x *= this._scale;
            y *= this._scale;
            width *= this._scale;
            height *= this._scale;
        }
        this.appendSvgNode(this.rc.rectangle(x, y, width, height, this.options));
    }

    drawPolygon(polygon: Vector[]): void {
        if (!polygon || polygon.length === 0) return;
        if (this._scale !== 1) polygon = polygon.map(v => v.clone().multiplyScalar(this._scale));
        this.appendSvgNode(this.rc.polygon(polygon.map(v => [v.x, v.y]), this.options));
    }

    drawSquare(centre: Vector, radius: number): void {
        const prevStroke = this.options.stroke;
        this.options.stroke = 'none';
        this.drawRectangle(centre.x - radius, centre.y - radius, 2 * radius, 2 * radius);
        this.options.stroke = prevStroke;
    }

    drawPolyline(line: Vector[]): void {
        if (!line || line.length < 2) return;
        if (this._scale !== 1) line = line.map(v => v.clone().multiplyScalar(this._scale));
        this.appendSvgNode(this.rc.linearPath(line.map(v => [v.x, v.y]), this.options));
    }
}
