import * as log from 'loglevel';
import DomainController from './domain_controller';
import TensorField from '../impl/tensor_field';
import Graph from '../impl/graph';
import Vector from '../vector';
import PolygonFinder from '../impl/polygon_finder';
import {PolygonParams} from '../impl/polygon_finder';


export interface BuildingModel {
    height: number;
    lotWorld: Vector[]; // In world space
    lotScreen: Vector[]; // In screen space
    roof: Vector[]; // In screen space
    sides: Vector[][]; // In screen space (array of quads)
    // Optional: per-side computed shade value (0..1). Populated by BuildingModels.
    sideShades?: number[];
}

/**
 * Pseudo 3D buildings
 *
 * Enhancements:
 * - cameraHeightFactor: tunable factor affecting camera distance used in projection (controls apparent perspective)
 * - heightScale: multiplier for building heights (allows global exaggeration or suppression)
 * - per-side shade values are computed and stored in BuildingModel.sideShades for later use by style/drawing code
 * - more robust perspective math with safety clamps to avoid division-by-zero artifacts
 */
class BuildingModels {
    private domainController = DomainController.getInstance();
    private _buildingModels: BuildingModel[] = [];

    // visual tuning parameters (exposed via setters)
    private cameraHeightFactor = 1.0; // multiplies the base camera distance (d)
    private heightScale = 1.0;        // multiplies each building's height (for exaggeration)
    private orthoHeightFactor = 1.0;  // multiplier for orthographic offset
    private lightDir: Vector = new Vector(0.5, -0.7); // 2D light direction used to compute per-side shading (screen-space)
    private ambientShade = 0.55;      // minimum shade multiplier (darker baseline)
    private specularBoost = 0.3;      // additional brightness range

    constructor(lots: Vector[][]) {  // Lots in world space
        for (const lot of lots) {
            this._buildingModels.push({
                height: Math.random() * 20 + 20,
                lotWorld: lot,
                lotScreen: [],
                roof: [],
                sides: [],
                sideShades: []
            });
        }
        this._buildingModels.sort((a, b) => a.height - b.height);
        // normalize lightDir for stable shading
        try { this.lightDir = this.lightDir.clone().normalize(); } catch (e) { /* ignore */ }
    }

    get buildingModels(): BuildingModel[] {
        return this._buildingModels;
    }

    /**
     * Set global camera height factor (1.0 = default).
     * Increasing makes projection appear less extreme (camera farther away relative to height).
     */
    public setCameraHeightFactor(f: number) {
        if (!Number.isFinite(f) || f <= 0) return;
        this.cameraHeightFactor = f;
    }

    public getCameraHeightFactor(): number {
        return this.cameraHeightFactor;
    }

    /**
     * Global height multiplier for buildings. Useful to exaggerate or reduce heights.
     */
    public setHeightScale(s: number) {
        if (!Number.isFinite(s) || s <= 0) return;
        this.heightScale = s;
    }

    public getHeightScale(): number {
        return this.heightScale;
    }

    /**
     * Set orthographic height factor used to offset roofs when in orthographic mode.
     */
    public setOrthoHeightFactor(f: number) {
        if (!Number.isFinite(f) || f <= 0) return;
        this.orthoHeightFactor = f;
    }

    public setLightDirection(v: Vector) {
        if (!v) return;
        this.lightDir = v.clone().normalize();
    }

    public setShadingParams(ambient: number, specular: number) {
        if (Number.isFinite(ambient)) this.ambientShade = ambient;
        if (Number.isFinite(specular)) this.specularBoost = specular;
    }

