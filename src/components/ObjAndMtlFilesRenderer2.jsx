import React, { useEffect, useRef, useState } from 'react';
import vtkActor from '@kitware/vtk.js/Rendering/Core/Actor';
import vtkFullScreenRenderWindow from '@kitware/vtk.js/Rendering/Misc/FullScreenRenderWindow';
import vtkMapper from '@kitware/vtk.js/Rendering/Core/Mapper';
import vtkOBJReader from '@kitware/vtk.js/IO/Misc/OBJReader';
import vtkMTLReader from '@kitware/vtk.js/IO/Misc/MTLReader';
import vtkPlane from '@kitware/vtk.js/Common/DataModel/Plane';
import {Button, FormControl, IconButton, InputLabel, MenuItem, Select} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import VisibilityTransparentIcon from '@mui/icons-material/VisibilityOutlined';
import "./Renderer.css";
import FilterListOutlinedIcon from '@mui/icons-material/FilterListOutlined';
import FilterListOffOutlinedIcon from '@mui/icons-material/FilterListOffOutlined';
import AutorenewOutlinedIcon from '@mui/icons-material/AutorenewOutlined';
import SyncDisabledOutlinedIcon from '@mui/icons-material/SyncDisabledOutlined';
import vtkOrientationMarkerWidget from "@kitware/vtk.js/Interaction/Widgets/OrientationMarkerWidget";
import vtkAnnotatedCubeActor from "@kitware/vtk.js/Rendering/Core/AnnotatedCubeActor";
import vtkOpenGLRenderWindow from "@kitware/vtk.js/Rendering/OpenGL/RenderWindow";
import {
  Fullscreen,
  KeyboardArrowDown,
  KeyboardArrowUp,
  Swipe,
} from "@mui/icons-material";



