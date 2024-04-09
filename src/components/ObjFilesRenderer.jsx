import React, { useEffect, useRef } from 'react';
import vtkActor from '@kitware/vtk.js/Rendering/Core/Actor';
import vtkFullScreenRenderWindow from '@kitware/vtk.js/Rendering/Misc/FullScreenRenderWindow';
import vtkMapper from '@kitware/vtk.js/Rendering/Core/Mapper';
import vtkOBJReader from '@kitware/vtk.js/IO/Misc/OBJReader';
import "./Renderer.css"
import TableModal from './TableModal';

window.scene = [];
window.toggleVisibility = (event) => {
  const index = Number(event.target.dataset.index);
  const actor = window.scene[index].actor;
  const visibility = actor.getVisibility();

  actor.setVisibility(!visibility);
  window.scene[index].visibility = !visibility;

  const buttonText = event.target;
  buttonText.textContent = visibility ? 'Show' : 'Hide';

  window.fullScreenRenderer.getRenderWindow().render();
};

const ObjFilesRenderer = (props) => {
  const containerRef = useRef(null);
  const fullScreenRendererRef = useRef(null);

  useEffect(() => {
    const initialize3DRenderer = async (objFiles) => {
      console.log('Initializing 3D renderer...');
      const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance({
        container: containerRef.current,
        background: [0.1, 0.1, 0.1],
      });
      const renderer = fullScreenRenderer.getRenderer();
      const renderWindow = fullScreenRenderer.getRenderWindow();

      const resetCamera = renderer.resetCamera;
      const render = renderWindow.render;

      const reader = vtkOBJReader.newInstance({ splitMode: 'usemtl' });

      try {
        objFiles.forEach((objFile) => {
          const objText = objFile.objContent;
          reader.parseAsText(objText);
  
          const size = reader.getNumberOfOutputPorts();
          for (let i = 0; i < size; i++) {
              const polydata = reader.getOutputData(i);
              const name = objFile.filename
              const mapper = vtkMapper.newInstance();
              const actor = vtkActor.newInstance();
  
              actor.setMapper(mapper);
              mapper.setInputData(polydata);
  
              renderer.addActor(actor);
  
              window.scene.push({ name, polydata, mapper, actor, visibility: true });
          }
        });
        resetCamera();
        render();

        const htmlBuffer = [
          '<style>.visible { font-weight: bold; cursor: pointer; } .click { min-width: 150px;}</style>',
        ];
        window.scene.forEach((item, idx) => {
          console.log('item', item)
          htmlBuffer.push(
            `<div class="click visible" data-index="${idx}">
              <button onclick="toggleVisibility(event)" data-index="${idx}">${item.visibility ? 'Hide' : 'Show'}</button>
              ${item.name}
            </div>`
          );
        });

        fullScreenRenderer.addController(htmlBuffer.join('\n'));
        window.fullScreenRenderer = fullScreenRenderer;
        console.log('Renderer initialization complete.');
      } catch (error) {
        console.error('Error initializing 3D renderer:', error);
      }
    };

    const objFiles = props.objFiles;
    if (objFiles) {
      initialize3DRenderer(objFiles);
    } else {
      console.error('Invalid objFiles or objFiles is undefined.');
    }
  }, [props.objFiles]);

  return (
    <div className='container' style={{ position: 'relative' }}>
      <div style={{ position: 'absolute', top: '15px', right: '25px', zIndex: 1 }}>
        <TableModal jsonFiles={props.jsonFiles} />
      </div>
      <div
        style={{
          height: '100vh',
          width: '100vw',  
        }}
        ref={containerRef}
      />
    </div>
  );
};

export default ObjFilesRenderer;
