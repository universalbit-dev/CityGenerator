import * as log from 'loglevel';
import * as dat from 'dat.gui';
import TensorFieldGUI from './ts/ui/tensor_field_gui';
import { NoiseParams } from './ts/impl/tensor_field';
import MainGUI from './ts/ui/main_gui';
import { DefaultCanvasWrapper } from './ts/ui/canvas_wrapper';
import Util from './ts/util';
import DragController from './ts/ui/drag_controller';
import DomainController from './ts/ui/domain_controller';
import Style from './ts/ui/style';
import { ColourScheme, DefaultStyle, RoughStyle } from './ts/ui/style';
import Vector from './ts/vector';
import ModelGenerator from './ts/model_generator';
import { saveAs } from 'file-saver';

// --- Use default colour scheme, no JSON ---
const DEFAULT_COLOUR_SCHEME: ColourScheme = {
    bgColour: "#ece5db",
    bgColourIn: "#ece5db",
    buildingColour: "#ece5db",
    buildingStroke: "#ece5db",
    seaColour: "#0055aa",
    grassColour: "#ece5db",
    minorRoadColour: "#666",
    minorRoadOutline: "#666",
    majorRoadColour: "#f8f8f8",
    majorRoadOutline: "#020202",
    mainRoadColour: "#f8f8f8",
    mainRoadOutline: "#020202",
    outlineSize: 1,
    minorWidth: 2,
    majorWidth: 4,
    mainWidth: 5,
    zoomBuildings: false,
    buildingModels: false,
    frameColour: "#ece5db",
    frameTextColour: "#020202",
};

declare global {
    interface Window {
        __cityGenMainInstance__?: Main;
        __cityGenGuiInstance__?: dat.GUI;
        log?: typeof log;
        __cityGenAnimationFrameId__?: number;
    }
}

/**
 * Main entry point for CityGenerator.
 */
class Main {
    private static readonly STARTING_WIDTH = 1440;
    private tensorFolder: dat.GUI;
    private roadsFolder: dat.GUI;
    private styleFolder: dat.GUI;
    private optionsFolder: dat.GUI;
    private downloadsFolder: dat.GUI;

    private domainController = DomainController.getInstance();
    private gui: dat.GUI;
    private dragController: DragController;
    private tensorField: TensorFieldGUI;
    private mainGui: MainGUI;

    private imageScale = 3;
    public highDPI = false;

    private canvas: HTMLCanvasElement;
    private tensorCanvas: DefaultCanvasWrapper;
    private _style: Style;
    public colourScheme: string = "Default";
    public zoomBuildings: boolean = DEFAULT_COLOUR_SCHEME.zoomBuildings ?? false;
    public buildingModels: boolean = DEFAULT_COLOUR_SCHEME.buildingModels ?? false;
    public showFrame: boolean = false;

    private previousFrameDrawTensor = true;
    public cameraX = 0;
    public cameraY = 0;
    private firstGenerate = true;
    private modelGenerator: ModelGenerator | undefined;
    
    showTensorField(): boolean {
    // Change this logic based on your app's needs.
    // For now, always show city map (returns false).
    return false;
}

    constructor() {
        // --- Deduplication: Destroy previous ---
        if (window.__cityGenGuiInstance__) window.__cityGenGuiInstance__.destroy();
        if (window.__cityGenAnimationFrameId__ !== undefined) cancelAnimationFrame(window.__cityGenAnimationFrameId__);
        this.gui = new dat.GUI({ width: 300 });
        window.__cityGenGuiInstance__ = this.gui;

        // Set up folders
        this.tensorFolder = this.gui.addFolder('Tensor Field');
        this.roadsFolder = this.gui.addFolder('Map');
        this.styleFolder = this.gui.addFolder('Style');
        this.optionsFolder = this.gui.addFolder('Options');
        this.downloadsFolder = this.gui.addFolder('Download');

        // Canvas setup
        this.canvas = document.getElementById(Util.CANVAS_ID) as HTMLCanvasElement;
        this.tensorCanvas = new DefaultCanvasWrapper(this.canvas);

        // Adjust zoom for large screens
        const screenWidth = this.domainController.screenDimensions.x;
        if (screenWidth > Main.STARTING_WIDTH) {
            this.domainController.zoom = screenWidth / Main.STARTING_WIDTH;
        }

        // --- Style and core object initialization FIRST ---
        this.changeColourScheme(this.colourScheme);

        // Tensor field and main GUI (must come after style is initialized)
        const noiseParamsPlaceholder: NoiseParams = {
            globalNoise: false,
            noiseSizePark: 20,
            noiseAnglePark: 90,
            noiseSizeGlobal: 30,
            noiseAngleGlobal: 20,
        };
        this.dragController = new DragController(this.gui);

        // TensorFieldGUI: correct constructor and type
        this.tensorField = new TensorFieldGUI(this.tensorFolder, this.dragController, true, noiseParamsPlaceholder);
        // MainGUI expects a TensorField (TensorFieldGUI is a subclass)
        this.mainGui = new MainGUI(this.roadsFolder, this.tensorField, () => this.tensorFolder.close());

        // Now set up controls
        this.setupStyleControls();
        this.setupOptionsAndDownloads();

        // Initial settings
        this.tensorField.setRecommended();

        // Add zoom control and generate button
        const zoomController = this.gui.add(this.domainController, 'zoom');
        this.domainController.setZoomUpdate(() => zoomController.updateDisplay());
        this.gui.add(this, 'generate');

        window.__cityGenAnimationFrameId__ = requestAnimationFrame(() => this.update());
    }

