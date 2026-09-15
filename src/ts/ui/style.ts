
import * as log from 'loglevel';
import TensorFieldGUI from './tensor_field_gui';
import { NoiseParams } from '../impl/tensor_field';
import CanvasWrapper from './canvas_wrapper';
import { DefaultCanvasWrapper, RoughCanvasWrapper } from './canvas_wrapper';
import Util from '../util';
import PolygonUtil from '../impl/polygon_util';
import DragController from './drag_controller';
import DomainController from './domain_controller';
import Vector from '../vector';
import { BuildingModel } from './buildings';

export interface ColourScheme {
    bgColour: string;
    bgColourIn?: string;
    buildingColour?: string;
    buildingSideColour?: string;
    buildingStroke?: string;
    seaColour: string;
    grassColour?: string;
    minorRoadColour: string;
    minorRoadOutline?: string;
    majorRoadColour?: string;
    majorRoadOutline?: string;
    mainRoadColour?: string;
    mainRoadOutline?: string;
    outlineSize?: number;
    minorWidth?: number;
    majorWidth?: number;
    mainWidth?: number;
    zoomBuildings?: boolean;
    buildingModels?: boolean;
    frameColour?: string;
    frameTextColour?: string;
    buildingShadowColour?: string;
    buildingLightAngle?: number; 
    buildingShadeIntensity?: number; 
    buildingRoofVariation?: number; 
    showSideDebug?: boolean;        
    debugNormalLength?: number;     
}

/**
 * Interface to avoid creating raw heap allocations for sorting building faces
 */
interface SortedSide {
    side: Vector[];
    distSq: number;
    brightness: number;
}

/**
 * Controls how screen-space data is drawn
 */
export default abstract class Style {
    protected canvas: CanvasWrapper;
    protected domainController: DomainController = DomainController.getInstance();
    public abstract createCanvasWrapper(c: HTMLCanvasElement, scale: number, resizeToWindow: boolean): CanvasWrapper;
    public abstract draw(canvas?: CanvasWrapper): void;

    public update(): void {}

    // Polygons
    public seaPolygon: Vector[] = [];
    public lots: Vector[][] = [];
    public buildingModels: BuildingModel[] = [];
    public parks: Vector[][] = [];

    // Polylines
    public coastline: Vector[] = [];
    public river: Vector[] = [];
    public secondaryRiver: Vector[] = [];
    public minorRoads: Vector[][] = [];
    public majorRoads: Vector[][] = [];
    public mainRoads: Vector[][] = [];
    public coastlineRoads: Vector[][] = [];
    public showFrame: boolean = false;

    public zoomBuildings: boolean = false;
    public showBuildingModels: boolean = false;

    // Cached raw numeric RGB arrays for ultra-fast shading math
    protected parsedBuildingColour: number[] = [128, 128, 128];
    protected parsedBuildingSideColour: number[] = [128, 128, 128];

