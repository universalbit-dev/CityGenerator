// Importing necessary libraries and modules
import * as log from 'loglevel';
import * as dat from 'dat.gui'; // GUI library for UI controls
import TensorFieldGUI from './ts/ui/tensor_field_gui';
import { NoiseParams } from './ts/impl/tensor_field';
import MainGUI from './ts/ui/main_gui';
import { DefaultCanvasWrapper } from './ts/ui/canvas_wrapper';
import Util from './ts/util';
import DragController from './ts/ui/drag_controller';
import DomainController from './ts/ui/domain_controller';
import Style from './ts/ui/style';
import { ColourScheme, DefaultStyle, RoughStyle } from './ts/ui/style';
import * as ColourSchemes from './colour_schemes.json'; // JSON file for color schemes
import Vector from './ts/vector';
import { SVG } from '@svgdotjs/svg.js';
import ModelGenerator from './ts/model_generator';
import { saveAs } from 'file-saver'; // Used for saving files

// --- GLOBAL DEDUPLICATION HELPERS ---
declare global {
  interface Window {
    __cityGenMainInstance__?: Main;
    __cityGenGuiInstance__?: dat.GUI;
    log?: typeof log;
    __cityGenAnimationFrameId__?: number;
  }
}

/**
 * The `Main` class serves as the entry point for the CityGenerator application.
 * It initializes the GUI, manages UI components, and handles the map generation process.
 */
class Main {
    private static readonly STARTING_WIDTH = 1440;
    // UI components
    private tensorFolder: dat.GUI;
    private roadsFolder: dat.GUI;
    private styleFolder: dat.GUI;
    private optionsFolder: dat.GUI;
    private downloadsFolder: dat.GUI;

    // Controllers and components
    private domainController = DomainController.getInstance();
    private gui: dat.GUI = new dat.GUI({ width: 300 });
    private dragController = new DragController(this.gui);
    private tensorField: TensorFieldGUI;
    private mainGui: MainGUI;

    // Options
    private imageScale = 3; // Resolution multiplier for downloaded images
    public highDPI = false; // High DPI mode for better resolution

    // Style options
    private canvas: HTMLCanvasElement;
    private tensorCanvas: DefaultCanvasWrapper;
    private _style: Style;
    private colourScheme: string = "Default";
    private zoomBuildings: boolean = false;
    private buildingModels: boolean = false;
    private showFrame: boolean = false;

    // State variables
    private previousFrameDrawTensor = true;
    private cameraX = 0;
    private cameraY = 0;
    private firstGenerate = true;
    private modelGenerator: ModelGenerator | undefined;

    /**
     * Constructs the `Main` class and initializes the GUI, canvas, and event listeners.
     */
    constructor() {
        // --- GLOBAL DEDUPLICATION: DESTROY PREVIOUS GUI/ANIMATION ---
        if (window.__cityGenGuiInstance__) {
            window.__cityGenGuiInstance__.destroy();
        }
        if (window.__cityGenAnimationFrameId__ !== undefined) {
            cancelAnimationFrame(window.__cityGenAnimationFrameId__);
        }
        // --- END DEDUPLICATION ---

        // Setup the main GUI
        this.gui = new dat.GUI({ width: 300 });
        window.__cityGenGuiInstance__ = this.gui; // Track globally for deduplication

        const zoomController = this.gui.add(this.domainController, 'zoom');
        this.domainController.setZoomUpdate(() => zoomController.updateDisplay());
        this.gui.add(this, 'generate');

        // Create folders for the GUI controls
        this.tensorFolder = this.gui.addFolder('Tensor Field');
        this.roadsFolder = this.gui.addFolder('Map');
        this.styleFolder = this.gui.addFolder('Style');
        this.optionsFolder = this.gui.addFolder('Options');
        this.downloadsFolder = this.gui.addFolder('Download');

        // Canvas setup
        this.canvas = document.getElementById(Util.CANVAS_ID) as HTMLCanvasElement;
        this.tensorCanvas = new DefaultCanvasWrapper(this.canvas);

        // Adjust zoom for large screen resolutions
        const screenWidth = this.domainController.screenDimensions.x;
        if (screenWidth > Main.STARTING_WIDTH) {
            this.domainController.zoom = screenWidth / Main.STARTING_WIDTH;
        }

        // Configure style controls
        this.setupStyleControls();

        // Setup tensor field and main GUI
        const noiseParamsPlaceholder: NoiseParams = {
            globalNoise: false,
            noiseSizePark: 20,
            noiseAnglePark: 90,
            noiseSizeGlobal: 30,
            noiseAngleGlobal: 20,
        };
        this.tensorField = new TensorFieldGUI(this.tensorFolder, this.dragController, true, noiseParamsPlaceholder);
        this.mainGui = new MainGUI(this.roadsFolder, this.tensorField, () => this.tensorFolder.close());

        // Configure options and download controls
        this.setupOptionsAndDownloads();

        // Initialize settings
        this.changeColourScheme(this.colourScheme);
        this.tensorField.setRecommended();

        // --- GLOBAL DEDUPLICATION: TRACK ANIMATION FRAME ---
        window.__cityGenAnimationFrameId__ = requestAnimationFrame(() => this.update());
        // --- END DEDUPLICATION ---
    }

