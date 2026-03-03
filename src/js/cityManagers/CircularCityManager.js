/**
 * CircularCityManager.js
 *
 * Models a circular city economy with sustainability and resource cycle metrics.
 * Compatible with the CityGenerator Deep Q-Learning simulation frontend.
 *
 * Enhancements for simulator testing:
 *  - Full action set (all 5 metrics + population)
 *  - Named ACTIONS constants for readability
 *  - State decay to keep the agent active
 *  - computeReward() for DQN training loop
 *  - getStateLabels() for chart axis labelling
 *  - modelName / modelTip for index.html auto-display
 *  - reset() for "Random City Model" button
 *  - Dispatches window 'simulationModelChanged' on construction
 */

export default class CircularCityManager {

    // ── Action constants ────────────────────────────────────────────────────
    static get ACTIONS() {
        return {
            LOCAL_PRODUCTION:  0,
            RECYCLING_RATE:    1,
            RENEWABLE_ENERGY:  2,
            WASTE_RECOVERY:    3,
            IMPORT_EXPORT:     4,
            POPULATION:        5,
        };
    }

    // ── Identity (consumed by index.html polling + event listeners) ─────────
    static get modelName() { return 'Circular City'; }
    static get modelTip()  {
        return '♻️ Boost local production, recycling, and renewable energy to close the resource loop!';
    }

    // ── Constructor ─────────────────────────────────────────────────────────
    constructor(options = {}) {
        this.MAX_POPULATION = typeof options.maxPopulation === 'number'
            ? options.maxPopulation : 100000;

        // Expose on instance so index.html polling (window.manager.modelName) works
        this.modelName = CircularCityManager.modelName;
        this.modelTip  = CircularCityManager.modelTip;

        this._defaults = {
            population:       50000,
            localProduction:  0.5,
            recyclingRate:    0.6,
            wasteRecovery:    0.4,
            importExportRatio:0.3,
            renewableEnergy:  0.5,
        };

        // Per-metric decay rates (simulates entropy / city degradation)
        this._decay = {
            localProduction:   0.001,
            recyclingRate:     0.0008,
            wasteRecovery:     0.0012,
            importExportRatio: 0.0005,
            renewableEnergy:   0.001,
        };

        this.reset();
        this._emitModelChanged();
    }

    // ── Reset ───────────────────────────────────────────────────────────────
    reset() {
        this.state = Object.assign({}, this._defaults);
        this._stepCount = 0;
        return this;
    }

    // ── Update (action dispatch) ─────────────────────────────────────────────
    /**
     * Apply an action and advance the simulation by one step.
     * @param {number} action  - one of CircularCityManager.ACTIONS values
     * @param {number} [delta] - optional override delta (default varies per metric)
     * @returns {boolean} true if a valid action was applied
     */
    update(action, delta) {
        const A   = CircularCityManager.ACTIONS;
        const clamp = (v, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, v));

        let applied = true;
        switch (action) {
            case A.LOCAL_PRODUCTION:
                this.state.localProduction   = clamp(this.state.localProduction  + (delta ?? 0.02));
                break;
            case A.RECYCLING_RATE:
                this.state.recyclingRate     = clamp(this.state.recyclingRate    + (delta ?? 0.02));
                break;
            case A.RENEWABLE_ENERGY:
                this.state.renewableEnergy   = clamp(this.state.renewableEnergy  + (delta ?? 0.02));
                break;
            case A.WASTE_RECOVERY:
                this.state.wasteRecovery     = clamp(this.state.wasteRecovery    + (delta ?? 0.02));
                break;
            case A.IMPORT_EXPORT:
                // Reducing import dependency (moving ratio toward 0) is rewarded
                this.state.importExportRatio = clamp(this.state.importExportRatio - (delta ?? 0.02));
                break;
            case A.POPULATION:
                // Population grows by 1 % of max by default
                this.state.population = Math.max(0,
                    this.state.population + (delta ?? Math.round(this.MAX_POPULATION * 0.01)));
                break;
            default:
                applied = false;
        }

        // Apply passive decay to all normalised metrics each step
        this._applyDecay();
        this._stepCount++;
        return applied;
    }

    // ── Reward ───────────────────────────────────────────────────────────────
    /**
     * Compute a scalar reward in [-1, 1] suitable for the DQN backward pass.
     * Higher recycling, local production, renewable energy, and waste recovery
     * are good; high import dependency is bad.
     *
     * @returns {number}
     */
    computeReward() {
        const s = this.state;
        const positive = (s.localProduction + s.recyclingRate +
                          s.wasteRecovery   + s.renewableEnergy) / 4;
        const negative = s.importExportRatio; // high import ratio is penalised
        return parseFloat((positive - negative).toFixed(4));
    }

    // ── State array (DQN input) ───────────────────────────────────────────────
    getStateArray() {
        const s = this.state;
        return [
            s.population / this.MAX_POPULATION,
            s.localProduction,
            s.recyclingRate,
            s.wasteRecovery,
            s.importExportRatio,
            s.renewableEnergy,
        ];
    }

    // ── State labels (chart axes) ────────────────────────────────────────────
    /**
     * Human-readable labels matching the order of getStateArray().
     * Used by the Chart.js state-chart in index.html / index.js.
     * @returns {string[]}
     */
    getStateLabels() {
        return [
            'Population',
            'Local Production',
            'Recycling Rate',
            'Waste Recovery',
            'Import/Export Ratio',
            'Renewable Energy',
        ];
    }

    // ── Serialisation helpers (useful for testing / save-state) ──────────────
    toJSON() {
        return {
            modelName: this.modelName,
            stepCount: this._stepCount,
            state:     Object.assign({}, this.state),
        };
    }

    fromJSON(data = {}) {
        if (data.state) Object.assign(this.state, data.state);
        if (typeof data.stepCount === 'number') this._stepCount = data.stepCount;
        return this;
    }

    // ── Private helpers ───────────────────────────────────────────────────────
    _applyDecay() {
        const clamp = (v) => Math.max(0, Math.min(1, v));
        for (const [key, rate] of Object.entries(this._decay)) {
            this.state[key] = clamp(this.state[key] - rate);
        }
    }

    _emitModelChanged() {
        try {
            if (typeof window !== 'undefined' && typeof CustomEvent !== 'undefined') {
                window.dispatchEvent(new CustomEvent('simulationModelChanged', {
                    detail: {
                        name: CircularCityManager.modelName,
                        tip:  CircularCityManager.modelTip,
                    },
                }));
            }
        } catch (e) { /* non-browser env, ignore */ }
    }
}