    constructor(protected dragController: DragController, public colourScheme: ColourScheme) {
        function ensureColour(name: string, value: string | undefined, fallback: string): string {
            if (value == null || value === "" || value === "null") {
                log.error(`ColourScheme Error - ${name} not defined or invalid, falling back to ${fallback}`);
                return fallback;
            }
            return value;
        }

        colourScheme.bgColour = ensureColour('bgColour', colourScheme.bgColour, "#333");
        colourScheme.seaColour = ensureColour('seaColour', colourScheme.seaColour, "#0055aa");
        colourScheme.minorRoadColour = ensureColour('minorRoadColour', colourScheme.minorRoadColour, "#666");

        colourScheme.bgColourIn      = ensureColour('bgColourIn', colourScheme.bgColourIn, colourScheme.bgColour);
        colourScheme.buildingColour  = ensureColour('buildingColour', colourScheme.buildingColour, colourScheme.bgColour);
        colourScheme.buildingStroke  = ensureColour('buildingStroke', colourScheme.buildingStroke, colourScheme.bgColour);
        colourScheme.grassColour     = ensureColour('grassColour', colourScheme.grassColour, colourScheme.bgColour);
        colourScheme.minorRoadOutline = ensureColour('minorRoadOutline', colourScheme.minorRoadOutline, colourScheme.minorRoadColour);
        colourScheme.majorRoadColour = ensureColour('majorRoadColour', colourScheme.majorRoadColour, colourScheme.minorRoadColour);
        colourScheme.majorRoadOutline = ensureColour('majorRoadOutline', colourScheme.majorRoadOutline, colourScheme.minorRoadOutline);
        colourScheme.mainRoadColour  = ensureColour('mainRoadColour', colourScheme.mainRoadColour, colourScheme.majorRoadColour);
        colourScheme.mainRoadOutline = ensureColour('mainRoadOutline', colourScheme.mainRoadOutline, colourScheme.majorRoadOutline);
        colourScheme.outlineSize     = colourScheme.outlineSize ?? 1;

        this.zoomBuildings           = colourScheme.zoomBuildings ?? false;
        this.showBuildingModels      = colourScheme.buildingModels ?? false;
        colourScheme.zoomBuildings   = this.zoomBuildings;
        colourScheme.buildingModels  = this.showBuildingModels;

        colourScheme.minorWidth      = colourScheme.minorWidth ?? 2;
        colourScheme.majorWidth      = colourScheme.majorWidth ?? 4;
        colourScheme.mainWidth       = colourScheme.mainWidth ?? 5;
        colourScheme.frameColour     = ensureColour('frameColour', colourScheme.frameColour, colourScheme.bgColour);
        colourScheme.frameTextColour = ensureColour('frameTextColour', colourScheme.frameTextColour, colourScheme.minorRoadOutline);

        colourScheme.buildingShadowColour = colourScheme.buildingShadowColour ?? "rgba(0,0,0,0.12)";
        colourScheme.buildingLightAngle = colourScheme.buildingLightAngle ?? 220; 
        colourScheme.buildingShadeIntensity = colourScheme.buildingShadeIntensity ?? 0.55;
        colourScheme.buildingRoofVariation = colourScheme.buildingRoofVariation ?? 0.06;

        colourScheme.showSideDebug = colourScheme.showSideDebug ?? false;
        colourScheme.debugNormalLength = colourScheme.debugNormalLength ?? 8;

        // Pre-parse the core building colours ONCE to avoid hot-loop string parsing
        try {
            const baseColour = colourScheme.buildingColour;
            if (baseColour) {
                const rgb = Util.parseCSSColor(baseColour);
                if (rgb && Array.isArray(rgb)) {
                    this.parsedBuildingColour = rgb;
                    
                    if (!colourScheme.buildingSideColour) {
                        const sideRgb = rgb.map((v: number) => Math.max(0, v - 40));
                        colourScheme.buildingSideColour = `rgb(${sideRgb[0]},${sideRgb[1]},${sideRgb[2]})`;
                        this.parsedBuildingSideColour = sideRgb;
                    } else {
                        this.parsedBuildingSideColour = Util.parseCSSColor(colourScheme.buildingSideColour) || [128, 128, 128];
                    }
                }
            }
        } catch (err) {
            log.error("Error parsing building colours during init:", err);
        }
    }

    public set canvasScale(scale: number) {
        this.canvas.canvasScale = scale;
    }

    public get needsUpdate(): boolean {
        return this.canvas.needsUpdate;
    }

    public set needsUpdate(n: boolean) {
        this.canvas.needsUpdate = n;
    }

    /**
     * Highly optimized mathematical shading function using pre-parsed raw RGB arrays.
     */
    protected fastShade(rgbArray: number[], brightness: number, alphaOverride?: number): string {
        const r = Math.min(255, Math.max(0, Math.round(rgbArray[0] * brightness)));
        const g = Math.min(255, Math.max(0, Math.round(rgbArray[1] * brightness)));
        const b = Math.min(255, Math.max(0, Math.round(rgbArray[2] * brightness)));
        
        if (typeof alphaOverride === 'number') {
            return `rgba(${r},${g},${b},${alphaOverride})`;
        }
        return `rgb(${r},${g},${b})`;
    }

