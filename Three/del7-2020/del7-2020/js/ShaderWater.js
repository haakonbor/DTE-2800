/**
 * Bruk av shader: B�lger i vann.
 * Bruker THREE-klokka!!
 * 
 * Basert p� kode fra: https://stemkoski.github.io/Three.js/Shader-Animate.html
 * 
 */
import * as THREE from "../../lib/three/build/three.module.js";
import { TrackballControls } from '../../lib/three/examples/jsm/controls/TrackballControls.js';

//Globale varianbler:
let renderer;
let scene;
let camera;

//Roter & zoom:
let controls; 
let SIZE = 1000;
let customUniforms2;

//Bruker THREE-klokka:
let clock = new THREE.Clock();

export function main() {
	//Henter referanse til canvaset:
	let mycanvas = document.getElementById('webgl');
	
	//Scene:
	scene = new THREE.Scene();
	
	//Lager et rendererobjekt (og setter st�rrelse):
	renderer = new THREE.WebGLRenderer({canvas:mycanvas, antialias:true});
	renderer.setClearColor(0xBFD104, 0xff);  //farge, alphaverdi.
	renderer.setSize(window.innerWidth, window.innerHeight);
	renderer.shadowMap.enabled = true; //NB!
	renderer.shadowMap.type = THREE.PCFSoftShadowMap; //THREE.BasicShadowMap;
	
	//Kamera:
	camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 5000);
	camera.position.x = 0;  
	camera.position.y = 40;
	camera.position.z = 50;
	camera.up = new THREE.Vector3(0, 1, 0);	
    let target = new THREE.Vector3(0.0, 0.0, 0.0);
    camera.lookAt(target);
    
    //Lys:
	let spotLight = new THREE.SpotLight(0xffffff, 0.5); //hvitt lys
	spotLight.position.set( 0, 3000, 0 ); 
	spotLight.castShadow = true;
	let dLight = 1024;
	let sLight = dLight;
	spotLight.shadow.camera.left = - sLight;
	spotLight.shadow.camera.right = sLight;
	spotLight.shadow.camera.top = sLight;
	spotLight.shadow.camera.bottom = - sLight;
	spotLight.shadow.camera.near = dLight / 30;
	spotLight.shadow.camera.far = dLight;
	spotLight.shadow.mapSize.x = 1024 * 2;
	spotLight.shadow.mapSize.y = 1024 * 2;
	scene.add(spotLight);

	//Ambient:
	scene.add(new THREE.AmbientLight(0x221133));
	
	//Legg modeller til scenen:
	addModels();
	
	//Roter/zoom hele scenen:
	addControls();
	
    //H�ndterer endring av vindusst�rrelse:
    window.addEventListener('resize', onWindowResize, false);
    
    //Input - standard Javascript / WebGL:
    document.addEventListener('keyup', handleKeyUp, false);
	document.addEventListener('keydown', handleKeyDown, false);
	//scene.fog = new THREE.FogExp2( 0x9999ff, 0.00025 );
	
	animate();
}

function handleKeyUp(event) {
	//currentlyPressedKeys[event.keyCode] = false;
}

function handleKeyDown(event) {
	//currentlyPressedKeys[event.keyCode] = true;
}

function addModels() {

    //Kube 1:
    let gCube = new THREE.BoxGeometry(40, 40, 40);
	let tCube = new THREE.TextureLoader().load('images/bird1.png');
    let mCube = new THREE.MeshPhongMaterial({ map: tCube });
    let cube = new THREE.Mesh(gCube, mCube);
    cube.name = "cubeOne";
    cube.position.x = -70;
    cube.position.y = 20;
    cube.position.z = -100;
    cube.castShadow = true;
    scene.add(cube);

    //Vannplan...
    let noiseTexture = new THREE.TextureLoader().load('images/cloud.png');
    noiseTexture.wrapS = noiseTexture.wrapT = THREE.RepeatWrapping;

	let waterTexture = new THREE.TextureLoader().load('images/water.jpg');
    waterTexture.wrapS = waterTexture.wrapT = THREE.RepeatWrapping;

    // Bruker "this." til � lage et globalt objekt;
    customUniforms2 = {
        baseTexture: { type: "t", value: waterTexture },
        baseSpeed: { type: "f", value: 0.15 },
        noiseTexture: { type: "t", value: noiseTexture },
        noiseScale: { type: "f", value: 0.2 },
        alpha: { type: "f", value: 0.8 },
        time: { type: "f", value: 0.2 }
    };

    // create custom material from the shader code above
    //   that is within specially labeled script tags
    let customMaterial2 = new THREE.ShaderMaterial(
	{
	    uniforms: customUniforms2,
	    vertexShader: document.getElementById('vertexShader').textContent,
	    fragmentShader: document.getElementById('fragmentShader').textContent
	});

    // other material properties
    customMaterial2.side = THREE.DoubleSide;
    customMaterial2.transparent = true;

    // apply the material to a surface
    let flatGeometry = new THREE.PlaneGeometry(SIZE, SIZE);
    let surface = new THREE.Mesh(flatGeometry, customMaterial2);
    surface.position.set(0, 0, 0);
    surface.rotateX(Math.PI / 2);

    scene.add(surface);

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

function animate() {
	requestAnimationFrame(animate);

	//Bruker THREE-klokka:
	let elapsed = clock.getDelta();
		
	//Oppdater trackball-kontrollen:
	controls.update();	
	
    //B�lger?
	customUniforms2.time.value += elapsed/3;

	render();
	
};

//Sjekker tastaturet:
function keyCheck(elapsed) {
	
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
