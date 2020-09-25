/**
 * Enkel roterende teksturert kube MED LYS.
 *
 * Bruker:
 * lys av type THREE.DirectionalLight
 * materiale av type THREE.MeshPhongMaterial
 */

import * as THREE from '../../lib/three/build/three.module.js';

//Globale varianbler:
let renderer;
let cube;
let scene;
let camera;

//rotasjoner
let angle = 0.0;
let lastTime = 0.0;

export function main() {
	//Henter referanse til canvaset:
	let mycanvas = document.getElementById('webgl');
	//Lager en scene:
	scene = new THREE.Scene();
	scene.background = new THREE.Color( 0xdddddd );

	//Oppretter et kamera:
	camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
	//Lager et rendererobjekt (og setter st�rrelse):
	renderer = new THREE.WebGLRenderer({canvas:mycanvas, antialias:true});
	renderer.setClearColor(0xBFD1FF, 0xff);  //farge, alphaverdi.
	renderer.setSize(window.innerWidth, window.innerHeight);

	//Definerer geometri og MeshPongMaterial for en kuben:
	let geometry = new THREE.CubeGeometry(1, 1, 1);
	let teksturURL = 'images/bird1.png';
	let mintekstur = new THREE.TextureLoader().load(teksturURL);
	let material = new THREE.MeshPhongMaterial({map : mintekstur});	//NB! MeshPhongMaterial

	//Lys:
	let light1 = new THREE.DirectionalLight(0xffffff, 1.0); //farge, intensitet (1=default)
	light1.position.set(2, 1, 4);
	scene.add(light1);

	let light2 = new THREE.DirectionalLight(0xffffff, 1.0); //farge, intensitet (1=default)
	light2.position.set(-2, -1, -4);
	scene.add(light2);

	//let material = new THREE.MeshBasicMaterial({color:0xff9900, map : mintekstur});
	//Oppretter et kubemesh vha. geomatri og materiale:
	cube = new THREE.Mesh(geometry, material);
	//Legger kuben til scenen:
	scene.add(cube);
	//Flytter litt p0 kamera (st�r opprinnelig i 0,0,0):
	camera.position.x = 1;
	camera.position.y = 1;
	camera.position.z = 3;

	// Koordinatsystem
	let axesHelper = new THREE.AxesHelper( 5 );
	scene.add( axesHelper );

	animate();
}

function animate(currentTime) {
	requestAnimationFrame(animate);
	if (currentTime === undefined)
		currentTime = 0; //Udefinert f�rste gang.

	let elapsed = 0.0; 			// Forl�pt tid siden siste kall p� draw().
	if (lastTime !== 0.0) 		// F�rst gang er lastTime = 0.0.
		elapsed = (currentTime - lastTime)/1000; //Opererer med sekunder.

	lastTime = currentTime;
	// F�lgende gir 60 graders rotasjon per sekund og 6 sekunder for en hel rotasjon:
	let rotationSpeed = (Math.PI / 3); // Bestemmer rotasjonshastighet.
	angle = angle + (rotationSpeed * elapsed);
	angle %= (Math.PI * 2); // "Rull rundt" dersom angle >= 360 grader.

	//Transformerer (roterer) kuben:
	cube.rotation.x = angle;
	cube.rotation.y = angle;

	//Tegner scenen med gitt kamera:
	renderer.render(scene, camera);
}