    protected computeSideBrightness(side: Vector[]): number {
        if (!side || side.length < 2) return 1.0;
        try {
            const dx = side[1].x - side[0].x;
            const dy = side[1].y - side[0].y;
            const len = Math.sqrt(dx * dx + dy * dy);
            
            if (len === 0) return 1.0;

            const nx = -dy / len;
            const ny = dx / len;

            const angleDeg = (this.colourScheme.buildingLightAngle ?? 220) % 360;
            const rad = angleDeg * Math.PI / 180.0;
            
            const lx = Math.cos(rad);
            const ly = Math.sin(rad);

            const dot = Math.max(-1, Math.min(1, (nx * lx) + (ny * ly)));
            
            const shadeIntensity = this.colourScheme.buildingShadeIntensity ?? 0.55;
            const brightnessBase = 0.6 + ( (dot + 1) / 2 ) * 0.55;
            const brightness = 1.0 - (1.0 - brightnessBase) * shadeIntensity;
            
            return Math.max(0.25, Math.min(1.4, brightness));
        } catch (err) {
            return 1.0;
        }
    }

    protected roofVariationMultiplier(seed: number): number {
        const varAmt = this.colourScheme.buildingRoofVariation ?? 0.06;
        const s = Math.abs(Math.sin(seed * 999.123 + 0.123));
        return 1.0 + (s - 0.5) * 2 * varAmt;
    }

    protected drawSideDebug(canvas: CanvasWrapper, side: Vector[], brightness: number): void {
        if (!this.colourScheme.showSideDebug || !side || side.length < 2) return;
        try {
            const a = side[0];
            const b = side[1];
            const mid = a.clone().add(b).divideScalar(2);
            const edge = b.clone().sub(a);
            const normal = new Vector(-edge.y, edge.x).normalize();
            const length = (this.colourScheme.debugNormalLength ?? 8) * this.domainController.zoom;
            const end = mid.clone().add(normal.clone().multiplyScalar(length));

            const t = Math.max(0, Math.min(1, (brightness - 0.25) / (1.4 - 0.25)));
            const red = Math.round(200 * (1 - t) + 40 * t);
            const green = Math.round(40 * (1 - t) + 200 * t);
            const blue = Math.round(40 * (1 - t) + 40 * t);

            (canvas as any).setStrokeStyle(`rgb(${red},${green},${blue})`);
            (canvas as any).setLineWidth(1);
            (canvas as any).drawPolyline([mid, end]);
        } catch (err) {
            // suppress debug draw errors
        }
    }
}

export class DefaultStyle extends Style {
    constructor(c: HTMLCanvasElement, dragController: DragController, colourScheme: ColourScheme, private heightmap=false) {
        super(dragController, colourScheme);
        this.canvas = this.createCanvasWrapper(c, 1, true);
        this.zoomBuildings = colourScheme.zoomBuildings ?? false;
        this.showBuildingModels = colourScheme.buildingModels ?? false;
    }

    public createCanvasWrapper(c: HTMLCanvasElement, scale=1, resizeToWindow=true): CanvasWrapper {
        return new DefaultCanvasWrapper(c, scale, resizeToWindow);
    }

