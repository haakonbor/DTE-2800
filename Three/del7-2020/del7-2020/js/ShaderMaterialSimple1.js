/**
 * Bruk av ShaderMaterial
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

    //Håndterer endring av vindusstørrelse:
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
	    color: { value: new THREE.Color(0x058210) },
	    texture: { value: new THREE.TextureLoader().load("textures/chocchip.png") },
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

let size = 50;
let angle = 0;

function animate(currentTime) {
	requestAnimationFrame(animate);

	let time = Date.now() * 0.01;

    //Roterer kula (betyr at modelviewmatrisa endres):
	sphere.rotation.y = sphere.rotation.z = 0.01 * time;

    // Endrer størrelsen på kula ved å endre på uniform-variablene amplitude
	// (samme verdi på alle vertekser og fragmenter for aktuelt render-kall):
	angle%=Math.PI * 2;
	let sinAngle = Math.sin(angle);
	uniforms.amplitude.value = sinAngle * size;
	angle+=0.01;

	//Endrer farge på kula ved å endre på uniform-variabelen  color:
	uniforms.color.value.offsetHSL(0.0005, 0.003, 0);   //HSL-fargemodell: h=hue, s=saturaion, l=lightness. FRA DOC: Adds the given h, s, and l to this color's values. Internally, this converts the color's r, g and b values to HSL, adds h, s, and l, and then converts the color back to RGB.

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
