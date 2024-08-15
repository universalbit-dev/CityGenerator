##### [Support UniversalBit Project](https://github.com/universalbit-dev/universalbit-dev/tree/main/support) -- [Disambiguation](https://en.wikipedia.org/wiki/Wikipedia:Disambiguation) -- [Bash Reference Manual](https://www.gnu.org/software/bash/manual/html_node/index.html) -- [Join Mastodon](https://mastodon.social/invite/wTHp2hSD) -- [Website](https://www.universalbit.it/) -- [Content Delivery Network](https://universalbitcdn.it/)

* [BTC Node](https://github.com/universalbit-dev/universalbit-dev/tree/main/blockchain/bitcoin)
* [Buy-Sell](https://github.com/universalbit-dev/gekko-m4-globular-cluster/blob/master/README.md)
---
* [Mining Calculator](https://whattomine.com/)

##### This is a multi-threaded CPU miner for Litecoin and Bitcoin,fork of Jeff Garzik's [reference cpuminer](https://github.com/pooler/cpuminer/releases).
---
#### [SourceForge Downloads](https://sourceforge.net/projects/cpuminer/files/)
#### [Cpu Miner Git Repository](https://github.com/pooler/cpuminer)
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

#### Setup your High Availability Cluster: [HArmadillium](https://github.com/universalbit-dev/armadillium/blob/main/HArmadillium.md)

[back](./)
