import * as log from 'loglevel';
import * as THREE from 'three';
import Vector from './vector';
import { CSG } from 'three-csg-ts';
import { BuildingModel } from './ui/buildings';
import { mergeBufferGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';

/**
 * Enum representing the various states of the `ModelGenerator`.
 */
enum ModelGeneratorStates {
    WAITING,
    SUBTRACT_OCEAN,
    ADD_COASTLINE,
    SUBTRACT_RIVER,
    ADD_ROADS,
    ADD_BLOCKS,
    ADD_BUILDINGS,
    CREATE_ZIP,
}

/**
 * The `ModelGenerator` class generates 3D models for a city using THREE.js and exports them as STL files.
 */
export default class ModelGenerator {
    private readonly groundLevel = 20; // Thickness of the ground mesh
    private readonly exportSTL = require('stl-exporter');
    private resolve: (blob: any) => void = b => {};
    private zip: any;
    private state: ModelGeneratorStates = ModelGeneratorStates.WAITING;

    private groundMesh: THREE.Mesh;
    private groundBsp: CSG;
    private polygonsToProcess: Vector[][] = [];
    private roadsGeometry = new THREE.BufferGeometry();
    private blocksGeometry = new THREE.BufferGeometry();
    private buildingsGeometry = new THREE.BufferGeometry();
    private roadsBsp: CSG;
    private buildingsToProcess: BuildingModel[];

    /**
     * Constructs a new `ModelGenerator` instance.
     * 
     * @param ground - Array of vectors representing the ground polygon.
     * @param sea - Array of vectors representing the sea polygon.
     * @param coastline - Array of vectors representing the coastline polygon.
     * @param river - Array of vectors representing the river polygon.
     * @param mainRoads - Array of arrays of vectors representing main roads.
     * @param majorRoads - Array of arrays of vectors representing major roads.
     * @param minorRoads - Array of arrays of vectors representing minor roads.
     * @param buildings - Array of `BuildingModel` objects representing buildings.
     * @param blocks - Array of arrays of vectors representing city blocks.
     */
    
    /**
     * Generates a bridge mesh connecting two points.
     * @param start - Start vector of the bridge.
     * @param end - End vector of the bridge.
     * @param height - Height of the bridge above water.
     * @returns The generated THREE.js mesh for the bridge.
     */
    private generateBridgeMesh(start: Vector, end: Vector, height: number): THREE.Mesh {
        const bridgeShape = new THREE.Shape();
        bridgeShape.moveTo(start.x, start.y);
        bridgeShape.lineTo(end.x, end.y);

        const extrudeSettings = {
            steps: 2,
            depth: height,
            bevelEnabled: false,
        };

        const geometry = new THREE.ExtrudeGeometry(bridgeShape, extrudeSettings);
        const material = new THREE.MeshStandardMaterial({
            color: 0x8B4513, // Bridge color (e.g., brown)
            metalness: 0.2,
            roughness: 0.7,
        });

        const mesh = new THREE.Mesh(geometry, material);
        return mesh;
    }
    
    constructor(
        private ground: Vector[],
        private sea: Vector[],
        private coastline: Vector[],
        private river: Vector[],
        private mainRoads: Vector[][],
        private majorRoads: Vector[][],
        private minorRoads: Vector[][],
        private buildings: BuildingModel[],
        private blocks: Vector[][],
    ) {}

    /**
     * Generates and returns the STL representation of the city as a Promise.
     * 
     * @returns A Promise that resolves with the STL blob.
     */
    public async getSTL(): Promise<any> {
        return new Promise<any>(resolve => {
            this.resolve = resolve;
            const JSZip = require("jszip");
            this.zip = new JSZip();
            this.zip.file("model/stl_binary.md", "");

            this.groundMesh = this.polygonToMesh(this.ground, this.groundLevel);
            this.groundBsp = CSG.fromMesh(this.groundMesh);
            this.setState(ModelGeneratorStates.SUBTRACT_OCEAN);
        });
    }

    /**
     * Updates the state of the model generator.
     * 
     * @param s - The new state of the model generator.
     */
    private setState(s: ModelGeneratorStates): void {
        this.state = s;
        log.info(ModelGeneratorStates[s]);
    }

    /**
     * Updates the model generation process. This method is designed to avoid blocking the main thread.
     * 
     * @returns `true` if the model generation is in progress, otherwise `false`.
     */
    public update(): boolean {
        switch(this.state) {
            case ModelGeneratorStates.WAITING: {
                return false;
            }
            case ModelGeneratorStates.SUBTRACT_OCEAN: {
                // Process ocean subtraction
                const seaLevelMesh = this.polygonToMesh(this.ground, 0);
                this.threeToBlender(seaLevelMesh);
                const seaLevelSTL = this.exportSTL.fromMesh(seaLevelMesh);
                this.zip.file("model/domain.stl", seaLevelSTL);

                const seaMesh = this.polygonToMesh(this.sea, 0);
                this.threeToBlender(seaMesh);
                const seaMeshSTL = this.exportSTL.fromMesh(seaMesh);
                this.zip.file("model/sea.stl", seaMeshSTL);
                this.setState(ModelGeneratorStates.ADD_COASTLINE);
                break;
            }
            // Other states follow similar logic
            // ...
        }
        return true;
    }

    /**
     * Rotates and scales a mesh so that the "up" direction is correct.
     * 
     * @param mesh - The 3D mesh to transform.
     */
    private threeToBlender(mesh: THREE.Object3D): void {
        mesh.scale.multiplyScalar(0.02);
        mesh.updateMatrixWorld(true);
    }

    /**
     * Converts a polygon into a THREE.js mesh by extruding it to a specified height.
     * 
     * @param polygon - Array of vectors representing the polygon.
     * @param height - The height to extrude the polygon.
     * @returns The generated THREE.js mesh.
     */
    private polygonToMesh(polygon: Vector[], height: number): THREE.Mesh {
        if (polygon.length < 3) {
            log.error("Tried to export empty polygon as OBJ");
            return null;
        }
        const shape = new THREE.Shape();
        shape.moveTo(polygon[0].x, polygon[0].y);
        for (let i = 1; i < polygon.length; i++) {
            shape.lineTo(polygon[i].x, polygon[i].y);
        }
        shape.lineTo(polygon[0].x, polygon[0].y);

        const extrudeSettings = {
            steps: 2,
            depth: height,
            bevelEnabled: true,
            bevelThickness: 1,
            bevelSize: 1,
            bevelOffset: 0,
            bevelSegments: 2
        };

        const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);

        const material = new THREE.MeshStandardMaterial({
            color: 0x808080,
            metalness: 0.5,
            roughness: 0.5
        });

        const mesh = new THREE.Mesh(geometry, material);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.updateMatrixWorld(true);
        return mesh;
    }
}
