export default class PermacultureDesignManager {
    constructor() {
        this.modelName = 'Permaculture Design';
        this.modelTip  = '\u{1F331} Learn regenerative city planning and permaculture for a resilient urban future.';
        this.state = {
            biodiversity:       0.5,
            soilHealth:         0.5,
            waterRetention:     0.4,
            energyEfficiency:   0.4,
            yield:              0.3,
            communityKnowledge: 0.5
        };
    }
    update(action) {
        if (action === 0) this.state.biodiversity       = Math.min(1, this.state.biodiversity       + 0.02);
        if (action === 1) this.state.soilHealth         = Math.min(1, this.state.soilHealth         + 0.02);
        if (action === 2) this.state.waterRetention     = Math.min(1, this.state.waterRetention     + 0.02);
        if (action === 3) this.state.energyEfficiency   = Math.min(1, this.state.energyEfficiency   + 0.02);
        if (action === 4) this.state.yield              = Math.min(1, this.state.yield              + 0.02);
        if (action === 5) this.state.communityKnowledge = Math.min(1, this.state.communityKnowledge + 0.02);
    }
    getStateArray() {
        const s = this.state;
        return [s.biodiversity, s.soilHealth, s.waterRetention,
                s.energyEfficiency, s.yield, s.communityKnowledge];
    }
}
