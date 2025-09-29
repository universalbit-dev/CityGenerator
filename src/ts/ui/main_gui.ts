import * as log from 'loglevel';
import DomainController from './domain_controller';
import TensorField from '../impl/tensor_field';
import { RK4Integrator } from '../impl/integrator';
import { StreamlineParams } from '../impl/streamlines';
import { WaterParams } from '../impl/water_generator';
import Graph from '../impl/graph';
import RoadGUI from './road_gui';
import WaterGUI from './water_gui';
import Vector from '../vector';
import PolygonFinder from '../impl/polygon_finder';
import Style from './style';
import { DefaultStyle, RoughStyle } from './style';
import CanvasWrapper from './canvas_wrapper';
import Buildings, { BuildingModel } from './buildings';
import PolygonUtil from '../impl/polygon_util';

/**
 * Handles Map folder, glues together impl
 */
export default class MainGUI {
    // Properties exposed to dat.GUI and for external configuration
    public numBigParks = 20;
    public numSmallParks = 10;
    public clusterBigParks = false;
    public animate = true;
    public animationSpeed = 30;

    // Internals
    private domainController = DomainController.getInstance();
    private intersections: Vector[] = [];
    private bigParks: Vector[][] = [];
    private smallParks: Vector[][] = [];
    private redraw = true;

    private coastline: WaterGUI;
    private mainRoads: RoadGUI;
    private majorRoads: RoadGUI;
    private minorRoads: RoadGUI;
    private buildings: Buildings;

    // Params
    private coastlineParams: WaterParams;
    private mainParams: StreamlineParams;
    private majorParams: StreamlineParams;
    private minorParams: StreamlineParams = {
        dsep: 20,
        dtest: 15,
        dstep: 1,
        dlookahead: 40,
        dcirclejoin: 5,
        joinangle: 0.1,
        pathIterations: 1000,
        seedTries: 300,
        simplifyTolerance: 0.5,
        collideEarly: 0,
    };

