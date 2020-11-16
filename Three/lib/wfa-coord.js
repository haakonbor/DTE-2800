/**
 * 
 */
import * as THREE from './three/build/three.module.js';

const SIZE = 1000;

//Koordinatsystemet:
export function addCoordSystem(scene) {
	addAxis(1, scene); //x-aksen.
	addAxis(2, scene); //y-aksen.
	addAxis(3, scene); //z-aksen.
}

//Legger til enkeltakse (stiplet for negativ del av aksen)
//Bruker Geometry - klassen til � lage egne "modeller", her akser som 
//hver best�r av to punkter av type THREE.Vector3()
function addAxis(axis, scene) {
	let fromNeg=new THREE.Vector3( 0, 0, 0 );
	let toNeg=new THREE.Vector3( 0, 0, 0 );
	let fromPos=new THREE.Vector3( 0, 0, 0 );
	let toPos=new THREE.Vector3( 0, 0, 0 );
	let axiscolor = 0x000000;
	
	switch (axis) {
	case 1: //x-aksen
		fromNeg=new THREE.Vector3( -SIZE, 0, 0 );;
		toNeg=new THREE.Vector3( 0, 0, 0 );
		fromPos=new THREE.Vector3( 0, 0, 0 );
		toPos=new THREE.Vector3( SIZE, 0, 0 );
		axiscolor = 0xff0000;
		break;
	case 2: //y-aksen
		fromNeg=new THREE.Vector3( 0, -SIZE, 0 );
		toNeg=new THREE.Vector3( 0, 0, 0 );
		fromPos=new THREE.Vector3( 0, 0, 0 );
		toPos=new THREE.Vector3( 0, SIZE, 0 );
		axiscolor = 0x00ff00;
		break;
	case 3: //z-aksen
		fromNeg=new THREE.Vector3( 0, 0, -SIZE );
		toNeg=new THREE.Vector3( 0, 0, 0 );
		fromPos=new THREE.Vector3( 0, 0, 0 );
		toPos=new THREE.Vector3( 0, 0, SIZE );
		axiscolor = 0x0000ff;
		break;
	}
	
	let posMat = new THREE.LineBasicMaterial({ linewidth: 2, color: axiscolor });
	let negMat = new THREE.LineDashedMaterial({ linewidth: 2, color: axiscolor, dashSize: 0.5, gapSize: 0.1 });
	
    let gNeg = new THREE.Geometry(); 
    gNeg.vertices.push( fromNeg ); 
    gNeg.vertices.push( toNeg );
    let coordNeg = new THREE.Line(gNeg, negMat, THREE.LineSegments);
	coordNeg.computeLineDistances(); // NB!
    scene.add(coordNeg);
   
    let gPos = new THREE.Geometry(); 
    gPos.vertices.push( fromPos ); 
    gPos.vertices.push( toPos );
    let coordPos = new THREE.Line(gPos, posMat, THREE.LineSegments);
	coordPos.computeLineDistances();
    scene.add(coordPos);
}
