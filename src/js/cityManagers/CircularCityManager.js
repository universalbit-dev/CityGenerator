export default class CircularCityManager {
    constructor() {
        this.state = {
            population: 50000,
            localProduction: 0.5,
            recyclingRate: 0.6,
            wasteRecovery: 0.4,
            importExportRatio: 0.3,
            renewableEnergy: 0.5
        };
    }
    update(action) {
        if (action === 0) this.state.localProduction = Math.min(1, this.state.localProduction + 0.02);
        if (action === 1) this.state.recyclingRate = Math.min(1, this.state.recyclingRate + 0.02);
        if (action === 2) this.state.renewableEnergy = Math.min(1, this.state.renewableEnergy + 0.02);
    }
    getStateArray() {
        const s = this.state;
        return [
            s.population / 100000,
            s.localProduction,
            s.recyclingRate,
            s.wasteRecovery,
            s.importExportRatio,
            s.renewableEnergy
        ];
    }
}
