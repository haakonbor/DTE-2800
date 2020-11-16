import * as THREE from "../../lib/three/build/three.module.js";
/*
	Collision margin (.setMargin(0.04) under:
	Fra: Bullet_User_manual.pdf
	Bullet uses a small collision margin for collision shapes, to improve performance and reliability of the collision detection.
	It is best not to modify the default collision margin, and if you do use a positive value: zero margin might introduce problems.
	By default this collision margin is set to 0.04

	Local inertia (treghetsmoment):
	Fra: Bullet_User_manual.pdf
	The world transform of a rigid body is in Bullet always equal to its center of mass, and its basis also defines its
	local frame for inertia. The local inertia tensor depends on the shape, and the btCollisionShape class provides a
	method to calculate the local inertia, given a mass.

 */

/*
* Original kode av Werner Farstad. Redigert slik at den roterende pinnen nå fungerer som en dør. Fjernet hjelpepilene
* og mulihgeten til å rotere pinnen/døra ved bruk av knapper. Redigerte createBox slik at den kan klassifiseres som en
* vegg, og hvis det er tilfelle så kolliderer ikke boksen/veggen med dørene.
*
* */

let physicsWorld;
let tmpTrans;   // Hjelpeobjekt.
let rbGreenBox;      // Grønn styrbar boks.
let colGroupPlane = 1,
	colGroupBall = 2,
	colGroupBox = 4,
	colGroupHingeSphere = 8,
	colGroupStick = 16;  //... osv. ; // Binært 1, 10, 100, 1000, 10000, 100000 osv
let rigidBodies = [];
const TERRAIN_SIZE = 100;
const terrainWidth = 128;
const terrainDepth = 128;

