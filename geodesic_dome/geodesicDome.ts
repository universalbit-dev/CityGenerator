// Import the Three.js library for 3D graphics.
import * as THREE from 'three';

/**
 * Creates a geodesic dome mesh using Three.js.
 * 
 * @param {number} radius - The radius of the geodesic dome.
 * @param {number} detail - The level of detail, which determines the number of subdivisions.
 * @returns {THREE.Mesh} - A Three.js mesh object representing the geodesic dome.
 */
function createGeodesicDome(radius: number, detail: number): THREE.Mesh {
    const geometry = new THREE.IcosahedronGeometry(radius, detail); // Create an icosahedron-based geometry.
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00, wireframe: true }); // Define a green wireframe material.
    return new THREE.Mesh(geometry, material); // Return the geodesic dome mesh.
}

/**
 * Initializes the Three.js scene, camera, and renderer, 
 * and adds a spinning geodesic dome to the scene.
 */
function init() {
    const scene = new THREE.Scene(); // Create a new 3D scene.
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000); // Set up a perspective camera.
    const renderer = new THREE.WebGLRenderer(); // Create a WebGL renderer.
    renderer.setSize(window.innerWidth, window.innerHeight); // Set the renderer size to match the window.
    document.body.appendChild(renderer.domElement); // Append the renderer's canvas to the DOM.

    // Create the geodesic dome and add it to the scene.
    const dome = createGeodesicDome(5, 2); // Radius: 5, Detail: 2.
    scene.add(dome); // Add the dome to the scene.

    // Position the camera to view the dome.
    camera.position.z = 10;

    /**
     * Animation loop to make the geodesic dome spin.
     * Continuously updates the scene and renders it.
     */
    function animate() {
        requestAnimationFrame(animate); // Recursive call for the next frame.
        dome.rotation.x += 0.01; // Rotate the dome slightly on the X-axis.
        dome.rotation.y += 0.01; // Rotate the dome slightly on the Y-axis.
        renderer.render(scene, camera); // Render the scene from the camera's perspective.
    }
    animate(); // Start the animation loop.
}

// Run the initialization function to set up and display the scene.
init();
