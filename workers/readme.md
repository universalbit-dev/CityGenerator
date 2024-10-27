##### [Support UniversalBit Project](https://github.com/universalbit-dev/universalbit-dev/tree/main/support) -- [Disambiguation](https://en.wikipedia.org/wiki/Wikipedia:Disambiguation) -- [Bash Reference Manual](https://www.gnu.org/software/bash/manual/html_node/index.html) -- [Join Mastodon](https://mastodon.social/invite/wTHp2hSD) -- [Website](https://www.universalbit.it/) -- [Content Delivery Network](https://universalbitcdn.it/)

#### BlockChain Environment (Net-Node && Mining && BuySell)

#### NetWork Node
* [Pruned BTC Node](https://github.com/universalbit-dev/universalbit-dev/tree/main/blockchain/bitcoin)
* [Live Map](https://bitnodes.io/nodes/live-map/)

#### Mining (cpu--gpu--asic)

#### [Cpu](https://bitcoinwiki.org/wiki/cpu-mining)
* [This is a multi-threaded CPU miner for Litecoin and Bitcoin](https://github.com/universalbit-dev/CityGenerator/tree/master/workers),
![CityGenerator](https://github.com/universalbit-dev/CityGenerator/blob/master/workers/citygenerator-workers-btc.png "citygenerator")

#### required:
```bash
sudo apt install libcurl4-openssl-dev libjansson-dev build-essential
./autogen.sh
./configure CFLAGS="-O3" # make sure -O3 is an O and not a zero!
make
```
##### Alternative:
* [Downloads cpu miner from sourceforge.net](https://sourceforge.net/projects/cpuminer/files/)

##### Note: setup workers folder web permission before start workers.js script
```bash
cd CityGenerator
sudo chmod 700 -R workers
```

#### cpu mining process with PM2
```bash
cd workers
npm i && npm audit fix
npm i pm2 -g
pm2 start workers.js
```
![CityGenerator](https://github.com/universalbit-dev/CityGenerator/blob/master/assets/images/CityGenerator_Workers.png "citygenerator")




* [How Bitcoin Mining really Works](https://www.freecodecamp.org/news/how-bitcoin-mining-really-works-38563ec38c87/)
* [CPU Miner once again](https://github.com/universalbit-dev/CityGenerator/blob/master/workers/workers.md)

#### Gpu Mining (Simplemining.net)
* [GPU](https://github.com/universalbit-dev/universalbit-dev/tree/main/blockchain)
    
#### Asic Miners (ESP32)
* [MicroMiner](https://github.com/universalbit-dev/esptool/blob/master/README.md)
* [BitMaker](https://github.com/BitMaker-hub/NerdMiner_v2)
* [ESP-Miner](https://github.com/skot/ESP-Miner)
  
#### Buy -- Sell
Simulate and make your strategy ,buy and sell cryptocurrency
* [Gekko-M4-Globular-Cluster](https://github.com/universalbit-dev/gekko-m4/blob/master/README.md)


