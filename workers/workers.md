---
layout: default
---
* [BTC Node](https://github.com/universalbit-dev/universalbit-dev/tree/main/blockchain/bitcoin)
* [Buy-Sell](https://github.com/universalbit-dev/gekko-m4/blob/master/README.md)
---
* [Mining]()

##### This is a multi-threaded CPU miner for Litecoin and Bitcoin,
##### fork of Jeff Garzik's [reference cpuminer]().
---
#### [Downloads](https://sourceforge.net/projects/cpuminer/files/)
#### [Git tree](https://github.com/pooler/cpuminer)
---
#### Dependencies:
```bash
sudo apt install libcurl4-openssl-dev libjansson-dev build-essential
```

```bash
./autogen.sh
./configure CFLAGS="-O3" # make sure -O3 is an O and not a zero!
make
```

##### Install [Node v20.6.0](https://nodejs.org/en/blog/release/v20.6.0)
```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.5/install.sh | bash
```

```bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"  # This loads nvm bash_completion
```
```
nvm i 20
npm i --build-from-source
```

#### Setup [pm2](https://pm2.io/docs/runtime/guide/process-management/) globally

```
npm i pm2 -g
```

##### Note: Before start process setup permission:
```
cd CityGenerator
sudo chmod 755 -R workers
```

#### Start process
```
cd workers
pm2 start workers.js
```
![CityGenerator](https://github.com/universalbit-dev/CityGenerator/blob/master/workers/citygenerator-workers.png "citygenerator")

#### Setup HA Cluster:
#### [HArmadillium](https://github.com/universalbit-dev/armadillium/blob/main/HArmadillium.md)


[back](./)
