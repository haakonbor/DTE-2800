/**
 * Bruk av shader: Terreng & b�lger
 *
 */
import * as THREE from "../../lib/three/build/three.module.js";
import { TrackballControls } from '../../lib/three/examples/jsm/controls/TrackballControls.js';

//Globale varianbler:
let renderer;
let scene;
let camera;

//Roter & zoom:
let controls; //rotere, zoone hele scenen.

let sphere;
let uniforms;
let my_displacements;
let noise;

export function main() {
	//Henter referanse til canvaset:
	let mycanvas = document.getElementById('webgl');

	//Scene:
	scene = new THREE.Scene();

	//Lager et rendererobjekt (og setter st�rrelse):
	renderer = new THREE.WebGLRenderer({canvas:mycanvas, antialias:true});
	renderer.setClearColor(0xBFD104, 0xff);  //farge, alphaverdi.
	renderer.setSize(window.innerWidth, window.innerHeight);
	renderer.setPixelRatio(window.devicePixelRatio);  //Fra: https://threejs.org/examples/webgl_custom_attributes.html

	//Kamera:
	camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 5000);
	camera.position.x = 130;
	camera.position.y = 200;
	camera.position.z = 150;
	camera.up = new THREE.Vector3(0, 1, 0);
    let target = new THREE.Vector3(0.0, 0.0, 0.0);
    camera.lookAt(target);

    //Lys:
	let spotLight = new THREE.SpotLight(0xffffff, 0.5); //hvitt lys
	spotLight.position.set( 0, 3000, 0 );
	spotLight.castShadow = true;
	spotLight.shadowMapWidth = 1024;
	spotLight.shadowMapHeight = 1024;
	spotLight.shadowCameraNear = 200;
	spotLight.shadowCameraFar = 3500;
	spotLight.shadowCameraVisible = false;		//NB!! Viser lyskildens posisjon og utstrekning.
	scene.add(spotLight);

	//Ambient:
	scene.add(new THREE.AmbientLight(0x221133));

	//Legg modeller til scenen:
	addSphere();

	//Koordinatsystem:
	//addCoordSystem();

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

}

function handleKeyDown(event) {

}

function addSphere() {
    //Definerer ekstra uniform-variabler:
	uniforms = {
	    amplitude: { value: 1.0 },
	    color: { value: new THREE.Color(0xff2200) },
	    texture: { value: new THREE.TextureLoader().load("images/water2.png") },
	};
	uniforms.texture.value.wrapS = uniforms.texture.value.wrapT = THREE.RepeatWrapping;

    //Bruker ShaderMaterial, leverer med uniforms, verteks- og fragmentshader:
	let shaderMaterial = new THREE.ShaderMaterial({
	    uniforms: uniforms,
	    vertexShader: document.getElementById('vertexshader').textContent,
	    fragmentShader: document.getElementById('fragmentshader').textContent
	});

	let radius = 50, segments = 128, rings = 64;
	let geometry = new THREE.SphereBufferGeometry(radius, segments, rings);

    //Definerer array for en ekstra attribute-variabel, antall elementer = antall vertekser:
	my_displacements = new Float32Array(geometry.attributes.position.count);

    //Brukes til å legge til "støy"/tilfeldige verdier displacement:
	noise = new Float32Array(geometry.attributes.position.count);
	for (let i = 0; i < my_displacements.length; i++) {
	    noise[i] = Math.random() * 5;
	}

    //Kopler my_displacements-arrayet til displacement-attributtet i shaderen:
	geometry.addAttribute('displacement', new THREE.BufferAttribute(my_displacements, 1)); //Dersom man skal sende inn ev Vector3 er itemSize = 3.

    //Lag mesh:
	sphere = new THREE.Mesh(geometry, shaderMaterial);
	scene.add(sphere);
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

function animate(currentTime) {
	requestAnimationFrame(animate);

	let time = Date.now() * 0.01;

    //Roterer kula:
	sphere.rotation.y = sphere.rotation.z = 0.01 * time;

    //Endrer på uniform-variablene amplitude og color (samme verdi på alle vertekser og fragmenter for aktuelt render-kall):
	uniforms.amplitude.value = 2.5 * Math.sin(sphere.rotation.y * 0.125);
	uniforms.color.value.offsetHSL(0.0005, 0, 0);

    //Endrer på attributtet displacement, dvs ny unik verdi for alle vertekser (for aktuelt render-kall):
	for (let i = 0; i < my_displacements.length; i++) {
	    my_displacements[i] = Math.sin(0.1 * i + time);
        //Legger til litt støy:
	    noise[i] += 0.5 * (0.5 - Math.random());
	    noise[i] = THREE.Math.clamp(noise[i], -5, 5);
	    my_displacements[i] += noise[i];
	}
    //NB! Marker at endringer er utf�rt:
	sphere.geometry.attributes.displacement.needsUpdate = true;

	controls.update();
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
