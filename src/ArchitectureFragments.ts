import * as THREE from 'three';
import * as OBC from '@thatopen/components';

export class ArchitectureFragments {
    private fragments: OBC.FragmentsManager;
    private components: OBC.Components;

    constructor(components: OBC.Components) {
        this.components = components;
        this.fragments = components.get(OBC.FragmentsManager);
    }

    createWall(points: THREE.Vector3[], height: number, thickness: number) {
        if (points.length < 2) return;
        
        const length = points[0].distanceTo(points[1]);
        const geometry = new THREE.BoxGeometry(thickness, height, length);
        const material = new THREE.MeshStandardMaterial({ color: 0x808080 });
        const mesh = new THREE.Mesh(geometry, material);
        
        const center = points[0].clone().add(points[1]).multiplyScalar(0.5);
        mesh.position.copy(center);
        mesh.position.y += height / 2;
        mesh.lookAt(points[1]);

        // Access the scene three object safely
        const worlds = this.components.get(OBC.Worlds);
        const world = worlds.list.values().next().value;
        if (world && world.scene) {
            world.scene.three.add(mesh);
        }
        
        return mesh;
    }

    createSlab(points: THREE.Vector3[], thickness: number) {
        const geometry = new THREE.BoxGeometry(10, thickness, 10);
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