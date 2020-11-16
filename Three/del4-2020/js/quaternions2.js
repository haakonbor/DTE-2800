/**
 * Rotasjoner ved hjelp av quaternioner.
 *
 * "The short definition is a quaternion is four numbers that can be used to represent a rotation and the avoid gimbal lock."
 * https://medium.com/@joshmarinacci/quaternions-are-spooky-3a228444956d
 *
 * TEST FORSKJELLEN PÅ Quaternions og "vanlige" vinkler:


 FRA: https://answers.unity.com/questions/147712/what-is-affected-by-the-w-in-quaternionxyzw.html
 Answer by keld-oelykke · Jul 28, 2011 at 10:02 PM
 a quaternion is a complex number with w as the real part and x, y, z as imaginary parts.
 If a quaternion represents a rotation then w = cos(theta / 2), where theta is the rotation angle around the axis of the quaternion.
 The axis v(v1, v2, v3) of a rotation is encoded in a quaternion: **x = v1 sin (theta / 2), y = v2 sin (theta / 2), z = v3 sin (theta / 2)*.
 If w is 1 then the quaternion defines 0 rotation angle around an undefined axis v = (0,0,0).
 If w is 0 the quaternion defines a half circle rotation since theta then could be +/- pi.
 If w is -1 the quaternion defines +/-2pi rotation angle around an undefined axis v = (0,0,0).
 A quater circle rotation around a single axis causes w to be +/- 0.5 and x/y/z to be +/- 0.5.
 Kind Regards, Keld Ølykke

 */
//Globale varianbler:
let renderer;
let scene;
let camera;

let meshSphere;
let clock = new THREE.Clock();

//Tar vare på tastetrykk:
let currentlyPressedKeys = {};
const ANGULAR_SPEED = 0.1;

let currentRotationTypes = [
    'Euler',
    'Quaternions'
];
let currentRotationType = 0;

import * as THREE from '../../lib/three/build/three.module.js';
import { addCoordSystem} from "../../lib/wfa-coord.js";

export function main() {
    //Henter referanse til canvaset:
    let mycanvas = document.getElementById('mycanvas');

    //Lager en scene:
    scene = new THREE.Scene();

    //Lager et rendererobjekt (og setter størrelse):
    renderer = new THREE.WebGLRenderer({ canvas: mycanvas, antialias: true });
    renderer.setClearColor(0xBFD104, 0xff);  //farge, alphaverdi.
    //renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setSize(mycanvas.width, mycanvas.height);

    //Kamera:
    camera = new THREE.PerspectiveCamera(75, mycanvas.width / mycanvas.height, 0.1, 1000);
    camera.position.x = 0;
    camera.position.y = 500;
    camera.position.z = 400;
    camera.up = new THREE.Vector3(0, 1, 0);
    let target = new THREE.Vector3(0.0, 600.0, 0.0);
    camera.lookAt(target);
    camera.updateProjectionMatrix();

    //Retningsorientert lys (som gir skygge):
    let directionalLight1 = new THREE.DirectionalLight(0xffffff, 1.0); //farge, intensitet (1=default)
    directionalLight1.position.set(0, 300, 0);
    directionalLight1.target.position.set(0, 0, 0);
    directionalLight1.castShadow = true;

    scene.add(directionalLight1);

    //Legg modeller til scenen:
    addModels();

    //Koordinatsystem:
    addCoordSystem(scene);

    //H�ndterer endring av vindusst�rrelse:
    window.addEventListener('resize', onWindowResize, false);

    //Input - standard Javascript / WebGL:
    document.addEventListener('keyup', handleKeyUp, false);
    document.addEventListener('keydown', handleKeyDown, false);

    animate();
}

function randomSpherePoint(radius){
    //pick numbers between 0 and 1
    let u = Math.random();
    let v = Math.random();
    // create random spherical coordinate
    let theta = 2 * Math.PI * u;
    let phi = Math.acos(2 * v-1);
    return new THREE.Spherical(radius,phi,theta)
}

function addModels() {
    //Teksturert kule:
    let loader = new THREE.TextureLoader();
    loader.load( './textures/metal1.jpg', function ( textureMap ) {

        textureMap.wrapS = THREE.RepeatWrapping;
        textureMap.wrapT = THREE.RepeatWrapping;
        textureMap.repeat.x = 10;    // Økes dersom man ønsker texture tiling.
        textureMap.repeat.y = 10;
        let material = new THREE.MeshPhongMaterial(
            {
                side: THREE.DoubleSide,
                map: textureMap,
                shading: THREE.SmoothShading,
                transparent: false,
                opacity: 0.5,
                wireframe: false,
            });

        let geometry = new THREE.SphereGeometry(500, 128, 128);
        //let material = new THREE.MeshPhongMaterial({ color: 0xEA0F09E, shading: THREE.SmoothShading,  transparent: false, opacity: 0.5 });
        meshSphere = new THREE.Mesh(geometry, material);
        //meshSphere.position.set(-50, 40, -45);
        meshSphere.castShadow = true;
        scene.add(meshSphere);

        let axesHelper = new THREE.AxesHelper( 500 );
        scene.add( axesHelper );

        let materialDingBats = new THREE.MeshPhongMaterial(
            {
                side: THREE.DoubleSide,
                color:'red',
                shading: THREE.SmoothShading,
                transparent: false,
                opacity: 0.5,
                wireframe: false,
            });
        for(let i=0; i<100; i++) {
            const building = new THREE.Mesh(
                new THREE.SphereBufferGeometry(20, 32, 32),
                materialDingBats
            );
            const pt = randomSpherePoint(500);
            building.position.setFromSpherical(pt);
            meshSphere.add(building);
        }
        let sphereAxesHelper = new THREE.AxesHelper( 570 );
        meshSphere.add( sphereAxesHelper );
    } );
}