    constructor(
        private guiFolder: dat.GUI,
        private tensorField: TensorField,
        private closeTensorFolder: () => void
    ) {
        // dat.GUI controls - only public properties permitted
        guiFolder.add(this, 'generateEverything');
        guiFolder.add(this, 'animate');
        guiFolder.add(this, 'animationSpeed');

        // Water and road params setup
        this.coastlineParams = {
            ...this.minorParams,
            coastNoise: { noiseEnabled: true, noiseSize: 30, noiseAngle: 20 },
            riverNoise: { noiseEnabled: true, noiseSize: 30, noiseAngle: 20 },
            riverBankSize: 10,
            riverSize: 30,
            pathIterations: 10000,
            simplifyTolerance: 10,
        };

        this.majorParams = { ...this.minorParams, dsep: 100, dtest: 30, dlookahead: 200, collideEarly: 0 };
        this.mainParams = { ...this.minorParams, dsep: 400, dtest: 200, dlookahead: 500, collideEarly: 0 };

        const integrator = new RK4Integrator(tensorField, this.minorParams);
        const redraw = () => (this.redraw = true);

        this.coastline = new WaterGUI(
            tensorField,
            this.coastlineParams,
            integrator,
            this.guiFolder,
            closeTensorFolder,
            'Water',
            redraw
        ).initFolder();

        this.mainRoads = new RoadGUI(this.mainParams, integrator, this.guiFolder, closeTensorFolder, 'Main', redraw).initFolder();
        this.majorRoads = new RoadGUI(this.majorParams, integrator, this.guiFolder, closeTensorFolder, 'Major', redraw, this.animate).initFolder();
        this.minorRoads = new RoadGUI(this.minorParams, integrator, this.guiFolder, closeTensorFolder, 'Minor', redraw, this.animate).initFolder();

        // Parks GUI
        const parks = guiFolder.addFolder('Parks');
        parks.add({ Generate: () => { this.buildings.reset(); this.addParks(); this.redraw = true; } }, 'Generate');
        parks.add(this, 'clusterBigParks');
        parks.add(this, 'numBigParks');
        parks.add(this, 'numSmallParks');

        // Buildings GUI
        const buildingsFolder = guiFolder.addFolder('Buildings');
        this.buildings = new Buildings(tensorField, buildingsFolder, redraw, this.minorParams.dstep, this.animate);
        this.buildings.setPreGenerateCallback(() => {
            const allStreamlines = [
                ...this.mainRoads.allStreamlines,
                ...this.majorRoads.allStreamlines,
                ...this.minorRoads.allStreamlines,
                ...this.coastline.streamlinesWithSecondaryRoad
            ];
            this.buildings.setAllStreamlines(allStreamlines);
        });

        // Animate callback
        const animateCtrl = guiFolder.__controllers.find(ctrl => ctrl.property === 'animate');
        if (animateCtrl) {
            animateCtrl.onChange((b: boolean) => {
                this.majorRoads.animate = b;
                this.minorRoads.animate = b;
                this.buildings.animate = b;
            });
        }

        this.minorRoads.setExistingStreamlines([this.coastline, this.mainRoads, this.majorRoads]);
        this.majorRoads.setExistingStreamlines([this.coastline, this.mainRoads]);
        this.mainRoads.setExistingStreamlines([this.coastline]);

        // Pre/post generate callbacks for water and roads
        this.coastline.setPreGenerateCallback(() => {
            this.mainRoads.clearStreamlines();
            this.majorRoads.clearStreamlines();
            this.minorRoads.clearStreamlines();
            this.bigParks = [];
            this.smallParks = [];
            this.buildings.reset();
            tensorField.parks = [];
            tensorField.sea = [];
            tensorField.river = [];
        });

        this.mainRoads.setPreGenerateCallback(() => {
            this.majorRoads.clearStreamlines();
            this.minorRoads.clearStreamlines();
            this.bigParks = [];
            this.smallParks = [];
            this.buildings.reset();
            tensorField.parks = [];
            tensorField.ignoreRiver = true;
        });

        this.mainRoads.setPostGenerateCallback(() => {
            tensorField.ignoreRiver = false;
        });

        this.majorRoads.setPreGenerateCallback(() => {
            this.minorRoads.clearStreamlines();
            this.bigParks = [];
            this.smallParks = [];
            this.buildings.reset();
            tensorField.parks = [];
            tensorField.ignoreRiver = true;
        });

        this.majorRoads.setPostGenerateCallback(() => {
            tensorField.ignoreRiver = false;
            this.addParks();
            this.redraw = true;
        });

        this.minorRoads.setPreGenerateCallback(() => {
            this.buildings.reset();
            this.smallParks = [];
            tensorField.parks = this.bigParks;
        });

        this.minorRoads.setPostGenerateCallback(() => {
            this.addParks();
        });
    }

    /**
     * Generate parks based on available polygons.
     */
    addParks(): void {
        const g = new Graph(
            [...this.majorRoads.allStreamlines, ...this.mainRoads.allStreamlines, ...this.minorRoads.allStreamlines],
            this.minorParams.dstep
        );
        this.intersections = g.intersections;

        const p = new PolygonFinder(
            g.nodes,
            {
                maxLength: 20,
                minArea: 80,
                shrinkSpacing: 4,
                chanceNoDivide: 1,
            },
            this.tensorField
        );
        p.findPolygons();
        const polygons = p.polygons;

        if (this.minorRoads.allStreamlines.length === 0) {
            // Big parks
            this.bigParks = [];
            this.smallParks = [];
            if (polygons.length > this.numBigParks) {
                if (this.clusterBigParks) {
                    const parkIndex = Math.floor(Math.random() * (polygons.length - this.numBigParks));
                    for (let i = parkIndex; i < parkIndex + this.numBigParks; i++) {
                        this.bigParks.push(polygons[i]);
                    }
                } else {
                    for (let i = 0; i < this.numBigParks; i++) {
                        const parkIndex = Math.floor(Math.random() * polygons.length);
                        this.bigParks.push(polygons[parkIndex]);
                    }
                }
            } else {
                this.bigParks.push(...polygons);
            }
        } else {
            // Small parks
            this.smallParks = [];
            for (let i = 0; i < this.numSmallParks; i++) {
                const parkIndex = Math.floor(Math.random() * polygons.length);
                this.smallParks.push(polygons[parkIndex]);
            }
        }

        this.tensorField.parks = [];
        this.tensorField.parks.push(...this.bigParks, ...this.smallParks);
    }

