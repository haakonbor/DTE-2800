/**
 * Demonstrerer skybox vha. CubeTextureLoader & Sprite
 *
 * SE: https://threejsfundamentals.org/threejs/lessons/threejs-backgrounds.html
 *
 * FLERE SKYBOXBILDER: https://opengameart.org/content/skiingpenguins-skybox-pack
 */
import * as THREE from "../../lib/three/build/three.module.js";
import { addCoordSystem} from "../../lib/wfa-coord.js";
import {OrbitControls} from '../../lib/three/examples/jsm/controls/OrbitControls.js';

//Globale varianbler:
let renderer;
let scene;
let camera;
let SIZE = 500;

//Tar vare p? tastetrykk:
let currentlyPressedKeys = {};
let clock = new THREE.Clock();

export function main() {
	//Henter referanse til canvaset:
	let mycanvas = document.getElementById('webgl');

	//Lager en scene:
	scene = new THREE.Scene();

	//Lager et rendererobjekt (og setter st�rrelse):
	renderer = new THREE.WebGLRenderer({canvas:mycanvas, antialias:true});
	renderer.autoClearColor = false;
	renderer.setClearColor(0xBFD104, 0xff);  //farge, alphaverdi.
	renderer.setSize(window.innerWidth, window.innerHeight);
	renderer.autoClear = false;
	renderer.shadowMap.enabled = true; //NB!
	renderer.shadowMap.type = THREE.PCFSoftShadowMap; //THREE.BasicShadowMap;

    //Kamera:
	const fov = 75;
	const aspect = 2;  // the canvas default
	const near = 0.1;
	const far = 2000;
	camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
	camera.position.x = 10;
	camera.position.y = 3;
	camera.position.z = 10;

	//Retningsorientert lys:
	let directionalLight1 = new THREE.DirectionalLight(0xffffff, 1.0); //farge, intensitet (1=default)
	directionalLight1.position.set(2, 1, 4);
	scene.add(directionalLight1);

	let directionalLight2 = new THREE.DirectionalLight(0xffffff, 1.0); //farge, intensitet (1=default)
	directionalLight2.position.set(-2, 1, -4);
	scene.add(directionalLight2);

	const controls = new OrbitControls(camera, mycanvas);
	controls.target.set(0, 0, 0);
	controls.minDistance = 500;
	controls.maxDistance = 1500;
	//controls.addEventListener('change', renderer);
	controls.update();

    //Skybox:
	addSkybox();
	addSprite();

	//Koordinatsystem:
	addCoordSystem(scene);

	//Legg modeller til scenen:
	//addModels();

	//Koordinatsystem:
	let axes = new THREE.AxesHelper(500);
	scene.add(axes);

    //H�ndterer endring av vindusst�rrelse:
    window.addEventListener('resize', onWindowResize, false);
    document.addEventListener('keyup', handleKeyUp, false);
    document.addEventListener('keydown', handleKeyDown, false);

	animate();
}

function change() {

}
function addSkybox() {
	const loader = new THREE.CubeTextureLoader();
	const texture = loader.load([
		'./images/dawnmountain-xpos.png',
		'./images/dawnmountain-xneg.png',
		'./images/dawnmountain-ypos.png',
		'./images/dawnmountain-yneg.png',
		'./images/dawnmountain-zpos.png',
		'./images/dawnmountain-zneg.png',
	]);
	scene.background = texture;
}

function addSprite() {
	// 1
	let spriteMap1 = new THREE.TextureLoader().load( "./images/bird1.png" );
	let spriteMaterial1 = new THREE.SpriteMaterial( { map: spriteMap1, color: 0xffffff } );
	let sprite1 = new THREE.Sprite( spriteMaterial1 );
	sprite1.position.set( -100, 80, 0);
	sprite1.scale.set(50,50,50);
	scene.add( sprite1 );

	// 2
	let spriteMap2 = new THREE.TextureLoader().load( "./images/tree.png" );
	let spriteMap3 = new THREE.TextureLoader().load( "./images/chocchip.png" );
	let spriteMaterial2 = new THREE.SpriteMaterial( { map: spriteMap2, color: 0xffffff } );
	let sprite2 = new THREE.Sprite( spriteMaterial2 );
	sprite2.position.set( 180, 80, 0);
	sprite2.scale.set(90,90,90);

	spriteMaterial2.map = spriteMap3;
	scene.add( sprite2 );
}

function handleKeyUp(event) {
    currentlyPressedKeys[event.keyCode] = false;
}

function handleKeyDown(event) {
    currentlyPressedKeys[event.keyCode] = true;
}

function addModels() {
    //Plan:
    let textureMap = new THREE.TextureLoader().load('images/chocchip.png');
    textureMap.wrapS = THREE.RepeatWrapping;
    textureMap.wrapT = THREE.RepeatWrapping;
    textureMap.repeat.x = 10;
    textureMap.repeat.y = 10;

    let mPlane = new THREE.MeshLambertMaterial(
	{
	    color: 0xFFAC5, // 0x912ff11,
	    side: THREE.DoubleSide,
	    map: textureMap,
	    flatShading: false,
	    wireframe: false,
	});

    let gPlane = new THREE.PlaneGeometry(SIZE, SIZE);

	let meshPlane = new THREE.Mesh( gPlane, mPlane);
	meshPlane.rotation.x = Math.PI / 2;
	scene.add(meshPlane);

	//Kube:
	let gCube = new THREE.BoxGeometry(40, 40, 40);
	let tCube =  new THREE.TextureLoader().load("images/bird1.png");
	let mCube = new THREE.MeshPhongMaterial({map : tCube});
	let cube = new THREE.Mesh(gCube, mCube);
	cube.name = "cube";
	cube.position.x = -70;
	cube.position.y = 0;
	cube.position.z = -100;
	cube.castShadow = true;
	scene.add(cube);
}

function animate(currentTime) {
    requestAnimationFrame(animate);
    let delta = clock.getDelta();
	render(delta);
};

function render(delta)
{
    renderer.render(scene, camera);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    render();
}
