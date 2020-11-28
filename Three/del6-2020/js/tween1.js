/**
 * Tween-demo.
 * Se: https://github.com/tweenjs/tween.js/
 *     https://github.com/tweenjs/tween.js/blob/master/docs/user_guide.md
 */
import * as THREE from "../../lib/three/build/three.module.js";
import { TrackballControls } from '../../lib/three/examples/jsm/controls/TrackballControls.js';
import { addCoordSystem} from "../../lib/wfa-coord.js";
import {TWEEN} from '../../lib/three/examples/jsm/libs/tween.module.min.js';

//Globale varianbler:
let renderer;
let scene;
let camera;

//Roter & zoom:
let controls; //rotere, zoone hele scenen.
let SIZE = 200;

let tween;
let gruppe;

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
	camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000);
	camera.position.x = 130;
	camera.position.y = 300;
	camera.position.z = 250;
	camera.up = new THREE.Vector3(0, 1, 0);
    let target = new THREE.Vector3(0.0, 0.0, 0.0);
    camera.lookAt(target);

    //Lys:
	let spotLight = new THREE.SpotLight(0xffffff); //hvitt lys
	spotLight.position.set( 0, 400, 0 );
	spotLight.castShadow = true;
	spotLight.shadow.mapWidth = 1024;
	spotLight.shadow.mapHeight = 1024;
	spotLight.shadow.cameraNear = 200;
	spotLight.shadow.cameraFar = 410;
	spotLight.shadow.cameraVisible = false;		//NB!! Viser lyskildens posisjon og utstrekning.
	scene.add(spotLight);

	//Retningsorientert lys:
	let directionalLight1 = new THREE.DirectionalLight(0xffffff, 1.0); //farge, intensitet (1=default)
	directionalLight1.position.set(2, 1, 4);
	scene.add(directionalLight1);

	let directionalLight2 = new THREE.DirectionalLight(0xffffff, 1.0); //farge, intensitet (1=default)
	directionalLight2.position.set(-2, 1, -4);
	scene.add(directionalLight2);

    //Tween, NB! ...onUpdate(doWhatEver):
	// SE: https://github.com/tweenjs/tween.js/blob/master/docs/user_guide.md
	tween = new TWEEN.Tween({ y: 0 })
		.to({ y: 180 }, 3000)
		.easing(TWEEN.Easing.Bounce.InOut)
		.yoyo(true)
		.repeat(Infinity)
		.onUpdate(doWhatEver);

	//Legg modeller til scenen:
	addModels();

	//Koordinatsystem:
	addCoordSystem(scene);

	addControls();

    //H�ndterer endring av vindusst�rrelse:
    window.addEventListener('resize', onWindowResize, false);

    tween.start();

    animate();

}

//Brukes av tween:
function doWhatEver(object) {
    // Bruk y'en til noe...:
    gruppe.position.set(0, object.y, 0);
};

function addModels() {
    //Plan:
    let gPlane = new THREE.PlaneGeometry(SIZE * 2, SIZE * 2);
    let mPlane = new THREE.MeshLambertMaterial({ color: 0xA0A0A0, side: THREE.DoubleSide });
    let meshPlane = new THREE.Mesh(gPlane, mPlane);
    meshPlane.rotation.x = Math.PI / 2;
    meshPlane.receiveShadow = true;	//NB!
    scene.add(meshPlane);

    //Object3D
	gruppe = new THREE.Object3D();

	//Kube 1:
	let gCube = new THREE.BoxGeometry(40, 40, 40);
	let tCube = THREE.ImageUtils.loadTexture("textures/bird1.png");
	let mCube = new THREE.MeshPhongMaterial({map : tCube});
	let cube = new THREE.Mesh(gCube, mCube);
	cube.name = "cubeOne";
	//Legger kuben til scenen:
	cube.position.x = -70;
	cube.position.y = 20;
	cube.position.z = -100;
	cube.castShadow = true;
	gruppe.add(cube);

	//Kube 2:
	let gCube1 = new THREE.BoxGeometry(40, 40, 40);
	let tCube1 = THREE.ImageUtils.loadTexture("textures/metal1.jpg");
	let mCube1 = new THREE.MeshPhongMaterial({map : tCube1});
	let cube1 = new THREE.Mesh(gCube1, mCube1);
	cube1.name = "cubeTwo";
	//Legger kuben til scenen:
	cube1.position.x = 70;
	cube1.position.y = 20;
	cube1.position.z = -100;
	cube1.castShadow = true;
	gruppe.add(cube1);

	gruppe.position.x = 20;
	gruppe.position.y = 20;
	gruppe.position.z = 20;

    //Lyd
	/*
    let listener1 = new THREE.AudioListener();
    camera.add(listener1);
    let sound1 = new THREE.Audio(listener1);
    let loader = new THREE.AudioLoader();
    cube1.add(sound1);
    // load a resource
    loader.load(
        // resource URL
        'assets/audio/dog.ogg',
        // Function when resource is loaded
        function (audioBuffer) {
            // set the audio object buffer to the loaded object
            sound1.setBuffer(audioBuffer);
            // play the audio
            sound1.play();
            sound1.setLoop(true);
        },
        // Function called when download progresses
        function (xhr) {
            console.log((xhr.loaded / xhr.total * 100) + '% loaded');
        },
        // Function called when download errors
        function (xhr) {
            console.log('An error happened');
        }
    );
	*/

    //Pil:
    let dir = new THREE.Vector3(0, 1, 0);
    let origin = gruppe.position; //new THREE.Vector3(10, 0, 0);
    let length = 50;
    let hex = 0xff0000;

    let arrowHelper = new THREE.ArrowHelper(dir, origin, length, hex);
    gruppe.add(arrowHelper);

	scene.add(gruppe);
}

//Legger til roter/zoom av scenen:
function addControls() {
    //NB! Viktit med renderer.domElement her pga. dat-gui (hvis ikke henger kontrollen fast i musepekeren).
    controls = new TrackballControls(camera, renderer.domElement);
	controls.addEventListener( 'change', render);
	controls.rotateSpeed = 1.0;
	controls.zoomSpeed = 10;
	controls.panSpeed = 0.8;

	controls.noZoom = false;
	controls.noPan = false;

	controls.staticMoving = true;
	controls.dynamicDampingFactor = 0.3;

}

//function animate(currentTime) {
function animate(currentTime) {
	requestAnimationFrame(animate);

    //Oppdaterer tween:
	TWEEN.update(currentTime);

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