    /**
     * Generate all roads and buildings for the city.
     */
    async generateEverything() {
        this.coastline.generateRoads();
        await this.mainRoads.generateRoads();
        await this.majorRoads.generateRoads(this.animate);
        await this.minorRoads.generateRoads(this.animate);
        this.redraw = true;
        await this.buildings.generate(this.animate);
    }

    /**
     * Update all animated components.
     */
    update() {
        let continueUpdate = true;
        const start = performance.now();
        while (continueUpdate && performance.now() - start < this.animationSpeed) {
            const minorChanged = this.minorRoads.update();
            const majorChanged = this.majorRoads.update();
            const mainChanged = this.mainRoads.update();
            const buildingsChanged = this.buildings.update();
            continueUpdate = minorChanged || majorChanged || mainChanged || buildingsChanged;
        }
        this.redraw = this.redraw || continueUpdate;
    }

    /**
     * Draw the current state of the map with the given style.
     */
    draw(style: Style, forceDraw = false, customCanvas?: CanvasWrapper): void {
        if (!style.needsUpdate && !forceDraw && !this.redraw && !this.domainController.moved) {
            return;
        }
        style.needsUpdate = false;
        this.domainController.moved = false;
        this.redraw = false;

        style.seaPolygon = this.coastline.seaPolygon;
        style.coastline = this.coastline.coastline;
        style.river = this.coastline.river;
        style.lots = this.buildings.lots;

        if ((style instanceof DefaultStyle && style.showBuildingModels) || style instanceof RoughStyle) {
            style.buildingModels = this.buildings.models;
        }

        style.parks = [
            ...this.bigParks.map(p => p.map(v => this.domainController.worldToScreen(v.clone()))),
            ...this.smallParks.map(p => p.map(v => this.domainController.worldToScreen(v.clone())))
        ];
        style.minorRoads = this.minorRoads.roads;
        style.majorRoads = this.majorRoads.roads;
        style.mainRoads = this.mainRoads.roads;
        style.coastlineRoads = this.coastline.roads;
        style.secondaryRiver = this.coastline.secondaryRiver;
        style.draw(customCanvas);
    }

    roadsEmpty(): boolean {
        return this.majorRoads.roadsEmpty()
            && this.minorRoads.roadsEmpty()
            && this.mainRoads.roadsEmpty()
            && this.coastline.roadsEmpty();
    }

    // OBJ Export methods
    public get seaPolygon(): Vector[] {
        return this.coastline.seaPolygon;
    }

    public get riverPolygon(): Vector[] {
        return this.coastline.river;
    }

    public get buildingModels(): BuildingModel[] {
        return this.buildings.models;
    }

    public getBlocks(): Promise<Vector[][]> {
        return this.buildings.getBlocks();
    }

    public get minorRoadPolygons(): Vector[][] {
        return this.minorRoads.roads.map(
            r => PolygonUtil.resizeGeometry(r, 1 * this.domainController.zoom, false)
        );
    }

    public get majorRoadPolygons(): Vector[][] {
        return [...this.majorRoads.roads, this.coastline.secondaryRiver].map(
            r => PolygonUtil.resizeGeometry(r, 2 * this.domainController.zoom, false)
        );
    }

    public get mainRoadPolygons(): Vector[][] {
        return [...this.mainRoads.roads, ...this.coastline.roads].map(
            r => PolygonUtil.resizeGeometry(r, 2.5 * this.domainController.zoom, false)
        );
    }

    public get coastlinePolygon(): Vector[] {
        return PolygonUtil.resizeGeometry(this.coastline.coastline, 15 * this.domainController.zoom, false);
    }
}
