import Vector from './vector';
import { BuildingModel } from './ui/buildings';
export default class ModelGenerator {
    private ground;
    private sea;
    private coastline;
    private river;
    private mainRoads;
    private majorRoads;
    private minorRoads;
    private buildings;
    private blocks;
    private readonly groundLevel;
    private resolve;
    private zip;
    private state;
    private groundMesh;
    private groundBsp;
    private polygonsToProcess;
    private roadsGeometry;
    private blocksGeometry;
    private roadsBsp;
    private buildingsGeometry;
    private buildingsToProcess;
    constructor(ground: Vector[], sea: Vector[], coastline: Vector[], river: Vector[], mainRoads: Vector[][], majorRoads: Vector[][], minorRoads: Vector[][], buildings: BuildingModel[], blocks: Vector[][]);
    private setState;
    /**
     * Return true if processing a model
     * Work done in update loop so main thread isn't swamped
     */
    update(): boolean;
    /**
     * Rotate and scale mesh so up is in the right direction
     */
    private threeToBlender;
    /**
     * Extrude a polygon into a THREE.js mesh
     */
    private polygonToMesh;
}