    /**
     * Recalculated when the camera moves or zoom/params change.
     *
     * Produces:
     * - lotScreen: footprint in screen space
     * - roof: projected roof polygon in screen space
     * - sides: sides as quads [v0_ground, v1_ground, v1_roof, v0_roof]
     * - sideShades: computed shading factor per side (0..1)
     */
    setBuildingProjections(): void {
        // base camera distance scaled by zoom and cameraHeightFactor
        const baseD = 1000;
        const d = (baseD * this.cameraHeightFactor) / Math.max(0.0001, this.domainController.zoom);
        const cameraPos = this.domainController.getCameraPosition();
        for (const b of this._buildingModels) {
            // compute screen-space footprint
            b.lotScreen = b.lotWorld.map(v => this.domainController.worldToScreen(v.clone()));

            // compute roof from scaled height per building
            const scaledHeight = (b.height * this.heightScale);
            b.roof = b.lotScreen.map(v => this.heightVectorToScreen(v, scaledHeight, d, cameraPos));

            // compute sides and per-side shade
            b.sides = this.getBuildingSides(b);
            b.sideShades = this.computeSideShades(b, cameraPos);
        }
    }

    /**
     * Use a more conventional perspective-like projection with a safe clamp.
     * For orthographic, use cameraDirection offset scaled by orthoHeightFactor.
     */
    private heightVectorToScreen(v: Vector, h: number, d: number, camera: Vector): Vector {
        // Safety: prevent worldZ <= 0 which would flip or blow up projection
        // Treat d as eyeZ (distance from camera to "ground" plane)
        const eyeZ = Math.max(1.0, d);
        const worldZ = eyeZ - h;
        // If worldZ gets too close to zero (object is at/behind eye), clamp to a small positive value
        const safeWorldZ = Math.max(0.0001, worldZ);
        const scale = eyeZ / safeWorldZ;

        if (this.domainController.orthographic) {
            // orthographic offset in the direction of cameraDirection (screen-space)
            // scale the offset by height and orthoHeightFactor
            const diff = this.domainController.cameraDirection.clone().multiplyScalar(-h * this.orthoHeightFactor);
            return v.clone().add(diff);
        } else {
            // perspective-ish projection (2D-friendly)
            // Move v relative to camera, scale, then translate back
            return v.clone().sub(camera).multiplyScalar(scale).add(camera);
        }
    }

    /**
     * Get sides of buildings by joining corresponding edges between the roof and ground
     */
    private getBuildingSides(b: BuildingModel): Vector[][] {
        const polygons: Vector[][] = [];
        for (let i = 0; i < b.lotScreen.length; i++) {
            const next = (i + 1) % b.lotScreen.length;
            polygons.push([b.lotScreen[i], b.lotScreen[next], b.roof[next], b.roof[i]]);
        }
        return polygons;
    }

    /**
     * Compute a simple per-side shading based on side orientation relative to the lightDir (screen-space).
     * Returns array of shade multipliers in [0,1] aligned with sides[].
     *
     * This method does not alter drawing; style.ts can read BuildingModel.sideShades to apply per-side fills.
     */
    private computeSideShades(b: BuildingModel, camera: Vector): number[] {
        const shades: number[] = [];
        if (!b.sides || b.sides.length === 0) return shades;

        // use screen-space normal approximation: rotate edge vector by 90deg
        for (const s of b.sides) {
            // s is [g0, g1, r1, r0], use ground edge g1-g0 as primary side direction
            const g0 = s[0], g1 = s[1];
            let edge = g1.clone().sub(g0);
            if (edge.length() === 0) {
                shades.push(this.ambientShade); // degenerate, fallback
                continue;
            }
            edge = edge.clone().normalize();

            // approximate 2D outward normal (rotate by +90deg)
            const normal = new Vector(-edge.y, edge.x).normalize();

            // brightness based on dot(normal, lightDir)
            const dot = Math.max(-1, Math.min(1, normal.dot(this.lightDir)));
            // map dot (-1..1) to shade (ambient..ambient+specularBoost)
            const brightness = this.ambientShade + (0.5 * (dot + 1)) * this.specularBoost;
            // clamp to [0,1]
            const shade = Math.max(0, Math.min(1, brightness));
            shades.push(shade);
        }
        return shades;
    }
}

