// This TypeScript file contains a Three.js implementation for creating and rendering a geodesic dome.
// It includes functions for setting up a 3D scene, a perspective camera, and a WebGL renderer, along with
// a reusable function to create geodesic dome meshes. Interaction is enhanced with orbit controls, and
// the dome is animated to spin continuously in the rendered scene.

// Import the Three.js library for 3D graphics.
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

/**
 * Creates a geodesic dome mesh using Three.js.
 * 
 * @param {number} radius - The radius of the geodesic dome.
 * @param {number} detail - The level of detail, which determines the number of subdivisions.
 * @param {THREE.Material} material - The material to apply to the geodesic dome.
 * @returns {THREE.Mesh} - A Three.js mesh object representing the geodesic dome.
 */
function createGeodesicDome(radius: number, detail: number, material?: THREE.Material): THREE.Mesh {
    const geometry = new THREE.IcosahedronGeometry(radius, detail); // Create an icosahedron-based geometry.
    const domeMaterial = material || new THREE.MeshBasicMaterial({ color: 0x00ff00, wireframe: true }); // Default material if none provided.
    return new THREE.Mesh(geometry, domeMaterial); // Return the geodesic dome mesh.
}

/**
 * Sets up the camera with default positioning.
 * 
 * @returns {THREE.PerspectiveCamera} - The configured perspective camera.
 */
function setupCamera(): THREE.PerspectiveCamera {
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 10; // Position the camera.
    return camera;
}

/**
 * Sets up the renderer and appends its DOM element to the document body.
 * 
 * @returns {THREE.WebGLRenderer} - The configured WebGLRenderer.
 */
function setupRenderer(): THREE.WebGLRenderer {
    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight); // Match the window size.
    document.body.appendChild(renderer.domElement); // Append to DOM.
    return renderer;
}

/**
 * Initializes the Three.js scene, camera, and renderer, 
 * and adds a spinning geodesic dome to the scene.
 */
function init() {
    const scene = new THREE.Scene(); // Create a new 3D scene.
    const camera = setupCamera(); // Set up the perspective camera.
    const renderer = setupRenderer(); // Set up the WebGL renderer.

    // Add orbit controls for better interaction.
    const controls = new OrbitControls(camera, renderer.domElement);

    // Create the geodesic dome and add it to the scene.
    const dome = createGeodesicDome(5, 2); // Radius: 5, Detail: 2.
    scene.add(dome); // Add the dome to the scene.

    /**
     * Animation loop to make the geodesic dome spin.
     * Continuously updates the scene and renders it.
     */
    function animate() {
        requestAnimationFrame(animate); // Recursive call for the next frame.
        dome.rotation.x += 0.01; // Rotate the dome slightly on the X-axis.
        dome.rotation.y += 0.01; // Rotate the dome slightly on the Y-axis.
        controls.update(); // Update controls.
        renderer.render(scene, camera); // Render the scene from the camera's perspective.
    }

    // Handle window resizing.
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    animate(); // Start the animation loop.
}

// Run the initialization function to set up and display the scene.
init();
