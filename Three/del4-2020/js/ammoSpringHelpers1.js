import * as THREE from "../../lib/three/build/three.module.js";
let physicsWorld;
let tmpTrans;   // Hjelpeobjekt.
let rigidBodies = [];
const TERRAIN_SIZE = 50;
const terrainWidth = 128;
const terrainDepth = 128;
let boardRotAngle = 0; //Math.PI/16;      // Dersom planet skal roteres.
let boardRotAxis = {x: 1, y:0, z: 0};

export function setupPhysicsWorld(){
	tmpTrans = new Ammo.btTransform();  // Hjelpeobjekt.
	let collisionConfiguration  = new Ammo.btDefaultCollisionConfiguration(),
		dispatcher          = new Ammo.btCollisionDispatcher(collisionConfiguration),
		overlappingPairCache= new Ammo.btDbvtBroadphase(),
		solver              = new Ammo.btSequentialImpulseConstraintSolver();

	physicsWorld           = new Ammo.btDiscreteDynamicsWorld(dispatcher, overlappingPairCache, solver, collisionConfiguration);
	physicsWorld.setGravity(new Ammo.btVector3(0, -9.81, 0));
}

export function updatePhysics( deltaTime ){
	if (!tmpTrans)
		return;
	// Step physics world:
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

export function createRandomBall(scene){
	let xPos = -14 + Math.random() * 28;
	let zPos = 15 + Math.random() * -50;
	let pos = {x: xPos, y: 20, z: zPos};
	let radius = -0.2 + Math.random()*2;
	return createBall(scene, radius, pos, 0xff0505, 5);
}

export function createTerrain(scene){

	// THREE:
	let terrainGeometry = new THREE.PlaneBufferGeometry( TERRAIN_SIZE * 2, TERRAIN_SIZE * 2, terrainWidth - 1, terrainDepth - 1 );
	terrainGeometry.rotateX( - Math.PI / 2 );
	let groundMaterial = new THREE.MeshPhongMaterial( { color: 0xC709C7, side: THREE.DoubleSide } );
	let terrainMesh = new THREE.Mesh( terrainGeometry, groundMaterial );
	terrainMesh.receiveShadow = true;
	scene.add( terrainMesh );

	let textureLoader = new THREE.TextureLoader();
	textureLoader.load( "./textures/tile2.png", function( texture ) {
		// ThreeJS, teksturering av terreng:
		texture.wrapS = THREE.RepeatWrapping;
		texture.wrapT = THREE.RepeatWrapping;
		texture.repeat.set( terrainWidth - 1, terrainDepth - 1 );
		groundMaterial.map = texture;
		groundMaterial.needsUpdate = true;

		// AmmoJS for terreng:
		let pos = {x: 0, y: 0, z: 0};
		let scale = {x: TERRAIN_SIZE * 2, y: 0 , z:TERRAIN_SIZE * 2};
		let quat = {x: 0, y: 0, z: 0, w: 1};
		let mass = 0;   //NB! Terrenget skal stå i ro.
		let transform = new Ammo.btTransform();
		let btQuat1 = new Ammo.btQuaternion();
		btQuat1.setRotation(new Ammo.btVector3(boardRotAxis.x, boardRotAxis.y, boardRotAxis.z), boardRotAngle);
		transform.setIdentity();
		transform.setOrigin( new Ammo.btVector3( pos.x, pos.y, pos.z ) );
		transform.setRotation( btQuat1 );
		let motionState = new Ammo.btDefaultMotionState( transform );
		let terrainShape = new Ammo.btBoxShape( new Ammo.btVector3( scale.x * 0.5, scale.y * 0.5, scale.z * 0.5 ) );
		//terrainShape.setMargin( 0.05 );
		let localInertia = new Ammo.btVector3( 0, 0, 0 );
		terrainShape.calculateLocalInertia( mass, localInertia );
		let rbInfo = new Ammo.btRigidBodyConstructionInfo( mass, motionState, terrainShape, localInertia );
		let terrainRigidBody = new Ammo.btRigidBody( rbInfo );
		terrainRigidBody.setRestitution(0.8);
		terrainRigidBody.setFriction(0.5);
		physicsWorld.addRigidBody( terrainRigidBody);

		// ThreeJS (resten):
		terrainMesh.userData.physicsBody = terrainRigidBody;
		terrainMesh.userData.name = 'terrain';
		rigidBodies.push(terrainMesh);

	} );
}

export function createBall(scene, radius, pos, color, mass){
	// Inputkontroll:
	if (!radius) radius = 1;
	if (!pos) pos = {x:0, y:30, z:0};
	if (!mass) mass = 1;
	if (!color) color = '#0000FF';

	mass = mass * radius;   // Gjør massen proporsjonal med størrelsen.

	let quat = {x: 0, y: 0, z: 0, w: 1};

	//Ammojs:
	let transform = new Ammo.btTransform();
	transform.setIdentity();
	transform.setOrigin( new Ammo.btVector3( pos.x, pos.y, pos.z ) );
	transform.setRotation( new Ammo.btQuaternion( quat.x, quat.y, quat.z, quat.w ) );
	let motionState = new Ammo.btDefaultMotionState( transform );
	let colShape = new Ammo.btSphereShape( radius );
	//colShape.setMargin( 0.05 );
	let localInertia = new Ammo.btVector3( 0, 0, 0 );
	colShape.calculateLocalInertia( mass, localInertia );
	let rbInfo = new Ammo.btRigidBodyConstructionInfo( mass, motionState, colShape, localInertia );
	let sphereRigidBody = new Ammo.btRigidBody( rbInfo );
	sphereRigidBody.setRestitution(0.3);
	sphereRigidBody.setFriction(0.6);
	physicsWorld.addRigidBody( sphereRigidBody);

	//ThreeJS:
	let ball = new THREE.Mesh(new THREE.SphereBufferGeometry(radius, 32, 32), new THREE.MeshPhongMaterial({color: color}));
	ball.position.set(pos.x, pos.y, pos.z);
	ball.castShadow = true;
	ball.receiveShadow = true;
	ball.userData.physicsBody = sphereRigidBody;
	ball.userData.name = 'ball';
	rigidBodies.push(ball);
	scene.add(ball);
	return sphereRigidBody;
}

// Simulerer en fjær mellom to objekter:
// Basert på: https://stackoverflow.com/questions/46671809/how-to-make-a-spring-constraint-with-bullet-physics
export function createSpringObjects(scene) {
	let mass1 = 0;
	let mass2 = 20;
	let pos1 = {x: 10, y: 20, z: 0};
	let pos2 = {x: 10, y: 10, z: 0};
	let scale = {x: 2, y: 2, z: 2};

	// Three:
	let springCubeMesh1 = new THREE.Mesh(new THREE.BoxBufferGeometry(), new THREE.MeshPhongMaterial({color: 0xf78a1d}));
	springCubeMesh1.position.set(pos1.x, pos1.y, pos1.z);
	springCubeMesh1.scale.set(scale.x, scale.y, scale.z);
	scene.add(springCubeMesh1);
	let springCubeMesh2 = springCubeMesh1.clone();
	springCubeMesh2.position.set(pos2.x, pos2.y, pos2.z);
	scene.add(springCubeMesh2);

	// Ammo: samme shape brukes av begge RBs:
	let boxShape = new Ammo.btBoxShape( new Ammo.btVector3( scale.x * 0.5, scale.y * 0.5, scale.z * 0.5 ) );

	let rbBox1 = createRB(boxShape, mass1, pos1);
	physicsWorld.addRigidBody(rbBox1);
	springCubeMesh1.userData.physicsBody = rbBox1;
	rigidBodies.push(springCubeMesh1);

	let rbBox2 = createRB(boxShape, mass2, pos2);
	physicsWorld.addRigidBody(rbBox2);
	springCubeMesh2.userData.physicsBody = rbBox2;
	rigidBodies.push(springCubeMesh2);

	//FJÆR MELLOM box1 og 2: https://stackoverflow.com/questions/46671809/how-to-make-a-spring-constraint-with-bullet-physics
	let transform1 = new Ammo.btTransform();
	transform1.setIdentity();
	transform1.setOrigin( new Ammo.btVector3( 0, -1, 0 ) );
	let transform2 = new Ammo.btTransform();
	transform2.setIdentity();
	transform2.setOrigin( new Ammo.btVector3( 0, 0, 0 ) );

	let springConstraint = new Ammo.btGeneric6DofSpringConstraint(
		rbBox1,
		rbBox2,
		transform1,
		transform2,
		true);

	// Removing any restrictions on the y-coordinate of the hanging box
	// by setting the lower limit above the upper one.
	springConstraint.setLinearLowerLimit(new Ammo.btVector3(0.0, 1.0, 0.0));
	springConstraint.setLinearUpperLimit(new Ammo.btVector3(0.0, 0.0, 0.0));

	// NB! Disse er viktig for at ikke den hengende kuben ikke skal rotere om alle akser!!
	// Disse gjør at den hengende boksen ikke roterer når den er festet til en constraint (se side 130 i Bullet-boka).
	springConstraint.setAngularLowerLimit(new Ammo.btVector3(0, 0.0, 0.0));
	springConstraint.setAngularUpperLimit(new Ammo.btVector3(0, 0.0, 0.0));

	// FRA: https://pybullet.org/Bullet/BulletFull/classbtGeneric6DofSpringConstraint.html
	// DOF index used in enableSpring() and setStiffness() means:
	// 0 : translation X
	// 1 : translation Y
	// 2 : translation Z
	// 3 : rotation X (3rd Euler rotational around new position of X axis, range [-PI+epsilon, PI-epsilon] )
	// 4 : rotation Y (2nd Euler rotational around new position of Y axis, range [-PI/2+epsilon, PI/2-epsilon] )
	// 5 : rotation Z (1st Euler rotational around Z axis, range [-PI+epsilon, PI-epsilon] )

	// Enabling the spring behavior for they y-coordinate (index = 1)
	//springConstraint.enableSpring(0,  false);
	springConstraint.enableSpring(1,  true);    // Translation on y-axis
	//springConstraint.enableSpring(2,  false);
	//springConstraint.enableSpring(3,  false);
	//springConstraint.enableSpring(4,  false);
	//springConstraint.enableSpring(5,  false);

	//springConstraint.setStiffness(0, 0);
	springConstraint.setStiffness(1, 55);
	//springConstraint.setStiffness(2, 0);

	//springConstraint.setDamping  (0,  0);
	springConstraint.setDamping  (1,  0.9);
	//springConstraint.setDamping  (2,  0);

	physicsWorld.addConstraint( springConstraint, false );
}

function createRB(shape,  mass, position) {
	let transform = new Ammo.btTransform();
	transform.setIdentity();
	transform.setOrigin( new Ammo.btVector3( position.x, position.y, position.z ) );
	let motionState = new Ammo.btDefaultMotionState( transform );
	let localInertia = new Ammo.btVector3( 0, 0, 0 );
	shape.calculateLocalInertia( mass, localInertia );
	let rbInfo = new Ammo.btRigidBodyConstructionInfo( mass, motionState, shape, localInertia );
	let rbBox = new Ammo.btRigidBody(rbInfo);
	rbBox.setRestitution(0.4);
	rbBox.setFriction(0.6);
	return rbBox;
}
