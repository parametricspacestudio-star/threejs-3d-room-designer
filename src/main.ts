import * as THREE from 'three';
import * as OBC from '@thatopen/components';
import * as OBCF from '@thatopen/components-front';
import * as BUI from '@thatopen/ui';
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
    
    const arch = new ArchitectureFragments(components);
    const gltfLoader = new GLTFLoader();
    
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
    
    const fragments = components.get(OBC.FragmentsManager);
    fragments.init();
    components.init();

    const addFurniture = (modelName: string) => {
        const fullPath = `/Blueprint3D-assets/models/glb/special/${modelName}`;
        gltfLoader.load(fullPath, (gltf) => {
            const model = gltf.scene;
            model.userData = { type: 'Furniture', name: modelName };
            world.scene.three.add(model);
        }, undefined, (err) => {
            const fallbackPath = `/Blueprint3D-assets/models/glb/${modelName}`;
            gltfLoader.load(fallbackPath, (gltf) => {
                gltf.scene.userData = { type: 'Furniture', name: modelName };
                world.scene.three.add(gltf.scene);
            });
        });
    };

    let slabWidth = 6;
    let slabDepth = 6;
    let wallHeight = 2.8;
    let currentSlab: THREE.Mesh | null = null;

    const propertyPanel = document.createElement('div');
    propertyPanel.style.cssText = `
        background: rgba(26, 27, 30, 0.9);
        color: white;
        padding: 1rem;
        border-radius: 8px;
        border: 1px solid #444;
        font-family: sans-serif;
        min-width: 200px;
    `;
    propertyPanel.innerHTML = '<h3>Properties</h3><p>Select an element to view properties.</p>';

    const createRoomModal = () => {
        const modal = BUI.Component.create<any>(() => {
            return BUI.html`
                <bim-modal label="Room Configuration" icon="measurement">
                    <bim-panel style="padding: 1.5rem; gap: 1.2rem; display: flex; flex-direction: column; background: #1a1b1e; min-width: 320px;">
                        <bim-label style="color: #fff; font-size: 1.1rem; font-weight: bold;">Slab & Wall Settings</bim-label>
                        
                        <div style="display: flex; flex-direction: column; gap: 1rem;">
                            <div style="display: flex; flex-direction: column; gap: 0.4rem;">
                                <bim-label style="color: #999;">Slab Width (X):</bim-label>
                                <input type="number" .value="${slabWidth.toString()}" @input="${(e: any) => slabWidth = Number(e.target.value)}" 
                                    style="background: #2a2b2e; color: #fff; border: 1px solid #444; padding: 8px; border-radius: 4px;">
                            </div>
                            <div style="display: flex; flex-direction: column; gap: 0.4rem;">
                                <bim-label style="color: #999;">Slab Depth (Y):</bim-label>
                                <input type="number" .value="${slabDepth.toString()}" @input="${(e: any) => slabDepth = Number(e.target.value)}" 
                                    style="background: #2a2b2e; color: #fff; border: 1px solid #444; padding: 8px; border-radius: 4px;">
                            </div>
                            <div style="display: flex; flex-direction: column; gap: 0.4rem;">
                                <bim-label style="color: #999;">Default Wall Height:</bim-label>
                                <input type="number" .value="${wallHeight.toString()}" @input="${(e: any) => wallHeight = Number(e.target.value)}" 
                                    style="background: #2a2b2e; color: #fff; border: 1px solid #444; padding: 8px; border-radius: 4px;">
                            </div>
                        </div>

                        <div style="margin-top: 1rem;">
                            <bim-button label="Apply Slab Dimensions" style="width: 100%;" @click=${() => {
                                if (currentSlab) world.scene.three.remove(currentSlab);
                                currentSlab = arch.createSlab(slabWidth, slabDepth, 0.2);
                                modal.active = false;
                            }}></bim-button>
                        </div>
                    </bim-panel>
                </bim-modal>
            `;
        });
        document.body.appendChild(modal);
        modal.active = true;
    };

    const placeWallOnEdge = (edge: 'N' | 'S' | 'E' | 'W') => {
        if (!currentSlab) return;
        const w = slabWidth / 2;
        const d = slabDepth / 2;
        let p1, p2;
        if (edge === 'N') { p1 = new THREE.Vector3(-w, 0, -d); p2 = new THREE.Vector3(w, 0, -d); }
        else if (edge === 'S') { p1 = new THREE.Vector3(-w, 0, d); p2 = new THREE.Vector3(w, 0, d); }
        else if (edge === 'E') { p1 = new THREE.Vector3(w, 0, -d); p2 = new THREE.Vector3(w, 0, d); }
        else { p1 = new THREE.Vector3(-w, 0, -d); p2 = new THREE.Vector3(-w, 0, d); }
        arch.createWall([p1, p2], wallHeight, 0.15);
    };

    const mainLayout = BUI.Component.create<any>(() => {
        return BUI.html`
            <div style="position: fixed; inset: 0; pointer-events: none; z-index: 99999; display: flex; justify-content: space-between; padding: 1.5rem;">
                <div style="pointer-events: auto; width: 340px; display: flex; flex-direction: column; gap: 1rem; background: rgba(26, 27, 30, 0.95); padding: 1.5rem; border-radius: 12px; border: 1px solid #333; height: fit-content; box-shadow: 0 10px 40px rgba(0,0,0,0.7);">
                    <h2 style="color: #fff; margin: 0 0 1rem 0; font-family: sans-serif; font-size: 1.3rem;">BIM Hub v3</h2>
                    <bim-panel label="Construction" active expanded>
                        <bim-panel-section label="Room Config" expanded>
                            <div style="display: flex; flex-direction: column; gap: 1rem; padding: 0.5rem;">
                                <bim-button label="Set Dimensions & Height" @click=${createRoomModal}></bim-button>
                                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem;">
                                    <bim-button label="Wall N" @click=${() => placeWallOnEdge('N')}></bim-button>
                                    <bim-button label="Wall S" @click=${() => placeWallOnEdge('S')}></bim-button>
                                    <bim-button label="Wall E" @click=${() => placeWallOnEdge('E')}></bim-button>
                                    <bim-button label="Wall W" @click=${() => placeWallOnEdge('W')}></bim-button>
                                </div>
                            </div>
                        </bim-panel-section>
                        <bim-panel-section label="Assets" expanded>
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.8rem; padding: 0.5rem;">
                                <bim-button label="Chair" @click=${() => addFurniture('chair.glb')}></bim-button>
                                <bim-button label="Table" @click=${() => addFurniture('table.glb')}></bim-button>
                                <bim-button label="Sofa" @click=${() => addFurniture('loungeSofa.glb')}></bim-button>
                                <bim-button label="Bed" @click=${() => addFurniture('bedDouble.glb')}></bim-button>
                            </div>
                        </bim-panel-section>
                    </bim-panel>
                </div>
                <div id="inspector-container" style="pointer-events: auto; width: 300px; height: fit-content;"></div>
            </div>
        `;
    });

    if (mainLayout) {
        document.body.appendChild(mainLayout);
        document.getElementById('inspector-container')!.appendChild(propertyPanel);
    }
    
    const highlighter = components.get(OBCF.Highlighter);
    highlighter.setup({ world });
    
    // Selection logic
    container.addEventListener('click', () => {
        const selection = highlighter.selection.main;
        if (selection.size > 0) {
            const fragmentID = Array.from(selection)[0];
            const fragment = fragments.list.get(fragmentID);
            if (fragment && fragment.mesh) {
                const data = fragment.mesh.userData;
                propertyPanel.innerHTML = `<h3>Properties</h3>` + 
                    Object.entries(data).map(([k, v]) => `<p><b>${k}:</b> ${v}</p>`).join('');
            }
        }
    });

    components.get(OBC.Grids).create(world);
    await world.camera.controls.setLookAt(10, 10, 10, 0, 0, 0);
}

init().catch(err => console.error(err));