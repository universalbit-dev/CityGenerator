# 🏙️ cityManagers Directory

Welcome to the **cityManagers** directory!  
Here you'll find modules that manage different aspects of futuristic, blockchain-enabled city simulations in [CityGenerator](https://github.com/universalbit-dev/CityGenerator).

---

## 📦 Contents

| File | Purpose | Key Attributes |
|------|---------|---------------|
| 🟢 [CircularCityManager.js](./CircularCityManager.js) | ♻️ Models circular city systems, focusing on sustainability and resource cycles. | Population, Local Production, Recycling Rate, Waste Recovery, Import/Export, Renewable Energy |
| 🟣 [CivicEcosystemManager.js](./CivicEcosystemManager.js) | 🏛️ Manages civic engagement, open data, and business/community flow. | Population, Citizen Engagement, Open Data, Business Density, Resource Flow, Feedback Loops |
| 🟠 [CommunityCommonsManager.js](./CommunityCommonsManager.js) | 🤝 Organizes shared resources, public spaces, and community participation. | Population, Shared Resources, Public Spaces, Participation, Local Energy, Happiness |
| 🔵 [ResilientCityModelManager.js](./ResilientCityModelManager.js) | 🦾 Focuses on city resilience through diversity, crisis readiness, and recovery. | Population, Redundancy, Diversity, Crisis Readiness, Recovery Speed, Community Support |
| 🟡 [SmartCityStateManager.js](./SmartCityStateManager.js) | 🤖 Coordinates smart infrastructure, IoT, and AI-driven services. | Population, Sensor Coverage, Connectivity, AI Services, Traffic Flow, Pollution |
| 🟤 [UrbanFabricManager.js](./UrbanFabricManager.js) | 🏗️ Manages physical city layers: roads, grids, logistics, and green spaces. | Population, Road Network, Power Grid, Data Connectivity, Logistics Efficiency, Green Space |

---

## 🚀 Usage

1. **Import a manager:**
   ```js
   import CircularCityManager from './CircularCityManager.js';
   ```
2. **Create and update:**
   ```js
   const manager = new CircularCityManager();
   manager.update(0); // Example: improve local production
   console.log(manager.getStateArray());
   ```
3. **Extend**:  
   Each manager exports a class with a state, update method, and getStateArray for easy simulation integration.

---

## 🤔 Which Manager Should I Use?

- ♻️ **CircularCityManager** — For sustainability and resource efficiency simulations.
- 🏛️ **CivicEcosystemManager** — For civic engagement and ecosystem modeling.
- 🤝 **CommunityCommonsManager** — For public spaces, sharing, and wellbeing.
- 🦾 **ResilientCityModelManager** — For resilience, diversity, and crisis models.
- 🤖 **SmartCityStateManager** — For smart city, IoT, and AI-driven features.
- 🏗️ **UrbanFabricManager** — For physical infrastructure and logistics.

---

## 📝 Contributing

- Add new city manager modules or improve existing ones!
- Please keep code readable and document important logic.
---

Made with ❤️ by the CityGenerator team
