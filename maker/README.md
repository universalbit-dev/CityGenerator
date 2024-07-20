## [VMaker Zone](https://en.wikipedia.org/wiki/Maker_culture)

#### NetWork Node -- Mining (cpu-gpu-asic) -- BuySell --
---
Bitcoin network node
* [BTC Node](https://github.com/universalbit-dev/universalbit-dev/tree/main/blockchain/bitcoin)
[Live Map](https://bitnodes.io/nodes/live-map/)

Simulate your strategy ,buy and sell cryptocurrency
* [Gekko-M4-Globular-Cluster](https://github.com/universalbit-dev/gekko-m4/blob/master/README.md)

### Mining BitCoin for fun and profit 
* [Mining LTC](https://f2pool.io/mining/guides/how-to-mine-litecoin/)
* [Mining BTC](https://f2pool.io/mining/guides/how-to-mine-bitcoin/)
#### Gpu Mining Os
* [GPU Mining](https://simplemining.net/)
#### Asic Miners
* [Asicminervalue](https://www.asicminervalue.com/)

---
#### [Cpu mining](https://bitcoinwiki.org/wiki/cpu-mining)
##### [This is a multi-threaded CPU miner for Litecoin and Bitcoin](https://github.com/universalbit-dev/CityGenerator/tree/master/workers),   
##### fork of Jeff Garzik's [reference cpuminer]().
* [Downloads cpu miner from sourceforge.net](https://sourceforge.net/projects/cpuminer/files/)
* [Git tree](https://github.com/pooler/cpuminer)
#### required:
```bash
sudo apt install libcurl4-openssl-dev libjansson-dev build-essential
```

```bash
./autogen.sh
./configure CFLAGS="-O3" # make sure -O3 is an O and not a zero!
make
```
##### Note: Before start mining process setup folder permission:
```
cd CityGenerator
sudo chmod 755 -R workers
```

##### Install [Node v20.6.0](https://nodejs.org/en/blog/release/v20.6.0)
#### Start cpu mining process with PM2
```
cd workers
npm i pm2 -g
pm2 start workers.js
```

![CityGenerator](https://github.com/universalbit-dev/CityGenerator/blob/master/workers/citygenerator-workers-btc.png "citygenerator")

#### Setup HA Cluster:
#### [HArmadillium](https://github.com/universalbit-dev/armadillium/blob/main/HArmadillium.md)



