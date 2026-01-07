import * as THREE from 'three';
import * as OBC from '@thatopen/components';

export class ArchitectureFragments {
    private components: OBC.Components;

    constructor(components: OBC.Components) {
        this.components = components;
    }

    createWall(points: THREE.Vector3[], height: number, thickness: number) {
        if (points.length < 2) return null;
        
        const start = points[0];
        const end = points[1];
        const length = start.distanceTo(end);
        
        const geometry = new THREE.BoxGeometry(thickness, height, length);
        const material = new THREE.MeshStandardMaterial({ color: 0x808080 });
        const mesh = new THREE.Mesh(geometry, material);
        
        const center = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
        mesh.position.copy(center);
        mesh.position.y += height / 2;
        
        mesh.lookAt(end);

        const worlds = this.components.get(OBC.Worlds);
        const world = worlds.list.values().next().value;
        if (world && world.scene) {
            world.scene.three.add(mesh);
        }
        
        return mesh;
    }

    createSlab(width: number, depth: number, thickness: number) {
        const geometry = new THREE.BoxGeometry(width, thickness, depth);
        const material = new THREE.MeshStandardMaterial({ color: 0x404040 });
        const mesh = new THREE.Mesh(geometry, material);
        
        mesh.position.y = -thickness / 2;
        
        const worlds = this.components.get(OBC.Worlds);
        const world = worlds.list.values().next().value;
        if (world && world.scene) {
            world.scene.three.add(mesh);
        }
        
        return mesh;
    }
}