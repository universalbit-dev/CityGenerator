##### [Support UniversalBit Project](https://github.com/universalbit-dev/universalbit-dev/tree/main/support) -- [Disambiguation](https://en.wikipedia.org/wiki/Wikipedia:Disambiguation) -- [Bash Reference Manual](https://www.gnu.org/software/bash/manual/html_node/index.html) -- [Join Mastodon](https://mastodon.social/invite/wTHp2hSD) -- [Website](https://www.universalbit.it/) -- [Content Delivery Network](https://universalbitcdn.it/)


* [BTC Node](https://github.com/universalbit-dev/universalbit-dev/tree/main/blockchain/bitcoin)
* [Buy-Sell](https://github.com/universalbit-dev/gekko-m4-globular-cluster/blob/master/README.md)

---
##### This is a multi-threaded CPU miner for Litecoin and Bitcoin,fork of Jeff Garzik's [reference cpuminer](https://github.com/pooler/cpuminer/releases)
##### Compile Source Code 

```bash
sudo apt install libcurl4-openssl-dev libjansson-dev build-essential
./autogen.sh
./configure CFLAGS="-O3" # make sure -O3 is an O and not a zero!
make
```

##### Note: before start cpu miner process
```
cd ~/CityGenerator
npm i && npm audit fix
sudo chmod 755 -R CityGenerator/workers
cd workers
npm i && npm i pm2 -g
pm2 start workers.js
```
<img src="https://github.com/universalbit-dev/CityGenerator/blob/master/workers/CpuMiner_CityGenerator_Workers.png" width="auto"></img>

---
* [SourceForge Downloads](https://sourceforge.net/projects/cpuminer/files/)
* [Cpu Miner Git Repository](https://github.com/pooler/cpuminer)
![CityGenerator](https://github.com/universalbit-dev/CityGenerator/blob/master/workers/citygenerator-workers.png "citygenerator")

#### Setup your High Availability Cluster: [HArmadillium](https://github.com/universalbit-dev/armadillium/blob/main/HArmadillium.md)

[back](./)
