# ⚙️ Workers Directory

> **ℹ️ About This Project**
>
> This project uses DigiByte mining and simplified smart contracts as a hands-on, educational way to understand how block validation and basic blockchain mechanisms work.
>
> - 🛠 **Mining** here is not for profit or DeFi, but to show how blocks are created and validated in a real or simulated DigiByte environment.
> - 💡 The included [`digibyte.js`](https://raw.githubusercontent.com/universalbit-dev/CityGenerator/refs/heads/master/digibyte.js) module introduces a “simplified smart contract” approach, serving as a starting point for understanding more complex contract logic in the future.
> - 🧪 Enabling a DigiByte testnet node lets you experiment with mining and contract logic risk-free, making this a perfect lab for learning, simulation, and prototyping.
> - 🚫 **Note:** DigiByte does not natively support complex DeFi smart contracts. The mechanisms here are foundational and propedeutic—they prepare you for understanding and building more advanced blockchain and smart contract solutions later.
>
> **In summary:** This is a practical, safe playground to help you master the basics of mining, block validation, and smart contracts on a blockchain.

---

## 🖥️ System Requirements

**Before you start, make sure Node.js and npm are installed.**  
We recommend using [nvm (Node Version Manager)](https://github.com/nvm-sh/nvm) for easy and flexible Node.js management.

### 🟢 Install Node.js (Recommended: v22+)
```bash
# Install NVM (if not already installed)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
# Restart your terminal or source your profile as instructed by nvm
nvm install 22
nvm use 22
```
**For Ubuntu/Debian alternative (not recommended for version management):**
```bash
sudo apt update
sudo apt install nodejs npm
```

---

## 🛠️ How to Set Up CPU Mining

### 1️⃣ Clone the Repository
This project includes a **multi-threaded CPU miner** for DigiByte, in the `CityGenerator/workers` directory.

```bash
git clone https://github.com/universalbit-dev/CityGenerator.git
cd CityGenerator/workers
```

### 2️⃣ (Optional) Download Alternative CPU Miners
- You can download pre-built CPU miners from [SourceForge](https://sourceforge.net/).

---

### 3️⃣ 🏗️ Build CPU Miner from Source (Optional)

If you want to compile the miner from source code:
```bash
sudo apt install libcurl4-openssl-dev libjansson-dev build-essential
./autogen.sh
./configure CFLAGS="-O3"  # Ensure -O3 is an uppercase 'O'
make
```

---

### ✅ Quick Setup Before You Start Mining

- 🛠️ Install system requirement:  
  ```bash
  sudo apt install cpulimit
  ```
- 📦 Install PM2 globally:  
  ```bash
  npm i pm2 -g
  ```
- 🔒 Set script permissions:  
  ```bash
  chmod 755 workers/workers.js
  ```

The `workers.js` script will:
- 🪙 Generate a random DigiByte address.
- 🧊 Run the miner at about 2% CPU usage using `cpulimit`.
- 🧵 Use just one CPU thread for demonstration and safety.
- 📴 Support clean shutdowns and easy management with PM2.

---

### 🚦 Install packages and Start Mining
```bash
npm i && npm audit fix
pm2 start workers.js
```

---

## 🌐 Blockchain Environment

### 🌍 Net-Node  
- [Pruned BTC Node](https://github.com/universalbit-dev/universalbit-dev/tree/main/blockchain/bitcoin)    
- [Pruned DGB Node](https://github.com/universalbit-dev/universalbit-dev/tree/main/blockchain/digibyte)

Set up and run a Net node to maintain full network functionality.

---

## 🧪 Enabling DigiByte Testnet Node

Safely experiment with mining and smart contracts by running a DigiByte testnet node.  
**Testnet is perfect for education, development, and simulation—no real funds involved!**

**Quick Start:**
```bash
# Download DigiByte Core from https://github.com/DigiByte-Core/digibyte
digibyted -testnet -daemon
```

**Connect CityGenerator to the testnet for:**
- 🏙️ Simulated transactions and mining
- 📜 Experimenting with smart contract logic
- 🔗 Integration with your `digibyte.js` module

---

## 💡 Simplified Smart Contracts with digibyte.js

The [`digibyte.js`](https://raw.githubusercontent.com/universalbit-dev/CityGenerator/refs/heads/master/digibyte.js) module creates a simplified smart contract environment. You can:

- 🔑 Generate random DigiByte addresses (testnet and mainnet)
- 🔄 Create and simulate basic transactions/block validation logic
- 🧩 Experiment with programmable rules (similar to Bitcoin Script)

See the `workers/` directory for mining/block simulation and explore `digibyte.js` for extending contract logic.

---

## 🧩 MICRO Miners (ESP32)
micromining solutions for ESP32 microcontrollers: **ESP32 NodeMCU WiFi CP2102**
- [MicroMiner](https://github.com/universalbit-dev/esptool_microminer)

---

## 📚 Additional Resources
- **[PM2 Quick Start](https://pm2.keymetrics.io/docs/usage/quick-start/)**
- [How Bitcoin Mining Really Works](https://www.freecodecamp.org/news/how-bitcoin-mining-really-works-38563ec38c87/)

---

## 🖥️ GPU Mining with Simplemining.net
Leverage GPU power for mining:
- [GPU Mining Setup](https://github.com/universalbit-dev/universalbit-dev/tree/main/blockchain)

---

## Support the UniversalBit Project
Help us grow and innovate!  
- [Support the UniversalBit Project](https://github.com/universalbit-dev/universalbit-dev/tree/main/support) 
- [Learn about Disambiguation](https://en.wikipedia.org/wiki/Wikipedia:Disambiguation)  
- [Bash Reference Manual](https://www.gnu.org/software/bash/manual/)
