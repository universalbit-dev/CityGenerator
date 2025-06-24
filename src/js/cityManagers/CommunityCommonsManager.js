export default class CommunityCommonsManager {
    constructor() {
        this.state = {
            population: 50000,
            sharedResources: 0.3,
            publicSpaces: 0.4,
            participation: 0.5,
            localEnergy: 0.4,
            happiness: 0.6
        };
    }
    update(action) {
        if (action === 0) this.state.sharedResources = Math.min(1, this.state.sharedResources + 0.02);
        if (action === 1) this.state.publicSpaces = Math.min(1, this.state.publicSpaces + 0.02);
        if (action === 2) this.state.happiness = Math.min(1, this.state.happiness + 0.01);
    }
    getStateArray() {
        const s = this.state;
        return [
            s.population / 100000,
            s.sharedResources,
            s.publicSpaces,
            s.participation,
            s.localEnergy,
            s.happiness
        ];
    }
}
