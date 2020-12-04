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

let size = 50;      //St�rrelse p� kula.
let angle = 0;      //Brukes til st�rrelsesendring.

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
	let dirLight1 = new THREE.DirectionalLight( 0xffffff , 1);
	dirLight1.color.setHSL( 0.1, 1, 0.95 );
	dirLight1.position.set( -0.1, 1.75, 0.1 );
	dirLight1.position.multiplyScalar( 100 );
	dirLight1.castShadow = true;
	let dLight = 500;
	let sLight = dLight;
	dirLight1.shadow.camera.left = - sLight;
	dirLight1.shadow.camera.right = sLight;
	dirLight1.shadow.camera.top = sLight;
	dirLight1.shadow.camera.bottom = - sLight;
	dirLight1.shadow.camera.near = dLight / 30;
	dirLight1.shadow.camera.far = dLight;
	dirLight1.shadow.mapSize.x = 1024 * 2;
	dirLight1.shadow.mapSize.y = 1024 * 2;
	scene.add( dirLight1 );

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

	animate();
}

function addSphere() {
    //Definerer ekstra uniform-variabler:
	uniforms = {
	    amplitude: { value: 1.0 },
	};

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

function animate(currentTime) {
	requestAnimationFrame(animate);
		
	let time = Date.now() * 0.01;

    //Roterer kula (betyr at modelviewmatrisa endres):
	sphere.rotation.y = sphere.rotation.z = 0.01 * time;

    //Endrer st�rrelsen p� kula ved � endre p� uniform-variablene amplitude (samme verdi p� alle verteksr og fragmenter for aktuelt render-kall):
	angle%=Math.PI * 2;
	let sinAngle = Math.sin(angle);
	//NB!!
	uniforms.amplitude.value = sinAngle * size;
	angle+=0.01;

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
