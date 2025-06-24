export default class ResilientCityModelManager {
    constructor() {
        this.state = {
            population: 50000,
            redundancy: 0.4,
            diversity: 0.5,
            crisisReadiness: 0.3,
            recoverySpeed: 0.4,
            communitySupport: 0.5
        };
    }
    update(action) {
        if (action === 0) this.state.redundancy = Math.min(1, this.state.redundancy + 0.02);
        if (action === 1) this.state.diversity = Math.min(1, this.state.diversity + 0.02);
        if (action === 2) this.state.crisisReadiness = Math.min(1, this.state.crisisReadiness + 0.02);
    }
    getStateArray() {
        const s = this.state;
        return [
            s.population / 100000,
            s.redundancy,
            s.diversity,
            s.crisisReadiness,
            s.recoverySpeed,
            s.communitySupport
        ];
    }
}
