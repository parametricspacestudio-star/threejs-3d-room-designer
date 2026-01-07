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
        
        console.log("Generating IFCWALL Fragment...", points);
        
        // In That Open Engine, we use FragmentsManager to create and manage IFC entities.
        // We define a fragment with geometry and then add it to the manager.
        const length = points[0].distanceTo(points[1]);
        const geometry = new THREE.BoxGeometry(thickness, height, length);
        const material = new THREE.MeshStandardMaterial({ color: 0x808080 });
        const mesh = new THREE.Mesh(geometry, material);
        
        // Position and rotate
        const center = points[0].clone().add(points[1]).multiplyScalar(0.5);
        mesh.position.copy(center);
        mesh.position.y += height / 2;
        mesh.lookAt(points[1]);

        // Convert to Fragment
        const fragment = this.fragments.core.add([mesh]);
        fragment.mesh.name = "IFCWALL";
        
        // Add to scene via fragments manager
        this.fragments.list.set(fragment.id, fragment);
        
        console.log("IFCWALL Fragment created with ID:", fragment.id);
        return fragment;
    }

    createSlab(points: THREE.Vector3[], thickness: number) {
        console.log("Generating IFCSLAB Fragment...", points);
        
        // Simplified slab creation for demo
        const geometry = new THREE.BoxGeometry(10, thickness, 10);
        const material = new THREE.MeshStandardMaterial({ color: 0x404040 });
        const mesh = new THREE.Mesh(geometry, material);
        
        mesh.position.y = -thickness / 2;
        
        const fragment = this.fragments.core.add([mesh]);
        fragment.mesh.name = "IFCSLAB";
        this.fragments.list.set(fragment.id, fragment);
        
        return fragment;
    }
}