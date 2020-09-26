import * as THREE from '../../lib/three/build/three.module.js';
import { TrackballControls } from '../../lib/three/examples/jsm/controls/TrackballControls.js';
import {addCoordSystem, SIZE} from "../../lib/wfa-coord.js";

// THREE objekter
let renderer, scene, camera;

// Rotasjon
let angle = 0.0;
let previousTime = 0.0;

// Kontroller
let controls;

// Drone
let drone;
let propellerSpeed = 0.0;
let speedHelper;


// Tastetrykk
let currentKeys = {};


function addDroneModel() {
    // Container
    drone = new THREE.Object3D();

    const textureLoader = new THREE.TextureLoader();

    // Body
    let whitePlasticTexture = textureLoader.load('resources/plasticw.jpg');
    let bodyGeometry = new THREE.CubeGeometry(50,10,50,5,2,5);
    let bodyMaterial = new THREE.MeshPhongMaterial({map: whitePlasticTexture});
    let bodyMesh = new THREE.Mesh(bodyGeometry, bodyMaterial);
    bodyMesh.castShadow = true;
    bodyMesh.name = "body";
    bodyMesh.position.x = 0;
    bodyMesh.position.y = 0;
    bodyMesh.position.z = 0;
    drone.add(bodyMesh);

    // Armer
    let armGeometry = new THREE.CylinderGeometry(
        5, 5, 40, 10, 5);
    let armMaterial = new THREE.MeshPhongMaterial({map: whitePlasticTexture});

    let leftBackArmMesh = new THREE.Mesh(armGeometry, armMaterial);
    leftBackArmMesh.castShadow = true;
    leftBackArmMesh.name = "leftBackArm";
    leftBackArmMesh.position.x = -25;
    leftBackArmMesh.position.y = 0;
    leftBackArmMesh.position.z = -25;
    leftBackArmMesh.rotation.x = Math.PI / 2;
    leftBackArmMesh.rotation.z = -Math.PI / 4;
    drone.add(leftBackArmMesh);

    let rightBackArmMesh = new THREE.Mesh(armGeometry, armMaterial);
    rightBackArmMesh.castShadow = true;
    rightBackArmMesh.name = "rightBackArm";
    rightBackArmMesh.position.x = 25;
    rightBackArmMesh.position.y = 0;
    rightBackArmMesh.position.z = -25;
    rightBackArmMesh.rotation.x = Math.PI / 2;
    rightBackArmMesh.rotation.z = Math.PI / 4;
    drone.add(rightBackArmMesh);

    let rightFrontArmMesh = new THREE.Mesh(armGeometry, armMaterial);
    rightFrontArmMesh.castShadow = true;
    rightFrontArmMesh.name = "rightFrontArm";
    rightFrontArmMesh.position.x = 25;
    rightFrontArmMesh.position.y = 0;
    rightFrontArmMesh.position.z = 25;
    rightFrontArmMesh.rotation.x = Math.PI / 2;
    rightFrontArmMesh.rotation.z = -Math.PI / 4;
    drone.add(rightFrontArmMesh);

    let leftFrontArmMesh = new THREE.Mesh(armGeometry, armMaterial);
    leftFrontArmMesh.castShadow = true;
    leftFrontArmMesh.name = "leftFrontArm";
    leftFrontArmMesh.position.x = -25;
    leftFrontArmMesh.position.y = 0;
    leftFrontArmMesh.position.z = 25;
    leftFrontArmMesh.rotation.x = Math.PI / 2;
    leftFrontArmMesh.rotation.z = Math.PI / 4;
    drone.add(leftFrontArmMesh);

    // Føtter
    let footCurve = new THREE.CatmullRomCurve3( [
        new THREE.Vector3(-15, 0, 0),
        new THREE.Vector3(-15, -20, 0),
        new THREE.Vector3(15, -20, 0),
        new THREE.Vector3(15, 0, 0)
    ])

    let footGeometry = new THREE.TubeGeometry(footCurve, 30, 2, 10, false);
    let aluminiumTexture = textureLoader.load('resources/aluminium.jpg');
    let footMaterial = new THREE.MeshPhongMaterial({map: aluminiumTexture});

    let leftFootMesh = new THREE.Mesh(footGeometry, footMaterial);
    leftFootMesh.castShadow = true;
    leftFootMesh.name = "leftFootMesh";
    leftFootMesh.position.x = -20;
    leftFootMesh.position.y = -5;
    leftFootMesh.position.z = 0;
    leftFootMesh.rotation.y = Math.PI / 2;
    drone.add(leftFootMesh);

    let rightFootMesh = new THREE.Mesh(footGeometry, footMaterial);
    rightFootMesh.castShadow = true;
    rightFootMesh.name = "rightFootMesh";
    rightFootMesh.position.x = 20;
    rightFootMesh.position.y = -5;
    rightFootMesh.position.z = 0;
    rightFootMesh.rotation.y = Math.PI / 2;
    drone.add(rightFootMesh);

    // Propellbaser
    let baseGeometry = new THREE.CylinderGeometry(3,3,3,20,1,false);
    let baseMaterial = new THREE.MeshPhongMaterial({map: aluminiumTexture});

    let leftBackBaseMesh = new THREE.Mesh(baseGeometry, baseMaterial);
    leftBackBaseMesh.castShadow = true;
    leftBackBaseMesh.name = "leftBackBase";
    leftBackBaseMesh.position.x = -35;
    leftBackBaseMesh.position.y = 6;
    leftBackBaseMesh.position.z = -35;
    drone.add(leftBackBaseMesh);

    let rightBackBaseMesh = new THREE.Mesh(baseGeometry, baseMaterial);
    rightBackBaseMesh.castShadow = true;
    rightBackBaseMesh.name = "rightBackBase";
    rightBackBaseMesh.position.x = 35;
    rightBackBaseMesh.position.y = 6;
    rightBackBaseMesh.position.z = -35;
    drone.add(rightBackBaseMesh);

    let rightFrontBaseMesh = new THREE.Mesh(baseGeometry, baseMaterial);
    rightFrontBaseMesh.castShadow = true;
    rightFrontBaseMesh.name = "rightFrontBase";
    rightFrontBaseMesh.position.x = 35;
    rightFrontBaseMesh.position.y = 6;
    rightFrontBaseMesh.position.z = 35;
    drone.add(rightFrontBaseMesh);

    let leftFrontBaseMesh = new THREE.Mesh(baseGeometry, baseMaterial);
    leftFrontBaseMesh.castShadow = true;
    leftFrontBaseMesh.name = "leftFrontBase";
    leftFrontBaseMesh.position.x = -35;
    leftFrontBaseMesh.position.y = 6;
    leftFrontBaseMesh.position.z = 35;
    drone.add(leftFrontBaseMesh);


    // Propeller
    let propellerGeometry = new THREE.BoxGeometry(1,25,1);
    let propellerMaterial = new THREE.MeshBasicMaterial({color:0x232b2b});

    let leftBackPropellerMesh = new THREE.Mesh(propellerGeometry, propellerMaterial);
    leftBackPropellerMesh.castShadow = true;
    leftBackPropellerMesh.name = "leftBackPropeller";
    leftBackPropellerMesh.position.x = -35;
    leftBackPropellerMesh.position.y = 8;
    leftBackPropellerMesh.position.z = -35;
    leftBackPropellerMesh.rotation.x = Math.PI / 2;
    drone.add(leftBackPropellerMesh);

    let rightBackPropellerMesh = new THREE.Mesh(propellerGeometry, propellerMaterial);
    rightBackPropellerMesh.castShadow = true;
    rightBackPropellerMesh.name = "rightBackPropeller";
    rightBackPropellerMesh.position.x = 35;
    rightBackPropellerMesh.position.y = 8;
    rightBackPropellerMesh.position.z = -35;
    rightBackPropellerMesh.rotation.x = Math.PI / 2;
    drone.add(rightBackPropellerMesh);

    let rightFrontPropellerMesh = new THREE.Mesh(propellerGeometry, propellerMaterial);
    rightFrontPropellerMesh.castShadow = true;
    rightFrontPropellerMesh.name = "rightFrontPropeller";
    rightFrontPropellerMesh.position.x = 35;
    rightFrontPropellerMesh.position.y = 8;
    rightFrontPropellerMesh.position.z = 35;
    rightFrontPropellerMesh.rotation.x = Math.PI / 2;
    drone.add(rightFrontPropellerMesh);

    let leftFrontPropellerMesh = new THREE.Mesh(propellerGeometry, propellerMaterial);
    leftFrontPropellerMesh.castShadow = true;
    leftFrontPropellerMesh.name = "leftFrontPropeller";
    leftFrontPropellerMesh.position.x = -35;
    leftFrontPropellerMesh.position.y = 8;
    leftFrontPropellerMesh.position.z = 35;
    leftFrontPropellerMesh.rotation.x = Math.PI / 2;
    drone.add(leftFrontPropellerMesh);

    // Kameraarm
    let cameraArmGeometry = new THREE.CylinderGeometry(3,3,15,20,1, false)
    let cameraArmMaterial = new THREE.MeshPhongMaterial({map: whitePlasticTexture, color:0x808080});
    let cameraArmMesh = new THREE.Mesh(cameraArmGeometry, cameraArmMaterial);
    cameraArmMesh.castShadow = true;
    cameraArmMesh.name = "cameraArm";
    cameraArmMesh.position.x = 0;
    cameraArmMesh.position.y = -12;
    cameraArmMesh.position.z = 0;
    drone.add(cameraArmMesh);

    // Kamerakropp
    let cameraBodyGeometry = new THREE.BoxGeometry(15,10,10,1,1,1);
    let cameraBodyMaterial = new THREE.MeshPhongMaterial({map: whitePlasticTexture, color:0x808080});
    let cameraBodyMesh = new THREE.Mesh(cameraBodyGeometry, cameraBodyMaterial);
    cameraBodyMesh.castShadow = true;
    cameraBodyMesh.name = "cameraBody";
    cameraBodyMesh.position.x = 0;
    cameraBodyMesh.position.y = -15;
    cameraBodyMesh.position.z = 0;
    cameraBodyMesh.rotation.x = Math.PI / 8;
    drone.add(cameraBodyMesh);

    // Kameralinse
    let cameraLensGeometry = new THREE.CylinderGeometry(4,4,4,20,1,false);
    let cameraLensMaterial = new THREE.MeshPhongMaterial({map: whitePlasticTexture, color:0x808080});
    let cameraLensMesh = new THREE.Mesh(cameraLensGeometry, cameraLensMaterial);
    cameraLensMesh.castShadow = true;
    cameraLensMesh.name = "cameraLens";
    cameraLensMesh.position.x = 0;
    cameraLensMesh.position.y = -17;
    cameraLensMesh.position.z = 5;
    cameraLensMesh.rotation.x = Math.PI / 2 + Math.PI/8;
    drone.add(cameraLensMesh);

    let lensTexture = textureLoader.load('resources/lens.png');

    let cameraGlassGeometry = new THREE.CircleGeometry(3.5,20);
    let cameraGlassMaterial = new THREE.MeshPhongMaterial({map:lensTexture});
    let cameraGlassMesh = new THREE.Mesh(cameraGlassGeometry, cameraGlassMaterial);
    cameraGlassMesh.name = "cameraGlass";
    cameraGlassMesh.position.x = 0;
    cameraGlassMesh.position.y = -17.75;
    cameraGlassMesh.position.z = 7.1;
    cameraGlassMesh.rotation.x = Math.PI / 8;
    drone.add(cameraGlassMesh);

    //...

    scene.add(drone);

    drone.position.y = 30;

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
    addDroneModel();
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

    controls.target = new THREE.Vector3(0,50,0);
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

function checkKeyPress() {
    if(currentKeys[71]) // G
        propellerSpeed += 0.2;

    else if(propellerSpeed > 0.0)
        propellerSpeed -= 0.2;

    else
        propellerSpeed = 0.0;
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
    angle = angle + (propellerSpeed * elapsedTime);
    angle %= (Math.PI * 2);

    // Roterer dronens propeller
    let leftBackPropeller = drone.getObjectByName("leftBackPropeller", true);
    if (leftBackPropeller != undefined)
        leftBackPropeller.rotation.z = angle;

    let rightBackPropeller = drone.getObjectByName("rightBackPropeller", true);
    if (rightBackPropeller != undefined)
        rightBackPropeller.rotation.z = angle;

    let rightFrontPropeller = drone.getObjectByName("rightFrontPropeller", true);
    if (rightFrontPropeller != undefined)
        rightFrontPropeller.rotation.z = angle;

    let leftFrontPropeller = drone.getObjectByName("leftFrontPropeller", true);
    if (leftFrontPropeller != undefined)
        leftFrontPropeller.rotation.z = angle;
    // ...

    if (propellerSpeed > 50 && drone.position.y <= 100)
        drone.position.y += 0.3;

    else if (propellerSpeed < 50 && drone.position.y > 30)
        drone.position.y -= 0.3;

    checkKeyPress();

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
    camera.position.x = 100;
    camera.position.y = 200;
    camera.position.z = 200;
    camera.up = new THREE.Vector3(0,1,0);
    // Har ingen effekt:
    //let cameraTarget = new THREE.Vector3(10.0,10000.0,10.0);
    //camera.lookAt(cameraTarget);

    // Lys
    let directionalLight1 = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight1.position.set(400,400,-400);
    directionalLight1.castShadow = true;
    directionalLight1.shadow.camera.near = 200;
    directionalLight1.shadow.camera.far = 1000;
    directionalLight1.shadow.camera.left = -500;
    directionalLight1.shadow.camera.right = 500;
    directionalLight1.shadow.camera.top = 250;
    directionalLight1.shadow.camera.bottom = -250;
    //directionalLight1.shadow.camera.visible = true;
    scene.add(directionalLight1);
    //  Hjelpeverktøy for skyggen til retningslyset
    //let dirShadowCamHelper1 = new THREE.CameraHelper(directionalLight1.shadow.camera);
    //scene.add(dirShadowCamHelper1);

    let directionalLight2 = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight2.position.set(-400,400,400);
    directionalLight2.castShadow = true;
    directionalLight2.shadow.camera.near = 200;
    directionalLight2.shadow.camera.far = 1000;
    directionalLight2.shadow.camera.left = -500;
    directionalLight2.shadow.camera.right = 500;
    directionalLight2.shadow.camera.top = 250;
    directionalLight2.shadow.camera.bottom = -250;
    //directionalLight2.shadow.camera.visible = true;
    scene.add(directionalLight2);
    //  Hjelpeverktøy for skyggen til retningslyset
    //let dirShadowCamHelper2 = new THREE.CameraHelper(directionalLight2.shadow.camera);
    //scene.add(dirShadowCamHelper2);

    /*
    let pointLight = new THREE.PointLight(0xffffff, 1.0); //hvitt lys
    pointLight.position.set( 0, 0, 0 );
    //pointLight.castShadow = true;
    pointLight.shadowMapWidth = 512;
    pointLight.shadowMapHeight = 512;
    pointLight.shadowCameraNear = 200;
    pointLight.shadowCameraFar = 410;
    //let dirShadowCamHelper3 = new THREE.CameraHelper(pointLight.shadow.camera);
    //scene.add(dirShadowCamHelper3);

    scene.add(pointLight);
    */


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