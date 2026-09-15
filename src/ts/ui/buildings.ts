import * as log from 'loglevel';
import DomainController from './domain_controller';
import TensorField from '../impl/tensor_field';
import Graph from '../impl/graph';
import Vector from '../vector';
import PolygonFinder from '../impl/polygon_finder';
import {PolygonParams} from '../impl/polygon_finder';

export interface BuildingModel {
    height: number;
    lotWorld: Vector[]; 
    lotScreen: Vector[]; 
    roof: Vector[]; 
    sides: Vector[][]; 
    sideShades?: number[]; 
    centroidWorld?: Vector; 
    isVisible?: boolean; 
}

class BuildingModels {
    private domainController = DomainController.getInstance();
    private _buildingModels: BuildingModel[] = [];

    private cameraHeightFactor = 1.0; 
    private heightScale = 1.0;        
    private orthoHeightFactor = 1.0;  
    private minHeight = 6;            
    private maxHeight = 20;           
    private lightDir: Vector = new Vector(0.5, -0.7).normalize(); 
    private ambientShade = 0.65;      
    private specularBoost = 0.2;      

    constructor(lots: Vector[][]) {  
        for (const lot of lots) {
            const height = Math.random() * (this.maxHeight - this.minHeight) + this.minHeight;
            this._buildingModels.push({
                height,
                lotWorld: lot,
                lotScreen: [],
                roof: [],
                sides: [],
                sideShades: [],
                centroidWorld: this.computeCentroid(lot),
                isVisible: true
            });
        }
        log.debug(`Initialized ${this._buildingModels.length} eco-modular building models.`);
    }

    get buildingModels(): BuildingModel[] {
        return this._buildingModels.filter(b => b.isVisible);
    }

    public setCameraHeightFactor(f: number) { if (Number.isFinite(f) && f > 0) this.cameraHeightFactor = f; }
    public getCameraHeightFactor(): number { return this.cameraHeightFactor; }
    public setHeightScale(s: number) { if (Number.isFinite(s) && s > 0) this.heightScale = s; }
    public getHeightScale(): number { return this.heightScale; }
    public setOrthoHeightFactor(f: number) { if (Number.isFinite(f) && f > 0) this.orthoHeightFactor = f; }
    public setHeightRange(min: number, max: number) {
        if (Number.isFinite(min) && Number.isFinite(max) && min < max) {
            this.minHeight = min;
            this.maxHeight = max;
        }
    }
    public setLightDirection(v: Vector) { if (v) this.lightDir = v.clone().normalize(); }
    public setShadingParams(ambient: number, specular: number) {
        if (Number.isFinite(ambient)) this.ambientShade = ambient;
        if (Number.isFinite(specular)) this.specularBoost = specular;
    }

    private computeCentroid(lot: Vector[]): Vector {
        let x = 0, y = 0;
        const len = lot.length;
        if (len === 0) return new Vector(0, 0);
        for (const v of lot) {
            x += v.x;
            y += v.y;
        }
        return new Vector(x / len, y / len);
    }

    setBuildingProjections(): void {
        const baseD = 1000;
        const d = (baseD * this.cameraHeightFactor) / Math.max(0.0001, this.domainController.zoom);
        const cameraPos = this.domainController.getCameraPosition();
        
        const screenCenter = new Vector(this.domainController.screenDimensions.x / 2, this.domainController.screenDimensions.y / 2);
        const cullRadiusSq = Math.pow(Math.max(this.domainController.screenDimensions.x, this.domainController.screenDimensions.y) * 0.6, 2);

        const distances = new Map<BuildingModel, number>();

        for (const b of this._buildingModels) {
            if (!b.centroidWorld) continue;

            const screenCentroid = this.domainController.worldToScreen(b.centroidWorld.clone());
            
            if (screenCentroid.distanceToSquared(screenCenter) > cullRadiusSq) {
                b.isVisible = false;
                continue;
            }

            b.isVisible = true;

            const dx = b.centroidWorld.x - cameraPos.x;
            const dy = b.centroidWorld.y - cameraPos.y;
            distances.set(b, (dx * dx) + (dy * dy)); 
        }

        const visibleModels = this._buildingModels.filter(b => b.isVisible);
        visibleModels.sort((a, b) => distances.get(b)! - distances.get(a)!);

        for (const b of visibleModels) {
            b.lotScreen = b.lotWorld.map(v => this.domainController.worldToScreen(v.clone()));
            const scaledHeight = b.height * this.heightScale;
            b.roof = b.lotScreen.map(v => this.heightVectorToScreen(v, scaledHeight, d, cameraPos));

            b.sides = this.getBuildingSides(b);
            b.sideShades = this.computeSideShades(b);
        }
    }