let anchorMesh, stickMesh;
let rbStick;
let boardRotAngle = 0;      // Dersom planet skal roteres.
let boardRotAxis = {x: 1, y:0, z: 0};
const IMPULSE_FORCE = 2;
let IMPULSE_FORCE_STICK = 50;

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
	// Kollisjonsdetejsjon:
	//checkCollisions(deltaTime);

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
	textureLoader.load( "./images/tile2.png", function( texture ) {
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
		// Kollisjonsfiltrering: Denne RB tilhører gruppa colGroupPlane og skal kunne kollidere med objekter i gruppene colGroupBox OG colGroupBall.
		physicsWorld.addRigidBody( terrainRigidBody, colGroupPlane,  colGroupBall | colGroupBox | colGroupStick );

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
	// Kollisjonsfiltrering: Denne RB tilhører gruppa colGroupBall og skal kunne kollidere med objekter i gruppene colGroupPlane OG colGroupBox.
	physicsWorld.addRigidBody( sphereRigidBody, colGroupBall, colGroupBall | colGroupPlane | colGroupBox | colGroupStick | colGroupHingeSphere);

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

export function createBox(scene, pos, color, mass, boxSize, isWall = false) {
	// Inputkontroll:
	if (!pos) pos = {x:0, y:5, z:20};
	if (!mass) mass = 10;
	if (!color) color = '#00FF00';
	if (!boxSize) boxSize = {width: 5, height: 20, depth:5};

	let quat = {x: 0, y: 0, z: 0, w: 1};

	// AMMO:
	let boxShape = new Ammo.btBoxShape( new Ammo.btVector3( boxSize.width/2, boxSize.height/2, boxSize.depth/2) );  //NB! Delt på 2!!
	let transform = new Ammo.btTransform();
	transform.setIdentity();
	transform.setOrigin( new Ammo.btVector3( pos.x, pos.y, pos.z ) );
	let btQuat1 = new Ammo.btQuaternion();
	btQuat1.setRotation(new Ammo.btVector3(boardRotAxis.x, boardRotAxis.y, boardRotAxis.z), boardRotAngle);
	transform.setRotation( btQuat1 );

	let motionState = new Ammo.btDefaultMotionState( transform );
	let localInertia = new Ammo.btVector3( 0, 0, 0 );
	rbGreenBox = new Ammo.btRigidBody(new Ammo.btRigidBodyConstructionInfo(mass, motionState, boxShape, localInertia));
	rbGreenBox.setRestitution(0.7);
	rbGreenBox.setFriction(0.2);
	// Kollisjonsfiltrering: Denne RB tilhører gruppa colGroupBox og skal kunne kollidere med objekter i gruppene colGroupPlane OG colGroupBall.
	if (isWall)
		physicsWorld.addRigidBody(rbGreenBox, colGroupBox, colGroupBall | colGroupPlane | colGroupBox);
	else
		physicsWorld.addRigidBody(rbGreenBox, colGroupBox, colGroupBall | colGroupPlane | colGroupStick | colGroupBox);


	// THREE:
	let boxGeometry = new THREE.BoxBufferGeometry( boxSize.width, boxSize.height, boxSize.depth);
	let boxMesh = new THREE.Mesh(boxGeometry, new THREE.MeshPhongMaterial({color: color}));
	let originBox = transform.getOrigin();
	let orientationBox = transform.getRotation();
	boxMesh.position.set(originBox.x(), originBox.y(), originBox.z());
	boxMesh.setRotationFromQuaternion(new THREE.Quaternion(orientationBox.x(), orientationBox.y(), orientationBox.z(), orientationBox.w()));
	boxMesh.castShadow = true;

	boxMesh.userData.physicsBody = rbGreenBox;
	rigidBodies.push(boxMesh);
	scene.add(boxMesh);
}

// Styrer grønn kube:
export function moveBox(currentlyPressedKeys) {
	if (!rbGreenBox)
		return;

	rbGreenBox.activate(true);
	let direction = undefined;
	let impulse = undefined;
	if (currentlyPressedKeys[65]) {	//A
		direction = {x:-1, y:0, z:0};
	}
	if (currentlyPressedKeys[68]) {	//D
		direction = {x:1, y:0, z:0};
	}
	if (currentlyPressedKeys[87]) {	//W
		direction = {x:0, y:0, z:-1};
	}
	if (currentlyPressedKeys[83]) {	//S
		direction = {x:0, y:0, z:1};
	}
	if (direction)  //<== NB! Viktig å sjekke!
		impulse = new Ammo.btVector3(direction.x*IMPULSE_FORCE, direction.y*IMPULSE_FORCE, direction.z*IMPULSE_FORCE);
	rbGreenBox.applyCentralImpulse( impulse );
}

export function applyCentralImpulseOnStick(currentlyPressedKeys, arrowHelper1, arrowHelper2, arrowHelper3) {
	if (!rbStick)
		return;

	// NB! Denne er viktig. rigid bodies "deaktiveres" når de blir stående i ro, må aktiveres før man bruke applyCentralImpulse().
	rbStick.activate(true);

	// ROTERER PLANET, bruker kvaternion:
	let threeQuat = new THREE.Quaternion();
	threeQuat.setFromAxisAngle( new THREE.Vector3( boardRotAxis.x, boardRotAxis.y, boardRotAxis.z ), boardRotAngle);

	let tmpTrans = new Ammo.btTransform();
	// STICKEN / KUBEN:
	// 1. Henter gjeldende rotasjon for "sticken"/kuben (Ammo):
	let ms1 = rbStick.getMotionState();
	ms1.getWorldTransform( tmpTrans );      // NB! worldTRANSFORM!
	let q1 = tmpTrans.getRotation();        // q1 inneholder nå stickens rotasjon.

	// 2. Lager en (THREE) vektor som peker i samme retning som sticken:
	let threeDirectionVectorStick = new THREE.Vector3(1,0,0);
	//   2.1 Lager en THREE-kvaternion for rotasjon basert på Ammo-kvaternionen (q1) over:
	let threeQuaternionStick = new THREE.Quaternion(q1.x(), q1.y(), q1.z(), q1.w());
	//   2.2 Roterer (THREE) retningsvektoren slik at den peker i samme retning som sticken:
	threeDirectionVectorStick.applyQuaternion(threeQuaternionStick);

	// 3. Illustrerer retninga vha. arrowHelper1:
	//arrowHelper1.setDirection(threeDirectionVectorStick);

	// 4. Lager vektorer som står vinkelrett på threeDirectionVectorStick vha. mesh.getWorldDirection():
	// Disse brukes igjen til å dytte sticken vha. applyCentralImpulse()
	let threeDir2 = new THREE.Vector3();
	stickMesh.getWorldDirection(threeDir2);  // NB! worldDIRECTION! Gir en vektor som peker mot Z. FRA DOC: Returns a vector representing the direction of object's positive z-axis in world space.
	let threeDir3 = new THREE.Vector3(-threeDir2.x, -threeDir2.y, -threeDir2.z);

	// 5. Viser pilene:
	//arrowHelper2.setDirection(threeDir2);
	//arrowHelper3.setDirection(threeDir3);

	/*
	// 6. "Dytter" sticken:
	if (currentlyPressedKeys[86]) {	//V
		let rdv1 = new Ammo.btVector3(threeDir2.x*IMPULSE_FORCE_STICK , threeDir2.y*IMPULSE_FORCE_STICK , threeDir2.z*IMPULSE_FORCE_STICK );
		rbStick.applyCentralImpulse( rdv1, IMPULSE_FORCE_STICK );
	}
	if (currentlyPressedKeys[66]) {	//B
		let rdv2 = new Ammo.btVector3(threeDir3.x*IMPULSE_FORCE_STICK , threeDir3.y*IMPULSE_FORCE_STICK , threeDir3.z*IMPULSE_FORCE_STICK );
		rbStick.applyCentralImpulse( rdv2, IMPULSE_FORCE_STICK );
	}
	*/
}

// Pinnen er forankret i kula (som står i ro, dvs. masse=0).
// Man bestemmer selv om ankret (Kula) skal tegnes/vises.
// Pinnen kan beveges - gjøres vha. applyCentralImpulse
export function createHingeObject(scene, pos, rot) {
	let posStick = pos;     // Cube
	let scaleStick = {x: 15, y: 25, z: 2};   // Størrelse på pinnen.
	let massStick = 50;                     // Kuben/"stikka" festes til kula og skal kunne rotere. Må derfor ha masse.

	let posAnchor = {x: pos.x, y: pos.y + 20, z: pos.z};    // Sphere, forankringspunkt.
	let radiusAnchor = 2;                         // Størrelse på kula.
	let massAnchor = 0;                     // Sphere, denne skal stå i ro.

	let transform = new Ammo.btTransform();

	//ThreeJS, kule:
	let threeQuat = new THREE.Quaternion();  // Roterer i forhold til planet (dersom satt).
	threeQuat.setFromAxisAngle( new THREE.Vector3( boardRotAxis.x, boardRotAxis.y, boardRotAxis.z ), boardRotAngle);
	anchorMesh = new THREE.Mesh(new THREE.SphereBufferGeometry(radiusAnchor), new THREE.MeshPhongMaterial({color: 0xb846db, transparent: true, opacity: 0.0}));
	anchorMesh.position.set(posAnchor.x, posAnchor.y, posAnchor.z);
	anchorMesh.setRotationFromQuaternion(threeQuat);
	anchorMesh.castShadow = true;
	anchorMesh.receiveShadow = true;
	scene.add(anchorMesh);

	//AmmoJS, kule:
	transform.setIdentity();
	transform.setOrigin( new Ammo.btVector3( posAnchor.x, posAnchor.y, posAnchor.z ) );
	let btQuat1 = new Ammo.btQuaternion();
	btQuat1.setRotation(new Ammo.btVector3(boardRotAxis.x, boardRotAxis.y, boardRotAxis.z), boardRotAngle);
	transform.setRotation( btQuat1 );
	let motionState = new Ammo.btDefaultMotionState( transform );
	let anchorColShape = new Ammo.btSphereShape( radiusAnchor );
	let localInertia = new Ammo.btVector3( 0, 0, 0 );
	anchorColShape.calculateLocalInertia( massAnchor, localInertia );
	let rbInfoAnchor = new Ammo.btRigidBodyConstructionInfo( massAnchor, motionState, anchorColShape, localInertia );
	let rbAnchor = new Ammo.btRigidBody( rbInfoAnchor );
	rbAnchor.setRestitution(0.4);
	rbAnchor.setFriction(0.6);
	physicsWorld.addRigidBody( rbAnchor, colGroupHingeSphere, colGroupBall );
	anchorMesh.userData.physicsBody = rbAnchor;
	rigidBodies.push(anchorMesh);

	//ThreeJS, kube/stick:
	stickMesh = new THREE.Mesh(new THREE.BoxBufferGeometry(), new THREE.MeshPhongMaterial({color: 0xf78a1d}));
	stickMesh.position.set(posStick.x, posStick.y, posStick.z);
	stickMesh.scale.set(scaleStick.x, scaleStick.y, scaleStick.z);
	stickMesh.setRotationFromQuaternion(threeQuat);
	stickMesh.castShadow = true;
	stickMesh.receiveShadow = true;
	scene.add(stickMesh);

	//AmmoJS, kube/stick:
	transform.setIdentity();
	transform.setOrigin( new Ammo.btVector3( posStick.x, posStick.y, posStick.z ) );
	let btQuat2 = new Ammo.btQuaternion();
	btQuat2.setRotation(new Ammo.btVector3(boardRotAxis.x, boardRotAxis.y, boardRotAxis.z), boardRotAngle); // + Math.PI/8);
	transform.setRotation( btQuat2 );
	motionState = new Ammo.btDefaultMotionState( transform );
	let stickColShape = new Ammo.btBoxShape( new Ammo.btVector3( scaleStick.x * 0.5, scaleStick.y * 0.5, scaleStick.z * 0.5 ) );
	localInertia = new Ammo.btVector3( 0, 0, 0 );
	stickColShape.calculateLocalInertia( massStick, localInertia );
	let rbInfoStick = new Ammo.btRigidBodyConstructionInfo( massStick, motionState, stickColShape, localInertia );
	rbStick = new Ammo.btRigidBody(rbInfoStick);
	rbStick.setRestitution(0.4);
	rbStick.setFriction(0.6);
	physicsWorld.addRigidBody(rbStick, colGroupStick, colGroupBall | colGroupPlane | colGroupBox);
	stickMesh.userData.physicsBody = rbStick;

	//Ammo, hengsel: SE F.EKS: https://www.panda3d.org/manual/?title=Bullet_Constraints#Hinge_Constraint:
	let anchorPivot = new Ammo.btVector3( 0, 1, 0 );
	let stickPivot = new Ammo.btVector3( rot * scaleStick.x * 0.5, 0, 0 );
	const anchorAxis = new Ammo.btVector3(0,1,0);
	const stickAxis = new Ammo.btVector3(0,1,0);
	let hingeConstraint = new Ammo.btHingeConstraint(rbAnchor, rbStick, anchorPivot, stickPivot, anchorAxis, stickAxis, false);

	// ENDRET TIL 0.7 I BEGGE RETNINGER
	let lowerLimit = -0.7; //Math.PI/2;
	let upperLimit = 0.7; //-Math.PI/2;

	hingeConstraint.setLimit( lowerLimit, upperLimit, 0.9, 0.9, 0.8);
	//hingeConstraint.setLimits( lowerLimit, upperLimit, 0.9, 2, 0.8);


	physicsWorld.addConstraint( hingeConstraint, false );
	rigidBodies.push(stickMesh);
}
