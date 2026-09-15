import * as log from 'loglevel';
import { DefaultCanvasWrapper } from './canvas_wrapper';
import DomainController from './domain_controller';
import DragController from './drag_controller';
import TensorField from '../impl/tensor_field';
import { NoiseParams } from '../impl/tensor_field';
import { BasisField, FIELD_TYPE } from '../impl/basis_field';
import Util from '../util';
import Vector from '../vector';

/**
 * Enhanced Extension of TensorField handling interaction with dat.GUI,
 * optimized cross-location caching, and robust lifecycle cleanup.
 */
export default class TensorFieldGUI extends TensorField {
    private TENSOR_LINE_DIAMETER = 20;
    private TENSOR_SPAWN_SCALE = 0.7; // How much to shrink worldDimensions to find spawn point
    private domainController = DomainController.getInstance();

    // Cache for cross locations to optimize frame-rate rendering performance
    private cachedCrossLocations: Vector[] = [];
    private lastZoom = -1;
    private lastWorldDimensions = new Vector(-1, -1);
    private lastOrigin = new Vector(-1, -1);

    // Explicit tracker for clean GUI folder and drag controller teardowns
    private cleanupCallbacks: Map<BasisField, () => void> = new Map();

    constructor(
        private guiFolder: dat.GUI,
        private dragController: DragController,
        public drawCentre: boolean,
        noiseParams: NoiseParams
    ) {
        super(noiseParams);

        const tensorFieldGuiObj = {
            reset: (): void => this.reset(),
            setRecommended: (): void => this.setRecommended(),
            addRadial: (): void => this.addRadialRandom(),
            addGrid: (): void => this.addGridRandom(),
        };

        this.guiFolder.add(tensorFieldGuiObj, 'reset').name('Reset Field');
        this.guiFolder.add(this, 'smooth').name('Smooth Tensor Field');
        this.guiFolder.add(tensorFieldGuiObj, 'setRecommended').name('Load Recommended');
        this.guiFolder.add(tensorFieldGuiObj, 'addRadial').name('Add Random Radial');
        this.guiFolder.add(tensorFieldGuiObj, 'addGrid').name('Add Random Grid');
    }

    /**
     * Sets a recommended multi-grid and radial tensor layout.
     */
    setRecommended(): void {
        this.reset();
        const size = this.domainController.worldDimensions.multiplyScalar(this.TENSOR_SPAWN_SCALE);
        const newOrigin = this.domainController.worldDimensions
            .multiplyScalar((1 - this.TENSOR_SPAWN_SCALE) / 2)
            .add(this.domainController.origin);

        this.addGridAtLocation(newOrigin);
        this.addGridAtLocation(newOrigin.clone().add(size));
        this.addGridAtLocation(newOrigin.clone().add(new Vector(size.x, 0)));
        this.addGridAtLocation(newOrigin.clone().add(new Vector(0, size.y)));
        this.addRadialRandom();
    }

    addRadialRandom(): void {
        const width = this.domainController.worldDimensions.x;
        this.addRadial(
            this.randomLocation(),
            Util.randomRange(width / 10, width / 5), // Size
            Util.randomRange(50)                    // Decay
        );
    }

    addGridRandom(): void {
        this.addGridAtLocation(this.randomLocation());
    }

    private addGridAtLocation(location: Vector): void {
        const width = this.domainController.worldDimensions.x;
        this.addGrid(
            location,
            Util.randomRange(width / 4, width), // Size
            Util.randomRange(50),               // Decay
            Util.randomRange(Math.PI / 2)       // Rotation angle
        );
    }

    /**
     * Samples a world-space random location within a shrunken bounding box.
     */
    private randomLocation(): Vector {
        const size = this.domainController.worldDimensions.multiplyScalar(this.TENSOR_SPAWN_SCALE);
        const location = new Vector(Math.random(), Math.random()).multiply(size);
        const newOrigin = this.domainController.worldDimensions.multiplyScalar((1 - this.TENSOR_SPAWN_SCALE) / 2);
        return location.add(this.domainController.origin).add(newOrigin);
    }

