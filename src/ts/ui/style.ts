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

    // New optional tuning parameters for improved pseudo-3D rendering
    buildingShadowColour?: string;
    buildingLightAngle?: number; // degrees, from +X axis (right) clockwise
    buildingShadeIntensity?: number; // 0..1, how strong the shading on sides should be
    buildingRoofVariation?: number; // 0..1, introduce slight roof colour variation

    // Debug / visualization options
    showSideDebug?: boolean;        // draw normals/brightness indicators for building sides
    debugNormalLength?: number;     // length of the debug normal lines in screen units
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

    // Properties for dat.GUI binding (carefully exposed!)
    public zoomBuildings: boolean = false;
    public showBuildingModels: boolean = false;

    constructor(protected dragController: DragController, public colourScheme: ColourScheme) {
        function ensureColour(name: string, value: string | undefined, fallback: string): string {
            if (value == null || value === "" || value === "null") {
                log.error(`ColourScheme Error - ${name} not defined or invalid, falling back to ${fallback}`);
                return fallback;
            }
            return value;
        }

        // Defensive assignment and fallback
        colourScheme.bgColour = ensureColour('bgColour', colourScheme.bgColour, "#333");
        colourScheme.seaColour = ensureColour('seaColour', colourScheme.seaColour, "#0055aa");
        colourScheme.minorRoadColour = ensureColour('minorRoadColour', colourScheme.minorRoadColour, "#666");

        // Default colourscheme cascade
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

        // GUI-bound booleans
        this.zoomBuildings           = colourScheme.zoomBuildings ?? false;
        this.showBuildingModels      = colourScheme.buildingModels ?? false;
        colourScheme.zoomBuildings   = this.zoomBuildings;
        colourScheme.buildingModels  = this.showBuildingModels;

        colourScheme.minorWidth      = colourScheme.minorWidth ?? 2;
        colourScheme.majorWidth      = colourScheme.majorWidth ?? 4;
        colourScheme.mainWidth       = colourScheme.mainWidth ?? 5;
        colourScheme.frameColour     = ensureColour('frameColour', colourScheme.frameColour, colourScheme.bgColour);
        colourScheme.frameTextColour = ensureColour('frameTextColour', colourScheme.frameTextColour, colourScheme.minorRoadOutline);

        // New defaults for enhanced 3D-like rendering
        colourScheme.buildingShadowColour = colourScheme.buildingShadowColour ?? "rgba(0,0,0,0.12)";
        colourScheme.buildingLightAngle = colourScheme.buildingLightAngle ?? 220; // light coming from top-left-ish by default
        colourScheme.buildingShadeIntensity = colourScheme.buildingShadeIntensity ?? 0.55;
        colourScheme.buildingRoofVariation = colourScheme.buildingRoofVariation ?? 0.06;

        // Debug defaults
        colourScheme.showSideDebug = colourScheme.showSideDebug ?? false;
        colourScheme.debugNormalLength = colourScheme.debugNormalLength ?? 8;

        if (!colourScheme.buildingSideColour) {
            // Defensive parsing
            let parsedRgb = [128,128,128];
            try {
                const baseColour = colourScheme.buildingColour;
                if (baseColour) {
                    const rgb = Util.parseCSSColor(baseColour);
                    if (rgb && Array.isArray(rgb)) {
                        parsedRgb = rgb.map((v: number) => Math.max(0, v - 40));
                    } else {
                        log.error("parseCSSColour returned null/invalid for buildingColour:", baseColour);
                    }
                }
            } catch (err) {
                log.error("Error parsing buildingColour for buildingSideColour default:", err);
            }
            colourScheme.buildingSideColour = `rgb(${parsedRgb[0]},${parsedRgb[1]},${parsedRgb[2]})`;
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
     * Compute a shaded colour by applying brightness to a CSS colour.
     * brightness is a multiplier where 1 = unchanged, <1 darker, >1 lighter.
     */
    protected getShadedColour(baseCss: string, brightness: number, alphaOverride?: number): string {
        try {
            const rgb = Util.parseCSSColor(baseCss);
            if (!rgb || !Array.isArray(rgb)) return baseCss;
            const r = Math.min(255, Math.max(0, Math.round(rgb[0] * brightness)));
            const g = Math.min(255, Math.max(0, Math.round(rgb[1] * brightness)));
            const b = Math.min(255, Math.max(0, Math.round(rgb[2] * brightness)));
            if (typeof alphaOverride === 'number') {
                return `rgba(${r},${g},${b},${alphaOverride})`;
            }
            return `rgb(${r},${g},${b})`;
        } catch (err) {
            log.error("getShadedColour parse error:", err);
            return baseCss;
        }
    }

    /**
     * Given a side polygon (array of Vector), compute a brightness multiplier
     * using a simple 2D lighting model based on an angle in the colour scheme.
     */
    protected computeSideBrightness(side: Vector[]): number {
        if (!side || side.length < 2) return 1.0;
        try {
            // Use the vector from first to second point as the edge direction
            const a = side[0];
            const b = side[1];
            const edge = b.clone().sub(a);
            // Perpendicular normal (2D): (-y, x)
            const normal = new Vector(-edge.y, edge.x).normalize();

            // Convert light angle to a unit vector
            const angleDeg = (this.colourScheme.buildingLightAngle ?? 220) % 360;
            const rad = angleDeg * Math.PI / 180.0;
            const light = new Vector(Math.cos(rad), Math.sin(rad)).normalize();

            // Dot product in [-1,1]
            const dot = Math.max(-1, Math.min(1, normal.dot(light)));
            // Map dot to brightness: favor values in [0.6, 1.15] scaled by shadeIntensity
            const shadeIntensity = this.colourScheme.buildingShadeIntensity ?? 0.55;
            const brightnessBase = 0.6 + ( (dot + 1) / 2 ) * 0.55;
            const brightness = 1.0 - (1.0 - brightnessBase) * shadeIntensity;
            return Math.max(0.25, Math.min(1.4, brightness));
        } catch (err) {
            log.error("computeSideBrightness error:", err);
            return 1.0;
        }
    }

    /**
     * Small helper to compute a per-roof-variation multiplier
     */
    protected roofVariationMultiplier(seed: number): number {
        const varAmt = this.colourScheme.buildingRoofVariation ?? 0.06;
        // deterministic pseudo-random but stable
        const s = Math.abs(Math.sin(seed * 999.123 + 0.123));
        return 1.0 + (s - 0.5) * 2 * varAmt;
    }

    /**
     * Draw a small debug normal/brightness indicator for a side.
     * Uses the provided canvas wrapper; this keeps debug drawing centralized.
     *
     * Note: CanvasWrapper is a generic base type; not all wrapper-specific
     * methods are typed on the abstract. To avoid a TS error here we cast to
     * `any` for the thin debug calls. Long-term you can add these methods to
     * the CanvasWrapper type definition instead.
     */
    protected drawSideDebug(canvas: CanvasWrapper, side: Vector[], brightness: number): void {
        if (!this.colourScheme.showSideDebug) return;
        if (!side || side.length < 2) return;
        try {
            const a = side[0];
            const b = side[1];
            const mid = a.clone().add(b).divideScalar(2);
            const edge = b.clone().sub(a);
            const normal = new Vector(-edge.y, edge.x).normalize();
            const length = (this.colourScheme.debugNormalLength ?? 8) * this.domainController.zoom;
            const end = mid.clone().add(normal.clone().multiplyScalar(length));

            // Map brightness to a colour: brighter => greener, darker => reddish
            const t = Math.max(0, Math.min(1, (brightness - 0.25) / (1.4 - 0.25)));
            const r = Math.round(200 * (1 - t) + 40 * t);
            const g = Math.round(40 * (1 - t) + 200 * t);
            const bcol = Math.round(40 * (1 - t) + 40 * t);

            // Cast to any to avoid missing-methods errors on the abstract wrapper
            (canvas as any).setStrokeStyle(`rgb(${r},${g},${bcol})`);
            (canvas as any).setLineWidth(1);
            (canvas as any).drawPolyline([mid, end]);
        } catch (err) {
            // don't let debug drawing break the renderer
        }
    }
}

export class DefaultStyle extends Style {
    constructor(c: HTMLCanvasElement, dragController: DragController, colourScheme: ColourScheme, private heightmap=false) {
        super(dragController, colourScheme);
        this.canvas = this.createCanvasWrapper(c, 1, true);
        // Sync dat.GUI properties to the instance
        this.zoomBuildings = colourScheme.zoomBuildings ?? false;
        this.showBuildingModels = colourScheme.buildingModels ?? false;
    }

    public createCanvasWrapper(c: HTMLCanvasElement, scale=1, resizeToWindow=true): CanvasWrapper {
        return new DefaultCanvasWrapper(c, scale, resizeToWindow);
    }

    public draw(canvas=this.canvas as DefaultCanvasWrapper): void {
        let bgColour;
        if (this.zoomBuildings) {
            bgColour = this.domainController.zoom >= 2 ? this.colourScheme.bgColourIn : this.colourScheme.bgColour;
        } else {
            bgColour = this.colourScheme.bgColour;
        }
        canvas.setFillStyle(bgColour);
        canvas.clearCanvas();

        // Sea
        canvas.setFillStyle(this.colourScheme.seaColour);
        canvas.setStrokeStyle(this.colourScheme.seaColour);
        canvas.setLineWidth(0.1);
        canvas.drawPolygon(this.seaPolygon);

        // Coastline
        canvas.setStrokeStyle(bgColour);
        canvas.setLineWidth(30 * this.domainController.zoom);
        canvas.drawPolyline(this.coastline);

        // Parks
        canvas.setLineWidth(1);
        canvas.setFillStyle(this.colourScheme.grassColour);
        for (const p of this.parks) canvas.drawPolygon(p);

        // River
        canvas.setFillStyle(this.colourScheme.seaColour);
        canvas.setStrokeStyle(this.colourScheme.seaColour);
        canvas.setLineWidth(1);
        canvas.drawPolygon(this.river);

        // Road outlines
        canvas.setStrokeStyle(this.colourScheme.minorRoadOutline);
        canvas.setLineWidth(this.colourScheme.outlineSize + this.colourScheme.minorWidth * this.domainController.zoom);
        for (const s of this.minorRoads) canvas.drawPolyline(s);

        canvas.setStrokeStyle(this.colourScheme.majorRoadOutline);
        canvas.setLineWidth(this.colourScheme.outlineSize + this.colourScheme.majorWidth * this.domainController.zoom);
        for (const s of this.majorRoads) canvas.drawPolyline(s);
        canvas.drawPolyline(this.secondaryRiver);

        canvas.setStrokeStyle(this.colourScheme.mainRoadOutline);
        canvas.setLineWidth(this.colourScheme.outlineSize + this.colourScheme.mainWidth * this.domainController.zoom);
        for (const s of this.mainRoads) canvas.drawPolyline(s);
        for (const s of this.coastlineRoads) canvas.drawPolyline(s);

        // Road inlines
        canvas.setStrokeStyle(this.colourScheme.minorRoadColour);
        canvas.setLineWidth(this.colourScheme.minorWidth * this.domainController.zoom);
        for (const s of this.minorRoads) canvas.drawPolyline(s);

        canvas.setStrokeStyle(this.colourScheme.majorRoadColour);
        canvas.setLineWidth(this.colourScheme.majorWidth * this.domainController.zoom);
        for (const s of this.majorRoads) canvas.drawPolyline(s);
        canvas.drawPolyline(this.secondaryRiver);

        canvas.setStrokeStyle(this.colourScheme.mainRoadColour);
        canvas.setLineWidth(this.colourScheme.mainWidth * this.domainController.zoom);
        for (const s of this.mainRoads) canvas.drawPolyline(s);
        for (const s of this.coastlineRoads) canvas.drawPolyline(s);

        canvas.setLineWidth(1);

        if (this.heightmap) {
            for (const b of this.buildingModels) {
                // Colour based on height
                let parsedRgb = [128,128,128];
                try {
                    const rgb = Util.parseCSSColor(this.colourScheme.bgColour);
                    if (rgb && Array.isArray(rgb)) {
                        parsedRgb = rgb.map((v: number) => Math.min(255, v + (b.height * 3.5)));
                    }
                } catch (err) {
                    log.error("Heightmap: Error parsing bgColour for buildingModels");
                }
                canvas.setFillStyle(`rgb(${parsedRgb[0]},${parsedRgb[1]},${parsedRgb[2]})`);
                canvas.setStrokeStyle(`rgb(${parsedRgb[0]},${parsedRgb[1]},${parsedRgb[2]})`);
                canvas.drawPolygon(b.lotScreen);
            }
        } else {
            // Buildings
            if (!this.zoomBuildings || this.domainController.zoom >= 2) {
                canvas.setFillStyle(this.colourScheme.buildingColour);
                canvas.setStrokeStyle(this.colourScheme.buildingStroke);
                for (const b of this.lots) canvas.drawPolygon(b);
            }

            // Pseudo-3D - improved per-side shading, soft shadows, per-roof variation, and sorted sides
            if (this.showBuildingModels && (!this.zoomBuildings || this.domainController.zoom >= 2.5)) {
                const baseSide = this.colourScheme.buildingSideColour!;
                const baseRoof = this.colourScheme.buildingColour!;
                // First draw soft ground shadows for buildings to give them weight
                const lightAngle = (this.colourScheme.buildingLightAngle ?? 220) * Math.PI / 180;
                const lightVec = new Vector(Math.cos(lightAngle), Math.sin(lightAngle)).normalize();

                for (const b of this.buildingModels) {
                    if (!b.roof || b.roof.length === 0) continue;
                    try {
                        const depth = Math.max(1, b.height * 0.12) * this.domainController.zoom;
                        const dx = -lightVec.x * depth;
                        const dy = -lightVec.y * depth;
                        const shadowPoly = b.lotScreen.map(p => p.clone().add(new Vector(dx, dy)));
                        canvas.setFillStyle(this.colourScheme.buildingShadowColour!);
                        canvas.setStrokeStyle("none");
                        canvas.drawPolygon(shadowPoly);
                    } catch (err) {
                        // ignore per-building shadow errors
                    }
                }

                // Collect and sort sides back-to-front relative to camera
                const allSides: any[] = [];
                const camera = this.domainController.getCameraPosition();
                for (const b of this.buildingModels) {
                    for (const s of b.sides) {
                        const averagePoint = s[0].clone().add(s[1]).divideScalar(2);
                        allSides.push([averagePoint.distanceToSquared(camera), s, b]);
                    }
                }
                allSides.sort((a, b) => b[0] - a[0]);

                // Draw sides with computed shading (sorted)
                for (const tuple of allSides) {
                    const side: Vector[] = tuple[1];
                    const brightness = this.computeSideBrightness(side);
                    const shaded = this.getShadedColour(baseSide, brightness);
                    canvas.setFillStyle(shaded);
                    canvas.setStrokeStyle(shaded);
                    canvas.drawPolygon(side);

                    // Debug overlay per-side (normals/brightness)
                    if (this.colourScheme.showSideDebug) {
                        this.drawSideDebug(canvas, side, brightness);
                    }
                }

                // Roofs with slight variation so not every roof is identical
                let roofSeed = 1;
                for (const b of this.buildingModels) {
                    const roofMul = this.roofVariationMultiplier(roofSeed++);
                    const roofColour = this.getShadedColour(baseRoof, roofMul);
                    canvas.setFillStyle(roofColour);
                    canvas.setStrokeStyle(this.colourScheme.buildingStroke);
                    canvas.drawPolygon(b.roof);
                }
            }
        }

        if (this.showFrame) {
            canvas.setFillStyle(this.colourScheme.frameColour);
            canvas.setStrokeStyle(this.colourScheme.frameColour);
            canvas.drawFrame(30, 30, 30, 30);

            // canvas.setFillStyle(this.colourScheme.frameTextColour);
            // canvas.drawCityName();
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
            // Lots
            if (!this.zoomBuildings || this.domainController.zoom >= 2) {
                canvas.setOptions({
                    roughness: 1.2,
                    stroke: this.colourScheme.buildingStroke,
                    strokeWidth: 1,
                    fill: '',
                });
                for (const b of this.lots) canvas.drawPolygon(b);
            }

            // Pseudo-3D with per-side shading (and per-side debug optionally)
            if (this.showBuildingModels && (!this.zoomBuildings || this.domainController.zoom >= 2.5)) {
                // TODO: improve sorting for sides rendering
                const allSidesDistances: any[] = [];
                const camera = this.domainController.getCameraPosition();
                for (const b of this.buildingModels) {
                    for (const s of b.sides) {
                        const averagePoint = s[0].clone().add(s[1]).divideScalar(2);
                        allSidesDistances.push([averagePoint.distanceToSquared(camera), s, b]);
                    }
                }
                allSidesDistances.sort((a, b) => b[0] - a[0]);

                // Draw sides with per-side shaded fill
                for (const tuple of allSidesDistances) {
                    const side: Vector[] = tuple[1];
                    const brightness = this.computeSideBrightness(side);
                    const shaded = this.getShadedColour(this.colourScheme.buildingSideColour!, brightness);
                    canvas.setOptions({
                        roughness: 1.2,
                        stroke: this.colourScheme.buildingStroke,
                        strokeWidth: 1,
                        fill: shaded,
                    });
                    canvas.drawPolygon(side);

                    if (this.colourScheme.showSideDebug) {
                        // For the rough wrapper, draw the debug line in a simpler way
                        const a = side[0];
                        const b = side[1];
                        const mid = a.clone().add(b).divideScalar(2);
                        const edge = b.clone().sub(a);
                        const normal = new Vector(-edge.y, edge.x).normalize();
                        const length = (this.colourScheme.debugNormalLength ?? 8) * this.domainController.zoom;
                        const end = mid.clone().add(normal.clone().multiplyScalar(length));
                        // Draw as a small polyline
                        canvas.setOptions({
                            strokeWidth: 1,
                            stroke: `rgb(255,0,0)`,
                            fill: 'none',
                        });
                        canvas.drawPolyline([mid, end]);
                    }
                }

                // Roofs
                let seed = 1;
                for (const b of this.buildingModels) {
                    const roofMul = this.roofVariationMultiplier(seed++);
                    const roofColour = this.getShadedColour(this.colourScheme.buildingColour!, roofMul);
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

