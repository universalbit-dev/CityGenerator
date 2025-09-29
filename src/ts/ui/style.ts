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
                        log.error("parseCSSColor returned null/invalid for buildingColour:", baseColour);
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

            // Pseudo-3D
            if (this.showBuildingModels && (!this.zoomBuildings || this.domainController.zoom >= 2.5)) {
                canvas.setFillStyle(this.colourScheme.buildingSideColour);
                canvas.setStrokeStyle(this.colourScheme.buildingSideColour);

                for (const b of this.buildingModels) {
                    for (const s of b.sides) canvas.drawPolygon(s);
                }
                canvas.setFillStyle(this.colourScheme.buildingColour);
                canvas.setStrokeStyle(this.colourScheme.buildingStroke);
                for (const b of this.buildingModels) canvas.drawPolygon(b.roof);
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

            // Pseudo-3D
            if (this.showBuildingModels && (!this.zoomBuildings || this.domainController.zoom >= 2.5)) {
                canvas.setOptions({
                    roughness: 1.2,
                    stroke: this.colourScheme.buildingStroke,
                    strokeWidth: 1,
                    fill: this.colourScheme.buildingSideColour,
                });

                // TODO: improve sorting for sides rendering
                const allSidesDistances: any[] = [];
                const camera = this.domainController.getCameraPosition();
                for (const b of this.buildingModels) {
                    for (const s of b.sides) {
                        const averagePoint = s[0].clone().add(s[1]).divideScalar(2);
                        allSidesDistances.push([averagePoint.distanceToSquared(camera), s]);
                    }
                }
                allSidesDistances.sort((a, b) => b[0] - a[0]);
                for (const p of allSidesDistances) canvas.drawPolygon(p[1]);

                canvas.setOptions({
                    roughness: 1.2,
                    stroke: this.colourScheme.buildingStroke,
                    strokeWidth: 1,
                    fill: this.colourScheme.buildingColour,
                });

                for (const b of this.buildingModels) canvas.drawPolygon(b.roof);
            }
        }
    }
}