    public draw(canvas=this.canvas as DefaultCanvasWrapper): void {
        const bgColour = (this.zoomBuildings && this.domainController.zoom >= 2) ? 
            this.colourScheme.bgColourIn! : this.colourScheme.bgColour;
        
        canvas.setFillStyle(bgColour);
        canvas.clearCanvas();

        // Sea & Coastline
        canvas.setFillStyle(this.colourScheme.seaColour);
        canvas.setStrokeStyle(this.colourScheme.seaColour);
        canvas.setLineWidth(0.1);
        canvas.drawPolygon(this.seaPolygon);

        canvas.setStrokeStyle(bgColour);
        canvas.setLineWidth(30 * this.domainController.zoom);
        canvas.drawPolyline(this.coastline);

        // Parks & River
        canvas.setLineWidth(1);
        canvas.setFillStyle(this.colourScheme.grassColour!);
        for (const p of this.parks) canvas.drawPolygon(p);

        canvas.setFillStyle(this.colourScheme.seaColour);
        canvas.setStrokeStyle(this.colourScheme.seaColour);
        canvas.setLineWidth(1);
        canvas.drawPolygon(this.river);

        // Road outlines
        canvas.setStrokeStyle(this.colourScheme.minorRoadOutline!);
        canvas.setLineWidth(this.colourScheme.outlineSize! + this.colourScheme.minorWidth! * this.domainController.zoom);
        for (const s of this.minorRoads) canvas.drawPolyline(s);

        canvas.setStrokeStyle(this.colourScheme.majorRoadOutline!);
        canvas.setLineWidth(this.colourScheme.outlineSize! + this.colourScheme.majorWidth! * this.domainController.zoom);
        for (const s of this.majorRoads) canvas.drawPolyline(s);
        canvas.drawPolyline(this.secondaryRiver);

        canvas.setStrokeStyle(this.colourScheme.mainRoadOutline!);
        canvas.setLineWidth(this.colourScheme.outlineSize! + this.colourScheme.mainWidth! * this.domainController.zoom);
        for (const s of this.mainRoads) canvas.drawPolyline(s);
        for (const s of this.coastlineRoads) canvas.drawPolyline(s);

        // Road inlines
        canvas.setStrokeStyle(this.colourScheme.minorRoadColour);
        canvas.setLineWidth(this.colourScheme.minorWidth! * this.domainController.zoom);
        for (const s of this.minorRoads) canvas.drawPolyline(s);

        canvas.setStrokeStyle(this.colourScheme.majorRoadColour!);
        canvas.setLineWidth(this.colourScheme.majorWidth! * this.domainController.zoom);
        for (const s of this.majorRoads) canvas.drawPolyline(s);
        canvas.drawPolyline(this.secondaryRiver);

        canvas.setStrokeStyle(this.colourScheme.mainRoadColour!);
        canvas.setLineWidth(this.colourScheme.mainWidth! * this.domainController.zoom);
        for (const s of this.mainRoads) canvas.drawPolyline(s);
        for (const s of this.coastlineRoads) canvas.drawPolyline(s);

        canvas.setLineWidth(1);

        if (this.heightmap) {
            for (const b of this.buildingModels) {
                const heat = Math.min(255, this.parsedBuildingColour[0] + (b.height * 3.5));
                const rgb = `rgb(${heat},${heat},${heat})`;
                canvas.setFillStyle(rgb);
                canvas.setStrokeStyle(rgb);
                canvas.drawPolygon(b.lotScreen);
            }
        } else {
            // Buildings
            if (!this.zoomBuildings || this.domainController.zoom >= 2) {
                canvas.setFillStyle(this.colourScheme.buildingColour!);
                canvas.setStrokeStyle(this.colourScheme.buildingStroke!);
                for (const b of this.lots) canvas.drawPolygon(b);
            }

            if (this.showBuildingModels && (!this.zoomBuildings || this.domainController.zoom >= 2.5)) {
                
                // Soft Ground Shadows
                const lightAngle = (this.colourScheme.buildingLightAngle ?? 220) * Math.PI / 180;
                const lightVecX = Math.cos(lightAngle);
                const lightVecY = Math.sin(lightAngle);

                for (const b of this.buildingModels) {
                    if (!b.roof || b.roof.length === 0) continue;
                    const depth = Math.max(1, b.height * 0.12) * this.domainController.zoom;
                    const dx = -lightVecX * depth;
                    const dy = -lightVecY * depth;
                    
                    const shadowPoly = b.lotScreen.map(p => p.clone().add(new Vector(dx, dy)));
                    canvas.setFillStyle(this.colourScheme.buildingShadowColour!);
                    canvas.setStrokeStyle("none");
                    canvas.drawPolygon(shadowPoly);
                }

                // Zero-allocation back-to-front sorting
                const allSides: SortedSide[] = [];
                const cameraPos = this.domainController.getCameraPosition();
                
                for (const b of this.buildingModels) {
                    for (const s of b.sides) {
                        const midX = (s[0].x + s[1].x) / 2;
                        const midY = (s[0].y + s[1].y) / 2;
                        const distSq = (midX - cameraPos.x) * (midX - cameraPos.x) + (midY - cameraPos.y) * (midY - cameraPos.y);
                        
                        allSides.push({
                            side: s,
                            distSq: distSq,
                            brightness: this.computeSideBrightness(s)
                        });
                    }
                }
                
                // Sort furthest distance first
                allSides.sort((a, b) => b.distSq - a.distSq);

                // Draw Sides with Facade Window Grids
                for (const face of allSides) {
                    const shaded = this.fastShade(this.parsedBuildingSideColour, face.brightness);
                    canvas.setFillStyle(shaded);
                    canvas.setStrokeStyle(shaded);
                    canvas.drawPolygon(face.side);

                    // Procedural Window Grid Detail Render on close zoom
                    if (this.domainController.zoom >= 3.0 && face.side.length === 4) {
                        try {
                            const [g0, g1, r1, r0] = face.side;
                            const edgeLenSq = Math.pow(g1.x - g0.x, 2) + Math.pow(g1.y - g0.y, 2);
                            
                            if (edgeLenSq > 400) {
                                const windowColour = this.fastShade(this.parsedBuildingSideColour, face.brightness * 0.6);
                                canvas.setFillStyle(windowColour);
                                canvas.setStrokeStyle("none");

                                const cols = Math.max(2, Math.floor(Math.sqrt(edgeLenSq) / 15));
                                for (let c = 1; c < cols; c++) {
                                    const t = c / cols;
                                    const botX = g0.x + (g1.x - g0.x) * t;
                                    const botY = g0.y + (g1.y - g0.y) * t;
                                    const topX = r0.x + (r1.x - r0.x) * t;
                                    const topY = r0.y + (r1.y - r0.y) * t;

                                    const wx = botX + (topX - botX) * 0.4;
                                    const wy = botY + (topY - botY) * 0.4;
                                    canvas.drawCircle(new Vector(wx, wy), 1.5 * this.domainController.zoom);
                                }
                            }
                        } catch (winErr) {
                            // suppress drawing errors gracefully
                        }
                    }

                    if (this.colourScheme.showSideDebug) {
                        this.drawSideDebug(canvas, face.side, face.brightness);
                    }
                }

                // Draw Roofs
                let roofSeed = 1;
                for (const b of this.buildingModels) {
                    const roofMul = this.roofVariationMultiplier(roofSeed++);
                    const roofColour = this.fastShade(this.parsedBuildingColour, roofMul);
                    canvas.setFillStyle(roofColour);
                    canvas.setStrokeStyle(this.colourScheme.buildingStroke!);
                    canvas.drawPolygon(b.roof);
                }
            }
        }

        if (this.showFrame) {
            canvas.setFillStyle(this.colourScheme.frameColour!);
            canvas.setStrokeStyle(this.colourScheme.frameColour!);
            canvas.drawFrame(30, 30, 30, 30);
        }
    }
}

