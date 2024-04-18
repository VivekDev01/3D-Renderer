import React, { useEffect, useRef, useState } from 'react';
import vtkActor from '@kitware/vtk.js/Rendering/Core/Actor';
import vtkFullScreenRenderWindow from '@kitware/vtk.js/Rendering/Misc/FullScreenRenderWindow';
import vtkMapper from '@kitware/vtk.js/Rendering/Core/Mapper';
import vtkOBJReader from '@kitware/vtk.js/IO/Misc/OBJReader';
import "./Renderer.css"
import TableModal from './TableModal';
import Button from '@mui/material/Button';
// import { ColorPicker } from "material-ui-color";


window.scene = [];
window.toggleVisibility = (event) => {
  console.log('window.scene', window.scene)
  const index = Number(event.target.dataset.index);
  
  const actor = window.scene[index].newActor;
  const visibility = actor.getVisibility();

  actor.setVisibility(!visibility);
  window.scene[index].visibility = !visibility;

  const buttonText = event.target;
  buttonText.textContent = visibility ? 'Show' : 'Hide';

  window.fullScreenRenderer.getRenderWindow().render();
};


const ObjFilesRenderer = (props) => {
  const containerRef = useRef(null);
  const [rendererInitialized, setRendererInitialized] = useState(false);
  const [isRotating, setIsRotating] = useState(false);
  const [renderer, setRenderer] = useState(null);
  const [actor, setActor] = useState(null);

  useEffect(() => {
    const initialize3DRenderer = async (objFiles) => {
      console.log('Initializing 3D renderer...');
      const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance({
        container: containerRef.current,
        background: [0.1, 0.1, 0.1],
      });

      const newRenderer = fullScreenRenderer.getRenderer();
      const renderWindow = fullScreenRenderer.getRenderWindow();

      const resetCamera = newRenderer.resetCamera;

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
              const newActor = vtkActor.newInstance();
              newActor.setMapper(mapper);
              mapper.setInputData(polydata);

              newRenderer.addActor(newActor);

              setActor(newActor); 
              setRenderer(newRenderer); 
              setRendererInitialized(true); 
              window.scene.push({ name, polydata, mapper, newActor, visibility: true });
          }
        });

        resetCamera();
        renderWindow.render();

        const htmlBuffer = [
          '<style>.visible { font-weight: bold; cursor: pointer; padding:5px; } .click { min-width: 150px;} .btn{border-radius:3px; border:0.1px solid black; cursor:pointer; background-color:white; color:black; font-weight:bold}</style>',
        ];
        window.scene.forEach((item, idx) => {
          console.log('item', item)
          htmlBuffer.push(
            `<div class="click visible" data-index="${idx}">
              <Button class="btn" onclick="toggleVisibility(event)" data-index="${idx}">${item.visibility ? 'Hide' : 'Show'}</Button>
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
    if (objFiles && !rendererInitialized) {
      initialize3DRenderer(objFiles);
    }

    return () => {
      if (renderer) {
        renderer.delete();
      }
    };
  }, [props.objFiles, rendererInitialized]); 

  const handleStartRotation = () => {
    setIsRotating(true);
  };

  const handleStopRotation = () => {
    setIsRotating(false);
  };

  useEffect(() => {
    const rotateActor = () => {
      if (isRotating && renderer && actor) {
        const camera = renderer.getActiveCamera();
        camera.azimuth(0.5); 
        renderer.resetCameraClippingRange();
        renderer.getRenderWindow().render(); 
      }
    };

    const rotationInterval = setInterval(rotateActor, 30); 

    return () => clearInterval(rotationInterval); 
  }, [isRotating, renderer, actor]); 

  return (
    <div className='container' style={{ position: 'relative' }}>
      <div style={{ position: 'absolute', top: '15px', right: '25px', zIndex: 1 }}>
        <TableModal jsonFiles={props.jsonFiles} />
      </div>
      <div style={{ position: 'absolute', top: '15px', right: '45%', zIndex: 1 }}>
        {isRotating ? (
          <Button style={{backgroundColor:"blue", color:"white", fontWeight:"bold"}} onClick={handleStopRotation}>Stop Rotation</Button>
        ) : (
          <Button style={{backgroundColor:"blue", color:"white", fontWeight:"bold"}} onClick={handleStartRotation}>Start Rotation</Button>
        )}
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
