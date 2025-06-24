export default class SmartCityStateManager {
    constructor() {
        this.state = {
            population: 50000,
            sensorCoverage: 0.5,
            connectivity: 0.6,
            aiServices: 0.4,
            trafficFlow: 0.5,
            pollution: 0.3
        };
    }
    update(action) {
        if (action === 0) this.state.sensorCoverage = Math.min(1, this.state.sensorCoverage + 0.03);
        if (action === 1) this.state.connectivity = Math.min(1, this.state.connectivity + 0.02);
        if (action === 2) this.state.aiServices = Math.min(1, this.state.aiServices + 0.02);
    }
    getStateArray() {
        const s = this.state;
        return [
            s.population / 100000,
            s.sensorCoverage,
            s.connectivity,
            s.aiServices,
            s.trafficFlow,
            s.pollution
        ];
    }
}
