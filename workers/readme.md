##### [Support UniversalBit Project](https://github.com/universalbit-dev/universalbit-dev/tree/main/support) -- [Disambiguation](https://en.wikipedia.org/wiki/Wikipedia:Disambiguation) -- [Bash Reference Manual](https://www.gnu.org/software/bash/manual/html_node/index.html) -- [Join Mastodon](https://mastodon.social/invite/wTHp2hSD) -- [Website](https://www.universalbit.it/) -- [Content Delivery Network](https://universalbitcdn.it/) -- [Live Map](https://bitnodes.io/nodes/live-map/)

---

#### BlockChain Environment

#### Net-Node 
* [Pruned BTC Node](https://github.com/universalbit-dev/universalbit-dev/tree/main/blockchain/bitcoin)
#### BuySell Cryptocurrency
* [Gekko-M4-Globular Cluster](https://github.com/universalbit-dev/gekko-m4-globular-cluster)

#### Asic Miners (ESP32)
* [MicroMiner](https://github.com/universalbit-dev/esptool/blob/master/README.md)
* [BitMaker](https://github.com/BitMaker-hub/NerdMiner_v2)
* [ESP-Miner](https://github.com/skot/ESP-Miner)

#### [Cpu-mining](https://bitcoinwiki.org/wiki/cpu-mining)
* [This is a multi-threaded CPU miner for Litecoin and Bitcoin](https://github.com/universalbit-dev/CityGenerator/tree/master/workers),

##### Alternative:
* [Downloads cpu miner from sourceforge.net](https://sourceforge.net/projects/cpuminer/files/)
#### build cpu miner from source:
```bash
sudo apt install libcurl4-openssl-dev libjansson-dev build-essential
./autogen.sh
./configure CFLAGS="-O3" # make sure -O3 is an O and not a zero!
make
```

##### Note: setup folder permission before start [workers.js](https://github.com/universalbit-dev/CityGenerator/blob/master/workers/workers.js) script
```bash
sudo chmod 744 -R ~/CityGenerator/workers
```

#### start cpu mining process with [PM2](https://pm2.keymetrics.io/docs/usage/quick-start/)
```bash
cd ~/CityGenerator/workers
npm i 
pm2 start workers.js
```
![CityGenerator](https://github.com/universalbit-dev/CityGenerator/blob/master/assets/images/CityGenerator_Workers.png "citygenerator")

* [How Bitcoin Mining really Works](https://www.freecodecamp.org/news/how-bitcoin-mining-really-works-38563ec38c87/)
* [CPU Miner once again](https://github.com/universalbit-dev/CityGenerator/blob/master/workers/workers.md)

#### Gpu Mining (Simplemining.net)
* [GPU](https://github.com/universalbit-dev/universalbit-dev/tree/main/blockchain)