    /**
     * Gets or caches the grid of points for vector field visualization in world space.
     */
    private getCrossLocations(): Vector[] {
        const zoom = this.domainController.zoom;
        const dims = this.domainController.worldDimensions;
        const origin = this.domainController.origin;

        // Return cached points if canvas viewport attributes haven't shifted
        if (
            this.lastZoom === zoom &&
            this.lastWorldDimensions.x === dims.x &&
            this.lastWorldDimensions.y === dims.y &&
            this.lastOrigin.x === origin.x &&
            this.lastOrigin.y === origin.y &&
            this.cachedCrossLocations.length > 0
        ) {
            return this.cachedCrossLocations;
        }

        this.lastZoom = zoom;
        this.lastWorldDimensions = dims.clone();
        this.lastOrigin = origin.clone();

        const diameter = this.TENSOR_LINE_DIAMETER / zoom;
        const nHor = Math.ceil(dims.x / diameter) + 1; // Prevent pop-in
        const nVer = Math.ceil(dims.y / diameter) + 1;
        const originX = diameter * Math.floor(origin.x / diameter);
        const originY = diameter * Math.floor(origin.y / diameter);

        const out: Vector[] = [];
        for (let x = 0; x <= nHor; x++) {
            for (let y = 0; y <= nVer; y++) {
                out.push(new Vector(originX + (x * diameter), originY + (y * diameter)));
            }
        }

        this.cachedCrossLocations = out;
        return out;
    }

    private getTensorLine(point: Vector, tensorV: Vector): Vector[] {
        const transformedPoint = this.domainController.worldToScreen(point.clone());
        const diff = tensorV.multiplyScalar(this.TENSOR_LINE_DIAMETER / 2);
        const start = transformedPoint.clone().sub(diff);
        const end = transformedPoint.clone().add(diff);
        return [start, end];
    }

    draw(canvas: DefaultCanvasWrapper): void {
        canvas.setFillStyle('black');
        canvas.clearCanvas();

        canvas.setStrokeStyle('white');
        canvas.setLineWidth(1);

        const tensorPoints = this.getCrossLocations();
        tensorPoints.forEach(p => {
            const t = this.samplePoint(p);
            canvas.drawPolyline(this.getTensorLine(p, t.getMajor()));
            canvas.drawPolyline(this.getTensorLine(p, t.getMinor()));
        });

        // Draw centre points of fields
        if (this.drawCentre) {
            canvas.setFillStyle('red');
            this.getBasisFields().forEach(field =>
                field.FIELD_TYPE === FIELD_TYPE.Grid
                    ? canvas.drawSquare(this.domainController.worldToScreen(field.centre), 7)
                    : canvas.drawCircle(this.domainController.worldToScreen(field.centre), 7)
            );
        }
    }

    protected addField(field: BasisField): void {
        super.addField(field);
        const folder = this.guiFolder.addFolder(field.FOLDER_NAME);

        const deregisterDrag = this.dragController.register(
            () => field.centre,
            field.dragMoveListener.bind(field),
            field.dragStartListener.bind(field)
        );

        const removeFieldObj = {
            remove: (): void => this.removeFieldGUI(field, deregisterDrag),
        };

        folder.add(removeFieldObj, 'remove').name('Remove Field');
        field.setGui(this.guiFolder, folder);

        // Register robust cleanup handler for state resets
        this.cleanupCallbacks.set(field, () => {
            deregisterDrag();
            field.removeFolderFromParent();
        });
    }

    private removeFieldGUI(field: BasisField, deregisterDrag: () => void): void {
        super.removeField(field);
        this.cleanupCallbacks.delete(field);
        deregisterDrag();
        field.removeFolderFromParent();
    }

    reset(): void {
        // Execute clean teardown on all active basis fields and GUI folders
        for (const [field, cleanup] of this.cleanupCallbacks.entries()) {
            super.removeField(field);
            cleanup();
        }
        this.cleanupCallbacks.clear();

        super.reset();
        log.info('TensorFieldGUI state successfully reset.');
    }
}