const ObjFilesRenderer = (props) => {
  const containerRef = useRef(null);
  const [rendererInitialized, setRendererInitialized] = useState(false);
  const [renderer, setRenderer] = useState(null);
  const [actors, setActors] = useState([]);
  const [isRotating, setIsRotating] = useState(false);
  const [isControlsVisible, setIsControlsVisible] = useState(true);
  const pageContainerRef = React.useRef(null);
  const [selectedPlane, setSelectedPlane] = useState('axial');
  const [scrollValue, setScrollValue] = useState(0);

    // Function to update clipping planes for all actors
    const updateClippingPlanes = (plane) => {
      if (renderer && actors.length > 0) {
        actors.forEach(({ actor }) => {
          const mapper = actor.getMapper();
          if (mapper) {
            mapper.removeAllClippingPlanes();
            mapper.addClippingPlane(plane);
          }
        });
        renderer.getRenderWindow().render();
      }
    };

    const initialize3DRenderer = async (renderingElements) => {
      console.log('Initializing 3D renderer...');
      try {
        const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance({
          container: containerRef.current,
          background: [0, 0, 0],
        });

        const newRenderer = fullScreenRenderer.getRenderer();
        const renderWindow = fullScreenRenderer.getRenderWindow();

        const newActors = [];

        let plane = null;
        if(selectedPlane === 'axial'){
            plane = vtkPlane.newInstance({ normal: [0, -1, 0], origin: [0, 0, 0] });
        }
        else if(selectedPlane === 'coronal'){
            plane = vtkPlane.newInstance({ normal: [1, 0, 0], origin: [0, 0, 0] });
        }
        else if(selectedPlane === 'sagittal'){
            plane = vtkPlane.newInstance({ normal: [0, 0, -1], origin: [0, 0, 0] });
        }
        

        for (const el of renderingElements) {
          const reader = vtkOBJReader.newInstance({ splitMode: 'usemtl' });
          const materialsReader = vtkMTLReader.newInstance();

          const objText = el.objContent;
          const mtlText = el.mtlContent;
          reader.parseAsText(objText);
          materialsReader.parseAsText(mtlText);

          const size = reader.getNumberOfOutputPorts();
          for (let i = 0; i < size; i++) {
            const polydata = reader.getOutputData(i);
            let name = polydata.get('name').name;
            const mapper = vtkMapper.newInstance();
            const newActor = vtkActor.newInstance();

            mapper.addClippingPlane(plane); // Add clipping plane to the mapper
            newActor.setMapper(mapper);
            mapper.setInputData(polydata);
            materialsReader.applyMaterialToActor(name, newActor);
            newRenderer.addActor(newActor);
            newActor.setOrientation(270, 0, 0);


            newActor.getProperty().setInterpolationToPhong();
            newActor.getProperty().setAmbient(0.1);
            newActor.getProperty().setDiffuse(0.9);
            newActor.getProperty().setSpecular(0.003);
            newActor.getProperty().setSpecularPower(40);
            newActor.getProperty().setSpecularColor(44, 44, 44);
            newActor.getProperty().setRoughnessTexture(0);
            newActor.getProperty().setMetallicTexture(0.21);

            const material = materialsReader.getMaterial(name);
            const diffuseColor = material ? material.Kd.map(parseFloat) : [1, 1, 1];
            const initialColor = `#${rgbToHex(diffuseColor[0] * 255)}${rgbToHex(diffuseColor[1] * 255)}${rgbToHex(diffuseColor[2] * 255)}`;

            const visibilityMode = name === 'mtl1' ? 'transparent' : 'visible';
            if (visibilityMode === 'transparent') {
              newActor.getProperty().setOpacity(0.5);
            }

            if(name === 'mtl1'){
              name = 'Mammary Gland'
            }
            else if(name === 'mtl192317'){
              name = 'Duct'
            }
            else if(name === 'mtl300061'){
              name = 'Sternum'
            }
            else if(name === 'mtl305077'){
              name = 'Tumor'
            }
            else if(name === 'mtl308555'){
              name = 'Vessels'
            }

            newActors.push({ actor: newActor, visibilityMode, color: initialColor, name });
          }
        }

        const openGLRenderWindow = vtkOpenGLRenderWindow.newInstance();
        const cube = vtkAnnotatedCubeActor.newInstance();
        cube.setDefaultStyle({
          text: "+X",
          fontStyle: "bold",
          fontFamily: "Arial",
          fontColor: "#FFF",
          fontSizeScale: (res) => res / 2,
          faceColor: "#606060",
          faceRotation: 0,
          edgeThickness: 0.1,
          edgeColor: "black",
          resolution: 400,
        });
        cube.setXPlusFaceProperty({ text: "L" }); // Left
        cube.setXMinusFaceProperty({ text: "R" }); // Right
        cube.setYPlusFaceProperty({ text: "S" }); // Superior
        cube.setYMinusFaceProperty({ text: "I" }); // Inferior
        cube.setZPlusFaceProperty({ text: "A" }); // Anterior
        cube.setZMinusFaceProperty({ text: "P" }); // Posterior
    
        const orientationMarker = vtkOrientationMarkerWidget.newInstance({
          actor: cube,
          interactor: renderWindow.getInteractor(),
        });
        orientationMarker.setEnabled(true);
        if (window.innerWidth > window.innerHeight) {
          orientationMarker.setViewportCorner(
            vtkOrientationMarkerWidget.Corners.BOTTOM_LEFT
          );
        } else {
          orientationMarker.setViewportCorner(
            vtkOrientationMarkerWidget.Corners.BOTTOM_RIGHT
          );
        }
        orientationMarker.setViewportSize(0.15);
        orientationMarker.setMinPixelSize(100);
        orientationMarker.setMaxPixelSize(300);

        const bounds = newRenderer.computeVisiblePropBounds();
        if(selectedPlane === 'axial'){
            plane.setOrigin(0, bounds[3], 0); 
        }else if(selectedPlane === 'coronal'){
            plane.setOrigin(bounds[0], 0, 0);
        }else if(selectedPlane === 'sagittal'){
            plane.setOrigin(0, 0, bounds[5]);
        }

        renderWindow.addView(openGLRenderWindow);
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

  useEffect(() => {

    const renderingElements = props.renderingElements;
    if (renderingElements && !rendererInitialized) {
      console.log('Rendering elements:', renderingElements);
      initialize3DRenderer(renderingElements);
    }

    // return () => {
      // if (renderer) {
      //   renderer.delete();
      // }
    // };
  }, [props.renderingElements, rendererInitialized, selectedPlane, renderer]);

  const toggleVisibility = (index) => {
    setActors((prevActors) => {
      const updatedActors = [...prevActors];
      const actorObj = updatedActors[index];
      const vtkActor = actorObj.actor;

      if (actorObj.visibilityMode === 'visible') {
        actorObj.visibilityMode = 'transparent';
        vtkActor.getProperty().setOpacity(0.5);
        vtkActor.setVisibility(true);
      } else if (actorObj.visibilityMode === 'transparent') {
        actorObj.visibilityMode = 'invisible';
        vtkActor.setVisibility(false);
      } else {
        actorObj.visibilityMode = 'visible';
        vtkActor.getProperty().setOpacity(1.0);
        vtkActor.setVisibility(true);
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

  useEffect(() => {
    let plane = null;

    if (selectedPlane === 'axial') {
      plane = vtkPlane.newInstance({ normal: [0, -1, 0], origin: [0, 0, 0] });
    } else if (selectedPlane === 'coronal') {
      plane = vtkPlane.newInstance({ normal: [1, 0, 0], origin: [0, 0, 0] });
    } else if (selectedPlane === 'sagittal') {
      plane = vtkPlane.newInstance({ normal: [0, 0, -1], origin: [0, 0, 0] });
    }

    updateClippingPlanes(plane);
  }, [selectedPlane]);

  const handleScroll = () => {
    const value = scrollValue;
    const normalizedValue = value / 100; // Normalize the value between 0 and 1

    if (renderer && actors.length > 0) {
        const bounds = renderer.computeVisiblePropBounds();

        if(selectedPlane === 'axial'){
            const yRange = bounds[3] - bounds[2]; // y-axis range of the bounding box
            // Calculate the yValue such that higher values correspond to the superior side
            const yValue = bounds[3] - normalizedValue * yRange;

            actors.forEach(({ actor }) => {
                // Update the clipping plane to crop from superior to inferior
                actor.getMapper().getClippingPlanes()[0].setOrigin(0, yValue, 0);
            });
        }
        else if(selectedPlane === 'coronal'){
            const xRange = bounds[1] - bounds[0]; // x-axis range of the bounding box
            // Calculate the xValue such that higher values correspond to the right side
            const xValue = bounds[0] + normalizedValue * xRange;

            actors.forEach(({ actor }) => {
                // Update the clipping plane to crop from right to left
                actor.getMapper().getClippingPlanes()[0].setOrigin(xValue, 0, 0);
            });
        }
        else if(selectedPlane === 'sagittal'){
            const zRange = bounds[4] - bounds[5]; // z-axis range of the bounding box
            // Calculate the zValue such that higher values correspond to the anterior side
            const zValue = bounds[5] + normalizedValue * zRange;

            actors.forEach(({ actor }) => {
                // Update the clipping plane to crop from anterior to posterior
                actor.getMapper().getClippingPlanes()[0].setOrigin(0, 0, zValue);
            });
        }

        renderer.getRenderWindow().render();
    }

};

useEffect(() => {
  handleScroll();
}, [scrollValue, selectedPlane, renderer, actors]);



const enterFullscreen = () => {
  const elem = pageContainerRef.current;
  if (elem.requestFullscreen) {
    elem.requestFullscreen();
  } else if (elem.mozRequestFullScreen) {
    elem.mozRequestFullScreen();
  } else if (elem.webkitRequestFullscreen) {
    elem.webkitRequestFullscreen();
  }
};

const exitFullscreen = () => {
  if (document.exitFullscreen) {
    document.exitFullscreen();
  } else if (document.mozCancelFullScreen) {
    document.mozCancelFullScreen();
  } else if (document.webkitExitFullscreen) {
    document.webkitExitFullscreen();
  }
};

const handleFullscreen = () => {
  if (!document.fullscreenElement) {
    enterFullscreen();
  } else {
    exitFullscreen();
  }
};



  return (
    <div className="container" style={{ position: 'relative' }} ref={pageContainerRef}>

      {/* rotation */}
      <div style={{ position: 'absolute', top: '15px', right: '50px', zIndex: 1 }}>
        {isRotating ? (
          <SyncDisabledOutlinedIcon style={{color:"white", fontWeight:"bold", cursor:'pointer'}} onClick={handleStopRotation} />
        ) : (
          <AutorenewOutlinedIcon style={{color:"white", fontWeight:"bold", cursor:'pointer'}} onClick={handleStartRotation} />
        )}
      </div>

      <IconButton
        id="fullscreen_btn"
        onClick={handleFullscreen}
        sx={{ position: "absolute", top: "15px", right: "15px", zIndex: 1, padding:0}}
        title="Fullscreen"
      >
        <Fullscreen sx={{ color: "#fff" }} />
      </IconButton>


      {/* 3d rendering */}
      <div style={{ height: '100vh', width: '100vw' }} ref={containerRef} />


      {/* controls icon to hide and show */}
      <div style={{ position: 'absolute', top: '15px', left: '40px', zIndex: 1 }}>
        {isControlsVisible ? (
            <FilterListOutlinedIcon style={{color:'white', cursor:'pointer'}} onClick={() => setIsControlsVisible(false)} />
        ) : (
            <FilterListOffOutlinedIcon  style={{color:'white', cursor:'pointer'}}  onClick={() => setIsControlsVisible(true)} />
        )}
      </div>


      {rendererInitialized && isControlsVisible && (
        <div 
            style={{ 
                position: 'absolute', 
                display:"flex", 
                justifyContent:"space-around", 
                alignItems:'center', 
                flexDirection:"column",  
                top: '35%', 
                width:"7%" ,
                left: '5px', 
                height: '40%', 
                zIndex: 1 
            }}
        >
            <FormControl variant="outlined" style={{width:'100%', backgroundColor:'gray', color:'white'}}>
                <InputLabel style={{color:"white"}} id="demo-simple-select-label">Cross section</InputLabel>
                <Select
                    style={{color:'white', backgroundColor:"#EB3678",  width: "100%", height: "35px"}}
                    id="demo-simple-select"
                    value={selectedPlane}
                    label="Search by:"
                    onChange={(e) => {
                      setSelectedPlane(e.target.value);
                      setScrollValue(0);
                    }}
                >
                    <MenuItem value='axial'>Axial</MenuItem>
                    <MenuItem value='coronal'>Coronal</MenuItem>
                    <MenuItem value='sagittal'>Sagittal</MenuItem>
                </Select>  
            </FormControl>
            <input
              type="range"
              min="0"
              max="100"
              // defaultValue="0"
              value={scrollValue}
              className="vertical-slider"
              onChange={(event) => {
                setScrollValue(event.target.value);
                // handleScroll();
              }}
              style={{
                transform: 'rotate(-90deg)',
                zIndex: 2,
              }}
            />
        </div>
      )}

   

      {rendererInitialized && isControlsVisible && (
        <div className="controls">
          {actors.map((actorObj, index) => (
            <div key={index} style={{color:actorObj.color}} className="control-item">
              <Button
                onClick={() => toggleVisibility(index)}
              >
                {actorObj.visibilityMode === 'visible' && <VisibilityIcon />}
                {actorObj.visibilityMode === 'transparent' && <VisibilityTransparentIcon />}
                {actorObj.visibilityMode === 'invisible' && <VisibilityOffIcon />}
              </Button>
              {actorObj.name}
              <input
                className='color-picker'
                type="color"
                value={actorObj.color}
                onChange={(e) => handleColorChange(index, e.target.value)}
                style={{
                  color: actorObj.color,
                  appearance: 'none',
                  WebkitAppearance: 'none',
                  MozAppearance: 'none',
                  border: 'none',
                  borderRadius: '50%',
                  background: 'none',
                  width: '30px',
                  height: '30px',
                  outline: 'none', 
                  cursor: 'pointer',
                }}
              />

            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ObjFilesRenderer;
