/**
 * Basert på info fra: Learning Three.js: The Javascript 3D Librarry for WebGL.
 *
 */
import * as THREE from "../../lib/three/build/three.module.js";
import { TrackballControls } from '../../lib/three/examples/jsm/controls/TrackballControls.js';
import Stats from '../../lib/three/examples/jsm/libs/stats.module.js';

//Globale varianbler:
let renderer;
let scene;
let camera;

//rotasjoner
let lastTime = 0.0;

//Roter & zoom:
let controls; //rotere, zoone hele scenen.
let currentlyPressedKeys = {};
let stats;

export function main() {
	//Henter referanse til canvaset:
	let mycanvas = document.getElementById('webgl');

	// Stats:
	stats = new Stats();
	stats.showPanel( 0 ); // 0: fps, 1: ms, 2: mb, 3+: custom
	document.body.appendChild( stats.dom );

	//Lager en scene:
	scene = new THREE.Scene();

	//Lager et rendererobjekt (og setter st�rrelse):
	renderer = new THREE.WebGLRenderer({
		canvas : mycanvas,
		antialias : true,
		//alpha: true
	});
	//renderer.setClearColor(0xBFD104, 0xff);  		//farge, alphaverdi.
	renderer.setClearColor(0xFF0000, 0xff); 		//farge, alphaverdi.
	renderer.setSize(window.innerWidth, window.innerHeight);
	renderer.shadowMap.enabled = true; //NB!
	renderer.shadowMap.type = THREE.PCFSoftShadowMap; //THREE.BasicShadowMap;

	//Oppretter et kamera:
	camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
	camera.position.x = 70;
	camera.position.y = 170;
	camera.position.z = 180;
	camera.up = new THREE.Vector3(0, 1, 0);
	let target = new THREE.Vector3(0.0, 0.0, 0.0);
	camera.lookAt(target);

	//Lys:
	let spotLight = new THREE.SpotLight(0xffffff); //hvitt lys
	spotLight.position.set(0, 400, 0);
	spotLight.castShadow = true;
	spotLight.shadow.mapSize.width = 1024;
	spotLight.shadow.mapSize.height = 1024;
	spotLight.shadow.camera.near = 200;
	spotLight.shadow.camera.far = 410;
	//spotLight.shadowCameraVisible = true;		//NB!! Viser lyskildens posisjon og utstrekning.
	scene.add(spotLight);

	//Retningsorientert lys:

	let directionalLight1 = new THREE.DirectionalLight(0xffffff, 1.0); //farge, intensitet (1=default)
	directionalLight1.position.set(100, 100, 100);
	scene.add(directionalLight1);

	let directionalLight2 = new THREE.DirectionalLight(0xffffff, 1.0); //farge, intensitet (1=default)
	directionalLight2.position.set(-50, -10, -100);
	scene.add(directionalLight2);

	//Legg modeller til scenen:
	addModels();

	//Koordinatsystem:
	//addCoordSystem(scene);

	//Roter/zoom hele scenen:
	addControls();

	window.addEventListener('resize', onWindowResize, false);
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

// KOMMENTER INN EN OG EN VARIANT:
function addModels() {
	//createParticles1();								    //Eks. Genererer individuelle Sprite-objekter.
	//createParticles2();								        //Bruker Points (samme antall)
	//createParticles3(0.1, true, 0.9, true, 0xFFFFFF);	//Lager et stort antall partikler vha. Points:
	//createParticles4(2, true, 0.5, true, 0xFFFFFF); 	//Styler vha. canvas
	//createParticles5();								//Sprite, SpriteMaterial & map. Alt. til Points/PointsMaterial & map:
	//createParticles6(2, true, 1, true, 0xFFFFFF); 	//Regndråper: Points, hver verteks beveger seg (posisjon oppdateres i animate()).
	//createParticles7(2, true, 0.5, true, 0xFFFFFF); 	//Snøflak: Flere Points's, en for hver partikkel-tekstur.
	createParticles8();								//Eks. Points basert på en ThorusKnot.
}

function createParticles1() {
    let material = new THREE.SpriteMaterial();
    //let material = new THREE.SpriteMaterial({color:0xFF0022});
	for (let x = -5; x < 5; x++) {
		for (let y = -5; y < 5; y++) {
			let sprite = new THREE.Sprite(material);
			sprite.position.set(x * 10, y * 10, 0);
			scene.add(sprite);
		}
	}
}

//Lage partikler vha. PointsMaterial
function createParticles2() {
    //Materiale:
	let material = new THREE.PointsMaterial({
	    size: 1,
		vertexColors : true,
		color : 0xff500
	});

    //Geometri, legger til posisjon og farge per verteks:
	let geom = new THREE.Geometry();
	for (let x = -5; x < 5; x++) {
		for (let y = -5; y < 5; y++) {
			let particle = new THREE.Vector3(x * 10, y * 10, 0);
			geom.vertices.push(particle);
			geom.colors.push(new THREE.Color(Math.random() * 0x00ffff));
		}
	}

	let points = new THREE.Points(geom, material);
	scene.add(points);
}

//Lager et stort antall partikler vha. Points (alle med samme farge):
function createParticles3(size, transparent, opacity, vertexColors,	sizeAttenuation, color) {
	let geom = new THREE.Geometry();
	let material = new THREE.PointsMaterial({
		size : size,
		transparent : transparent,
		opacity : opacity,
		vertexColors : vertexColors,
		sizeAttenuation : sizeAttenuation,
		color : color
	});

	let range = 500;
	let liferange = 5000;	//max antall ms

	for (let i = 0; i < 45000; i++) {
		let particle = new THREE.Vector3(
				Math.random() * range - range / 2,
				Math.random() * range - range / 2,
				Math.random() * range - range / 2);

		particle.lifetime = Math.random() * liferange;

		geom.vertices.push(particle);
		let color = new THREE.Color(0x00ff00);
		color.setHSL(
				Math.random() * color.getHSL().h,
				Math.random() * color.getHSL().s,
				Math.random() * color.getHSL().l);
		geom.colors.push(color);
	}

	let points = new THREE.Points(geom, material);
	scene.add(points);
}

//Genererer en tekstur basert på et HTML5 canvas-ovjekt:
let getTexture = function(size) {
	let canvas = document.createElement('canvas');
	canvas.width = size;
	canvas.height = size;

	let ctx = canvas.getContext('2d');
	ctx.fill();
	ctx.fillStyle = 'rgba(3, 12, 255, 1.0)'; // Bruk blå farge
	ctx.fillRect(0, 0, size, size); // Fylt rektangel
	let texture = new THREE.Texture(canvas);
	texture.needsUpdate = true;
	return texture;
}

//Styler (gir farge til) partiklene vha html5-canvas:
function createParticles4(size, transparent, opacity, sizeAttenuation, color) {
	let geom = new THREE.Geometry();

	let material = new THREE.PointsMaterial({
		size : size,
		transparent : transparent,
		opacity : opacity,
		map : getTexture(16),
		sizeAttenuation : sizeAttenuation,
		color : color
	});

	let range = 500;
	for (let i = 0; i < 15000; i++) {
		let particle = new THREE.Vector3(
				Math.random() * range - range / 2,
				Math.random() * range - range / 2,
				Math.random() * range - range / 2);
		geom.vertices.push(particle);
	}

	let points = new THREE.Points(geom, material);
	points.sortParticles = true;
	//points.frustumCulled = true;
	scene.add(points);
}

// Bruker Sprite og SpriteMaterial sammen med map (i stedet for Points og PointsMaterial/map)
// Øker man antallet til f.eks. 15000 ser man at ting går tregt.
function createParticles5() {
	let material = new THREE.SpriteMaterial({
		map : getTexture(32),
		color : 0xffffff
	});

	let range = 500;
	for (let i = 0; i < 1500; i++) {
		let sprite = new THREE.Sprite(material);
		sprite.position.set(Math.random() * range - range / 2, Math.random()
				* range - range / 2, Math.random() * range - range / 2);
		sprite.scale.set(4, 4, 4);
		scene.add(sprite);
	}
}

// Regndråper:
function createParticles6(size, transparent, opacity, sizeAttenuation, color) {
	//Endrer bakgrunn:
	renderer.setClearColor(0x000000, 0xff); 		//farge, alphaverdi.
	let texture = new THREE.TextureLoader().load("images/raindrop.png");
	scene.add(createPoints("animatedParticles", 150000, texture, size, transparent, opacity, sizeAttenuation, color));
}

//Snøflak: bruk av flere Points-systemer, en for hver partikkel-tekstur:
function createParticles7(size, transparent, opacity, sizeAttenuation, color) {
	//Endrer bakgrunn:
	renderer.setClearColor(0x000000, 0xff); 		//farge, alphaverdi.

	let texture1 = THREE.ImageUtils.loadTexture("images/snowflake1.png");
	let texture2 = THREE.ImageUtils.loadTexture("images/snowflake2.png");
	let texture3 = THREE.ImageUtils.loadTexture("images/snowflake3.png");
	let texture4 = THREE.ImageUtils.loadTexture("images/snowflake5.png");

	scene.add(createPoints("animatedParticles", 3000, texture1, size, transparent, opacity,
			sizeAttenuation, color));
	scene.add(createPoints("animatedParticles", 2000, texture2, size, transparent, opacity,
			sizeAttenuation, color));
	scene.add(createPoints("animatedParticles", 1500, texture3, size, transparent, opacity,
			sizeAttenuation, color));
	scene.add(createPoints("animatedParticles", 50000, texture4, size, transparent, opacity,
			sizeAttenuation, color));
}

function createPoints(name, count, texture, size, transparent, opacity, sizeAttenuation, color) {
	let geom = new THREE.Geometry();
	let cloudColor = new THREE.Color(color);
	//cloudColor.setHSL(color.getHSL().h, color.getHSL().s, (Math.random()) * color.getHSL().l);

	let material = new THREE.PointsMaterial({
		size : size,
		transparent : transparent,
		opacity : opacity,
		map : texture,
		blending : THREE.AdditiveBlending,
		depthWrite : false,
		sizeAttenuation : sizeAttenuation,
		color : cloudColor
	});

	let liferange = 5000;
	let range = 80;
	for (let i = 0; i < count; i++) {
		let particle = new THREE.Vector3(Math.random() * range - range / 2,
				Math.random() * range * 1.5, Math.random() * range - range / 2);
		particle.velocityY = 0.1 + Math.random() / 5;
		particle.velocityX = (Math.random() - 0.5) / 3;
		particle.velocityZ = (Math.random() - 0.5) / 3;
		particle.lifetime = Math.random() * liferange;
		geom.vertices.push(particle);
	}

	let points = new THREE.Points(geom, material);
	points.name = name;
	points.scale.x = 3;
	points.scale.y = 3;
	points.scale.z = 3;
	points.sortParticles = true;
	return points;
}

//Genererer tekstur fra canvas. Brukes av thorusknot (createParticles8()):
function getTexture1(size) {
	let canvas = document.createElement('canvas');
	canvas.width = size;
	canvas.height = size;

	let context = canvas.getContext('2d');
	let gradient = context.createRadialGradient(canvas.width / 2,
			canvas.height / 2, 0, canvas.width / 2, canvas.height / 2,
			canvas.width / 2);

	gradient.addColorStop(0, 'rgba(255,255,255,1)');
	gradient.addColorStop(0.2, 'rgba(0,255,255,1)');
	gradient.addColorStop(0.4, 'rgba(0,0,64,1)');
	gradient.addColorStop(1, 'rgba(0,0,0,1)');

	context.fillStyle = gradient;
	context.fillRect(0, 0, canvas.width, canvas.height);

	let texture = new THREE.Texture(canvas);
	texture.needsUpdate = true;
	return texture;
}

function createParticles8() {
	let geom = new THREE.TorusKnotGeometry(10, 3, 100, 16);

	let material = new THREE.PointsMaterial({
		color : 0xffffff,
		size : 3,
		transparent : true,
		opacity : 0.8,
		depthWrite : false,
		blending : THREE.AdditiveBlending,
		map : getTexture1(16)
	});

	let points = new THREE.Points(geom, material);
	points.sortParticles = true;
	points.name = "particles8";
	scene.add(points);
}

// Legger til roter/zoom av scenen:
function addControls() {
	controls = new TrackballControls(camera);
	controls.addEventListener('change', render);
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

	stats.begin();
	if (currentTime == undefined)
		currentTime = 0;

	let elapsed = 0.0;
	if (lastTime != 0.0)
		elapsed = (currentTime - lastTime) / 1000;

	lastTime = currentTime;

	// Gjennomløper og animerer alle
	scene.children.forEach((childMesh) => {
		if (childMesh instanceof THREE.Points) {
			if (childMesh.name === 'animatedParticles') {
				let vertices = childMesh.geometry.vertices;
				let v;
				for (let i = 0; i < vertices.length; i++) {
					v = vertices[i];
					if (v != null && v.lifetime > currentTime) {
						v.y = v.y - (v.velocityY);
						v.x = v.x - (v.velocityX);

						if (v.y <= 0) v.y = 60;
						if (v.x <= -20 || v.x >= 20) v.velocityX = v.velocityX * -1;
					}
					childMesh.geometry.verticesNeedUpdate = true;
				}
			}
		}
	});

	//Sjekker input:
	keyCheck(elapsed);

	//Oppdater trackball-kontrollen:
	controls.update();

	//Tegner scenen med gitt kamera:
	render();

	stats.end();
};

//Sjekker tastaturet:
function keyCheck(elapsed) {

}

function render() {
	renderer.render(scene, camera);
}

function onWindowResize() {

	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();

	renderer.setSize(window.innerWidth, window.innerHeight);

	controls.handleResize();
	render();
}