    /**
     * Configures style-related controls in the GUI.
     */
    private setupStyleControls(): void {
        this.styleFolder.add(this, 'colourScheme' as any).onChange((val: string) => {
            try {
                this.changeColourScheme(val);
            } catch (error) {
                console.error('Error changing colour scheme:', error);
            }
        });

        this.styleFolder.add(this, 'zoomBuildings' as any).onChange((val: boolean) => {
            try {
                this.previousFrameDrawTensor = true;
                this._style.zoomBuildings = val;
            } catch (error) {
                console.error('Error updating zoom buildings:', error);
            }
        });

        this.styleFolder.add(this, 'buildingModels' as any).onChange((val: boolean) => {
            try {
                this.previousFrameDrawTensor = true;
                this._style.showBuildingModels = val;
            } catch (error) {
                console.error('Error updating building models:', error);
            }
        });

        this.styleFolder.add(this, 'showFrame' as any).onChange((val: boolean) => {
            try {
                this.previousFrameDrawTensor = true;
                this._style.showFrame = val;
            } catch (error) {
                console.error('Error updating show frame:', error);
            }
        });

        this.styleFolder.add(this, 'cameraX' as any, -15, 15).step(1).onChange(() => {
            try {
                this.setCameraDirection();
            } catch (error) {
                console.error('Error setting camera direction for X:', error);
            }
        });

        this.styleFolder.add(this, 'cameraY' as any, -15, 15).step(1).onChange(() => {
            try {
                this.setCameraDirection();
            } catch (error) {
                console.error('Error setting camera direction for Y:', error);
            }
        });
    }

    /**
     * Configures options and download-related controls in the GUI.
     */
    private setupOptionsAndDownloads(): void {
        this.optionsFolder.add(this.tensorField, 'drawCentre');
        this.optionsFolder.add(this, 'highDPI').onChange((high: boolean) => this.changeCanvasScale(high));
        this.downloadsFolder.add({ "PNG": () => this.downloadPng() }, 'PNG');
        this.downloadsFolder.add({ "SVG": () => this.downloadSVG() }, 'SVG');
        this.downloadsFolder.add({ "STL": () => this.downloadSTL() }, 'STL');
        this.downloadsFolder.add({ "Heightmap": () => this.downloadHeightmap() }, 'Heightmap');
    }

    /**
     * Generates the entire map by invoking the necessary components.
     */
    generate(): void {
        if (!this.firstGenerate) {
            this.tensorField.setRecommended();
        } else {
            this.firstGenerate = false;
        }
        this.mainGui.generateEverything();
    }

    /**
     * Changes the color scheme of the map.
     * @param scheme - The name of the color scheme to apply.
     */
    changeColourScheme(scheme: string): void {
        const colourScheme: ColourScheme = (ColourSchemes as any)[scheme];
        this.zoomBuildings = colourScheme.zoomBuildings;
        this.buildingModels = colourScheme.buildingModels;
        Util.updateGui(this.styleFolder);
        if (scheme.startsWith("Drawn")) {
            this._style = new RoughStyle(this.canvas, this.dragController, { ...colourScheme });
        } else {
            this._style = new DefaultStyle(this.canvas, this.dragController, { ...colourScheme }, scheme.startsWith("Heightmap"));
        }
        this._style.showFrame = this.showFrame;
        this.changeCanvasScale(this.highDPI);
    }

    /**
     * Adjusts the resolution of the canvas for high DPI displays.
     * @param high - Whether to enable high DPI scaling.
     */
    changeCanvasScale(high: boolean): void {
        const value = high ? 2 : 1;
        this._style.canvasScale = value;
        this.tensorCanvas.canvasScale = value;
    }

    /**
     * Updates the camera direction for pseudo-3D building rendering.
     */
    setCameraDirection(): void {
        this.domainController.cameraDirection = new Vector(this.cameraX / 10, this.cameraY / 10);
    }

    // File download implementations (PNG, SVG, STL, Heightmap)
    downloadPng(): void {
        console.log("Downloading PNG...");
        // Implement logic for downloading a PNG file
    }
    downloadSVG(): void {
        console.log("Downloading SVG...");
        // Implement logic for downloading an SVG file
    }
    downloadHeightmap(): void {
        console.log("Downloading Heightmap...");
        // Implement logic for downloading a heightmap
    }
    downloadSTL(): void {
        console.log("Downloading STL...");
        const stlData = `
            solid city_model
            facet normal 0 0 0
                outer loop
                    vertex 0 0 0
                    vertex 1 0 0
                    vertex 0 1 0
                endloop
            endfacet
            endsolid city_model
        `;
        const blob = new Blob([stlData], { type: 'model/stl' });
        saveAs(blob, 'city_model.stl');
    }

    /**
     * Updates the application state and redraws the canvas.
     */
    update(): void {
        if (this.modelGenerator) {
            let continueUpdate = true;
            const start = performance.now();
            while (continueUpdate && performance.now() - start < 100) {
                continueUpdate = this.modelGenerator.update();
            }
        }
        this._style.update();
        this.mainGui.update();
        this.draw();
        window.__cityGenAnimationFrameId__ = requestAnimationFrame(this.update.bind(this));
    }

    draw(): void {
        // Implement drawing logic
    }
}

// --- GLOBAL SINGLETON ENTRYPOINT ---
(window as any).log = log;
window.addEventListener('load', (): void => {
    // DEDUPLICATE: Destroy previous Main instance if present
    if (window.__cityGenMainInstance__) {
        if (window.__cityGenGuiInstance__) window.__cityGenGuiInstance__.destroy();
        if (window.__cityGenAnimationFrameId__ !== undefined) {
            cancelAnimationFrame(window.__cityGenAnimationFrameId__);
        }
        // Optionally: Call a destroy/cleanup method if you add one to Main
    }
    window.__cityGenMainInstance__ = new Main();
});
