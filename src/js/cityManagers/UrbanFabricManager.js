export default class UrbanFabricManager {
    constructor() {
        this.modelName = 'Urban Fabric';
        this.modelTip  = '\u{1F3D7}\ufe0f Invest in roads, power grid & green space to grow the city fabric.';
        this.state = {
            population: 50000,
            roadNetwork: 0.4,
            powerGrid: 0.6,
            dataConnectivity: 0.5,
            logisticsEfficiency: 0.45,
            greenSpace: 0.2
        };
    }
    update(action) {
        if (action === 0) this.state.roadNetwork = Math.min(1, this.state.roadNetwork + 0.02);
        if (action === 1) this.state.greenSpace  = Math.min(1, this.state.greenSpace  + 0.01);
        if (action === 2) this.state.powerGrid   = Math.min(1, this.state.powerGrid   + 0.03);
    }
    getStateArray() {
        const s = this.state;
        return [
            s.population / 100000,
            s.roadNetwork,
            s.powerGrid,
            s.dataConnectivity,
            s.logisticsEfficiency,
            s.greenSpace
        ];
    }
}