function toRad(angle) {
    return angle/(2*Math.PI);
}

function doRotationsWithQuaternions(elapsed) {
    if (!meshSphere)
        return;

    const currentRotation = meshSphere.quaternion;

    //WS = rotasjon om X-aksen
    if (currentlyPressedKeys[83]) {	//S
        //const rot = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), toRad(-ANGULAR_SPEED));
        const rot = new THREE.Quaternion().setFromEuler(new THREE.Euler(toRad(-ANGULAR_SPEED), 0, 0));
        currentRotation.multiplyQuaternions(rot, currentRotation);
    }
    if (currentlyPressedKeys[87]) {	//W
        //const rot = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), toRad(ANGULAR_SPEED));
        const rot = new THREE.Quaternion().setFromEuler(new THREE.Euler(toRad(ANGULAR_SPEED), 0, 0));
        currentRotation.multiplyQuaternions(rot, currentRotation);
    }

    //AD = rotasjon om Y-aksen
    if (currentlyPressedKeys[65]) { //A
        const rot = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), toRad(-ANGULAR_SPEED));
        currentRotation.multiplyQuaternions(rot, currentRotation);
    }
    if (currentlyPressedKeys[68]) {	//D
        const rot = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), toRad(ANGULAR_SPEED));
        currentRotation.multiplyQuaternions(rot, currentRotation);
    }

    //FG = rotasjon om Z-aksen
    if (currentlyPressedKeys[70]) {	//F
        const rot = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), toRad(-ANGULAR_SPEED));
        currentRotation.multiplyQuaternions(rot, currentRotation);
    }
    if (currentlyPressedKeys[71]) {	//G
        const rot = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), toRad(ANGULAR_SPEED));
        currentRotation.multiplyQuaternions(rot, currentRotation);
    }
}

let xRot=0,yRot=0,zRot=0;
// Gir "gimbal lock":
function doRotationsWithEulerAngles(elapsed) {
    //WS = rotasjon om X-aksen
    if (currentlyPressedKeys[83]) {	//S
        xRot = xRot + (toRad(ANGULAR_SPEED));
        meshSphere.rotation.x = xRot
    }
    if (currentlyPressedKeys[87]) {	//W
        xRot = xRot - (toRad(ANGULAR_SPEED));
        meshSphere.rotation.x = xRot
    }
    xRot %= (Math.PI * 2);

    //AD = rotasjon om Y-aksen
    if (currentlyPressedKeys[65]) { //A
        yRot = yRot + (toRad(ANGULAR_SPEED));
        meshSphere.rotation.y = yRot
    }
    if (currentlyPressedKeys[68]) {	//D
        yRot = yRot - (toRad(ANGULAR_SPEED));
        meshSphere.rotation.y = yRot
    }
    yRot %= (Math.PI * 2);

    //FG = rotasjon om Z-aksen
    if (currentlyPressedKeys[70]) {	//F
        zRot = zRot + (toRad(ANGULAR_SPEED));
        meshSphere.rotation.z = zRot
    }
    if (currentlyPressedKeys[71]) {	//G
        zRot = zRot - (toRad(ANGULAR_SPEED));
        meshSphere.rotation.z = zRot
    }
}

// TEST: Trykk og hold først på F (rotasjon om Z), deretter hold nede W (rotasjon om X)
function keyCheck(elapsed) {
    if (currentRotationType===0) {
        doRotationsWithEulerAngles(elapsed);
    } else {
        doRotationsWithQuaternions(elapsed);
    }
}

function render() {
    renderer.render(scene, camera);
}

function animate(currentTime) {
    requestAnimationFrame(animate);

    document.getElementById("rotation").innerHTML = currentRotationTypes[currentRotationType];

    let elapsed = clock.elapsedTime;

    //Sjekker input:
    keyCheck(elapsed);

    //Tegner scenen med gitt kamera:
    render();
}

/*** ANNET ***/
function handleKeyUp(event) {
    //console.log(event.keyCode);
    currentlyPressedKeys[event.keyCode] = false;

    // Veksle mellom Euler og Quaternions:
    if (event.keyCode === 32) {	//Spacebar
        if (currentRotationType===0)
            currentRotationType=1;
        else if (currentRotationType===1)
            currentRotationType=0;
    }
}

function handleKeyDown(event) {
    currentlyPressedKeys[event.keyCode] = true;
}

function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);

    render();
}
