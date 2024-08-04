##### [Support UniversalBit Project](https://github.com/universalbit-dev/universalbit-dev/tree/main/support)   ##### [Disambiguation](https://en.wikipedia.org/wiki/Wikipedia:Disambiguation)   ##### [Bash Reference Manual](https://www.gnu.org/software/bash/manual/html_node/index.html)

---
* [CityGenerator](https://github.com/universalbit-dev/CityGenerator/blob/master/assets/images/gif/citygenerator.gif) && [Threejs-Editor](https://threejs.org/editor/)

<img src="https://github.com/universalbit-dev/CityGenerator/blob/master/assets/images/gif/city_generator_threejs_editor.gif" width="600"></img>

* [Object3D to Json]
  
<img src="https://github.com/universalbit-dev/CityGenerator/blob/master/assets/images/gif/object3d_tojson.gif" width="600"></img>

[citygenerator.json](https://raw.githubusercontent.com/universalbit-dev/CityGenerator/master/json/citygenerator.json)
```bash
"metadata": {
		"version": 4.6,
		"type": "Object",
		"generator": "Object3D.toJSON"
	},
```
* [CityGenerator usage](https://github.com/universalbit-dev/CityGenerator/blob/master/docs/usageguide.md)
* [NetWorking and Blockchain Node](https://github.com/universalbit-dev/CityGenerator/tree/master/network)
* [BlockChain Workers](https://github.com/universalbit-dev/CityGenerator#multi-threaded-cpu-miner-for-litecoin-and-bitcoin)
* [3D](https://github.com/universalbit-dev/CityGenerator/tree/master/public/3d/buildings)
* [Low Voltage HHO Module](https://github.com/universalbit-dev/CityGenerator/blob/master/public/hho/Low_Voltage_HHO_Module.md)
* [Wind Turbine](https://github.com/universalbit-dev/CityGenerator/blob/master/public/windturbine/ArchimedesWindTurbine.md)
* [Build Your Project](##Development)

* [License](https://www.gnu.org/licenses/lgpl-3.0.txt)
* [Contact](#contact)

##### About Author of City Map Generator: [@probabletrain](https://github.com/ProbableTrain/MapGenerator)
* [WebSite](https://maps.probabletrain.com/#/)
* [Support](https://ko-fi.com/probabletrain)
  
##### Thanks!
---

#### Getting Started
* [ThreeJS Editor](https://threejs.org/editor/)
  Three.js is a cross-browser JavaScript library and application programming interface (API) used to create and display animated 3D computer graphics in a web browser using WebGL. 
* [MeshLab](https://www.meshlab.net/#features)
  MeshLab is a 3D mesh processing software system that is oriented to the management and processing of unstructured large meshes and provides a set of tools for editing, cleaning, healing, inspecting, rendering, and converting these kinds of meshes. 
  
#### Cleaning and simplifying a mesh with meshlab  -- [Modeling STL-files in Blender](https://github.com/universalbit-dev/CityGenerator/blob/master/docs/stl.md)
filters > Remeshing, Simplification and Reconstruction > Quadric Edge Collapse Decimation

---
---

##3D
* [Blender](https://www.blender.org/)
* [Buildings](https://github.com/universalbit-dev/CityGenerator/tree/master/public/3d/buildings)

 [Building Tools](https://ranjian0.github.io/building_tools/) -- [Buildify](https://github.com/universalbit-dev/CityGenerator/blob/master/public/3d/buildify/Buildify_1.0.pdf)

### [View](https://github.com/universalbit-dev/CityGenerator/blob/master/stl/nofullstack_model.stl) exported stl 3d model
### [Use CityGenerator](https://github.com/universalbit-dev/CityGenerator/blob/master/docs/usageguide.md)
---
* open > /dist/index.html file  and [generate city](https://github.com/universalbit-dev/CityGenerator/blob/master/assets/images/gif/citygenerator.gif)
---

<img src="https://github.com/universalbit-dev/CityGenerator/blob/master/assets/images/gif/citygenerator.gif" width="600"></img>

on board: Content Delivery Network
* CDN [threejs@0.164.1](https://www.jsdelivr.com/package/npm/three)
* CDN [jsts@latest](https://www.jsdelivr.com/package/npm/jsts)
* bundle_edit.js [work in progress]
---
---

##Development 

### NodeJS Engine: [NodeJsv20.13.0 LTS](https://nodejs.org/en/blog/release/v20.13.0)

* Clone the project
```bash
git clone https://github.com/universalbit-dev/CityGenerator.git
cd CityGenerator
```
* Install packages with npm 
```bash
npm i && npm audit fix
```

#about-the-project
##### [Compiler WebPack5 release](https://webpack.js.org/blog/2020-10-10-webpack-5-release/)
##### [TypeScript Note](https://webpack.js.org/guides/typescript/)

##### Build Project:
```bash
npm run build
```
<img src="https://github.com/universalbit-dev/CityGenerator/blob/master/assets/images/gif/citygenerator_algo.gif" width="auto"></img>

---

* [Typescript WebPack](https://webpack.js.org/guides/typescript/)
* [WebPack Module Federarion](https://webpack.js.org/concepts/module-federation/)
* [Pm2](https://pm2.io/docs/runtime/guide/process-management/)

---
---

#### BlockChain Net node:
##### Net Node and No-Profit  [Why?](https://www.blockchain-council.org/blockchain/blockchain-mining-a-comprehensive-step-by-step-guide/)
##### Bitcoin Pruned Net Node:
* [BTC Node](https://github.com/universalbit-dev/universalbit-dev/tree/main/blockchain/bitcoin)
##### Multi-threaded CPU miner for Litecoin and Bitcoin 
* [CpuMiner](https://github.com/universalbit-dev/CityGenerator/blob/master/workers/workers.md)
##### Gpu and ASIC Mining
* [Gpu_Miner Os](https://simplemining.net)
* [ASIC Miner](https://www.asicminervalue.com/)

##### Contributing: feel free to make something of amazing.
  
## Contact
##### [UniversalBit-dev](https://github.com/universalbit-dev) -- [UniversalBitCDN](https://universalbitcdn.it) -- [WebSite](https://universalbit.it) -- [@Universalbit](https://mastodon.social/@UniversalBit)

## License
Distributed under the LGPL-3.0 License. See [lgpl-3.0.txt](https://www.gnu.org/licenses/lgpl-3.0.txt)

