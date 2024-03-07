export interface RandomRange {
    min?: number;
    max: number;
}
export default class Util {
    static readonly CANVAS_ID = "map-canvas";
    static readonly IMG_CANVAS_ID = "img-canvas";
    static readonly SVG_ID = "map-svg";
    static readonly DRAW_INFLATE_AMOUNT = 1.2;
    static updateGui(gui: dat.GUI): void;
    static removeAllFolders(gui: dat.GUI): void;
    static randomRange(max: number, min?: number): number;
    private static kCSSColorTable;
    private static clamp_css_byte;
    private static clamp_css_float;
    private static parse_css_int;
    private static parse_css_float;
    private static css_hue_to_rgb;
    static parseCSSColor(css_str: string): number[];
}
