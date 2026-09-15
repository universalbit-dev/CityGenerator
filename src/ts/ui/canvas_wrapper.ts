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
 */
export default abstract class CanvasWrapper {
    protected svgNode: any;
    protected _width: number = 0;   
    protected _height: number = 0;  
    public needsUpdate: boolean = false;

    protected canvas: HTMLCanvasElement;

    constructor(canvas: HTMLCanvasElement, protected _scale = 1, resizeToWindow = true) {
        this.canvas = canvas;
        this.setDimensions();
        this.resizeCanvas();
        if (resizeToWindow) {
            window.addEventListener('resize', () => {
                this.setDimensions();
                this.resizeCanvas();
            });
            window.addEventListener('orientationchange', () => {
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
    abstract drawRectangle(x: number, y: number, width: number, height: number): void;
    abstract drawPolygon(polygon: Vector[]): void;
    abstract drawCircle(centre: Vector, radius: number): void;
    abstract drawSquare(centre: Vector, radius: number): void;
    abstract drawPolyline(line: Vector[]): void;
    abstract drawPolylines(lines: Vector[][]): void; 

    setDimensions(): void {
        try {
            const rect = this.canvas.getBoundingClientRect();
            const cssWidth = rect.width || this.canvas.clientWidth || window.innerWidth;
            const cssHeight = rect.height || this.canvas.clientHeight || window.innerHeight;
            this._width = cssWidth * this._scale;
            this._height = cssHeight * this._scale;
        } catch (e) {
            this._width = window.innerWidth * this._scale;
            this._height = window.innerHeight * this._scale;
        }
    }

    get width(): number { return this._width; }
    get height(): number { return this._height; }
    get canvasScale(): number { return this._scale; }

    set canvasScale(s: number) {
        this._scale = s;
        this.setDimensions();
        this.resizeCanvas();
    }

    protected zoomVectors(vs: Vector[]): Vector[] {
        if (this._scale === 1) return vs;
        return vs.map(v => v.clone().multiplyScalar(this._scale));
    }

    protected resizeCanvas(): void {
        const cssWidth = this._width / this._scale;
        const cssHeight = this._height / this._scale;
        this.canvas.style.width = `${cssWidth}px`;
        this.canvas.style.height = `${cssHeight}px`;
        this.needsUpdate = true;
    }
}

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

        this.updateBackingStore(true);
        this.ctx.fillStyle = 'black';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.lineJoin = 'round';
        this.ctx.lineCap = 'round';
    }

    private getCssSize(): { cssWidth: number; cssHeight: number; rectWidth: number; rectHeight: number } {
        const rect = this.canvas.getBoundingClientRect();
        const rectWidth = rect.width || this.canvas.clientWidth || window.innerWidth;
        const rectHeight = rect.height || this.canvas.clientHeight || window.innerHeight;
        const cssWidth = rectWidth * this.canvasScale;
        const cssHeight = rectHeight * this.canvasScale;
        return { cssWidth, cssHeight, rectWidth, rectHeight };
    }

    private updateBackingStore(force = false): void {
        const dpr = window.devicePixelRatio || 1;
        const { cssWidth, cssHeight, rectWidth, rectHeight } = this.getCssSize();

        const needUpdate = force ||
            Math.round(cssWidth * dpr) !== this.canvas.width ||
            Math.round(cssHeight * dpr) !== this.canvas.height ||
            dpr !== this.pixelRatio ||
            rectWidth !== this.lastRectWidth ||
            rectHeight !== this.lastRectHeight;

        if (!needUpdate) return;

        this.pixelRatio = dpr;
        this.lastRectWidth = rectWidth;
        this.lastRectHeight = rectHeight;

        const MAX_CANVAS_DIMENSION = 8192;
        let backingWidth = Math.max(1, Math.round(cssWidth * dpr));
        let backingHeight = Math.max(1, Math.round(cssHeight * dpr));

        if (backingWidth > MAX_CANVAS_DIMENSION || backingHeight > MAX_CANVAS_DIMENSION) {
            const ratio = Math.min(MAX_CANVAS_DIMENSION / backingWidth, MAX_CANVAS_DIMENSION / backingHeight);
            backingWidth = Math.round(backingWidth * ratio);
            backingHeight = Math.round(backingHeight * ratio);
        }

        this.canvas.width = backingWidth;
        this.canvas.height = backingHeight;
        this.canvas.style.width = `${rectWidth * this.canvasScale}px`;
        this.canvas.style.height = `${rectHeight * this.canvasScale}px`;

        this.ctx.setTransform(this.pixelRatio, 0, 0, this.pixelRatio, 0, 0);
        this.needsUpdate = true;
    }

    createSVG(svgElement: any): void {
        super.createSVG(svgElement);
        this.svg = SVG(svgElement);
    }

    setFillStyle(colour: string): void { this.ctx.fillStyle = colour; }
    setStrokeStyle(colour: string): void { this.ctx.strokeStyle = colour; }
    
    setLineWidth(width: number): void {
        if (this._scale !== 1) width *= this._scale;
        this.ctx.lineWidth = width;
    }

    clearCanvas(): void {
        this.updateBackingStore();
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

    private snapX(x: number): number { return Math.round(x * this.pixelRatio) / this.pixelRatio; }
    private snapY(y: number): number { return Math.round(y * this.pixelRatio) / this.pixelRatio; }
    private snapPoint(v: Vector): Vector { return new Vector(this.snapX(v.x), this.snapY(v.y)); }

    drawRectangle(x: number, y: number, width: number, height: number): void {
        this.updateBackingStore();
        if (this._scale !== 1) {
            x *= this._scale; y *= this._scale; width *= this._scale; height *= this._scale;
        }

        const sx = this.snapX(x); const sy = this.snapY(y);
        const sw = Math.round(width * this.pixelRatio) / this.pixelRatio;
        const sh = Math.round(height * this.pixelRatio) / this.pixelRatio;

        this.ctx.fillRect(sx, sy, sw, sh);

        if (this.svg) {
            this.svg.rect({
                fill: this.ctx.fillStyle, 'fill-opacity': 1,
                stroke: this.ctx.strokeStyle, 'stroke-width': this.ctx.lineWidth,
                x: sx, y: sy, width: sw, height: sh,
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
                const sv = this.snapPoint(v); return [sv.x, sv.y];
            });
            vectorArray.push(vectorArray[0]);
            this.svg.polyline(vectorArray).attr({
                fill: this.ctx.fillStyle, 'fill-opacity': 1,
                stroke: (this.ctx.lineWidth || 0) > 0 ? this.ctx.strokeStyle : 'none',
                'stroke-width': this.ctx.lineWidth,
                'stroke-linejoin': 'round', 'stroke-linecap': 'round'
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
                const sv = this.snapPoint(v); return [sv.x, sv.y];
            });
            this.svg.polyline(vectorArray).attr({
                'fill-opacity': 0, stroke: this.ctx.strokeStyle, 'stroke-width': this.ctx.lineWidth,
                'stroke-linejoin': 'round', 'stroke-linecap': 'round'
            });
        }
    }

    drawPolylines(lines: Vector[][]): void {
        if (!lines || lines.length === 0) return;
        this.updateBackingStore();

        this.ctx.beginPath();
        for (let i = 0; i < lines.length; i++) {
            let line = lines[i];
            if (!line || line.length < 2) continue;
            
            line = this.zoomVectors(line);
            const p0 = this.snapPoint(line[0]);
            this.ctx.moveTo(p0.x, p0.y);
            
            for (let j = 1; j < line.length; j++) {
                const pj = this.snapPoint(line[j]);
                this.ctx.lineTo(pj.x, pj.y);
            }
        }
        this.ctx.stroke();

        if (this.svg) {
            let pathString = "";
            for (let i = 0; i < lines.length; i++) {
                let line = lines[i];
                if (!line || line.length < 2) continue;
                
                line = this.zoomVectors(line);
                const p0 = this.snapPoint(line[0]);
                pathString += `M ${p0.x} ${p0.y} `;
                
                for (let j = 1; j < line.length; j++) {
                    const pj = this.snapPoint(line[j]);
                    pathString += `L ${pj.x} ${pj.y} `;
                }
            }
            if (pathString) {
                this.svg.path(pathString).attr({
                    'fill-opacity': 0,
                    stroke: this.ctx.strokeStyle,
                    'stroke-width': this.ctx.lineWidth,
                    'stroke-linejoin': 'round',
                    'stroke-linecap': 'round'
                });
            }
        }
    }
}

export class RoughCanvasWrapper extends CanvasWrapper {
    private r = require('roughjs/bundled/rough.cjs');
    private rc: any;

    private options: RoughOptions = {
        roughness: 1, bowing: 1, stroke: '#000000', strokeWidth: 1, fill: '#000000', fillStyle: 'solid',
    };

    constructor(canvas: HTMLCanvasElement, scale = 1, resizeToWindow = true) {
        super(canvas, scale, resizeToWindow);
        this.rc = this.r.canvas(canvas);
    }

    createSVG(svgElement: any): void {
        super.createSVG(svgElement);
        this.rc = this.r.svg(this.svgNode);
    }

    drawFrame(left: number, right: number, up: number, down: number): void {}
    drawCircle(centre: Vector, radius: number): void {}

    setOptions(options: RoughOptions): void {
        if (options.strokeWidth) options.strokeWidth *= this._scale;
        Object.assign(this.options, options);
    }

    clearCanvas(): void {
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
            x *= this._scale; y *= this._scale; width *= this._scale; height *= this._scale;
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

    drawPolylines(lines: Vector[][]): void {
        if (!lines || lines.length === 0) return;
        
        let pathString = "";
        for (let line of lines) {
            if (!line || line.length < 2) continue;
            
            if (this._scale !== 1) {
                line = line.map(v => v.clone().multiplyScalar(this._scale));
            }
            
            pathString += `M ${line[0].x} ${line[0].y} `;
            for (let i = 1; i < line.length; i++) {
                pathString += `L ${line[i].x} ${line[i].y} `;
            }
        }
        
        if (pathString.length > 0) {
            this.appendSvgNode(this.rc.path(pathString, this.options));
        }
    }
}
