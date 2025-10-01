# Build & Compiler Tool Comparison

## Overview

This document clarifies the differences in build and compiler tools used in the **CityGenerator** and **MapGenerator** projects.  
It is intended to help contributors, maintainers, and the open-source community understand the technical choices and project structure.

---

## CityGenerator (universalbit-dev/CityGenerator)

**Modern, Modular, and Scalable Build System**

### **Key Files**
- `webpack.config.js`:  
  - Uses **Webpack** as the primary bundler.
  - Handles code splitting, asset management, and modular builds.
- `tsconfig.json`:  
  - Configures **TypeScript** for strict typing and advanced JS features.
- `package.json`:  
  - Declares dependencies (Webpack, TypeScript, Bootstrap, Chart.js, etc.), scripts (`build`, `start`, etc.), and dev tools.
- `server.js` / `https_server.js`:  
  - Node.js scripts for local and production hosting, including HTTPS support.
- `index.d.ts`:  
  - Project-wide TypeScript type definitions.
- `src/ts/`, `src/js/`, `main.ts`:  
  - Core logic, managers, UI, and RL agent code (TypeScript and ES6+).

### **Build Flow**
- Development:  
  - Webpack compiles and bundles JS/TS, assets, and styles.
  - Node.js server runs local dev instances.
- Production:  
  - Webpack creates optimized bundles for deployment.
  - Supports advanced features: live reloading, modular city managers, worker scripts.

### **Community Advantages**
- **Scalable:** Easily add new managers, modules, and features.
- **Modular:** Clean separation of logic, UI, and algorithms.
- **Modern:** Uses latest JS/TS standards and build practices.
- **Secure:** HTTPS support for production.

---

## MapGenerator (ProbableTrain/MapGenerator)

**Classic, Lightweight, and Focused Build Pipeline**

### **Key Files**
- `gulpfile.js`:  
  - Uses **Gulp** as the build/task runner.
  - Handles compilation, bundling, and asset pipeline with simple tasks.
- `tsconfig.json`:  
  - Configures **TypeScript** for source compilation.
- `package.json`:  
  - Declares dependencies (Gulp, TypeScript, etc.), scripts (`build`, etc.), and dev tools.
- `dist/`:  
  - Output folder for built JS, CSS, and HTML (produced by Gulp).
- `src/ts/`, `main.ts`:  
  - Core procedural map generation logic (TypeScript).

### **Build Flow**
- Development:  
  - Gulp watches and compiles TypeScript, bundles JS/CSS, and copies assets.
  - No server-side code; runs as a static webapp.
- Production:  
  - Gulp produces final assets in `dist/` for deployment.

### **Community Advantages**
- **Simple:** Easy to set up and maintain.
- **Lightweight:** Minimal dependencies, quick builds.
- **Focused:** Single-purpose map generator, streamlined pipeline.

---

## **Summary Table**

| Feature            | CityGenerator                      | MapGenerator                  |
|--------------------|------------------------------------|-------------------------------|
| **Primary Compiler**| Webpack (config: `webpack.config.js`)| Gulp (config: `gulpfile.js`)   |
| **TypeScript**     | Yes (`tsconfig.json`, `.d.ts`)     | Yes (`tsconfig.json`)          |
| **Server-side**    | Yes (`server.js`, `https_server.js`)| No                            |
| **Workers**        | Yes (native/C workers)             | No                            |
| **Output Folder**  | Custom/public (`dist/`, etc.)      | `dist/`                        |
| **Complexity**     | High (modular, scalable)           | Medium (simple, focused)       |

---

## **For Contributors & Maintainers**

- When contributing to **CityGenerator**:
  - Familiarize yourself with modular structure and Webpack.
  - Expect TypeScript and server-side logic.
  - Use Webpack scripts for builds and testing.

- When contributing to **MapGenerator**:
  - Focus on Gulp tasks and client-side TypeScript modules.
  - No server-side logic or complex build pipelines.
  - Quick setup for map generation features.

---

_This comparison is intended as a living resource for the development community.  
Feel free to update as project structures evolve!_
