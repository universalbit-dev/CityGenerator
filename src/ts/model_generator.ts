import * as log from 'loglevel';
import * as THREE from 'three'
import Vector from './vector';
import { CSG } from 'three-csg-ts';
import {BuildingModel} from './ui/buildings';
import { mergeBufferGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';

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

export default class ModelGenerator {
    private readonly groundLevel = 20;  // Thickness of groundMesh

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


    constructor(private ground: Vector[],
                private sea: Vector[],
                private coastline: Vector[],
                private river: Vector[],
                private mainRoads: Vector[][],
                private majorRoads: Vector[][],
                private minorRoads: Vector[][],
                private buildings: BuildingModel[],
                private blocks: Vector[][]) {
    }

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

    private setState(s: ModelGeneratorStates): void {
        this.state = s;
        log.info(ModelGeneratorStates[s]);
    }

    /**
     * Return true if processing a model
     * Work done in update loop so main thread isn't swamped
     */
    public update(): boolean {
        switch(this.state) {
            case ModelGeneratorStates.WAITING: {
                return false;
            }
            case ModelGeneratorStates.SUBTRACT_OCEAN: {
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
            case ModelGeneratorStates.ADD_COASTLINE: {
                const coastlineMesh = this.polygonToMesh(this.coastline, 0);
                this.threeToBlender(coastlineMesh);
                const coastlineSTL = this.exportSTL.fromMesh(coastlineMesh);
                this.zip.file("model/coastline.stl", coastlineSTL);
                this.setState(ModelGeneratorStates.SUBTRACT_RIVER);
                break;
            }
            case ModelGeneratorStates.SUBTRACT_RIVER: {
                const riverMesh = this.polygonToMesh(this.river, 0);
                this.threeToBlender(riverMesh);
                const riverSTL = this.exportSTL.fromMesh(riverMesh);
                this.zip.file("model/river.stl", riverSTL);
                this.setState(ModelGeneratorStates.ADD_ROADS);
                this.polygonsToProcess = this.minorRoads.concat(this.majorRoads).concat(this.mainRoads);
                break;
            }
            case ModelGeneratorStates.ADD_ROADS: {
                if (this.polygonsToProcess.length === 0) {
                    const mesh = new (<any>THREE).Mesh(this.roadsGeometry);
                    this.threeToBlender(mesh);
                    const buildingsSTL = this.exportSTL.fromMesh(mesh);
                    this.zip.file("model/roads.stl", buildingsSTL);
                    
                    this.setState(ModelGeneratorStates.ADD_BLOCKS);
                    this.polygonsToProcess = [...this.blocks];
                    break;
                }

                const road = this.polygonsToProcess.pop();
                const roadsMesh = this.polygonToMesh(road, 0);
       
                const roadsGeometries = [this.roadsGeometry, roadsMesh.geometry];
                this.roadsGeometry = mergeBufferGeometries(roadsGeometries);
                //this.roadsGeometry((roadsMesh.geometry), this.groundMesh.matrix);
                break;
            }
            case ModelGeneratorStates.ADD_BLOCKS: {
                if (this.polygonsToProcess.length === 0) {
                    const mesh = new (<any>THREE).Mesh(this.blocksGeometry);
                    this.threeToBlender(mesh);
                    const blocksSTL = this.exportSTL.fromMesh(mesh);
                    this.zip.file("model/blocks.stl", blocksSTL);

                    this.setState(ModelGeneratorStates.ADD_BUILDINGS);
                    this.buildingsToProcess = [...this.buildings];
                    break; 
                }





                const block = this.polygonsToProcess.pop();
                const blockMesh = this.polygonToMesh(block, 1);
                const blocksGeometries = [this.blocksGeometry, blockMesh.geometry];
                this.blocksGeometry = mergeBufferGeometries(blocksGeometries);
                //this.blocksGeometry((blockMesh.geometry), this.groundMesh.matrix);
                break;
            }
            case ModelGeneratorStates.ADD_BUILDINGS: {
                if (this.buildingsToProcess.length === 0) {
                    const mesh = new (<any>THREE).Mesh(this.buildingsGeometry);
                    this.threeToBlender(mesh);
                    const buildingsSTL = this.exportSTL.fromMesh(mesh);
                    this.zip.file("model/buildings.stl", buildingsSTL);
                    this.setState(ModelGeneratorStates.CREATE_ZIP);
                    break;
                }

                const b = this.buildingsToProcess.pop();
                const buildingMesh = this.polygonToMesh(b.lotScreen, b.height);
                const buildingsGeometries = [this.buildingsGeometry, buildingMesh.geometry];
                this.buildingsGeometry = mergeBufferGeometries(buildingsGeometries);
                //this.buildingsGeometry((buildingMesh.geometry), this.groundMesh.matrix);
                break;
            }
            case ModelGeneratorStates.CREATE_ZIP: {
                this.zip.generateAsync({type:"blob"}).then((blob: any) => this.resolve(blob));
                this.setState(ModelGeneratorStates.WAITING);
                break;
            }
            default: {
                break;
            }
        }
        return true;
    }

    /**
     * Rotate and scale mesh so up is in the right direction
     */
    private threeToBlender(mesh: THREE.Object3D): void {
        mesh.scale.multiplyScalar(0.02);
        mesh.updateMatrixWorld(true);
    }

    /**
     * Extrude a polygon into a THREE.js mesh  -- copilot enhance --
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

    // Apply material
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

