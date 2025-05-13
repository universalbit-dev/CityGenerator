### Community Help Request: Improving Project Build Structure and Resolving Runtime Issues

### Interactive treemap visualization of the contents
![Webpack Bundle Analyzer](https://github.com/universalbit-dev/CityGenerator/blob/master/assets/images/webpack_bundle_analyzer.png)

#### Overview
The `CityGenerator` project is an exciting initiative aimed at creating futuristic urban designs with a blockchain-driven approach. However, we are facing several challenges in the build process and runtime, and we would greatly appreciate the community's assistance to resolve these issues.

#### Current Challenges
1. **Improper File Structure**:
   - The `bundle.js` file, which is a generated build artifact, is currently located in the `/src` directory.
   - Best practices dictate that generated files like `bundle.js` should be placed in a dedicated `/dist` or `/build` directory to maintain a clean and manageable project structure.

2. **Runtime and Build Issues**:
   - The application encounters issues during runtime and build processes, often resulting in a black screen or getting stuck.
   - These issues make it difficult to debug and hinder efficient development and deployment.

#### Community Assistance Needed
We are seeking the community's help to address the following:
1. **Restructuring the Build Directory**:
   - Guidance on configuring our build tools (e.g., Webpack, Vite, Rollup, etc.) to output all build artifacts, including `bundle.js`, into a `/dist` directory.
   - Recommendations for maintaining a clean and scalable project structure.

2. **Debugging the Runtime Issues**:
   - Identifying the root cause of the application getting stuck or displaying a black screen during runtime.
   - Suggestions for proper debugging tools and techniques to pinpoint and resolve the issue.

3. **Optimizing Build Processes**:
   - Best practices for optimizing the build process to minimize errors and improve reliability.
   - Tips on ensuring compatibility and performance across different environments.

#### How to Contribute
We welcome contributions in any of the following ways:
- Submitting pull requests with fixes or improvements.
- Sharing insights or debugging tips in the project Discussions or Issues section.
- Recommending tools or configurations that have worked well in similar projects.

#### Join the Effort
If you're interested in helping, please visit the [GitHub repository](https://github.com/universalbit-dev/CityGenerator) and engage with us through Issues or Discussions. Together, we can overcome these challenges and push the boundaries of futuristic urban design.

Thank you in advance for your support!
