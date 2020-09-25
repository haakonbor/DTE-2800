import * as THREE from '../../lib/three/build/three.module.js';
import { TrackballControls } from '../../lib/three/examples/jsm/controls/TrackballControls.js';
import {addCoordSystem, SIZE} from "../../lib/wfa-coord.js";

// THREE objekter
let renderer, scene, camera;

// Rotasjon
let angle, previousTime = 0.0;

// Kontroller
let controls;

// Drone
let drone;
let propellerSpeed = 0.2;
let speedHelper;

// Tastetrykk
let currentKeys = {};


function addDroneModel() {

}

function addModels() {
    // Plan
    let planeGeometry = new THREE.PlaneGeometry(SIZE * 2, SIZE * 2);
    let planeMaterial = new THREE.MeshLambertMaterial({color: 0x19bd2c, side: THREE.DoubleSide})
    let planeMesh = new THREE.Mesh(planeGeometry, planeMaterial);
    planeMesh.rotation.x = Math.PI / 2;
    planeMesh.receiveShadow = true;
    scene.add(planeMesh);

    // Drone
    //addDroneModel();
}

function addControls() {
    controls = new TrackballControls(camera);
    controls.addEventListener('change', render);
    controls.rotateSpeed = 1.0;
    controls.zoomSpeed = 10;
    controls.panSpeed = 0.8;

    controls.noZoom = false;
    controls.noPan = false;

    controls.staticMoving = true;
    controls.dynamicDampingFactor = 0.3;
}

function handleKeyUp(event) {
    currentKeys[event.keyCode] = false;
}

function handleKeyDown(event) {
    currentKeys[event.keyCode] = true;
}

function render()
{
    renderer.render(scene, camera);
}

function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);

    controls.handleResize();
    render();
}

function animate(currentTime) {
    requestAnimationFrame(animate);

    // Kalkulerer tidsforskjell mellom frames
    if(currentTime == undefined)
        currentTime = 0;

    let elapsedTime = 0.0;
    if (previousTime != 0.0)
        elapsedTime = (currentTime - previousTime) / 1000;

    previousTime = currentTime;

    // Bestemmer rotasjonshastighet
    let rotationSpeed = Math.PI;
    angle = angle + (rotationSpeed * elapsedTime);
    angle %= (Math.PI * 2);

    // Roterer dronens propeller

    // ...

    // Oppdaterer trackball kontrollen
    controls.update();

    // Renderer
    render();
}

export function main () {
    // Initialisering av:
    // Canvas
    let canvas = document.getElementById('webgl');

    // Scene
    scene = new THREE.Scene();

    // Renderer
    renderer = new THREE.WebGLRenderer({canvas:canvas, antialias:true});
    renderer.setClearColor(0xBFD104, 0xff);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Kamera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight,
        0.1, 5000);
    camera.position.x = 130;
    camera.position.y = 200;
    camera.position.z = 130;
    camera.up = new THREE.Vector3(0,1,0);
    let cameraTarget = new THREE.Vector3(0.0,0.0,0.0);
    camera.lookAt(cameraTarget);

    // Lys
    //  Retningslys (sol)
    let directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(0,400,0);
    directionalLight.castShadow = true;
    directionalLight.shadow.camera.near = 200;
    directionalLight.shadow.camera.far = 501;
    directionalLight.shadow.camera.left = -250;
    directionalLight.shadow.camera.right = 250;
    directionalLight.shadow.camera.top = 250;
    directionalLight.shadow.camera.bottom = -250;
    //directionalLight.shadow.camera.visible = true;
    scene.add(directionalLight);
    //      Hjelpeverktøy for skyggen til retningslyset
    let dirShadowCamHelper = new THREE.CameraHelper(directionalLight.shadow.camera);
    scene.add(dirShadowCamHelper);

    //  Punktlys (lampe)
    let spotLight = new THREE.SpotLight(0xffffff, 1.0);
    spotLight.position.set( 2, 1, 4 );
    spotLight.castShadow = true;
    spotLight.shadow.mapSize.width = 512;
    spotLight.shadow.mapSize.height = 512;
    spotLight.shadow.camera.near = 200;
    spotLight.shadow.camera.far = 410;
    //spotLight.shadow.cameraVisible = true;
    scene.add(spotLight);
    //      Hjelpeverktøy for skyggen til punktlyset
    let spotShadowCamHelper = new THREE.CameraHelper(directionalLight.shadow.camera);
    scene.add(spotShadowCamHelper);

    // Modeller
    addModels();

    // Koordinatssystem
    addCoordSystem(scene);
    
    // Kontroller
    addControls();

    // Endring av vindustørrelse
    window.addEventListener('resize', onWindowResize, false);

    // Input
    document.addEventListener('keyup', handleKeyUp, false);
    document.addEventListener('keydown', handleKeyDown, false);

    animate();
}