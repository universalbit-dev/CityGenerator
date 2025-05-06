# Workers Documentation

## Blockchain Environment

### Net-Node  
- [Pruned BTC Node](https://github.com/universalbit-dev/universalbit-dev/tree/main/blockchain/bitcoin)  
  Set up and run a pruned Bitcoin node for reduced storage requirements while maintaining full network functionality.

---

## Buy/Sell Cryptocurrency
- [Gekko-M4 Globular Cluster](https://github.com/universalbit-dev/gekko-m4-globular-cluster)  
  A sustainable cryptocurrency model inspired by decentralized finance and ecological principles.

---

## ASIC Miners (ESP32)
Explore lightweight and efficient mining solutions for ESP32 microcontrollers:
- [MicroMiner](https://github.com/universalbit-dev/esptool/blob/master/README.md)  
- [BitMaker](https://github.com/BitMaker-hub/NerdMiner_v2)  
- [ESP-Miner](https://github.com/skot/ESP-Miner)

---

## CPU Mining
  
  Learn about multi-threaded CPU mining for DigiByte.

### How to Set Up CPU Mining
1. **Clone the Repository**  
   This project includes a multi-threaded CPU miner for DigiByte:  
   [CityGenerator Workers](https://github.com/universalbit-dev/CityGenerator/tree/master/workers)

2. **Alternative CPU Miners**  
   - [Download pre-built CPU miners from SourceForge](https://sourceforge.net/projects/cpuminer/files/)

3. **Build CPU Miner from Source**  
   Follow these steps to compile the miner from source:
   ```bash
   sudo apt install libcurl4-openssl-dev libjansson-dev build-essential
   ./autogen.sh
   ./configure CFLAGS="-O3" # Ensure -O3 is an uppercase "O"
   make
   ```

### Setup Folder Permissions
Before starting the worker script, set the necessary folder permissions:
```bash
sudo chmod 744 -R ~/CityGenerator/workers
```

### Start the CPU Mining Process with PM2
Use [PM2](https://pm2.keymetrics.io/docs/usage/quick-start/) for process management:
```bash
cd ~/CityGenerator/workers
npm i
pm2 start workers.js
```

---

### Additional Resources
- [How Bitcoin Mining Really Works](https://www.freecodecamp.org/news/how-bitcoin-mining-really-works-38563ec38c87/)  
  A deep dive into the mechanics of Bitcoin mining.
- [CPU Miner Overview](https://github.com/universalbit-dev/CityGenerator/blob/master/workers/workers.md)  
  Learn more about the CPU mining process and its implementation.
---

## GPU Mining with Simplemining.net
Leverage GPU power for mining:
- [GPU Mining Setup](https://github.com/universalbit-dev/universalbit-dev/tree/main/blockchain)

---

## 📢 Support the UniversalBit Project
Help us grow and continue innovating!  
- [Support the UniversalBit Project](https://github.com/universalbit-dev/universalbit-dev/tree/main/support)  
- [Learn about Disambiguation](https://en.wikipedia.org/wiki/Wikipedia:Disambiguation)  
- [Bash Reference Manual](https://www.gnu.org/software/bash/manual/)

