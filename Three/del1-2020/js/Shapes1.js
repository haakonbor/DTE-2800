/**
 * Tegner flere former / shapes.
 * Lager ogs� en egendefinert modell vha. vertekser og faces.
 * 
 * Tegner et plan.
 * Tegner koordinatsystemet. Stiplet for negativ del av aksen. Bruker et Geometry-objekt som igjen brukes sammen med THREE.Line.
 * (alle XxxxxGeometry-klasser, f.eks. SphereGeometry, arver fra Geometry).
 * Bruker flere egenskaper til controls (zoomSpeed, panSpeed m.m.)
 * 
 */
//Globale varianbler:
let renderer;
let scene;
let camera;

//rotasjoner
let angle = 0.0;
let lastTime = 0.0;

//Lys:
let light;

//Roter & zoom:
let controls; //rotere, zoone hele scenen.

let SIZE = 200;

let clock = new THREE.Clock();
let meshOctahedron;

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
	camera.up = new THREE.Vector3(0, 1, 0);			//Endrer på kameraets oppretning.
    let target = new THREE.Vector3(0.0, 0.0, 0.0);
    camera.lookAt(target);
    
    //Lys:
	light = new THREE.DirectionalLight(0xffffff, 1.0); //farge, intensitet (1=default)
	light.position.set(0, 10, 0);
	scene.add(light);
	
	//Legg modeller til scenen:
	addModels();
	
	//Koordinatsystem:
	addCoordSystem();
	//let axes = new THREE.AxisHelper(SIZE);
	//scene.add(axes);
	
	//Roter/zoom hele scenen:
	addControls();
	
    //Håndterer endring av vindusstørrelse:
    window.addEventListener('resize', onWindowResize, false);
    
	animate();
}

function addModels() {
	//Definerer modeller:
	let gTorus = new THREE.TorusGeometry(10, 3, 16, 100);
	let mTorus = new THREE.MeshPhongMaterial({color : 0x90ff30});	//NB! MeshPhongMaterial
	let meshTorus = new THREE.Mesh(gTorus, mTorus);
	meshTorus.rotation.x = Math.PI / 2;
	scene.add(meshTorus);
	
	let gPlane = new THREE.PlaneGeometry( SIZE*2, SIZE*2 );
	let mPlane = new THREE.MeshPhongMaterial( {color: 0xffff00, side: THREE.DoubleSide} );
	let meshPlane = new THREE.Mesh( gPlane, mPlane);
	meshPlane.rotation.x = Math.PI / 2;
	scene.add(meshPlane);
	
	let gOctahedron = new THREE.OctahedronGeometry( 15 );
	let mOctahedron = new THREE.MeshPhongMaterial( {color: 0x000579} );
	meshOctahedron = new THREE.Mesh( gOctahedron, mOctahedron );
	meshOctahedron.position.set( -15, 5, -25 );
	scene.add( meshOctahedron );
	
	//Egegndefinert plan:
    let gPlane1 = new THREE.Geometry();
    gPlane1.vertices.push( new THREE.Vector3(0, -20, 20) );
    gPlane1.vertices.push( new THREE.Vector3(0, 20, 20) );
    gPlane1.vertices.push( new THREE.Vector3(0, -20, -20) );
    gPlane1.vertices.push( new THREE.Vector3(0, 20, -20) );
    gPlane1.faces.push( new THREE.Face3( 0, 1, 2 ) ); //NB! Culling!! Rekkef�lge...
    gPlane1.faces.push( new THREE.Face3( 1, 3, 2 ) ); //NB! Culling!! Rekkef�lge...
   		    
    let mPlane1 = new THREE.MeshBasicMaterial( { color: 0xccff00 } );
    mPlane1.side = THREE.DoubleSide;	//NB! CULLLING!!
    let plane = new THREE.Mesh(gPlane1, mPlane1);
    plane.rotation.y = Math.PI /3;
    plane.name = "myplane";
    scene.add(plane);
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
//hver består av to punkter av type THREE.Vector3()
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
	let negMat = new THREE.LineDashedMaterial({ linewidth: 2, color: axiscolor, dashSize: 30, gapSize: 10 });
	/*let negMat = new THREE.LineDashedMaterial( {
		color: 0x000000,
		linewidth: 1,
		scale: 1,
		dashSize: 3,
		gapSize: 1,
	} );*/

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

function animate() {
	requestAnimationFrame(animate);

	let elapsed = clock.getDelta(); 			// Forl�pt tid siden siste kall p� draw().
	
	// F�lgende gir 60 graders rotasjon per sekund og 6 sekunder for en hel rotasjon:
	let rotationSpeed = (Math.PI / 3); // Bestemmer rotasjonshastighet.
	angle = angle + (rotationSpeed * elapsed);
	angle = angle % (Math.PI * 2); // "Rull rundt" dersom angle >= 360 grader.

	meshOctahedron.rotation.y = angle;
	
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
