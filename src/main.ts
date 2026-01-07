import * as THREE from 'three';
import * as OBC from '@thatopen/components';
import * as OBCF from '@thatopen/components-front';
import * as BUI from '@thatopen/ui';
import { ArchitectureFragments } from './ArchitectureFragments';

BUI.Manager.init();

async function init() {
    const components = new OBC.Components();
    const worlds = components.get(OBC.Worlds);
    const world = worlds.create<OBC.SimpleScene, OBC.OrthoPerspectiveCamera, OBC.SimpleRenderer>();
    
    world.name = 'main';
    const sceneComponent = new OBC.SimpleScene(components);
    sceneComponent.setup();
    world.scene = sceneComponent;
    
    const container = document.getElementById('container')!;
    const viewport = document.createElement('bim-viewport');
    container.appendChild(viewport);
    
    world.renderer = new OBC.SimpleRenderer(components, viewport);
    world.camera = new OBC.OrthoPerspectiveCamera(components);
    
    components.init();
    
    // Initialize Managers
    const fragments = components.get(OBC.FragmentsManager);
    console.log("Fragments Manager ready", fragments);
    const arch = new ArchitectureFragments(components);
    
    // Setup Highlighter
    const highlighter = components.get(OBCF.Highlighter);
    highlighter.setup({ world });
    
    // Scene orchestration logic
    console.log("Hybrid BIM Configurator Initialized");
    
    // Example: Create architecture from logic
    arch.createWall([new THREE.Vector3(0,0,0), new THREE.Vector3(10,0,0)], 3, 0.2);

    return { world, components };
}

init();