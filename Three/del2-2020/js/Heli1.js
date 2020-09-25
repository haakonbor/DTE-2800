/**
 * Helikopter med roterende rotor.
 * 
 * Tegner et plan.
 * Tegner koordinatsystemet.
 * 
 * Definerer et helikopter vha. Object3D-klassen.
 * 
 */
//Globale varianbler:
let renderer;
let scene;
let camera;

//TEST!!!

//rotasjoner<
let angle = 0.0;
let lastTime = 0.0;

//Lys:
let light;

//Roter & zoom:
let controls; //rotere, zoone hele scenen.

let SIZE = 200;

//Helikoptermodell:
let helicopter;

import * as THREE from '../../lib/three/build/three.module.js';
import { TrackballControls } from '../../lib/three/examples/jsm/controls/TrackballControls.js';

export function main() {
	//Henter referanse til canvaset:
	let mycanvas = document.getElementById('webgl');
	
	//Lager en scene:
	scene = new THREE.Scene();
	
	//Lager et rendererobjekt (og setter st�rrelse):
	renderer = new THREE.WebGLRenderer({canvas:mycanvas, antialias:true});
	renderer.setClearColor(0xBFD1FF, 0xff);  //farge, alphaverdi.
	renderer.setSize(window.innerWidth, window.innerHeight);
	
	//Oppretter et kamera:
	camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
	camera.position.x = 10;  
	camera.position.y = 5;
	camera.position.z = 12;
	camera.up = new THREE.Vector3(0, 1, 0);			//Endrer p� kameraets oppretning.
    let target = new THREE.Vector3(0.0, 0.0, 0.0);
    camera.lookAt(target);
    
    //Lys:
	light = new THREE.DirectionalLight(0xffffff, 1.0); //farge, intensitet (1=default)
	light.position.set(2, 1, 4);
	scene.add(light);
	
	//Legg modeller til scenen:
	addModels();
	
	//Koordinatsystem:
	addCoordSystem();
	
	//Roter/zoom hele scenen:
	addControls();
	
    //H�ndterer endring av vindusst�rrelse:
    window.addEventListener('resize', onWindowResize, false);
    
	animate();
}

function addModels() {
	//Plan:
	let gPlane = new THREE.PlaneGeometry( SIZE*2, SIZE*2 );
	let mPlane = new THREE.MeshPhongMaterial( {color: 0xffff00, side: THREE.DoubleSide} );
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
	//meshCockpit.castShadow = true;
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
	meshBody.castShadow = true;
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
	
    scene.add(helicopter);
    
    //Flytter hele helikoptret:
    helicopter.position.x = -60;
    helicopter.position.y = 20;
    helicopter.position.z = -60;
}

//Legger til roter/zoom av scenen:
function addControls() {
	controls = new TrackballControls(camera);
	controls.addEventListener( 'change', render);
	controls.rotateSpeed = 1.0;
	controls.zoomSpeed = 10;
	controls.panSpeed = 0.8;
	
	controls.noZoom = false;
	controls.noPan = false;
	
	controls.staticMoving = true;
	controls.dynamicDampingFactor = 0.3;
}
//Koordinatsystemet:
function addCoordSystem() {
	addAxis(1); //x-aksen.
	addAxis(2); //y-aksen.
	addAxis(3); //z-aksen.
}

//Legger til enkeltakse (stiplet for negativ del av aksen)
//Bruker Geometry - klassen til � lage egne "modeller", her akser som 
//hver best�r av to punkter av type THREE.Vector3()
function addAxis(axis) {
	let fromNeg=new THREE.Vector3( 0, 0, 0 );
	let toNeg=new THREE.Vector3( 0, 0, 0 );
	let fromPos=new THREE.Vector3( 0, 0, 0 );
	let toPos=new THREE.Vector3( 0, 0, 0 );
	let axiscolor = 0x000000;
	
	switch (axis) {
	case 1: //x-aksen
		fromNeg=new THREE.Vector3( -SIZE, 0, 0 );;
		toNeg=new THREE.Vector3( 0, 0, 0 );
		fromPos=new THREE.Vector3( 0, 0, 0 );
		toPos=new THREE.Vector3( SIZE, 0, 0 );
		axiscolor = 0xff0000;
		break;
	case 2: //y-aksen
		fromNeg=new THREE.Vector3( 0, -SIZE, 0 );
		toNeg=new THREE.Vector3( 0, 0, 0 );
		fromPos=new THREE.Vector3( 0, 0, 0 );
		toPos=new THREE.Vector3( 0, SIZE, 0 );
		axiscolor = 0x00ff00;
		break;
	case 3: //z-aksen
		fromNeg=new THREE.Vector3( 0, 0, -SIZE );
		toNeg=new THREE.Vector3( 0, 0, 0 );
		fromPos=new THREE.Vector3( 0, 0, 0 );
		toPos=new THREE.Vector3( 0, 0, SIZE );
		axiscolor = 0x0000ff;
		break;
	}
	
	let posMat = new THREE.LineBasicMaterial({ linewidth: 2, color: axiscolor });
	let negMat = new THREE.LineDashedMaterial({ linewidth: 2, color: axiscolor, dashSize: 0.5, gapSize: 0.1 });
	
    let gNeg = new THREE.Geometry(); 
    gNeg.vertices.push( fromNeg ); 
    gNeg.vertices.push( toNeg );
    let coordNeg = new THREE.Line(gNeg, negMat, THREE.LineSegments);
    coordNeg.computeLineDistances(); // NB!
    scene.add(coordNeg);
   
    let gPos = new THREE.Geometry(); 
    gPos.vertices.push( fromPos ); 
    gPos.vertices.push( toPos );
    let coordPos = new THREE.Line(gPos, posMat, THREE.LineSegments);
    coordPos.computeLineDistances();
    scene.add(coordPos);
}

function animate(currentTime) {
	requestAnimationFrame(animate);
	if (currentTime == undefined)
	    currentTime = 0; //Udefinert f�rste gang.
	 
	let elapsed = 0.0; 			// Forl�pt tid siden siste kall p� draw().
	if (lastTime != 0.0) 		// F�rst gang er lastTime = 0.0.
		elapsed = (currentTime - lastTime)/1000; //Opererer med sekunder.
	  
	lastTime = currentTime; 	

	let rotationSpeed = (Math.PI); // Bestemmer rotasjonshastighet.
	angle = angle + (rotationSpeed * elapsed);
	angle %= (Math.PI * 2); // "Rull rundt" dersom angle >= 360 grader.

	//Roterer helikoptrets rotor:
	let rotor = helicopter.getObjectByName("rotor", true);  //true = recursive...
	//showDebug("rotor.name=" + rotor.name);
	if (rotor != undefined)
		rotor.rotation.y = angle;
	  
	//Oppdater trackball-kontrollen:
	controls.update();	
	//Tegner scenen med gitt kamera:
	render();
};

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
