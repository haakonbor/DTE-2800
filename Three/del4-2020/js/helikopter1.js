// ********************************************************************** //
// SE BULLET DOCS: https://pybullet.org/Bullet/BulletFull/annotated.html *** //
//
// SE OGSÅ: https://medium.com/@bluemagnificent/intro-to-javascript-3d-physics-using-ammo-js-and-three-js-dd48df81f591
//      OG: https://github.com/kripken/ammo.js/
//      OG HER; http://lo-th.github.io/Ammo.lab/
//      OG: https://github.com/BlueMagnificent/baller
//   QUATERNIONS: https://medium.com/@joshmarinacci/quaternions-are-spooky-3a228444956d
//
// ********************************************************************** //

//variable declaration
import * as THREE from "../../lib/three/build/three.module.js";

let physicsWorld, scene, camera, renderer, tmpTrans, rigidBodies = [];
let colGroupPlane = 1, colGroupRedBall = 2, colGroupHelikopter = 4;
let helikopter;
let clock = new THREE.Clock();

export function start(){
	tmpTrans = new Ammo.btTransform();

	setupPhysicsWorld();
	setupGraphics();
	createBlock();
	createBall();
	createHeli();
	renderFrame();
}

function setupPhysicsWorld(){

	let collisionConfiguration  = new Ammo.btDefaultCollisionConfiguration(),
		dispatcher          = new Ammo.btCollisionDispatcher(collisionConfiguration),
		overlappingPairCache= new Ammo.btDbvtBroadphase(),
		solver              = new Ammo.btSequentialImpulseConstraintSolver();

	physicsWorld           = new Ammo.btDiscreteDynamicsWorld(dispatcher, overlappingPairCache, solver, collisionConfiguration);
	physicsWorld.setGravity(new Ammo.btVector3(0, -10, 0));

}

function setupGraphics(){

	//create the scene
	scene = new THREE.Scene();
	scene.background = new THREE.Color( 0xbfd1e5 );

	//create camera
	camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 0.2, 5000 );
	camera.position.set( 0, 30, 70 );
	camera.lookAt(new THREE.Vector3(0, 0, 0));

	//Add hemisphere light
	let hemiLight = new THREE.HemisphereLight( 0xffffff, 0xffffff, 0.1 );
	hemiLight.color.setHSL( 0.6, 0.6, 0.6 );
	hemiLight.groundColor.setHSL( 0.1, 1, 0.4 );
	hemiLight.position.set( 0, 50, 0 );
	scene.add( hemiLight );

	//Add directional light
	let dirLight = new THREE.DirectionalLight( 0xffffff , 1);
	dirLight.color.setHSL( 0.1, 1, 0.95 );
	dirLight.position.set( -1, 1.75, 1 );
	dirLight.position.multiplyScalar( 100 );
	scene.add( dirLight );

	dirLight.castShadow = true;

	dirLight.shadow.mapSize.width = 2048;
	dirLight.shadow.mapSize.height = 2048;

	let d = 50;

	dirLight.shadow.camera.left = -d;
	dirLight.shadow.camera.right = d;
	dirLight.shadow.camera.top = d;
	dirLight.shadow.camera.bottom = -d;

	dirLight.shadow.camera.far = 13500;

	//Setup the renderer
	renderer = new THREE.WebGLRenderer( { antialias: true } );
	renderer.setClearColor( 0xbfd1e5 );
	renderer.setPixelRatio( window.devicePixelRatio );
	renderer.setSize( window.innerWidth, window.innerHeight );
	document.body.appendChild( renderer.domElement );

	renderer.gammaInput = true;
	renderer.gammaOutput = true;

	renderer.shadowMap.enabled = true;

}