export class RoughStyle extends Style {
    private dragging = false;

    constructor(c: HTMLCanvasElement, dragController: DragController, colourScheme: ColourScheme) {
        super(dragController, colourScheme);
        this.canvas = this.createCanvasWrapper(c, 1, true);
        this.zoomBuildings = colourScheme.zoomBuildings ?? false;
        this.showBuildingModels = colourScheme.buildingModels ?? false;
    }

    public createCanvasWrapper(c: HTMLCanvasElement, scale=1, resizeToWindow=true): CanvasWrapper {
        return new RoughCanvasWrapper(c, scale, resizeToWindow);
    }

    public update() {
        const dragging = this.dragController.isDragging || this.domainController.isScrolling;
        if (!dragging && this.dragging) this.canvas.needsUpdate = true;
        this.dragging = dragging;
    }

    public draw(canvas=this.canvas as RoughCanvasWrapper): void {
        canvas.setOptions({
            fill: this.colourScheme.bgColour,
            roughness: 1,
            bowing: 1,
            fillStyle: 'solid',
            stroke: "none",
        });

        canvas.clearCanvas();

        // Sea
        canvas.setOptions({
            roughness: 0,
            fillWeight: 1,
            fill: this.colourScheme.seaColour,
            fillStyle: 'solid',
            stroke: "none",
            strokeWidth: 1,
        });
        canvas.drawPolygon(this.seaPolygon);

        canvas.setOptions({
            stroke: this.colourScheme.bgColour,
            strokeWidth: 30,
        });
        canvas.drawPolyline(this.coastline);

        canvas.setOptions({
            roughness: 0,
            fillWeight: 1,
            fill: this.colourScheme.seaColour,
            fillStyle: 'solid',
            stroke: "none",
            strokeWidth: 1,
        });
        canvas.drawPolygon(this.river);

        // Parks
        canvas.setOptions({
            fill: this.colourScheme.grassColour,
        });
        this.parks.forEach(p => canvas.drawPolygon(p));

        // Roads
        canvas.setOptions({
            stroke: this.colourScheme.minorRoadColour,
            strokeWidth: 1,
            fill: 'none',
        });
        this.minorRoads.forEach(s => canvas.drawPolyline(s));

        canvas.setOptions({
            strokeWidth: 2,
            stroke: this.colourScheme.majorRoadColour,
        });
        this.majorRoads.forEach(s => canvas.drawPolyline(s));
        canvas.drawPolyline(this.secondaryRiver);

        canvas.setOptions({
            strokeWidth: 3,
            stroke: this.colourScheme.mainRoadColour,
        });
        this.mainRoads.forEach(s => canvas.drawPolyline(s));
        this.coastlineRoads.forEach(s => canvas.drawPolyline(s));

        // Buildings
        if (!this.dragging) {
            if (!this.zoomBuildings || this.domainController.zoom >= 2) {
                canvas.setOptions({
                    roughness: 1.2,
                    stroke: this.colourScheme.buildingStroke,
                    strokeWidth: 1,
                    fill: '',
                });
                for (const b of this.lots) canvas.drawPolygon(b);
            }

            if (this.showBuildingModels && (!this.zoomBuildings || this.domainController.zoom >= 2.5)) {
                const allSides: SortedSide[] = [];
                const cameraPos = this.domainController.getCameraPosition();
                
                for (const b of this.buildingModels) {
                    for (const s of b.sides) {
                        const midX = (s[0].x + s[1].x) / 2;
                        const midY = (s[0].y + s[1].y) / 2;
                        const distSq = (midX - cameraPos.x) * (midX - cameraPos.x) + (midY - cameraPos.y) * (midY - cameraPos.y);
                        
                        allSides.push({
                            side: s,
                            distSq: distSq,
                            brightness: this.computeSideBrightness(s)
                        });
                    }
                }
                
                allSides.sort((a, b) => b.distSq - a.distSq);

                for (const face of allSides) {
                    const shaded = this.fastShade(this.parsedBuildingSideColour, face.brightness);
                    canvas.setOptions({
                        roughness: 1.2,
                        stroke: this.colourScheme.buildingStroke,
                        strokeWidth: 1,
                        fill: shaded,
                    });
                    canvas.drawPolygon(face.side);

                    if (this.colourScheme.showSideDebug) {
                        const a = face.side[0];
                        const b = face.side[1];
                        const mid = a.clone().add(b).divideScalar(2);
                        const edge = b.clone().sub(a);
                        const normal = new Vector(-edge.y, edge.x).normalize();
                        const length = (this.colourScheme.debugNormalLength ?? 8) * this.domainController.zoom;
                        const end = mid.clone().add(normal.clone().multiplyScalar(length));
                        
                        canvas.setOptions({
                            strokeWidth: 1,
                            stroke: `rgb(255,0,0)`,
                            fill: 'none',
                        });
                        canvas.drawPolyline([mid, end]);
                    }
                }

                let seed = 1;
                for (const b of this.buildingModels) {
                    const roofMul = this.roofVariationMultiplier(seed++);
                    const roofColour = this.fastShade(this.parsedBuildingColour, roofMul);
                    canvas.setOptions({
                        roughness: 1.2,
                        stroke: this.colourScheme.buildingStroke,
                        strokeWidth: 1,
                        fill: roofColour,
                    });
                    canvas.drawPolygon(b.roof);
                }
            }
        }
    }
}
