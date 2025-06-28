# Workers Directory
### **CPU Mining Guide**

Learn about multi-threaded CPU mining for DigiByte and how to set up, build, and run a CPU miner effectively. This guide also introduces how to integrate CPU mining with blockchain environments like Gekko M4 Globular Cluster for innovative solutions.

---

#### **How to Set Up CPU Mining**

##### ** Clone the Repository**
This project includes a **multi-threaded CPU miner** for DigiByte, located in the `CityGenerator Workers` directory.

```bash
git clone https://github.com/universalbit-dev/CityGenerator.git
cd CityGenerator/workers
```

##### ** Alternative CPU Miners**
- You can download pre-built CPU miners from [SourceForge](https://sourceforge.net/).

---

#### **Build CPU Miner from Source** *(Optional)*

If you prefer to compile the miner from the source code, follow these steps:

```bash
sudo apt install libcurl4-openssl-dev libjansson-dev build-essential
./autogen.sh
./configure CFLAGS="-O3"  # Ensure -O3 is an uppercase "O"
make
```
---
> **Quick Setup Before You Start Mining**
>
> ✅ Make sure you have everything ready:
>
> - 🛠️ Install system requirement:  
>   `sudo apt install cpulimit`
>
> - 📦 Install PM2 globally:  
>   `npm i pm2 -g`
>
> - 🔒 Set script permissions:  
>   `chmod 755 workers/workers.js`
>
> The `workers.js` script will:
> - Generate a random DigiByte address for mining payouts.
> - Run the miner at about 2% CPU usage using `cpulimit`.
> - Use just one CPU thread for demonstration and safety.
> - Support clean shutdowns and easy management with PM2.

---

**Install packages and Start the mining process:**
```bash
npm i
pm2 start workers.js
```

## Blockchain Environment

### Net-Node  
- [Pruned BTC Node](https://github.com/universalbit-dev/universalbit-dev/tree/main/blockchain/bitcoin)    
- [Pruned DGB Node](https://github.com/universalbit-dev/universalbit-dev/tree/main/blockchain/digibyte)

 **Setup and run  Net node for maintaining full network functionality.**
 
---

## Buy/Sell Cryptocurrency
- [Gekko-M4 Globular Cluster](https://github.com/universalbit-dev/gekko-m4-globular-cluster)  
  A sustainable cryptocurrency model inspired by decentralized finance and ecological principles.
---
"One of the core ecological principles encourages the thoughtful repurposing of older or unused hardware. By using such hardware for CPU mining, you can contribute to maintaining network node functionality and validating hashes effectively, all while helping to reduce electronic waste in a sustainable way."


## ASIC Miners (ESP32)
Explore lightweight and efficient mining solutions for ESP32 microcontrollers:
- [MicroMiner](https://github.com/universalbit-dev/esptool/blob/master/README.md)  
- [BitMaker](https://github.com/BitMaker-hub/NerdMiner_v2)  
- [ESP-Miner](https://github.com/skot/ESP-Miner)

---

#### **Integrate with Gekko M4 Globular Cluster**
* **[Repository](https://github.com/universalbit-dev/gekko-m4-globular-cluster)**
  
For advanced users, combine the mining process with **Gekko M4 Globular Cluster** in a blockchain environment. This integration unlocks innovative possibilities and helps create groundbreaking applications. Continue exploring ways to leverage blockchain technology for amazing results.

---

### Additional Resources
- **[PM2](https://pm2.keymetrics.io/docs/usage/quick-start/)**
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

