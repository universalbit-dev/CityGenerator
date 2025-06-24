export default class CivicEcosystemManager {
    constructor() {
        this.state = {
            population: 50000,
            citizenEngagement: 0.3,
            openData: 0.4,
            businessDensity: 0.5,
            resourceFlow: 0.4,
            feedbackLoops: 0.2
        };
    }
    update(action) {
        if (action === 0) this.state.citizenEngagement = Math.min(1, this.state.citizenEngagement + 0.02);
        if (action === 1) this.state.openData = Math.min(1, this.state.openData + 0.01);
        if (action === 2) this.state.businessDensity = Math.min(1, this.state.businessDensity + 0.03);
    }
    getStateArray() {
        const s = this.state;
        return [
            s.population / 100000,
            s.citizenEngagement,
            s.openData,
            s.businessDensity,
            s.resourceFlow,
            s.feedbackLoops
        ];
    }
}
