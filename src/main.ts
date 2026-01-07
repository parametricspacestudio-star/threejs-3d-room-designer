import * as THREE from 'three';
import * as OBC from '@thatopen/components';
import * as OBCF from '@thatopen/components-front';
import * as BUI from '@thatopen/ui';
import * as BUIC from '@thatopen/ui-obc';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { ArchitectureFragments } from './ArchitectureFragments';

BUI.Manager.init();

async function init() {
    console.log("Initializing Hybrid BIM Configurator...");
    const components = new OBC.Components();
    const worlds = components.get(OBC.Worlds);
    const world = worlds.create<OBC.SimpleScene, OBC.OrthoPerspectiveCamera, OBC.SimpleRenderer>();
    
    world.name = 'main';
    const sceneComponent = new OBC.SimpleScene(components);
    sceneComponent.setup();
    world.scene = sceneComponent;
    
    // Initialize Managers
    const fragments = components.get(OBC.FragmentsManager);
    const arch = new ArchitectureFragments(components);
    const gltfLoader = new GLTFLoader();
    
    // Setup viewport
    const container = document.getElementById('container')!;
    container.style.position = 'fixed';
    container.style.inset = '0';
    container.style.zIndex = '0';
    
    const viewport = document.createElement('bim-viewport');
    viewport.style.width = '100%';
    viewport.style.height = '100%';
    viewport.style.display = 'block';
    container.appendChild(viewport);
    
    world.renderer = new OBC.SimpleRenderer(components, viewport);
    world.camera = new OBC.OrthoPerspectiveCamera(components);
    
    // Proper initialization
    fragments.init("https://unpkg.com/@thatopen/fragments@3.2.13/dist/Worker/worker.mjs");
    components.init();

    // Furniture Placement
    const addFurniture = (modelPath: string) => {
        console.log("Loading furniture:", modelPath);
        gltfLoader.load(modelPath, (gltf) => {
            const model = gltf.scene;
            model.position.set(0, 0, 0);
            world.scene.three.add(model);
            console.log("Furniture added to world.scene.three");
        }, undefined, (err) => console.error("Load error:", err));
    };

    // Create UI
    const mainLayout = BUI.Component.create<BUI.PanelSection>(() => {
        return BUI.html`
            <div style="position: fixed; inset: 0; pointer-events: none; z-index: 99999; display: flex; justify-content: space-between; padding: 2rem;">
                <div style="pointer-events: auto; width: 320px; display: flex; flex-direction: column; gap: 1rem; background: rgba(32, 33, 36, 0.9); padding: 1.5rem; border-radius: 12px; border: 1px solid #444; height: fit-content; box-shadow: 0 4px 20px rgba(0,0,0,0.5);">
                    <h2 style="color: white; margin: 0 0 1rem 0; font-family: sans-serif; font-size: 1.4rem; border-bottom: 1px solid #555; padding-bottom: 0.5rem;">BIM Hub</h2>
                    <bim-panel label="Architecture" icon="gear" active expanded>
                        <bim-panel-section label="Fragments (IFC)" icon="wall" expanded>
                            <div style="display: flex; flex-direction: column; gap: 0.8rem; padding: 0.5rem;">
                                <bim-button label="Add Wall Segment" @click=${() => arch.createWall([new THREE.Vector3(-2,0,0), new THREE.Vector3(2,0,0)], 3, 0.2)}></bim-button>
                                <bim-button label="Add Floor Slab" @click=${() => arch.createSlab([], 0.2)}></bim-button>
                            </div>
                        </bim-panel-section>
                        <bim-panel-section label="Furniture (GLB)" icon="chair" expanded>
                            <div style="display: flex; flex-direction: column; gap: 0.8rem; padding: 0.5rem;">
                                <bim-button label="Place Chair" @click=${() => addFurniture('/Blueprint3D-assets/models/glb/chair.glb')}></bim-button>
                                <bim-button label="Place Table" @click=${() => addFurniture('/Blueprint3D-assets/models/glb/table.glb')}></bim-button>
                            </div>
                        </bim-panel-section>
                    </bim-panel>
                </div>
                
                <div style="pointer-events: auto; width: 320px; display: flex; flex-direction: column; gap: 1rem; background: rgba(32, 33, 36, 0.9); padding: 1.5rem; border-radius: 12px; border: 1px solid #444; height: fit-content; box-shadow: 0 4px 20px rgba(0,0,0,0.5);">
                     <h2 style="color: white; margin: 0 0 1rem 0; font-family: sans-serif; font-size: 1.4rem; border-bottom: 1px solid #555; padding-bottom: 0.5rem;">Properties</h2>
                     <bim-panel label="Element Info" icon="info-circle" active expanded>
                        <bim-panel-section label="Details" expanded>
                            <div id="properties-panel" style="padding: 1rem; color: #ccc; font-family: sans-serif; font-size: 1rem; line-height: 1.4;">Select elements in the scene to view their BIM properties.</div>
                        </bim-panel-section>
                     </bim-panel>
                </div>
            </div>
        `;
    });

    if (mainLayout) document.body.appendChild(mainLayout);
    
    // Highlighter and Grids
    const highlighter = components.get(OBCF.Highlighter);
    highlighter.setup({ world });
    const grids = components.get(OBC.Grids);
    grids.create(world);
    
    // Initial Camera View
    await world.camera.controls.setLookAt(10, 10, 10, 0, 0, 0);
    
    console.log("Hybrid BIM Configurator Ready.");
    return { world, components };
}

init().catch(err => {
    console.error("Initialization Failed:", err);
});