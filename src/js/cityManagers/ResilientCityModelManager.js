export default class ResilientCityModelManager {
    /**
     * Create a ResilientCityModelManager
     * @param {Object} [options]
     * @param {number} [options.maxPopulation=100000] - value used to normalize population to 0..1
     * @param {Object} [options.initialState] - override initial state properties
     * @param {function(Object):void} [options.onUpdate] - optional callback called after every successful update with a cloned state
     */
    constructor(options = {}) {
        this.MAX_POPULATION = typeof options.maxPopulation === 'number' ? options.maxPopulation : 100000;

        const defaults = {
            population: 50000,
            redundancy: 0.4,
            diversity: 0.5,
            crisisReadiness: 0.3,
            recoverySpeed: 0.4,
            communitySupport: 0.5
        };

        this.state = Object.assign({}, defaults, options.initialState || {});
        this.onUpdate = typeof options.onUpdate === 'function' ? options.onUpdate : null;
    }

    // Named action constants (keeps numeric compatibility with previous code)
    static get ACTIONS() {
        return {
            REDUNDANCY: 0,
            DIVERSITY: 1,
            CRISIS_READINESS: 2,
            RECOVERY_SPEED: 3,
            COMMUNITY_SUPPORT: 4,
            POPULATION: 5
        };
    }

    // Internal helper to clamp a number to [min, max]
    _clamp(value, min = 0, max = 1) {
        if (Number.isNaN(value) || value === Infinity || value === -Infinity) return min;
        return Math.max(min, Math.min(max, value));
    }

    /**
     * Update a metric by action.
     * Backwards compatible: calling update(0) will increase redundancy by 0.02.
     * @param {number} action - one of ResilientCityModelManager.ACTIONS values (or numeric indices)
     * @param {number} [delta] - optional delta to apply. For metrics (0..4) delta is in normalized units (default +0.02).
     *                           For population (ACTION=5) delta is number of people to add/subtract (default +1000).
     * @returns {boolean} true if update applied, false if action invalid
     */
    update(action, delta) {
        const A = ResilientCityModelManager.ACTIONS;
        const defaultMetricDelta = 0.02;
        const defaultPopulationDelta = Math.round(this.MAX_POPULATION * 0.01); // default 1% of max -> 1000 for 100k

        if (action === A.REDUNDANCY) {
            const d = typeof delta === 'number' ? delta : defaultMetricDelta;
            this.state.redundancy = this._clamp(this.state.redundancy + d, 0, 1);
        } else if (action === A.DIVERSITY) {
            const d = typeof delta === 'number' ? delta : defaultMetricDelta;
            this.state.diversity = this._clamp(this.state.diversity + d, 0, 1);
        } else if (action === A.CRISIS_READINESS) {
            const d = typeof delta === 'number' ? delta : defaultMetricDelta;
            this.state.crisisReadiness = this._clamp(this.state.crisisReadiness + d, 0, 1);
        } else if (action === A.RECOVERY_SPEED) {
            const d = typeof delta === 'number' ? delta : defaultMetricDelta;
            this.state.recoverySpeed = this._clamp(this.state.recoverySpeed + d, 0, 1);
        } else if (action === A.COMMUNITY_SUPPORT) {
            const d = typeof delta === 'number' ? delta : defaultMetricDelta;
            this.state.communitySupport = this._clamp(this.state.communitySupport + d, 0, 1);
        } else if (action === A.POPULATION) {
            const d = typeof delta === 'number' ? delta : defaultPopulationDelta;
            // allow population to vary between 0 and MAX_POPULATION
            this.state.population = Math.round(this._clamp(this.state.population + d, 0, this.MAX_POPULATION));
        } else {
            // invalid action
            return false;
        }

        // notify listener with a deep copy to avoid external mutation
        if (this.onUpdate) {
            this.onUpdate(this.getStateCopy());
        }

        return true;
    }

    /**
     * Replace the whole state (merges keys) with validation/clamping.
     * @param {Object} newState
     */
    setState(newState = {}) {
        if (typeof newState !== 'object' || newState === null) return;

        if (typeof newState.population === 'number') {
            this.state.population = Math.round(this._clamp(newState.population, 0, this.MAX_POPULATION));
        }
        if (typeof newState.redundancy === 'number') {
            this.state.redundancy = this._clamp(newState.redundancy, 0, 1);
        }
        if (typeof newState.diversity === 'number') {
            this.state.diversity = this._clamp(newState.diversity, 0, 1);
        }
        if (typeof newState.crisisReadiness === 'number') {
            this.state.crisisReadiness = this._clamp(newState.crisisReadiness, 0, 1);
        }
        if (typeof newState.recoverySpeed === 'number') {
            this.state.recoverySpeed = this._clamp(newState.recoverySpeed, 0, 1);
        }
        if (typeof newState.communitySupport === 'number') {
            this.state.communitySupport = this._clamp(newState.communitySupport, 0, 1);
        }

        if (this.onUpdate) {
            this.onUpdate(this.getStateCopy());
        }
    }

    /**
     * Return a normalized state array:
     * [populationNormalized, redundancy, diversity, crisisReadiness, recoverySpeed, communitySupport]
     * populationNormalized is population / MAX_POPULATION (range 0..1).
     */
    getStateArray() {
        const s = this.state;
        return [
            this._clamp(s.population / this.MAX_POPULATION, 0, 1),
            this._clamp(s.redundancy, 0, 1),
            this._clamp(s.diversity, 0, 1),
            this._clamp(s.crisisReadiness, 0, 1),
            this._clamp(s.recoverySpeed, 0, 1),
            this._clamp(s.communitySupport, 0, 1)
        ];
    }

    /**
     * Return a shallow copy of the state object (safe to hand out)
     * @returns {Object}
     */
    getStateCopy() {
        return {
            population: this.state.population,
            redundancy: this.state.redundancy,
            diversity: this.state.diversity,
            crisisReadiness: this.state.crisisReadiness,
            recoverySpeed: this.state.recoverySpeed,
            communitySupport: this.state.communitySupport
        };
    }

    /**
     * Reset to defaults (optionally passing new defaults)
     * @param {Object} [defaults]
     */
    reset(defaults = {}) {
        this.state = Object.assign({
            population: 50000,
            redundancy: 0.4,
            diversity: 0.5,
            crisisReadiness: 0.3,
            recoverySpeed: 0.4,
            communitySupport: 0.5
        }, defaults);

        // ensure clamped/valid
        this.setState(this.state);
    }
}