function createBlock(){

	let pos = {x: 0, y: 0, z: 0};
	let scale = {x: 50, y: 2, z: 50};
	let quat = {x: 0, y: 0, z: 0, w: 1};
	let mass = 0;

	//threeJS Section
	let blockPlane = new THREE.Mesh(new THREE.BoxBufferGeometry(), new THREE.MeshPhongMaterial({color: 0xa0afa4}));

	blockPlane.position.set(pos.x, pos.y, pos.z);
	blockPlane.scale.set(scale.x, scale.y, scale.z);

	blockPlane.castShadow = true;
	blockPlane.receiveShadow = true;

	scene.add(blockPlane);


	//Ammojs Section
	let transform = new Ammo.btTransform();
	transform.setIdentity();
	transform.setOrigin( new Ammo.btVector3( pos.x, pos.y, pos.z ) );
	transform.setRotation( new Ammo.btQuaternion( quat.x, quat.y, quat.z, quat.w ) );
	let motionState = new Ammo.btDefaultMotionState( transform );

	let colShape = new Ammo.btBoxShape( new Ammo.btVector3( scale.x * 0.5, scale.y * 0.5, scale.z * 0.5 ) );
	colShape.setMargin( 0.05 );

	let localInertia = new Ammo.btVector3( 0, 0, 0 );
	colShape.calculateLocalInertia( mass, localInertia );

	let rbInfo = new Ammo.btRigidBodyConstructionInfo( mass, motionState, colShape, localInertia );
	let body = new Ammo.btRigidBody( rbInfo );
	body.setRestitution(0.9);

	// physicsWorld.addRigidBody( body );
	physicsWorld.addRigidBody( body, colGroupPlane, colGroupRedBall | colGroupHelikopter );
}

function createBall(){

	let pos = {x: 0, y: 20, z: 0};
	let radius = 2;
	let quat = {x: 0, y: 0, z: 0, w: 1};
	let mass = 100;

	//threeJS Section
	let ball = new THREE.Mesh(new THREE.SphereBufferGeometry(radius), new THREE.MeshPhongMaterial({color: 0xff0505}));

	ball.position.set(pos.x, pos.y, pos.z);

	ball.castShadow = true;
	ball.receiveShadow = true;

	scene.add(ball);

	// Restitution?
	//Ammojs Section
	let transform = new Ammo.btTransform();
	transform.setIdentity();
	transform.setOrigin( new Ammo.btVector3( pos.x, pos.y, pos.z ) );
	transform.setRotation( new Ammo.btQuaternion( quat.x, quat.y, quat.z, quat.w ) );
	let motionState = new Ammo.btDefaultMotionState( transform );

	let colShape = new Ammo.btSphereShape( radius );
	colShape.setMargin( 0.05 );

	let localInertia = new Ammo.btVector3( 0, 0, 0 );
	colShape.calculateLocalInertia( mass, localInertia );

	let rbInfo = new Ammo.btRigidBodyConstructionInfo( mass, motionState, colShape, localInertia );
	let body = new Ammo.btRigidBody( rbInfo );
	body.setRestitution(0.8);

	// physicsWorld.addRigidBody( body );
	physicsWorld.addRigidBody( body, colGroupRedBall, colGroupPlane | colGroupHelikopter );

	ball.userData.physicsBody = body;
	rigidBodies.push(ball);
}

function getMeshPoitions(mesh) {
	let positions=[];
	for (let i=0; i<mesh.children.length; i++) {
		let child = mesh.children[i];
		let vertices = child.geometry.vertices;
		positions.push(...vertices);
	}
	return positions;
}

