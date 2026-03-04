export default class ResilientCityModelManager {
    constructor(options = {}) {
        this.modelName = 'Resilient City';
        this.modelTip  = '\u{1F9BE} Build redundancy, diversity & crisis readiness for a resilient city.';

        this.MAX_POPULATION = typeof options.maxPopulation === 'number' ? options.maxPopulation : 100000;
        const defaults = {
            population: 50000,
            redundancy: 0.4,
            diversity: 0.5,
            crisisReadiness: 0.3,
            recoverySpeed: 0.4,
            communitySupport: 0.5
        };
        this.state    = Object.assign({}, defaults, options.initialState || {});
        this.onUpdate = typeof options.onUpdate === 'function' ? options.onUpdate : null;
    }

    static get ACTIONS() {
        return {
            REDUNDANCY: 0, DIVERSITY: 1, CRISIS_READINESS: 2,
            RECOVERY_SPEED: 3, COMMUNITY_SUPPORT: 4, POPULATION: 5
        };
    }

    _clamp(value, min = 0, max = 1) {
        if (Number.isNaN(value) || !isFinite(value)) return min;
        return Math.max(min, Math.min(max, value));
    }

    update(action, delta) {
        const A = ResilientCityModelManager.ACTIONS;
        const d = typeof delta === 'number' ? delta : 0.02;
        if      (action === A.REDUNDANCY)       this.state.redundancy       = this._clamp(this.state.redundancy       + d);
        else if (action === A.DIVERSITY)        this.state.diversity        = this._clamp(this.state.diversity        + d);
        else if (action === A.CRISIS_READINESS) this.state.crisisReadiness  = this._clamp(this.state.crisisReadiness  + d);
        else if (action === A.RECOVERY_SPEED)   this.state.recoverySpeed    = this._clamp(this.state.recoverySpeed    + d);
        else if (action === A.COMMUNITY_SUPPORT)this.state.communitySupport = this._clamp(this.state.communitySupport + d);
        else if (action === A.POPULATION)       this.state.population = Math.max(0, this.state.population + (typeof delta === 'number' ? delta : 1000));
        else return false;
        if (this.onUpdate) this.onUpdate(Object.assign({}, this.state));
        return true;
    }

    getStateArray() {
        const s = this.state;
        return [
            s.population / this.MAX_POPULATION,
            s.redundancy,
            s.diversity,
            s.crisisReadiness,
            s.recoverySpeed,
            s.communitySupport
        ];
    }
}
