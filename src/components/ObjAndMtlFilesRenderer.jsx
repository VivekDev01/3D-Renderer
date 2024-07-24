import React, { useEffect, useRef, useState } from 'react';
import vtkActor from '@kitware/vtk.js/Rendering/Core/Actor';
import vtkFullScreenRenderWindow from '@kitware/vtk.js/Rendering/Misc/FullScreenRenderWindow';
import vtkMapper from '@kitware/vtk.js/Rendering/Core/Mapper';
import vtkOBJReader from '@kitware/vtk.js/IO/Misc/OBJReader';
import vtkMTLReader from '@kitware/vtk.js/IO/Misc/MTLReader';
import Button from '@mui/material/Button';
import "./Renderer.css"
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import VisibilityTransparentIcon from '@mui/icons-material/VisibilityOutlined'; 

const ObjAndMtlFilesRenderer = (props) => {
  const containerRef = useRef(null);
  const [rendererInitialized, setRendererInitialized] = useState(false);
  const [renderer, setRenderer] = useState(null);
  const [actors, setActors] = useState([]);
  const [isRotating, setIsRotating] = useState(false);

  useEffect(() => {
    const initialize3DRenderer = async (renderingElements) => {
      console.log('Initializing 3D renderer...');
      const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance({
        container: containerRef.current,
        background: [0, 0, 0],  
      });

      const newRenderer = fullScreenRenderer.getRenderer();
      const renderWindow = fullScreenRenderer.getRenderWindow();

      try {
        const newActors = [];
        renderingElements.forEach((el) => {
          const reader = vtkOBJReader.newInstance({ splitMode: 'usemtl' });
          const materialsReader = vtkMTLReader.newInstance();

          const objText = el.objContent;
          const mtlText = el.mtlContent;
          reader.parseAsText(objText);
          materialsReader.parseAsText(mtlText);

          const size = reader.getNumberOfOutputPorts();
          for (let i = 0; i < size; i++) {
            const polydata = reader.getOutputData(i);
            const name = polydata.get('name').name;
            const mapper = vtkMapper.newInstance();
            const newActor = vtkActor.newInstance();
            newActor.setMapper(mapper);
            mapper.setInputData(polydata);
            materialsReader.applyMaterialToActor(name, newActor);
            newRenderer.addActor(newActor);

             // Set initial properties for smoothness and lighting
             newActor.getProperty().setInterpolationToPhong();
             newActor.getProperty().setSpecular(0.3); // Specular reflection coefficient
             newActor.getProperty().setSpecularPower(30); // Specular reflection power
             newActor.getProperty().setDiffuse(0.8); // Diffuse reflection coefficient
             newActor.getProperty().setAmbient(0.1); // Ambient reflection coefficient
             newActor.getProperty().setOpacity(1.0); // Fully opaque

            const material = materialsReader.getMaterial(name);
            console.log(material)

            const diffuseColor = material ? material.Kd.map(parseFloat) : [1, 1, 1];
            console.log(diffuseColor)

            const initialColor = `#${rgbToHex(diffuseColor[0] * 255)}${rgbToHex(diffuseColor[1] * 255)}${rgbToHex(diffuseColor[2] * 255)}`;

            console.log(initialColor)
            newActors.push({ actor: newActor, visibilityMode: 'visible', color: initialColor, name: name });
          }
        });

        newRenderer.resetCamera();
        renderWindow.render();
        setRenderer(newRenderer);
        setActors(newActors);

        console.log('Renderer initialization complete.');
        setRendererInitialized(true);
      } catch (error) {
        console.error('Error initializing 3D renderer:', error);
      }
    };

    const renderingElements = props.renderingElements;
    if (renderingElements && !rendererInitialized) {
      initialize3DRenderer(renderingElements);
    }

    return () => {
      if (renderer) {
        renderer.delete();
      }
    };
  }, [props.renderingElements, rendererInitialized]);

  const toggleVisibility = (index) => {
    setActors((prevActors) => {
      const updatedActors = [...prevActors];
      const actorObj = updatedActors[index];
      const vtkActor = actorObj.actor;

      // Cycle through visibility modes: visible, transparent, invisible
      if (actorObj.visibilityMode === 'visible') {
        actorObj.visibilityMode = 'transparent';
        vtkActor.getProperty().setOpacity(0.5); // Set transparency
        vtkActor.setVisibility(true); // Ensure actor is visible
      } else if (actorObj.visibilityMode === 'transparent') {
        actorObj.visibilityMode = 'invisible';
        vtkActor.setVisibility(false); // Set actor to invisible
      } else {
        actorObj.visibilityMode = 'visible';
        vtkActor.getProperty().setOpacity(1.0); // Set to fully opaque
        vtkActor.setVisibility(true); // Ensure actor is visible
      }

      if (renderer) {
        renderer.getRenderWindow().render();
      }
      return updatedActors;
    });
  };

  const handleColorChange = (index, color) => {
    setActors((prevActors) => {
      const updatedActors = [...prevActors];
      const actor = updatedActors[index];
      actor.color = color;
      if (renderer) {
        const vtkActor = actor.actor;
        const rgbColor = hexToRgb(color);
        vtkActor.getProperty().setColor(rgbColor);
        renderer.getRenderWindow().render();
      }
      return updatedActors;
    });
  };

  const hexToRgb = (hex) => {
    const r = parseInt(hex.slice(1, 3), 16) / 255.0;
    const g = parseInt(hex.slice(3, 5), 16) / 255.0;
    const b = parseInt(hex.slice(5, 7), 16) / 255.0;
    return [r, g, b];
  };

  const rgbToHex = (value) => {
    const hex = Math.max(0, Math.min(255, Math.round(value))).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };

  const handleStartRotation = () => {
    setIsRotating(true);
  };

  const handleStopRotation = () => {
    setIsRotating(false);
  };

  useEffect(() => {
    const rotateActor = () => {
      if (isRotating && renderer) {
        const camera = renderer.getActiveCamera();
        camera.azimuth(0.5);
        renderer.resetCameraClippingRange();
        renderer.getRenderWindow().render();
      }
    };

    const rotationInterval = setInterval(rotateActor, 30);

    return () => clearInterval(rotationInterval);
  }, [isRotating, renderer]);

  return (
    <div className="container" style={{ position: 'relative' }}>
      

      <div style={{ position: 'absolute', top: '15px', right: '45%', zIndex: 1 }}>
        {isRotating ? (
          <Button style={{backgroundColor:"blue", color:"white", fontWeight:"bold"}} onClick={handleStopRotation}>Stop Rotation</Button>
        ) : (
          <Button style={{backgroundColor:"blue", color:"white", fontWeight:"bold"}} onClick={handleStartRotation}>Start Rotation</Button>
        )}
      </div>

      <div style={{ height: '100vh', width: '100vw' }} ref={containerRef} />

      {rendererInitialized && (
        <div className="controls">
          {actors.map((actorObj, index) => (
            <div key={index} style={{color:actorObj.color}} className="control-item">
              <Button onClick={() => toggleVisibility(index)}>
                {actorObj.visibilityMode === 'visible' ? (
                  <VisibilityIcon />
                ) : actorObj.visibilityMode === 'transparent' ? (
                  <VisibilityTransparentIcon />
                ) : (
                  <VisibilityOffIcon />
                )}
              </Button>
              {actorObj.name}
              <input
                className='color-picker'
                type="color"
                value={actorObj.color}
                onChange={(e) => handleColorChange(index, e.target.value)}
                style={{
                  color: actorObj.color,
                  width: '22px',
                  height: '22px',
                  padding: 0,
                  border: 'none',
                  outline: 'none',
                  borderRadius: '25%',
                  boxShadow: 'none',
                  backgroundColor: actorObj.color,
                  cursor: 'pointer',
                  appearance: 'none',
                  WebkitAppearance: 'none',
                  MozAppearance: 'none',
                }}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ObjAndMtlFilesRenderer;