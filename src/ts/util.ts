/**
 * Represents a range of random numbers.
 */
export interface RandomRange {
    /**
     * The minimum value of the range (optional).
     */
    min?: number;

    /**
     * The maximum value of the range.
     */
    max: number;
}

/**
 * Utility class containing helper methods and constants.
 */
export default class Util {
    /**
     * The ID of the main canvas element. This must match the styles in `style.css` and the structure in `index.html`.
     */
    static readonly CANVAS_ID = 'map-canvas';

    /**
     * The ID of the image canvas element.
     */
    static readonly IMG_CANVAS_ID = 'img-canvas';

    /**
     * The ID of the SVG element.
     */
    static readonly SVG_ID = 'map-svg';

    /**
     * The amount by which to extend streamlines beyond the screen for drawing buildings at the edges.
     */
    static readonly DRAW_INFLATE_AMOUNT = 1.2;

    /**
     * Refreshes the displayed values in the given `dat.GUI` instance.
     * 
     * @param gui - The `dat.GUI` instance to update.
     */
    static updateGui(gui: dat.GUI): void {
        if (gui.__controllers) {
            gui.__controllers.forEach(c => c.updateDisplay());
        }
        if (gui.__folders) {
            for (const folderName in gui.__folders) {
                this.updateGui(gui.__folders[folderName]);
            }
        }
    }

    /**
     * Removes all folders from the given `dat.GUI` instance.
     * 
     * @param gui - The `dat.GUI` instance to clear.
     */
    static removeAllFolders(gui: dat.GUI): void {
        if (gui.__folders) {
            for (const folderName in gui.__folders) {
                gui.removeFolder(gui.__folders[folderName]);
            }
        }
    }

    /**
     * Generates a random number between a given range.
     * 
     * @param max - The maximum value of the range.
     * @param min - The minimum value of the range (default is 0).
     * @returns A random number between `min` and `max`.
     */
    static randomRange(max: number, min = 0): number {
        return (Math.random() * (max - min)) + min;
    }

    // CSS color parser methods

    /**
     * Table mapping CSS color keywords to RGBA values.
     */
    private static kCSSColorTable: any = {
        // CSS color keywords
        "transparent": [0, 0, 0, 0], "aliceblue": [240, 248, 255, 1],
        // ...additional color definitions omitted for brevity
    };

    /**
     * Clamps an integer to the range 0..255.
     * 
     * @param i - The input integer.
     * @returns The clamped integer.
     */
    private static clamp_css_byte(i: number): number {
        i = Math.round(i);
        return i < 0 ? 0 : i > 255 ? 255 : i;
    }

    /**
     * Clamps a float to the range 0.0..1.0.
     * 
     * @param f - The input float.
     * @returns The clamped float.
     */
    private static clamp_css_float(f: number): number {
        return f < 0 ? 0 : f > 1 ? 1 : f;
    }

    /**
     * Parses an integer or percentage from a CSS string.
     * 
     * @param str - The CSS string to parse.
     * @returns The parsed integer.
     */
    private static parse_css_int(str: string): number {
        if (str[str.length - 1] === '%') {
            return Util.clamp_css_byte(parseFloat(str) / 100 * 255);
        }
        return Util.clamp_css_byte(parseInt(str));
    }

    /**
     * Parses a float or percentage from a CSS string.
     * 
     * @param str - The CSS string to parse.
     * @returns The parsed float.
     */
    private static parse_css_float(str: string): number {
        if (str[str.length - 1] === '%') {
            return Util.clamp_css_float(parseFloat(str) / 100);
        }
        return Util.clamp_css_float(parseFloat(str));
    }

    /**
     * Converts a hue to an RGB value.
     * 
     * @param m1 - The first intermediate value.
     * @param m2 - The second intermediate value.
     * @param h - The hue value.
     * @returns The RGB value.
     */
    private static css_hue_to_rgb(m1: number, m2: number, h: number) {
        if (h < 0) h += 1;
        else if (h > 1) h -= 1;

        if (h * 6 < 1) return m1 + (m2 - m1) * h * 6;
        if (h * 2 < 1) return m2;
        if (h * 3 < 2) return m1 + (m2 - m1) * (2 / 3 - h) * 6;
        return m1;
    }

    /**
     * Parses a CSS color string and returns its RGBA representation.
     * 
     * @param css_str - The CSS color string to parse.
     * @returns An array representing the RGBA color, or `null` if parsing fails.
     */
    static parseCSSColor(css_str: string): number[] {
        // Remove all whitespace and convert to lowercase.
        var str = css_str.replace(/ /g, '').toLowerCase();

        // Color keyword lookup.
        if (str in Util.kCSSColorTable) return Util.kCSSColorTable[str].slice();

        // Hex color parsing, RGB(A) and HSL(A) parsing omitted for brevity.

        return null;
    }
}
