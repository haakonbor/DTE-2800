/**
 * FirstPersonControls
 */
import * as THREE from "../../lib/three/build/three.module.js";
import { FirstPersonControls } from '../../lib/three/examples/jsm/controls/FirstPersonControls.js';
import { addCoordSystem } from "../../lib/wfa-coord.js";

//Globale varianbler:
let renderer;
let scene;
let camera;

//rotasjoner
let angle = 0.0;
let lastTime = 0.0;

//FirstPersonControls:
let controls;

let SIZE = 200;

let helicopter;									//Helikoptermodellen.
let heliSpeed = 0.2;							//Helokoptrets hastighet.
let speedVector = new THREE.Vector3(0.3,0,0.1);		//Fartsvektor.
let positionVector = new THREE.Vector3(0.3,0,0.1); 	//Posisjonsvetor.
let delta = Math.PI/100;  						//Hvor mye fartsvektoren roterer
let axis = new THREE.Vector3( 0, 1, 0 );		//Hvilken akse fartsvektoren roterer rundt.
  
//Tar vare på tastetrykk:
let currentlyPressedKeys = {};

let clock = new THREE.Clock();

export function main() {
	//Henter referanse til canvaset:
	let mycanvas = document.getElementById('webgl');
	
	//Lager en scene:
	scene = new THREE.Scene();
	
	//Lager et rendererobjekt (og setter st�rrelse):
	renderer = new THREE.WebGLRenderer({canvas:mycanvas, antialias:true});
	renderer.setClearColor(0xBFD104, 0xff);  //farge, alphaverdi.
	renderer.setSize(window.innerWidth, window.innerHeight);
	renderer.shadowMapEnabled = true; //NB!
	renderer.shadowMapType = THREE.PCFSoftShadowMap; //THREE.BasicShadowMap;
	
	//Oppretter et kamera:
	camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
	camera.position.x = 100;
	camera.position.y = 160;
	camera.position.z = 430;
	camera.up = new THREE.Vector3(0, 1, 0);	
    let target = new THREE.Vector3(0.0, 0.0, 0.0);
    camera.lookAt(target);
    
    //Lys:
	let spotLight = new THREE.SpotLight(0xffffff); //hvitt lys
	spotLight.position.set( 0, 400, 0 ); 
	scene.add(spotLight);
	
	//Retningsorientert lys:
	let directionalLight = new THREE.DirectionalLight(0x5055ff, 1.0); //farge, intensitet (1=default)
	directionalLight.position.set(2, 1, 4);
	scene.add(directionalLight);
	
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

function handleKeyUp(event) {
	currentlyPressedKeys[event.keyCode] = false;
}

function handleKeyDown(event) {
	currentlyPressedKeys[event.keyCode] = true;
}

function addModels() {
	//Plan:
	let gPlane = new THREE.PlaneGeometry( SIZE*2, SIZE*2 );
	let mPlane = new THREE.MeshLambertMaterial( {color: 0x91affff, side: THREE.DoubleSide } );
	let meshPlane = new THREE.Mesh( gPlane, mPlane);
	meshPlane.rotation.x = Math.PI / 2;
	scene.add(meshPlane);
	
	//Helikopter:
	addHeliModel();
}

function addHeliModel() {
	//Konteiner:
	helicopter = new THREE.Object3D();
	
	//Cockpit:
	let texCocpit = THREE.ImageUtils.loadTexture('images/metal1.jpg');	
	let gCockpit = new THREE.SphereGeometry(5, 32, 32);
	let mCockpit = new THREE.MeshPhongMaterial({ map: texCocpit });
	let meshCockpit = new THREE.Mesh(gCockpit, mCockpit);
	meshCockpit.name = "cockpit";
	meshCockpit.position.x = 0;
	meshCockpit.position.y = 0;
	meshCockpit.position.z = 0;	
	helicopter.add(meshCockpit);

	//Body:
	let texBody = THREE.ImageUtils.loadTexture('images/metal1.jpg');	
	let gBody = new THREE.CylinderGeometry(1.0, 4, 12, 8, 4, false);
	let mBody = new THREE.MeshPhongMaterial({ map: texBody });
	let meshBody = new THREE.Mesh(gBody, mBody);
	meshBody.name = "body";
	meshBody.rotation.z = Math.PI / 2;
	meshBody.position.x = -7;
	meshBody.position.y = 0;
	meshBody.position.z = 0;
	helicopter.add(meshBody);
	
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
	helicopter.add(meshRotor);
	
	//Bakrotor:
	let gBRotor = new THREE.BoxGeometry(5, 1, 0.2);
	let mBRotor = new THREE.MeshBasicMaterial({ color:0x00de88});
	let meshBRotor = new THREE.Mesh(gBRotor, mBRotor);
	meshBRotor.name = "bakrotor";
	meshBRotor.position.x = -13.0;
	meshBRotor.position.y = 1;
	meshBRotor.position.z = 0;
	helicopter.add(meshBRotor);
	
    scene.add(helicopter);
    
    //Flytter hele helikoptret:
    helicopter.position.y = 100;
}

//Legger til roter/zoom av scenen:
function addControls() {

    controls = new FirstPersonControls(camera);
    controls.lookSpeed = 0.4;
    controls.movementSpeed = 20;
    controls.noFly = true;
    controls.lookVertical = true;
    controls.constrainVertical = true;
    controls.verticalMin = 1.0;
    controls.verticalMax = 2.0;
    controls.lon = -150;
    controls.lat = 120;

}

function animate() {
	requestAnimationFrame(animate);

	let delta = clock.getDelta();

	let rotationSpeed = (Math.PI); // Bestemmer rotasjonshastighet.
	angle = angle + (rotationSpeed * delta);
	angle %= (Math.PI * 2); // "Rull rundt" dersom angle >= 360 grader.

	//Roterer helikoptrets rotor:
	let rotor = helicopter.getObjectByName("rotor", true);  //true = recursive...
	//showDebug("rotor.name=" + rotor.name);
	if (rotor != undefined)
		rotor.rotation.y = angle;
	let bakrotor = helicopter.getObjectByName("bakrotor", true);  //true = recursive...
	if (bakrotor != undefined)
		bakrotor.rotation.z = angle;
	
	positionVector.x = positionVector.x + (speedVector.x * heliSpeed);
	positionVector.y = 0;
	positionVector.z = positionVector.z + (speedVector.z * heliSpeed);

	helicopter.position.x = positionVector.x;
	helicopter.position.z = positionVector.z;
	
	helicopter.rotation.y = getRotationAngleUsingAtan2();
	
	//Sjekker input:
	keyCheck();
	
    //Oppdater FirstPerson-kontrollen:
	controls.update(delta);

	//Tegner scenen med gitt kamera:
	render();
};

//Sjekker tastaturet (standard Javascript/WebGL):
function keyCheck() {
	
	if (currentlyPressedKeys[65]) { //A
		let matrix = new THREE.Matrix4().makeRotationAxis( axis, delta );
	   	speedVector.applyMatrix4( matrix );
    }
    if (currentlyPressedKeys[83]) {	//S
    	heliSpeed-=0.01;
		if (heliSpeed<=0)
			heliSpeed = 0.0;
    }
    if (currentlyPressedKeys[87]) {	//W
    	heliSpeed+=0.01;
		if (heliSpeed>=10)
			heliSpeed = 1.0;
    }
    if (currentlyPressedKeys[68]) {	//D
    	let matrix = new THREE.Matrix4().makeRotationAxis( axis, -delta );
	   	speedVector.applyMatrix4( matrix );	   	 
    }
    
    //H�yde (V/B):
    if (currentlyPressedKeys[86]) { //V
    	helicopter.position.y -= 0.3;
    }
    if (currentlyPressedKeys[66]) {	//B
    	helicopter.position.y += 0.3;
    }
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

function getRotationAngleUsingAtan2()
{
	return Math.atan2(speedVector.x, speedVector.z) - Math.PI / 2;
};
