import * as THREE from 'three';
import * as OBC from '@thatopen/components';
import * as OBCF from '@thatopen/components-front';
import * as BUI from '@thatopen/ui';
import * as BUIC from '@thatopen/ui-obc';
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
    
    // Create Layout
    const mainLayout = BUI.Component.create<BUI.PanelSection>(() => {
        return BUI.html`
            <bim-grid floating style="inset: 1rem; pointer-events: none; z-index: 100;">
                <bim-column style="pointer-events: auto; width: 300px;">
                    <bim-panel label="BIM Configurator" icon="gear" active>
                        <bim-panel-section label="Architectural Elements" icon="wall">
                            <bim-button label="Add Wall" @click=${() => arch.createWall([new THREE.Vector3(0,0,0), new THREE.Vector3(5,0,0)], 3, 0.2)}></bim-button>
                            <bim-button label="Add Floor" @click=${() => arch.createSlab([], 0.2)}></bim-button>
                        </bim-panel-section>
                        <bim-panel-section label="Model Controls" icon="cube">
                             <bim-button label="Clear Scene" @click=${() => components.get(OBC.FragmentsManager).dispose()}></bim-button>
                        </bim-panel-section>
                    </bim-panel>
                </bim-column>
                <bim-column style="flex-grow: 1;"></bim-column>
                <bim-column style="pointer-events: auto; width: 300px;">
                     <bim-panel label="Properties" icon="info-circle">
                        <bim-panel-section label="Element Info">
                            <div id="properties-panel">Select an element to see properties</div>
                        </bim-panel-section>
                     </bim-panel>
                </bim-column>
            </bim-grid>
        `;
    });

    document.body.append(mainLayout);
    
    // Create viewport container
    const container = document.getElementById('container')!;
    container.style.position = 'absolute';
    container.style.top = '0';
    container.style.left = '0';
    container.style.width = '100vw';
    container.style.height = '100vh';
    container.style.background = '#202124';
    
    const viewport = document.createElement('bim-viewport');
    viewport.style.width = '100%';
    viewport.style.height = '100%';
    viewport.style.display = 'block';
    container.appendChild(viewport);
    
    world.renderer = new OBC.SimpleRenderer(components, viewport);
    world.camera = new OBC.OrthoPerspectiveCamera(components);
    
    components.init();
    
    // Initialize Managers
    const fragments = components.get(OBC.FragmentsManager);
    const arch = new ArchitectureFragments(components);
    
    // Setup Highlighter
    const highlighter = components.get(OBCF.Highlighter);
    highlighter.setup({ world });
    
    // Grids
    const grids = components.get(OBC.Grids);
    grids.create(world);
    
    // Initial Camera
    await world.camera.controls.setLookAt(20, 20, 20, 0, 0, 0);
    
    console.log("Hybrid BIM Configurator Initialized");
    
    return { world, components };
}

init().catch(err => console.error("Initialization error:", err));