/**
 * Finds building lots and optionally pseudo3D buildings
 */
export default class Buildings {
    private polygonFinder: PolygonFinder;
    private allStreamlines: Vector[][] = [];
    private domainController = DomainController.getInstance();
    private preGenerateCallback: () => any = () => {};
    private postGenerateCallback: () => any = () => {};
    private _models: BuildingModels = new BuildingModels([]);
    private _blocks: Vector[][] = [];

    private buildingParams: PolygonParams = {
        maxLength: 20,
        minArea: 200,
        shrinkSpacing: 4,
        chanceNoDivide: 0.05,
    };

    constructor(private tensorField: TensorField,
                folder: dat.GUI,
                private redraw: () => void,
                private dstep: number,
                private _animate: boolean) {
        folder.add({'AddBuildings': () => this.generate(this._animate)}, 'AddBuildings');
        folder.add(this.buildingParams, 'minArea');
        folder.add(this.buildingParams, 'shrinkSpacing');
        folder.add(this.buildingParams, 'chanceNoDivide');
        this.polygonFinder = new PolygonFinder([], this.buildingParams, this.tensorField);
    }

    set animate(v: boolean) {
        this._animate = v;
    }

    get lots(): Vector[][] {
        return this.polygonFinder.polygons.map(p => p.map(v => this.domainController.worldToScreen(v.clone())));
    }

    /**
     * Only used when creating the 3D model to 'fake' the roads
     */
    getBlocks(): Promise<Vector[][]> {
        const g = new Graph(this.allStreamlines, this.dstep, true);
        const blockParams = Object.assign({}, this.buildingParams);
        blockParams.shrinkSpacing = blockParams.shrinkSpacing/2;
        const polygonFinder = new PolygonFinder(g.nodes, blockParams, this.tensorField);
        polygonFinder.findPolygons();
        return polygonFinder.shrink(false).then(() => polygonFinder.polygons.map(p => p.map(v => this.domainController.worldToScreen(v.clone()))));
    }

    get models(): BuildingModel[] {
        this._models.setBuildingProjections();
        return this._models.buildingModels;
    }

    /**
     * Expose tuning setters so Main (or GUI) can tweak behaviour at runtime.
     */
    public setCameraHeightFactor(f: number) {
        this._models.setCameraHeightFactor?.(f);
    }

    public setHeightScale(s: number) {
        this._models.setHeightScale?.(s);
    }

    public setOrthoHeightFactor(f: number) {
        this._models.setOrthoHeightFactor?.(f);
    }

    public setLightDirection(v: Vector) {
        this._models.setLightDirection?.(v);
    }

    public setShadingParams(ambient: number, specular: number) {
        this._models.setShadingParams?.(ambient, specular);
    }

    setAllStreamlines(s: Vector[][]): void {
        this.allStreamlines = s;
    }

    reset(): void {
        this.polygonFinder.reset();
        this._models = new BuildingModels([]);
    }

    update(): boolean {
        return this.polygonFinder.update();
    }

    /**
     * Finds blocks, shrinks and divides them to create building lots
     */
    async generate(animate: boolean): Promise<void> {
        this.preGenerateCallback();
        this._models = new BuildingModels([]);
        const g = new Graph(this.allStreamlines, this.dstep, true);

        this.polygonFinder = new PolygonFinder(g.nodes, this.buildingParams, this.tensorField);
        this.polygonFinder.findPolygons();
        await this.polygonFinder.shrink(animate);
        await this.polygonFinder.divide(animate);
        this.redraw();
        this._models = new BuildingModels(this.polygonFinder.polygons);

        this.postGenerateCallback();
    }

    setPreGenerateCallback(callback: () => any): void {
        this.preGenerateCallback = callback;
    }

    setPostGenerateCallback(callback: () => any): void {
        this.postGenerateCallback = callback;
    }
}