    private heightVectorToScreen(v: Vector, h: number, d: number, camera: Vector): Vector {
        const eyeZ = Math.max(1.0, d);
        const worldZ = eyeZ - h;
        const safeWorldZ = Math.max(0.0001, worldZ);
        const scale = eyeZ / safeWorldZ;

        if (this.domainController.orthographic) {
            const diff = this.domainController.cameraDirection.clone().multiplyScalar(-h * this.orthoHeightFactor);
            return v.clone().add(diff);
        } else {
            return v.clone().sub(camera).multiplyScalar(scale).add(camera);
        }
    }

    private getBuildingSides(b: BuildingModel): Vector[][] {
        const polygons: Vector[][] = [];
        for (let i = 0; i < b.lotScreen.length; i++) {
            const next = (i + 1) % b.lotScreen.length;
            const g0 = b.lotScreen[i];
            const g1 = b.lotScreen[next];
            const r0 = b.roof[i];
            const r1 = b.roof[next];

            const dx1 = g1.x - g0.x;
            const dy1 = g1.y - g0.y;
            const dx2 = r0.x - g0.x;
            const dy2 = r0.y - g0.y;
            
            const crossProduct = (dx1 * dy2) - (dy1 * dx2);

            if (crossProduct < -0.1) { 
                polygons.push([g0, g1, r1, r0]);
            }
        }
        return polygons;
    }

    private computeSideShades(b: BuildingModel): number[] {
        const shades: number[] = [];
        if (!b.sides || b.sides.length === 0) return shades;

        for (const s of b.sides) {
            const g0 = s[0], g1 = s[1];
            const dx = g1.x - g0.x;
            const dy = g1.y - g0.y;
            const length = Math.sqrt(dx * dx + dy * dy);
            
            if (length === 0) {
                shades.push(this.ambientShade);
                continue;
            }

            const nx = -dy / length;
            const ny = dx / length;

            const dot = Math.max(-1, Math.min(1, nx * this.lightDir.x + ny * this.lightDir.y));
            const brightness = this.ambientShade + (0.5 * (dot + 1)) * this.specularBoost;
            shades.push(Math.max(0, Math.min(1, brightness)));
        }
        return shades;
    }
}

export default class Buildings {
    private polygonFinder: PolygonFinder;
    private allStreamlines: Vector[][] = [];
    private domainController = DomainController.getInstance();
    private preGenerateCallback: () => any = () => {};
    private postGenerateCallback: () => any = () => {};
    private _models: BuildingModels = new BuildingModels([]);

    private buildingParams: PolygonParams = {
        maxLength: 30,
        minArea: 350,
        shrinkSpacing: 8,
        chanceNoDivide: 0.25,
    };

    constructor(
        private tensorField: TensorField,
        folder: dat.GUI,
        private redraw: () => void,
        private dstep: number,
        private _animate: boolean
    ) {
        folder.add({'AddBuildings': () => this.generate(this._animate)}, 'AddBuildings').name('Generate Eco-Structures');
        folder.add(this.buildingParams, 'minArea').name('Min Lot Area');
        folder.add(this.buildingParams, 'shrinkSpacing').name('Garden Spacing');
        folder.add(this.buildingParams, 'chanceNoDivide').name('Open Space Ratio');

        this.polygonFinder = new PolygonFinder([], this.buildingParams, this.tensorField);
    }

    set animate(v: boolean) {
        this._animate = v;
    }

    get lots(): Vector[][] {
        return this.polygonFinder.polygons.map(p => p.map(v => this.domainController.worldToScreen(v.clone())));
    }

    getBlocks(): Promise<Vector[][]> {
        const g = new Graph(this.allStreamlines, this.dstep, true);
        const blockParams = Object.assign({}, this.buildingParams);
        blockParams.shrinkSpacing = blockParams.shrinkSpacing / 2;
        const polygonFinder = new PolygonFinder(g.nodes, blockParams, this.tensorField);
        polygonFinder.findPolygons();
        return polygonFinder.shrink(false).then(() =>
            polygonFinder.polygons.map(p => p.map(v => this.domainController.worldToScreen(v.clone())))
        );
    }

    get models(): BuildingModel[] {
        this._models.setBuildingProjections();
        return this._models.buildingModels;
    }

    public setCameraHeightFactor(f: number) { this._models.setCameraHeightFactor?.(f); }
    public setHeightScale(s: number) { this._models.setHeightScale?.(s); }
    public setOrthoHeightFactor(f: number) { this._models.setOrthoHeightFactor?.(f); }
    public setHeightRange(min: number, max: number) { this._models.setHeightRange?.(min, max); }
    public setLightDirection(v: Vector) { this._models.setLightDirection?.(v); }
    public setShadingParams(ambient: number, specular: number) { this._models.setShadingParams?.(ambient, specular); }

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

    async generate(animate: boolean): Promise<void> {
        log.info('Generating resilient eco-community clusters...');
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
        log.info('Eco-community generation completed.');
    }

    setPreGenerateCallback(callback: () => any): void {
        this.preGenerateCallback = callback;
    }

    setPostGenerateCallback(callback: () => any): void {
        this.postGenerateCallback = callback;
    }
}
