/**
 * Represents a range of random numbers.
 */
export interface RandomRange {
    min?: number;
    max: number;
}

/**
 * Utility class containing helper methods and constants.
 */
export default class Util {
    static readonly CANVAS_ID = 'map-canvas';
    static readonly IMG_CANVAS_ID = 'img-canvas';
    static readonly SVG_ID = 'map-svg';
    static readonly DRAW_INFLATE_AMOUNT = 1.2;

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

    static removeAllFolders(gui: dat.GUI): void {
        if (gui.__folders) {
            for (const folderName in gui.__folders) {
                gui.removeFolder(gui.__folders[folderName]);
            }
        }
    }

    static randomRange(max: number, min = 0): number {
        return (Math.random() * (max - min)) + min;
    }

    // --- CSS Color Parser Section ---

    private static kCSSColorTable: { [key: string]: number[] } = {
        // Most common CSS color keywords
        "transparent": [0, 0, 0, 0], "aliceblue": [240, 248, 255, 1], "antiquewhite": [250, 235, 215, 1],
        "aqua": [0, 255, 255, 1], "black": [0, 0, 0, 1], "blue": [0, 0, 255, 1], "fuchsia": [255, 0, 255, 1],
        "gray": [128, 128, 128, 1], "green": [0, 128, 0, 1], "lime": [0, 255, 0, 1], "maroon": [128, 0, 0, 1],
        "navy": [0, 0, 128, 1], "olive": [128, 128, 0, 1], "purple": [128, 0, 128, 1], "red": [255, 0, 0, 1],
        "silver": [192, 192, 192, 1], "teal": [0, 128, 128, 1], "white": [255, 255, 255, 1], "yellow": [255, 255, 0, 1],
        // Add more as needed
    };

    private static clamp_css_byte(i: number): number {
        i = Math.round(i);
        return i < 0 ? 0 : i > 255 ? 255 : i;
    }

    private static clamp_css_float(f: number): number {
        return f < 0 ? 0 : f > 1 ? 1 : f;
    }

    private static parse_css_int(str: string): number {
        if (str.endsWith('%')) {
            return Util.clamp_css_byte(parseFloat(str) / 100 * 255);
        }
        return Util.clamp_css_byte(parseInt(str, 10));
    }

    private static parse_css_float(str: string): number {
        if (str.endsWith('%')) {
            return Util.clamp_css_float(parseFloat(str) / 100);
        }
        return Util.clamp_css_float(parseFloat(str));
    }

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
     * Returns [R, G, B] for legacy compatibility (as your code expects).
     * Always returns a valid RGB array (never null).
     */
    static parseCSSColor(css_str: string): number[] {
        if (!css_str || typeof css_str !== "string") return [128, 128, 128];
        let str = css_str.replace(/ /g, '').toLowerCase();

        // Color keyword lookup
        if (str in Util.kCSSColorTable) return Util.kCSSColorTable[str].slice(0, 3);

        // Hex color parsing
        if (str[0] === '#') {
            let hex = str.substring(1);
            if (hex.length === 3) {
                hex = hex.split('').map(c => c + c).join('');
            }
            if (hex.length === 6) {
                return [
                    parseInt(hex.substring(0, 2), 16),
                    parseInt(hex.substring(2, 4), 16),
                    parseInt(hex.substring(4, 6), 16)
                ];
            }
        }

        // rgb(), rgba()
        const rgbMatch = str.match(/^rgba?\(([^)]+)\)$/);
        if (rgbMatch) {
            const parts = rgbMatch[1].split(',').map(x => Util.parse_css_int(x.trim()));
            return parts.slice(0, 3);
        }

        // hsl(), hsla()
        const hslMatch = str.match(/^hsla?\(([^)]+)\)$/);
        if (hslMatch) {
            let parts = hslMatch[1].split(',').map(x => x.trim());
            let h = parseFloat(parts[0]) / 360;
            let s = Util.parse_css_float(parts[1]);
            let l = Util.parse_css_float(parts[2]);
            let m2 = l <= 0.5 ? l * (s + 1) : l + s - l * s;
            let m1 = l * 2 - m2;
            let r = Util.clamp_css_byte(Util.css_hue_to_rgb(m1, m2, h + 1 / 3) * 255);
            let g = Util.clamp_css_byte(Util.css_hue_to_rgb(m1, m2, h) * 255);
            let b = Util.clamp_css_byte(Util.css_hue_to_rgb(m1, m2, h - 1 / 3) * 255);
            return [r, g, b];
        }

        // Named color (fallback via canvas)
        try {
            let ctx = document.createElement("canvas").getContext("2d");
            if (ctx) {
                ctx.fillStyle = css_str;
                let computed = ctx.fillStyle;
                if (computed && computed[0] === '#') {
                    let hex = computed.substring(1);
                    if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
                    if (hex.length === 6) {
                        return [
                            parseInt(hex.substring(0, 2), 16),
                            parseInt(hex.substring(2, 4), 16),
                            parseInt(hex.substring(4, 6), 16)
                        ];
                    }
                }
            }
        } catch (err) {
            // ignore
        }

        // Fallback and log warning
        console.warn("parseCSSColor could not parse:", css_str);
        return [128, 128, 128];
    }
}
