import * as THREE from 'three';
import * as OBC from '@thatopen/components';
import * as OBCF from '@thatopen/components-front';
import * as BUI from '@thatopen/ui';
import * as BUIC from '@thatopen/ui-obc';
import { ArchitectureFragments } from './ArchitectureFragments';

// Initializing the UI library
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
    
    components.init();

    // Create and append UI panels
    const mainLayout = BUI.Component.create<BUI.PanelSection>(() => {
        return BUI.html`
            <div style="position: fixed; inset: 0; pointer-events: none; z-index: 99999; display: flex; justify-content: space-between; padding: 2rem;">
                <div style="pointer-events: auto; width: 320px; display: flex; flex-direction: column; gap: 1rem; background: rgba(32, 33, 36, 0.9); padding: 1.5rem; border-radius: 12px; border: 1px solid #444; height: fit-content; box-shadow: 0 4px 20px rgba(0,0,0,0.5);">
                    <h2 style="color: white; margin: 0 0 1rem 0; font-family: sans-serif; font-size: 1.4rem; border-bottom: 1px solid #555; padding-bottom: 0.5rem;">BIM Configurator</h2>
                    <bim-panel label="Architecture" icon="gear" active expanded>
                        <bim-panel-section label="Create Elements" icon="wall" expanded>
                            <div style="display: flex; flex-direction: column; gap: 0.8rem; padding: 0.5rem;">
                                <bim-button label="Add Wall" @click=${() => arch.createWall([new THREE.Vector3(0,0,0), new THREE.Vector3(5,0,0)], 3, 0.2)}></bim-button>
                                <bim-button label="Add Floor" @click=${() => arch.createSlab([], 0.2)}></bim-button>
                            </div>
                        </bim-panel-section>
                        <bim-panel-section label="Scene Management" icon="cube" expanded>
                             <div style="padding: 0.5rem;">
                                <bim-button label="Clear All Fragments" @click=${() => fragments.dispose()}></bim-button>
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

    if (mainLayout) {
        document.body.appendChild(mainLayout);
        console.log("UI Panels Injected Successfully");
    }
    
    // Highlighter and Grids
    const highlighter = components.get(OBCF.Highlighter);
    highlighter.setup({ world });
    const grids = components.get(OBC.Grids);
    grids.create(world);
    
    // Initial Camera View
    await world.camera.controls.setLookAt(20, 20, 20, 0, 0, 0);
    
    console.log("Hybrid BIM Configurator Ready.");
    return { world, components };
}

init().catch(err => {
    console.error("Initialization Failed:", err);
    // Visual error feedback on screen
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);color:white;background:#d32f2f;padding:2rem;z-index:999999;font-family:sans-serif;border-radius:12px;box-shadow:0 10px 30px rgba(0,0,0,0.5);text-align:center;';
    errorDiv.innerHTML = '<h1 style="margin:0 0 1rem 0;">Initialization Error</h1><p>' + err.message + '</p>';
    document.body.appendChild(errorDiv);
});