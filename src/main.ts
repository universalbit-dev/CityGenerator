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

// --- Use default colour scheme ---
const DEFAULT_COLOUR_SCHEME: ColourScheme = {
    bgColour: "#f5f3ee",
    bgColourIn: "#f5f3ee",
    buildingColour: "#d9cfc3",
    buildingStroke: "#bba58d",
    seaColour: "#0055aa",
    grassColour: "#c2e59c",
    minorRoadColour: "#a0a0a0",
    minorRoadOutline: "#7a7a7a",
    majorRoadColour: "#ffd265",
    majorRoadOutline: "#b58c00",
    mainRoadColour: "#ffffff",
    mainRoadOutline: "#0055aa",
    outlineSize: 1,
    minorWidth: 2,
    majorWidth: 4,
    mainWidth: 5,
    zoomBuildings: false,
    buildingModels: true,
    frameColour: "#cccccc",
    frameTextColour: "#222222",
};

declare global {
    interface Window {
        __cityGenMainInstance__?: Main;
        __cityGenGuiInstance__?: dat.GUI;
        log?: typeof log;
        __cityGenAnimationFrameId__?: number;
    }
}

class Main {
    private static readonly STARTING_WIDTH = 1440;

    private tensorFolder: dat.GUI;
    private roadsFolder: dat.GUI;
    private styleFolder: dat.GUI;
    private optionsFolder: dat.GUI;

    private domainController = DomainController.getInstance();
    private gui: dat.GUI;
    private dragController: DragController;
    private tensorField: TensorFieldGUI;
    public mainGui: MainGUI;
    private isGenerating = false;

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
        // In this app, false means the main city map is shown.
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

        // Tensor field and main GUI
        const noiseParamsPlaceholder: NoiseParams = {
            globalNoise: false,
            noiseSizePark: 20,
            noiseAnglePark: 90,
            noiseSizeGlobal: 30,
            noiseAngleGlobal: 20,
        };
        this.dragController = new DragController(this.gui);
        this.tensorField = new TensorFieldGUI(this.tensorFolder, this.dragController, true, noiseParamsPlaceholder);
        this.mainGui = new MainGUI(this.roadsFolder, this.tensorField, () => this.tensorFolder.close());

        // Set up controls
        this.setupStyleControls();
        this.setupOptionsAndDownloads();

        // Initial settings
        this.tensorField.setRecommended();

        // Add zoom control and generate button (dat.GUI)
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
        this.optionsFolder.add(this.tensorField, 'drawCentre');
        this.optionsFolder.add(this, 'highDPI').onChange((high: boolean) => this.changeCanvasScale(high));
    }

    async triggerGeneration() {
        if (this.isGenerating) return;
        this.isGenerating = true;
        try {
            if (this.mainGui && typeof this.mainGui.generateEverything === 'function') {
                await this.mainGui.generateEverything();
            } else {
                console.error('mainGui is not initialized or generateEverything is missing.');
            }
        } finally {
            this.isGenerating = false;
        }
    }

    async generate(): Promise<void> {
        if (!this.firstGenerate) {
            this.tensorField.setRecommended();
        } else {
            this.firstGenerate = false;
        }
        await this.triggerGeneration();
    }

    changeColourScheme(scheme: string): void {
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

        this.dragController.setDragDisabled(!isTensorField);

        if (isTensorField) {
            this.previousFrameDrawTensor = true;
            this.tensorField.draw(this.tensorCanvas);
        } else {
            if (this.previousFrameDrawTensor) {
                this.previousFrameDrawTensor = false;
                this.mainGui.draw(this._style, true);
            } else {
                this.mainGui.draw(this._style);
            }
        }
    }
}

// --- GLOBAL SINGLETON ENTRYPOINT / PAGE LOAD ---
(window as any).log = log;
window.addEventListener('load', async (): Promise<void> => {
    if (window.__cityGenMainInstance__) {
        if (window.__cityGenGuiInstance__) window.__cityGenGuiInstance__.destroy();
        if (window.__cityGenAnimationFrameId__ !== undefined) {
            cancelAnimationFrame(window.__cityGenAnimationFrameId__);
        }
    }
    const mainInstance = new Main();
    window.__cityGenMainInstance__ = mainInstance;

    // Auto-generate city on load
    await mainInstance.triggerGeneration();

    // "Random City Model" button handler (if present)
    const randomBtn = document.getElementById('random-city-model-btn');
    if (randomBtn) {
        randomBtn.addEventListener('click', async () => {
            await mainInstance.triggerGeneration();
        });
    }
});
