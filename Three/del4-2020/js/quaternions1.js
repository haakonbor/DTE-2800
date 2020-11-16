/**
 * Rotasjoner ved hjelp av quaternioner.
 *
 * "The short definition is a quaternion is four numbers that can be used to represent a rotation and the avoid gimbal lock."
 * https://medium.com/@joshmarinacci/quaternions-are-spooky-3a228444956d
 *
 * TEST FORSKJELLEN PÅ Quaternions og "vanlige" vinkler: Trykk og hold først på F (rotasjon om Z), deretter hold
 * nede W (rotasjon om X). Gir en "vobbel-effekt" når vanlige vinkler brukes.


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

//Roter & zoom:
let controls; //rotere, zoone hele scenen.

let SIZE = 500;
let meshSphere;
let helikopter;
let angle = 0.0;

let clock = new THREE.Clock();

//Tar vare på tastetrykk:
let currentlyPressedKeys = {};
const ANGULAR_SPEED = 0.5;

import * as THREE from '../../lib/three/build/three.module.js';
import { TrackballControls } from '../../lib/three/examples/jsm/controls/TrackballControls.js';
import { addCoordSystem} from "../../lib/wfa-coord.js";

export function main() {
    //Henter referanse til canvaset:
    let mycanvas = document.getElementById('webgl');

    //Lager en scene:
    scene = new THREE.Scene();

    //Lager et rendererobjekt (og setter st�rrelse):
    renderer = new THREE.WebGLRenderer({ canvas: mycanvas, antialias: true });
    renderer.setClearColor(0xBFD104, 0xff);  //farge, alphaverdi.
    renderer.setSize(window.innerWidth, window.innerHeight);

    //Kamera:
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.x = 100;
    camera.position.y = 140;
    camera.position.z = 100;
    camera.up = new THREE.Vector3(0, 1, 0);
    let target = new THREE.Vector3(0.0, 0.0, 0.0);
    camera.lookAt(target);

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

    //Roter/zoom hele scenen:
    addControls();

    //H�ndterer endring av vindusst�rrelse:
    window.addEventListener('resize', onWindowResize, false);

    //Input - standard Javascript / WebGL:
    document.addEventListener('keyup', handleKeyUp, false);
    document.addEventListener('keydown', handleKeyDown, false);

    animate();
}

function addHeliModel() {
    //Konteiner:
    helikopter = new THREE.Object3D();

    let loader = new THREE.TextureLoader();
    loader.load( './textures/metal1.jpg', function ( texture ) {
        //Cockpit:
        let gCockpit = new THREE.SphereGeometry(5, 32, 32);
        let mCockpit = new THREE.MeshPhongMaterial({ map: texture });
        let meshCockpit = new THREE.Mesh(gCockpit, mCockpit);
        meshCockpit.castShadow = true;
        meshCockpit.name = "cockpit";
        meshCockpit.position.x = 0;
        meshCockpit.position.y = 0;
        meshCockpit.position.z = 0;
        helikopter.add(meshCockpit);

        //Body:
        let gBody = new THREE.CylinderGeometry(1.0, 4, 12, 8, 4, false);
        let mBody = new THREE.MeshPhongMaterial({ map: texture });
        let meshBody = new THREE.Mesh(gBody, mBody);
        meshBody.castShadow = true;
        meshBody.name = "body";
        meshBody.rotation.z = Math.PI / 2;
        meshBody.position.x = -7;
        meshBody.position.y = 0;
        meshBody.position.z = 0;
        helikopter.add(meshBody);

        //Rotor:
        let gRotor = new THREE.BoxGeometry(0.2, 20, 1);
        let mRotor = new THREE.MeshBasicMaterial({ color:0x00de88});
        let meshRotor = new THREE.Mesh(gRotor, mRotor);
        meshRotor.name = "rotor";
        meshRotor.rotation.z = Math.PI / 2;
        meshRotor.rotation.y = Math.PI / 5;
        meshRotor.position.x = 0;
        meshRotor.position.y = 5;
        meshRotor.position.z = 0;
        meshRotor.castShadow = true;
        helikopter.add(meshRotor);

        //Bakrotor:
        let gBRotor = new THREE.BoxGeometry(5, 1, 0.2);
        let mBRotor = new THREE.MeshBasicMaterial({ color:0x00de88});
        let meshBRotor = new THREE.Mesh(gBRotor, mBRotor);
        meshBRotor.name = "bakrotor";
        meshBRotor.position.x = -13.0;
        meshBRotor.position.y = 1;
        meshBRotor.position.z = 0;
        helikopter.add(meshBRotor);

        scene.add(helikopter);

        //Flytter hele helikoptret:
        //helikopter.castShadow = true;	//NB!
        helikopter.position.y = 100;
        helikopter.position.x = -30;
        helikopter.position.z = 40;
    });
}

function addModels() {
    //Plan:
    let planeGeometry = new THREE.PlaneGeometry(SIZE * 2, SIZE * 2);
    let lambertMaterial = new THREE.MeshLambertMaterial({ color: 0x0677F4, side: THREE.DoubleSide });
    let meshPlane = new THREE.Mesh(planeGeometry, lambertMaterial);
    meshPlane.rotation.x = Math.PI / 2;
    meshPlane.receiveShadow = true;	//NB!
    scene.add(meshPlane);

    //Teksturert kule:
    let loader = new THREE.TextureLoader();
    loader.load( './textures/metal1.jpg', function ( texture ) {

        let geometry = new THREE.SphereGeometry(20, 32, 32);
        //let material = new THREE.MeshPhongMaterial({ color: 0xEA0000, shading: THREE.SmoothShading });
        let material = new THREE.MeshBasicMaterial( { map: texture } );
        meshSphere = new THREE.Mesh(geometry, material);
        meshSphere.position.set(-50, 40, -45);
        meshSphere.castShadow = true;
        scene.add(meshSphere);

        let axesHelper = new THREE.AxesHelper( 50 );
        meshSphere.add( axesHelper );

    } );

    // Helikopter:
    addHeliModel();
}

//Legger til roter/zoom av scenen:
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

function toRad(angle) {
    return angle/(2*Math.PI);
}

function doRotationsWithQuaternions(elapsed, meshToRotate) {
    const currentRotation = meshToRotate.quaternion;

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
function doRotationsWithAngles(elapsed, meshToRotate) {
    //WS = rotasjon om X-aksen
    if (currentlyPressedKeys[83]) {	//S
        xRot = xRot + (toRad(ANGULAR_SPEED));
        meshToRotate.rotation.x = xRot
    }
    if (currentlyPressedKeys[87]) {	//W
        xRot = xRot - (toRad(ANGULAR_SPEED));
        meshToRotate.rotation.x = xRot
    }
    xRot %= (Math.PI * 2);

    //AD = rotasjon om Y-aksen
    if (currentlyPressedKeys[65]) { //A
        yRot = yRot + (toRad(ANGULAR_SPEED));
        meshToRotate.rotation.y = yRot
    }
    if (currentlyPressedKeys[68]) {	//D
        yRot = yRot - (toRad(ANGULAR_SPEED));
        meshToRotate.rotation.y = yRot
    }
    yRot %= (Math.PI * 2);

    //FG = rotasjon om Z-aksen
    if (currentlyPressedKeys[70]) {	//F
        zRot = zRot + (toRad(ANGULAR_SPEED));
        meshToRotate.rotation.z = zRot
    }
    if (currentlyPressedKeys[71]) {	//G
        zRot = zRot - (toRad(ANGULAR_SPEED));
        meshToRotate.rotation.z = zRot
    }
}

// TEST: Trykk og hold først på F (rotasjon om Z), deretter hold nede W (rotasjon om X)
function keyCheck(elapsed) {
    // TEST: Trykk og hold først på F (rotasjon om Z), deretter hold nede W (rotasjon om X)
    if (helikopter) {
        doRotationsWithQuaternions(elapsed, helikopter);
        //doRotationsWithAngles(elapsed, helikopter);
    }
}

function render() {
    renderer.render(scene, camera);
}

function animate(currentTime) {
    requestAnimationFrame(animate);

    let elapsed = clock.getDelta(); 	// Forl�pt tid siden siste kall på animate().

    let rotationSpeed = Math.PI * 2; // Bestemmer rotasjonshastighet.
    angle = angle + (rotationSpeed * elapsed);
    angle %= (Math.PI * 2); // "Rull rundt" dersom angle >= 360 grader.

    //Roterer helikoptrets rotor:
    let rotor = helikopter.getObjectByName("rotor", true);  //true = recursive...
    //showDebug("rotor.name=" + rotor.name);
    if (rotor !== undefined)
        rotor.rotation.y = angle;
    let bakrotor = helikopter.getObjectByName("bakrotor", true);  //true = recursive...
    if (bakrotor !== undefined)
        bakrotor.rotation.z = angle;

    //Sjekker input:
    keyCheck(elapsed);

    //Oppdater trackball-kontrollen:
    controls.update();

    //Tegner scenen med gitt kamera:
    render();
}

/*** ANNET ***/
function handleKeyUp(event) {
    //console.log(event.keyCode);
    currentlyPressedKeys[event.keyCode] = false;
}

function handleKeyDown(event) {
    currentlyPressedKeys[event.keyCode] = true;
}

function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);

    controls.handleResize();
    render();
}
