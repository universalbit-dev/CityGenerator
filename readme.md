[![CodeQL](https://github.com/universalbit-dev/CityGenerator/actions/workflows/github-code-scanning/codeql/badge.svg)](https://github.com/universalbit-dev/CityGenerator/actions/workflows/github-code-scanning/codeql)
[![License: LGPL v3](https://img.shields.io/badge/License-LGPL_v3-blue.svg)](https://www.gnu.org/licenses/lgpl-3.0)
[![NodeJS](https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![Hyperledger](https://img.shields.io/badge/hyperledger-2F3134?style=for-the-badge&logo=hyperledger&logoColor=white)](https://www.lfdecentralizedtrust.org/)
[![FreeCodeCamp](https://img.shields.io/badge/Freecodecamp-%23123.svg?&style=for-the-badge&logo=freecodecamp&logoColor=green)](https://www.freecodecamp.org/)

**[Web3](https://github.com/freeCodeCamp/web3-curriculum?tab=readme-ov-file)**

---

### [CityGenerator](https://github.com/universalbit-dev/CityGenerator)

**Description**:  
The **CityGenerator** project focuses on creating dynamic city models inspired by the principles outlined in the [Fab City: The Mass Distribution of (Almost) Everything](https://fablabbcn.org/wp-content/uploads/2020/09/Fab-City-The-Mass-Distribution-of-Almost-Everything.pdf) white paper. It aims to provide tools for simulating and visualizing sustainable, self-sufficient, and resilient urban environments.

---

**Key Objectives**:
1. **Sustainability**: Promote local production and reduce dependency on external resources, aligning with the Fab City framework.
2. **Resilience**: Envision cities capable of adapting to environmental, social, and economic changes.
3. **Collaboration**: Create open-source tools and models to engage developers, urban planners, and researchers in building decentralized urban systems.

---

### Clone the project
```bash
git clone https://github.com/universalbit-dev/CityGenerator.git
cd CityGenerator
```
### Install packages with npm then generate your city model
```bash
npm i && npm audit fix
npm start
```

## Running the [HTTPS] Server

The `https_server.js` file is designed to run a secure HTTPS server using SSL/TLS certificates. Follow these steps to **get started**:

### Quick Start

1. **Generate SSL Certificate and Key**:
   - Use the following command to generate a self-signed SSL certificate and key:
     ```bash
     openssl req -nodes -new -x509 -keyout ssl/private-key.pem -out ssl/certificate.pem -days 365
     ```
   - Alternatively, if you have a configuration file (`distinguished.cnf`), use:
     ```bash
     openssl req -nodes -new -x509 \
     -keyout ssl/private-key.pem -out ssl/certificate.pem -days 365 \
     -config ssl/distinguished.cnf
     ```

2. **Run the HTTPS Server**:
   - Execute the following command in the root directory of your project:
     ```bash
     node https_server.js
     ```
     
3. **Learn More**:
   - For detailed instructions, refer to the [SSL README](ssl/readme.md).

* [Docs](https://github.com/universalbit-dev/CityGenerator/tree/master/docs)
* [CityGenerator -- STL Model View --](https://github.com/universalbit-dev/CityGenerator/blob/master/stl/nofullstack_model.stl)
* [CityGenerator usage](https://github.com/universalbit-dev/CityGenerator/blob/master/docs/usageguide.md)

<img src="/docs/assets/images/%5Bmap%5D01.png" width="9%"></img> <img src="/docs/assets/images/%5Bmap%5D02.png" width="9%"></img> <img src="/docs/assets/images/%5Bmap%5D03.png" width="9%"></img> <img src="/docs/assets/images/%5Bmap%5D04.png" width="9%"></img> <img src="/docs/assets/images/%5Bmap%5D05.png" width="9%"></img> <img src="/docs/assets/images/%5Bmap%5D06.png" width="9%"></img> 

| City Generator                        | [Images](https://github.com/universalbit-dev/CityGenerator/tree/master/docs/assets/images)                             |
| ----------------------------------- | ----------------------------------- |
| ![map01](https://github.com/universalbit-dev/CityGenerator/blob/master/docs/assets/images/%5Bmap%5D17.png) | ![map_16](https://github.com/universalbit-dev/CityGenerator/blob/master/docs/assets/images/%5Bmap%5D16.png) |

|                             |                             |
| ----------------------------------- | ----------------------------------- |
| ![map_13](https://github.com/universalbit-dev/CityGenerator/blob/master/docs/assets/images/%5Bmap%5D13.png)  |


##### About Author of City Map Generator: [@probabletrain](https://github.com/ProbableTrain/MapGenerator)
* [WebSite](https://maps.probabletrain.com/#/)
* [Support City Map Generator](https://ko-fi.com/probabletrain)
  
##### Thanks!
---
...this is something of amazing
* [Buildify](https://paveloliva.gumroad.com/l/buildify) 
---

[development]

* [Compiler WebPack5 release](https://webpack.js.org/blog/2020-10-10-webpack-5-release/)
* [TypeScript Note](https://webpack.js.org/guides/typescript/)

#### Build your Project:
```bash
npm run build
```
* [WebPack Module Federarion](https://webpack.js.org/concepts/module-federation/)
---

##### Blockchain Integration: Information about integrating with DigiByte and other blockchain environments.
-- [DigiByte Integration Guide](https://www.digibyte.org/docs/integrationguide.pdf) --
-- [Documentation and examples](https://github.com/RenzoDD/digibyte-js?tab=readme-ov-file#documentation--examples-) --
#### Blockchain Environment
-- [Workers](https://github.com/universalbit-dev/CityGenerator/blob/master/workers/readme.md)

##### Contributing: feel free to make something of amazing.
## 📢 Support the UniversalBit Project
Help us grow and continue innovating!  
- [Support the UniversalBit Project](https://github.com/universalbit-dev/universalbit-dev/tree/main/support)  
- [Learn about Disambiguation](https://en.wikipedia.org/wiki/Wikipedia:Disambiguation)  
- [Bash Reference Manual](https://www.gnu.org/software/bash/manual/)

---
  
## License
Distributed under the LGPL-3.0 License. See [lgpl-3.0.txt](https://www.gnu.org/licenses/lgpl-3.0.txt)

