# Workers Documentation

Welcome to the **Workers** module documentation for the [CityGenerator](https://github.com/universalbit-dev/CityGenerator) project. This guide will help you set up and use the multi-threaded CPU miner for Litecoin and Bitcoin.

## Table of Contents
1. [Introduction](#introduction)
2. [Prerequisites](#prerequisites)
3. [Installation](#installation)
4. [Starting the Miner](#starting-the-miner)
5. [Additional Resources](#additional-resources)
6. [High Availability Cluster Setup](#high-availability-cluster-setup)
7. [Support and Contributions](#support-and-contributions)

---

## Introduction

This module includes a multi-threaded CPU miner for Litecoin and Bitcoin, forked from Jeff Garzik's [reference cpuminer](https://github.com/pooler/cpuminer/releases). It is designed to work seamlessly with the **CityGenerator** project, providing efficient cryptocurrency mining as part of the futuristic city-building ecosystem.

---

## Prerequisites

Before you begin, ensure your system meets the following requirements:

- **Operating System**: Linux-based distributions (tested on Ubuntu).
- **Required Packages**:
  - `libcurl4-openssl-dev`
  - `libjansson-dev`
  - `build-essential`
- **Node.js and npm**: Installed on your system.
- **Permission to install global npm packages**.

---

## Installation

Follow these steps to install and set up the miner:

### Step 1: Clone the Repository
```bash
git clone https://github.com/universalbit-dev/CityGenerator.git
```

### Step 2: Install Dependencies
Navigate to the project directory and install the required Node.js dependencies:
```bash
cd ~/CityGenerator
npm install
npm audit fix
```

### Step 3: Compile the Miner
For compiling the miner, run the following commands:
```bash
sudo apt install libcurl4-openssl-dev libjansson-dev build-essential
./autogen.sh
./configure CFLAGS="-O3" # Ensure '-O3' is the letter 'O' and not a zero!
make
```

### Step 4: Set Permissions
Ensure appropriate permissions for the `workers` directory:
```bash
sudo chmod 755 -R CityGenerator/workers
```

---

## Starting the Miner

### Step 1: Navigate to the `workers` Directory
```bash
cd workers
```

### Step 2: Install Additional Dependencies
```bash
npm install
npm install pm2 -g
```

### Step 3: Start the Miner
Run the miner using `pm2`:
```bash
pm2 start workers.js
```

### Example Output
You can monitor the system performance and see the mining processes in action.

![CpuMiner Workers](https://github.com/universalbit-dev/CityGenerator/blob/master/workers/CpuMiner_CityGenerator_Workers.png)

---

## Additional Resources

- [SourceForge Downloads](https://sourceforge.net/projects/cpuminer/files/)
- [CpuMiner Git Repository](https://github.com/pooler/cpuminer)

![CityGenerator](https://github.com/universalbit-dev/CityGenerator/blob/master/workers/citygenerator-workers.png "CityGenerator Workers")

---

## High Availability Cluster Setup

To enhance the scalability and fault tolerance of your mining setup, consider configuring a High Availability Cluster using [HArmadillium](https://github.com/universalbit-dev/armadillium/blob/main/HArmadillium.md).

---

## Support and Contributions

- **Support the UniversalBit Project**: [Support Page](https://github.com/universalbit-dev/universalbit-dev/tree/main/support)
- **Buy and Sell Cryptocurrency**: [Gekko M4](https://github.com/universalbit-dev/gekko-m4-globular-cluster/blob/master/README.md)

For questions or contributions, feel free to open an issue or submit a pull request.

---
