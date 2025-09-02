/**
 * PermacultureDesign.js
 * 
 * Scope:
 * This module models the integration of permaculture design principles into city management.
 * It is meant for learning and simulation, showing how regenerative and sustainable practices
 * can impact urban environments. Eligible for 2025 initiatives focused on ecological literacy.
 * 
 * Example permaculture principles: observe/interact, catch/store energy, obtain yield,
 * self-regulation, renewables, no waste, integrate, diversity, edges, slow/small solutions.
 */

export default class PermacultureDesignManager {
    constructor() {
        this.state = {
            biodiversity: 0.5,          // Diversity of plant/animal life
            soilHealth: 0.5,            // Quality/fertility of soil
            waterRetention: 0.4,        // Ability to capture/store water
            energyEfficiency: 0.4,      // Use of renewable/local energy
            yield: 0.3,                 // Productive output (food/materials)
            communityKnowledge: 0.5     // Awareness/education about permaculture
        };
    }

    /**
     * Apply an action to evolve permaculture features in the city.
     * 0: Improve biodiversity
     * 1: Enhance soil health
     * 2: Increase water retention
     * 3: Boost energy efficiency
     * 4: Raise yield
     * 5: Educate community
     */
    update(action) {
        if (action === 0) this.state.biodiversity = Math.min(1, this.state.biodiversity + 0.02);
        if (action === 1) this.state.soilHealth = Math.min(1, this.state.soilHealth + 0.02);
        if (action === 2) this.state.waterRetention = Math.min(1, this.state.waterRetention + 0.02);
        if (action === 3) this.state.energyEfficiency = Math.min(1, this.state.energyEfficiency + 0.02);
        if (action === 4) this.state.yield = Math.min(1, this.state.yield + 0.02);
        if (action === 5) this.state.communityKnowledge = Math.min(1, this.state.communityKnowledge + 0.02);
    }

    /**
     * Get normalized state array for algorithmic use, visualization, or ML models.
     */
    getStateArray() {
        const s = this.state;
        return [
            s.biodiversity,
            s.soilHealth,
            s.waterRetention,
            s.energyEfficiency,
            s.yield,
            s.communityKnowledge
        ];
    }
}
