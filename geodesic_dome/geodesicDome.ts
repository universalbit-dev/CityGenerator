import * as THREE from 'three';

// Function to create a geodesic dome
function createGeodesicDome(radius: number, detail: number): THREE.Mesh {
    const geometry = new THREE.IcosahedronGeometry(radius, detail);
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00, wireframe: true });
    return new THREE.Mesh(geometry, material);
}

// Initialize the scene
function init() {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // Create and add the geodesic dome to the scene
    const dome = createGeodesicDome(5, 2);
    scene.add(dome);

    camera.position.z = 10;

    // Animation loop
    function animate() {
        requestAnimationFrame(animate);
        dome.rotation.x += 0.01;
        dome.rotation.y += 0.01;
        renderer.render(scene, camera);
    }
    animate();
}

// Run the init function to set up the scene
init();