    private setupStyleControls(): void {
        this.styleFolder.add(this, 'colourScheme' as any).onChange((val: string) => {
            try { this.changeColourScheme(val); }
            catch (error) { console.error('Error changing colour scheme:', error); }
        });

        this.styleFolder.add(this, 'zoomBuildings' as any).onChange((val: boolean) => {
            try {
                this.previousFrameDrawTensor = true;
                if (this._style) this._style.zoomBuildings = val;
            } catch (error) { console.error('Error updating zoom buildings:', error); }
        });

        this.styleFolder.add(this, 'buildingModels' as any).onChange((val: boolean) => {
            try {
                this.previousFrameDrawTensor = true;
                if (this._style) this._style.showBuildingModels = val;
            } catch (error) { console.error('Error updating building models:', error); }
        });

        this.styleFolder.add(this, 'showFrame' as any).onChange((val: boolean) => {
            try {
                this.previousFrameDrawTensor = true;
                if (this._style) this._style.showFrame = val;
            } catch (error) { console.error('Error updating show frame:', error); }
        });

        this.styleFolder.add(this, 'cameraX' as any, -15, 15).step(1).onChange(() => {
            try { this.setCameraDirection(); }
            catch (error) { console.error('Error setting camera direction for X:', error); }
        });
        this.styleFolder.add(this, 'cameraY' as any, -15, 15).step(1).onChange(() => {
            try { this.setCameraDirection(); }
            catch (error) { console.error('Error setting camera direction for Y:', error); }
        });
    }

    private setupOptionsAndDownloads(): void {
        // Only bind drawCentre to tensorField, not mainGui
        this.optionsFolder.add(this.tensorField, 'drawCentre');
        this.optionsFolder.add(this, 'highDPI').onChange((high: boolean) => this.changeCanvasScale(high));
        this.downloadsFolder.add({ "PNG": () => this.downloadPng() }, 'PNG');
        this.downloadsFolder.add({ "SVG": () => this.downloadSVG() }, 'SVG');
        this.downloadsFolder.add({ "STL": () => this.downloadSTL() }, 'STL');
        this.downloadsFolder.add({ "Heightmap": () => this.downloadHeightmap() }, 'Heightmap');
    }

    generate(): void {
        if (!this.firstGenerate) {
            this.tensorField.setRecommended();
        } else {
            this.firstGenerate = false;
        }
        if (this.mainGui && typeof this.mainGui.generateEverything === 'function') {
            this.mainGui.generateEverything();
        } else {
            console.error('mainGui is not initialized or generateEverything is missing.');
        }
    }

    changeColourScheme(scheme: string): void {
        // Use ONLY the default scheme
        const colourScheme: ColourScheme = DEFAULT_COLOUR_SCHEME;
        this.zoomBuildings = colourScheme.zoomBuildings ?? false;
        this.buildingModels = colourScheme.buildingModels ?? false;
        Util.updateGui(this.styleFolder);
        this._style = new DefaultStyle(this.canvas, this.dragController, { ...colourScheme }, scheme.startsWith("Heightmap"));
        this._style.showFrame = this.showFrame;
        this.changeCanvasScale(this.highDPI);
    }

    changeCanvasScale(high: boolean): void {
        const value = high ? 2 : 1;
        if (this._style) this._style.canvasScale = value;
        if (this.tensorCanvas) this.tensorCanvas.canvasScale = value;
    }

    setCameraDirection(): void {
        this.domainController.cameraDirection = new Vector(this.cameraX / 10, this.cameraY / 10);
    }

    // File download implementations (PNG, SVG, STL, Heightmap)
    downloadPng(): void { /* ... */ }
    downloadSVG(): void { /* ... */ }
    downloadHeightmap(): void { /* ... */ }
    downloadSTL(): void {
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

    update(): void {
        if (this.modelGenerator) {
            let continueUpdate = true;
            const start = performance.now();
            while (continueUpdate && performance.now() - start < 100) {
                continueUpdate = this.modelGenerator.update();
            }
        }
        if (this._style) this._style.update();
        if (this.mainGui) this.mainGui.update();
        this.draw();
        window.__cityGenAnimationFrameId__ = requestAnimationFrame(this.update.bind(this));
    }

   draw(): void {
    const isTensorField = this.showTensorField();

    // Toggle drag functionality based on mode
    this.dragController.setDragDisabled(!isTensorField);

    if (isTensorField) {
        this.previousFrameDrawTensor = true;
        this.tensorField.draw(this.tensorCanvas);
    } else {
        if (this.previousFrameDrawTensor) {
            this.previousFrameDrawTensor = false;
            // Force redraw when switching from tensor field mode
            this.mainGui.draw(this._style, true);
        } else {
            this.mainGui.draw(this._style);
        }
    }
}
}

// --- GLOBAL SINGLETON ENTRYPOINT ---
(window as any).log = log;
window.addEventListener('load', (): void => {
    if (window.__cityGenMainInstance__) {
        if (window.__cityGenGuiInstance__) window.__cityGenGuiInstance__.destroy();
        if (window.__cityGenAnimationFrameId__ !== undefined) {
            cancelAnimationFrame(window.__cityGenAnimationFrameId__);
        }
    }
    window.__cityGenMainInstance__ = new Main();
});
