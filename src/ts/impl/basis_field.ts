import Tensor from './tensor';
import Vector from '../vector';

export const enum FIELD_TYPE {
    Radial,
    Grid,
};

/**
 * Grid or Radial field to be combined with others to create the tensor field
 */
export abstract class BasisField {
    abstract readonly FOLDER_NAME: string;
    abstract readonly FIELD_TYPE: number;
    protected static folderNameIndex: number = 0;
    protected parentFolder: dat.GUI;
    protected folder: dat.GUI;
    protected _centre: Vector;

    // --- Make size and decay public for dat.GUI (fixes dat.GUI binding errors) ---
    public size: number;
    public decay: number;

    constructor(centre: Vector, size: number, decay: number) {
        this._centre = centre.clone();
        this.size = size;
        this.decay = decay;
    }

    set centre(centre: Vector) {
        this._centre.copy(centre);
    }

    get centre(): Vector {
        return this._centre.clone();
    }

    set decayValue(value: number) {
        this.decay = value;
    }

    set sizeValue(value: number) {
        this.size = value;
    }

    dragStartListener(): void {
        this.setFolder();
    }

    dragMoveListener(delta: Vector): void {
        // Delta assumed to be in world space (only relevant when zoomed)
        this._centre.add(delta);
    }

    abstract getTensor(point: Vector): Tensor;

    getWeightedTensor(point: Vector, smooth: boolean): Tensor {
        return this.getTensor(point).scale(this.getTensorWeight(point, smooth));
    }

    setFolder(): void {
        if (this.parentFolder?.__folders) {
            for (const folderName in this.parentFolder.__folders) {
                this.parentFolder.__folders[folderName].close();
            }
            this.folder.open();
        }
    }

    removeFolderFromParent(): void {
        if (this.parentFolder?.__folders && Object.values(this.parentFolder.__folders).indexOf(this.folder) >= 0) {
            this.parentFolder.removeFolder(this.folder);
        }
    }

    /**
     * Creates a folder and adds it to the GUI to control params
     * Only bind to public properties!
     */
    setGui(parent: dat.GUI, folder: dat.GUI): void {
        this.parentFolder = parent;
        this.folder = folder;
        folder.add(this._centre, 'x');
        folder.add(this._centre, 'y');
        folder.add(this, 'size');
        folder.add(this, 'decay', -50, 50);
    }

    /**
     * Interpolates between (0 and 1)^decay
     */
    protected getTensorWeight(point: Vector, smooth: boolean): number {
        const normDistanceToCentre = point.clone().sub(this._centre).length() / this.size;
        if (smooth) {
            return normDistanceToCentre ** -this.decay;
        }
        // Stop (** 0) turning weight into 1, filling screen even when outside 'size'
        if (this.decay === 0 && normDistanceToCentre >= 1) {
            return 0;
        }
        return Math.max(0, (1 - normDistanceToCentre)) ** this.decay;
    }
}

export class Grid extends BasisField {
    readonly FOLDER_NAME = `Grid ${Grid.folderNameIndex++}`;
    readonly FIELD_TYPE = FIELD_TYPE.Grid;

    private _theta: number;

    constructor(centre: Vector, size: number, decay: number, theta: number) {
        super(centre, size, decay);
        this._theta = theta;
    }

    set theta(theta: number) {
        this._theta = theta;
    }

    setGui(parent: dat.GUI, folder: dat.GUI): void {
        super.setGui(parent, folder);

        // GUI in degrees, convert to rads
        const thetaProp = {theta: this._theta * 180 / Math.PI};
        const thetaController = folder.add(thetaProp, 'theta', -90, 90);
        thetaController.onChange(theta => this._theta = theta * (Math.PI / 180));
    }

    getTensor(point: Vector): Tensor {
        const cos = Math.cos(2 * this._theta);
        const sin = Math.sin(2 * this._theta);
        return new Tensor(1, [cos, sin]);
    }
}

export class Radial extends BasisField {
    readonly FOLDER_NAME = `Radial ${Radial.folderNameIndex++}`;
    readonly FIELD_TYPE = FIELD_TYPE.Radial;

    constructor(centre: Vector, size: number, decay: number) {
        super(centre, size, decay);
    }

    getTensor(point: Vector): Tensor {
        const t = point.clone().sub(this._centre);
        const t1 = t.y ** 2 - t.x ** 2;
        const t2 = -2 * t.x * t.y;
        return new Tensor(1, [t1, t2]);
    }
}
