import { ModuleFederationPlugin } from "webpack";
export let entry: string;
export let mode: string;
export let plugins: ModuleFederationPlugin[];
export let devtool: string;
export namespace module {
    let rules: {
        test: RegExp;
        use: string;
        exclude: RegExp;
    }[];
}
export namespace resolve {
    let extensions: string[];
}
export namespace output {
    let filename: string;
    let path: string;
}