function createHeli(){

	//*** THREE: ***
	//Konteiner:
	helikopter = new THREE.Object3D();

	let loader = new THREE.TextureLoader();
	loader.load( './textures/metal1.jpg', function ( texture ) {
		//Cockpit:
		let gCockpit = new THREE.SphereGeometry(5, 32, 32);
		let mCockpit = new THREE.MeshPhongMaterial({ map: texture });
		let meshCockpit = new THREE.Mesh(gCockpit, mCockpit);
		meshCockpit.castShadow = true;
		meshCockpit.name = "cockpit";
		meshCockpit.position.x = 0;
		meshCockpit.position.y = 0;
		meshCockpit.position.z = 0;
		helikopter.add(meshCockpit);

		//Body:
		let gBody = new THREE.CylinderGeometry(1.0, 4, 12, 8, 4, false);
		let mBody = new THREE.MeshPhongMaterial({ map: texture });
		let meshBody = new THREE.Mesh(gBody, mBody);
		meshBody.castShadow = true;
		meshBody.name = "body";
		meshBody.rotation.z = Math.PI / 2;
		meshBody.position.x = -7;
		meshBody.position.y = 0;
		meshBody.position.z = 0;
		helikopter.add(meshBody);

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
		meshRotor.castShadow = true;
		helikopter.add(meshRotor);

		//Bakrotor:
		let gBRotor = new THREE.BoxGeometry(5, 1, 0.2);
		let mBRotor = new THREE.MeshBasicMaterial({ color:0x00de88});
		let meshBRotor = new THREE.Mesh(gBRotor, mBRotor);
		meshBRotor.name = "bakrotor";
		meshBRotor.position.x = -13.0;
		meshBRotor.position.y = 1;
		meshBRotor.position.z = 0;
		helikopter.add(meshBRotor);

		//Flytter hele helikoptret:
		//helikopter.position.y = 170;
		//helikopter.position.x = 90;
		//helikopter.position.z = 80;

		scene.add(helikopter);

		//** AMMO ***
		let pos = {x: -5, y: 50, z: 0};
		let radius = 2;
		let quat = {x: 0, y: 0, z: 0, w: 1};
		let mass = 1000;

		let transform = new Ammo.btTransform();
		transform.setIdentity();
		transform.setOrigin( new Ammo.btVector3( pos.x, pos.y, pos.z ) );
		transform.setRotation( new Ammo.btQuaternion( quat.x, quat.y, quat.z, quat.w ) );
		let motionState = new Ammo.btDefaultMotionState( transform );

		let heliGeo = new THREE.SphereGeometry(15, 3, 3);
		THREE.GeometryUtils.merge(heliGeo, meshCockpit);
		THREE.GeometryUtils.merge(heliGeo, meshBody);

		// let positions = getMeshPoitions(helikopter);
		let positions = heliGeo.vertices;
		let objShape = new Ammo.btConvexHullShape();
		for(let i = 0; i < positions.length; i += 3)
		{
			let pt = new Ammo.btVector3(positions[i], positions[i+1], positions[i+2]);
			objShape.addPoint(pt);
		}
		objShape.setMargin( 0.05 );

		let localInertia = new Ammo.btVector3( 0, 0, 0 );
		objShape.calculateLocalInertia( mass, localInertia );

		let rbInfo = new Ammo.btRigidBodyConstructionInfo( mass, motionState, objShape, localInertia );
		let body = new Ammo.btRigidBody( rbInfo );
		body.setRestitution(0.8);
		//body.setFriction(0);

		// physicsWorld.addRigidBody( body );
		physicsWorld.addRigidBody( body, colGroupHelikopter, colGroupPlane | colGroupRedBall );

		helikopter.userData.physicsBody = body;
		rigidBodies.push(helikopter);
	});
}

function updatePhysics( deltaTime ){

	if (!tmpTrans)
		return;

	// Step world
	physicsWorld.stepSimulation( deltaTime, 10 );

	// Update rigid bodies
	for ( let i = 0; i < rigidBodies.length; i++ ) {
		let objThree = rigidBodies[ i ];
		let objAmmo = objThree.userData.physicsBody;
		let ms = objAmmo.getMotionState();
		if ( ms ) {

			ms.getWorldTransform( tmpTrans );
			let p = tmpTrans.getOrigin();
			let q = tmpTrans.getRotation();
			objThree.position.set( p.x(), p.y(), p.z() );
			objThree.quaternion.set( q.x(), q.y(), q.z(), q.w() );

		}
	}

}

function renderFrame(){

	let deltaTime = clock.getDelta();
	updatePhysics( deltaTime );
	renderer.render( scene, camera );

	requestAnimationFrame( renderFrame );

}