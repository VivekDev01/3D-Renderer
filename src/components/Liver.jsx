import React, { useEffect, useRef, useState } from 'react';
import vtkActor from '@kitware/vtk.js/Rendering/Core/Actor';
import vtkFullScreenRenderWindow from '@kitware/vtk.js/Rendering/Misc/FullScreenRenderWindow';
import vtkMapper from '@kitware/vtk.js/Rendering/Core/Mapper';
import vtkOBJReader from '@kitware/vtk.js/IO/Misc/OBJReader';
import vtkMTLReader from '@kitware/vtk.js/IO/Misc/MTLReader';
import vtkPlane from '@kitware/vtk.js/Common/DataModel/Plane';
import { Button, FormControl, Icon, IconButton, InputLabel, MenuItem, Select, Slider, Tooltip } from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import VisibilityTransparentIcon from '@mui/icons-material/VisibilityOutlined';
import "./Renderer.css";
import FilterListOutlinedIcon from '@mui/icons-material/FilterListOutlined';
import FilterListOffOutlinedIcon from '@mui/icons-material/FilterListOffOutlined';
import AutorenewOutlinedIcon from '@mui/icons-material/AutorenewOutlined';
import SyncDisabledOutlinedIcon from '@mui/icons-material/SyncDisabledOutlined';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import vtkOrientationMarkerWidget from "@kitware/vtk.js/Interaction/Widgets/OrientationMarkerWidget";
import vtkAnnotatedCubeActor from "@kitware/vtk.js/Rendering/Core/AnnotatedCubeActor";
import vtkOpenGLRenderWindow from "@kitware/vtk.js/Rendering/OpenGL/RenderWindow";
import {
  Fullscreen,
  KeyboardArrowDown,
  KeyboardArrowUp,
  Swipe,
} from "@mui/icons-material";
import RestoreIcon from '@mui/icons-material/Restore';
import { message } from 'antd'
import { useParams } from 'react-router-dom';
import { baseURL } from '../config';
import MagicChange from '@mui/icons-material/AutoFixHigh';
import CrossSection from '@mui/icons-material/Adjust';
import RotationIcon from '@mui/icons-material/ThreeSixty';
import PositionIcon from '@mui/icons-material/PictureInPicture';
import LiverIcon from '../svgs/liver.svg';
import TumorIcon from '../svgs/tumor.svg';
import ArteryIcon from '../svgs/artery.svg';

const getOrganDetails = (name) => {
  if (name === 'mtl1') return { icon: LiverIcon, label: 'Liver' };
  if (name === 'mtl110503') return { icon: TumorIcon, label: 'Tumor' };
  if (name === 'mtl111289') return { icon: ArteryIcon, label: 'Arteries' };
  return { icon: null, label: name };
};

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
  const [selectedActor, setSelectedActor] = useState(0);

  const [positionValueAxial, setPositionValueAxial] = useState(0);
  const [positionValueCoronal, setPositionValueCoronal] = useState(0);
  const [positionValueSagittal, setPositionValueSagittal] = useState(0);

  const [rotationValueAxial, setRotationValueAxial] = useState(0);
  const [rotationValueCoronal, setRotationValueCoronal] = useState(0);
  const [rotationValueSagittal, setRotationValueSagittal] = useState(0);


  //vivek
  const [selectedProperty, setSelectedProperty] = useState('diffuse');
  const [selectedPropertyValue, setSelectedPropertyValue] = useState({
    ambient: 10,
    diffuse: 100,
    specular: 5,
    specularPower: 90,
    specularColor: 50,
    roughnessTexture: 0,
    metallicTexture: 61,
    opacity: 100,

  });
  const [propertiesChanged, setPropertiesChanged] = useState(false);

  const [isRenderingLoaded, setIsRenderingLoaded] = useState(false);

  const [isCrossSectionFeatureEnabled, setIsCrossSectionFeatureEnabled] = useState(false);
  const [isChangePropertyValueFeatureEnabled, setIsChangePropertyValueFeatureEnabled] = useState(false);
  const [isChangePositionValueFeatureEnabled, setIsChangePositionValueFeatureEnabled] = useState(false);
  const [isChangeRotationValueFeatureEnabled, setIsChangeRotationValueFeatureEnabled] = useState(false);
  const [isFindingsVisible, setIsFindingsVisible] = useState(false);

  const demoFindings = {
    Liver: [
      "Volume: 1450 cc",
      "Density: Normal (45 HU)",
      "No focal lesions detected in the left lobe.",
      "Mild fatty infiltration observed."
    ],
    Tumor: [
      "Location: Segment VII",
      "Size: 3.2 x 2.8 x 3.0 cm",
      "Type: Hepatocellular Carcinoma (HCC)",
      "Vascularity: Hypervascular",
      "Margins: Irregular"
    ],
    Arteries: [
      "Hepatic Artery: Patent",
      "Portal Vein: Normal caliber",
      "No evidence of thrombosis.",
      "Variant anatomy: Michels Type I"
    ]
  };

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
        background: [0, 0, 0], // Dark gray
      });

      const newRenderer = fullScreenRenderer.getRenderer();
      const renderWindow = fullScreenRenderer.getRenderWindow();

      const newActors = [];
      const initialStates = [];

      let plane = null;
      if (selectedPlane === 'axial') {
        plane = vtkPlane.newInstance({ normal: [0, -1, 0], origin: [0, 0, 0] });
      }
      else if (selectedPlane === 'coronal') {
        plane = vtkPlane.newInstance({ normal: [1, 0, 0], origin: [0, 0, 0] });
      }
      else if (selectedPlane === 'sagittal') {
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

          // newActor.setOrientation(270, 0, 0); // Breast, human skelton
          newActor.setOrientation(90, 270, 0);  // KUB


          newActor.getProperty().setInterpolationToPhong();
          // newActor.getProperty().setInterpolationToGouraud();
          // newActor.getProperty().setInterpolationToFlat();

          // newActor.getProperty().setAmbient(0.6);  // vivek
          // newActor.getProperty().setDiffuse(1);
          // newActor.getProperty().setSpecular(0.005);
          // newActor.getProperty().setSpecularPower(90);
          // newActor.getProperty().setSpecularColor(50, 50, 50);
          // newActor.getProperty().setRoughnessTexture(0);
          // newActor.getProperty().setMetallicTexture(0.61);
          newActor.getProperty().setAmbient(selectedPropertyValue.ambient / 100);
          newActor.getProperty().setDiffuse(selectedPropertyValue.diffuse / 100);
          newActor.getProperty().setSpecular(selectedPropertyValue.specular / 1000);
          newActor.getProperty().setSpecularPower(selectedPropertyValue.specularPower);
          newActor.getProperty().setSpecularColor(selectedPropertyValue.specularColor, selectedPropertyValue.specularColor, selectedPropertyValue.specularColor);
          newActor.getProperty().setRoughnessTexture(selectedPropertyValue.roughnessTexture / 100);
          newActor.getProperty().setMetallicTexture(selectedPropertyValue.metallicTexture / 100);
          newActor.getProperty().setOpacity(selectedPropertyValue.opacity / 100);

          // newActor.getProperty().setEdgeColor(0, 0, 0);
          // newActor.getProperty().setEdgeVisibility(true);




          const material = materialsReader.getMaterial(name);
          const diffuseColor = material ? material.Kd.map(parseFloat) : [1, 1, 1];
          const initialColor = `#${rgbToHex(diffuseColor[0] * 255)}${rgbToHex(diffuseColor[1] * 255)}${rgbToHex(diffuseColor[2] * 255)}`;

          const visibilityMode = name === 'mtl1' ? 'transparent' : 'visible';
          if (visibilityMode === 'transparent') {
            newActor.getProperty().setOpacity(0.5);
          }

          if (selectedActor === null) {
            setSelectedActor(0);
          }

          newActors.push({ actor: newActor, visibilityMode, color: initialColor, name });

          initialStates.push({
            position: newActor.getPosition(),
            orientation: newActor.getOrientation(),
            scale: newActor.getScale(),
          });
        }
      }

      console.log(initialStates)


      const openGLRenderWindow = vtkOpenGLRenderWindow.newInstance();
      const cube = vtkAnnotatedCubeActor.newInstance();
      cube.setDefaultStyle({
        text: "+X",
        fontStyle: "bold",
        fontFamily: "Arial",
        fontColor: "#FFF",
        fontSizeScale: (res) => res / 2,
        faceColor: "#EB3678",
        faceRotation: 0,
        edgeThickness: 0.1,
        edgeColor: "black",
        resolution: 400,
        sendToBack: true,
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
      if (selectedPlane === 'axial') {
        plane.setOrigin(0, bounds[3], 0);
      } else if (selectedPlane === 'coronal') {
        plane.setOrigin(bounds[0], 0, 0);
      } else if (selectedPlane === 'sagittal') {
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
    setIsRenderingLoaded(true);

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

      if (selectedPlane === 'axial') {
        const yRange = bounds[3] - bounds[2]; // y-axis range of the bounding box
        // Calculate the yValue such that higher values correspond to the superior side
        const yValue = bounds[3] - normalizedValue * yRange;

        actors.forEach(({ actor }) => {
          // Update the clipping plane to crop from superior to inferior
          actor.getMapper().getClippingPlanes()[0].setOrigin(0, yValue, 0);
        });
      }
      else if (selectedPlane === 'coronal') {
        const xRange = bounds[1] - bounds[0]; // x-axis range of the bounding box
        // Calculate the xValue such that higher values correspond to the right side
        const xValue = bounds[0] + normalizedValue * xRange;

        actors.forEach(({ actor }) => {
          // Update the clipping plane to crop from right to left
          actor.getMapper().getClippingPlanes()[0].setOrigin(xValue, 0, 0);
        });
      }
      else if (selectedPlane === 'sagittal') {
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

  const handdleRestore = () => {
    setScrollValue(0);
    setSelectedPlane('axial');


    setActors((prevActors) => {
      const updatedActors = [...prevActors];
      updatedActors.forEach((actorObj, index) => {
        const vtkActor = actorObj.actor;
        vtkActor.setPosition(0, 0, 0);
        vtkActor.setOrientation(270, 90, 0);
        vtkActor.setScale(1, 1, 1);
        vtkActor.rotateX(0);
        vtkActor.rotateY(0);
        vtkActor.rotateZ(0);
      });

      return updatedActors;
    });
    setPositionValueAxial(0);
    setPositionValueCoronal(0);
    setPositionValueSagittal(0);
    setRotationValueAxial(0);
    setRotationValueCoronal(0);
    setRotationValueSagittal(0);
    setSelectedActor(0)

    if (renderer) {
      const camera = renderer.getActiveCamera();
      camera.setPosition(0, 0, 1);
      camera.setFocalPoint(0, 0, 0);
      camera.setViewUp(0, 1, 0);
      renderer.resetCamera();
      renderer.getRenderWindow().render();
    }
  }


  const updateActorPosition = (newValue, plane) => {
    if (selectedActor !== null) {
      const actorObj = actors[selectedActor];
      const vtkActor = actorObj.actor;
      const currentPos = vtkActor.getPosition();

      let newPos;
      if (plane === 'axial') {
        newPos = [currentPos[0], newValue, currentPos[2]];
      } else if (plane === 'coronal') {
        newPos = [newValue, currentPos[1], currentPos[2]];
      } else if (plane === 'sagittal') {
        newPos = [currentPos[0], currentPos[1], newValue];
      }

      vtkActor.setPosition(...newPos);
      if (plane === 'axial') {
        setPositionValueAxial(newValue);
      }
      else if (plane === 'coronal') {
        setPositionValueCoronal(newValue);
      }
      else if (plane === 'sagittal') {
        setPositionValueSagittal(newValue);
      }
      renderer.getRenderWindow().render();
    }
  };



  const updateActorRotation = (newValue, axis) => {
    if (selectedActor !== null) {
      const actorObj = actors[selectedActor];
      const vtkActor = actorObj.actor;

      // Rotate the actor around the selected axis
      if (axis === 'x') {
        vtkActor.rotateX(newValue - rotationValueAxial);
      } else if (axis === 'y') {
        vtkActor.rotateY(newValue - rotationValueCoronal);
      } else if (axis === 'z') {
        vtkActor.rotateZ(newValue - rotationValueSagittal);
      }

      if (axis === 'x') {
        setRotationValueAxial(newValue);
      }
      else if (axis === 'y') {
        setRotationValueCoronal(newValue);
      }
      else if (axis === 'z') {
        setRotationValueSagittal(newValue);
      }
      renderer.getRenderWindow().render();
    }
  };



  // useEffect(() => {
  //   console.log(selectedPropertyValue, selectedProperty);
  //   setActors((prevActors) => {
  //     const updatedActors = [...prevActors];
  //     updatedActors.forEach((actorObj, index) => {
  //       const vtkActor = actorObj.actor;
  //       if(selectedProperty === 'ambient'){
  //         vtkActor.getProperty().setAmbient(selectedPropertyValue.ambient/100);
  //       }
  //       else if(selectedProperty === 'diffuse'){
  //         vtkActor.getProperty().setDiffuse(selectedPropertyValue.diffuse/100);
  //       }
  //       else if(selectedProperty === 'specular'){
  //         vtkActor.getProperty().setSpecular(selectedPropertyValue.specular/1000);
  //       }
  //       else if(selectedProperty === 'specularPower'){
  //         vtkActor.getProperty().setSpecularPower(selectedPropertyValue.specularPower);
  //       }
  //       else if(selectedProperty === 'specularColor'){
  //         vtkActor.getProperty().setSpecularColor(selectedPropertyValue.specularColor, selectedPropertyValue.specularColor, selectedPropertyValue.specularColor);
  //       }
  //       else if(selectedProperty === 'roughnessTexture'){
  //         vtkActor.getProperty().setRoughnessTexture(selectedPropertyValue.roughnessTexture/100);
  //       }
  //       else if(selectedProperty === 'metallicTexture'){
  //         vtkActor.getProperty().setMetallicTexture(selectedPropertyValue.metallicTexture/100);
  //       }
  //       else if(selectedProperty === 'opacity'){
  //         vtkActor.getProperty().setOpacity(selectedPropertyValue.opacity/100);
  //       }
  //     });
  //     return updatedActors;
  //   });

  //   if (renderer) {
  //     renderer.resetCamera();
  //     renderer.getRenderWindow().render();
  //   }
  // }, [selectedPropertyValue, isRenderingLoaded]);


  useEffect(() => {
    console.log(selectedPropertyValue, selectedProperty);
    setActors((prevActors) => {
      const updatedActors = [...prevActors];
      updatedActors.forEach((actorObj, index) => {
        const vtkActor = actorObj.actor;
        vtkActor.getProperty().setAmbient(selectedPropertyValue.ambient / 100);
        vtkActor.getProperty().setDiffuse(selectedPropertyValue.diffuse / 100);
        vtkActor.getProperty().setSpecular(selectedPropertyValue.specular / 1000);
        vtkActor.getProperty().setSpecularPower(selectedPropertyValue.specularPower);
        vtkActor.getProperty().setSpecularColor(selectedPropertyValue.specularColor, selectedPropertyValue.specularColor, selectedPropertyValue.specularColor);
        vtkActor.getProperty().setRoughnessTexture(selectedPropertyValue.roughnessTexture / 100);
        vtkActor.getProperty().setMetallicTexture(selectedPropertyValue.metallicTexture / 100);
        if (actorObj.visibilityMode === 'transparent') {
          vtkActor.getProperty().setOpacity(0.5);
        } else {
          vtkActor.getProperty().setOpacity(selectedPropertyValue.opacity / 100);
        }
        // vtkActor.getProperty().setFrontfaceCulling(true); // hides the front face of the object
        // vtkActor.getProperty().setBackfaceCulling(true); // hides the back face of the object
      });
      return updatedActors;
    });

    if (renderer) {
      renderer.resetCamera();
      renderer.getRenderWindow().render();
    }
  }, [isRenderingLoaded, selectedPropertyValue]);




  return (
    <div className="container" style={{ position: 'relative' }} ref={pageContainerRef}>

      <div style={{ position: 'absolute', top: '15px', right: '5px', zIndex: 1 }}>
        {/* Change Property Value */}
        <Tooltip title="Change Property Value">
          <IconButton
            id="change_property_value_btn"
            onClick={() => {
              setIsChangePropertyValueFeatureEnabled(!isChangePropertyValueFeatureEnabled);
              setIsCrossSectionFeatureEnabled(false);
              setIsChangePositionValueFeatureEnabled(false);
              setIsFindingsVisible(false);
            }}
            title="Change Property Value"
          >
            <MagicChange sx={{ color: isChangePropertyValueFeatureEnabled ? '#EB3678' : "#fff" }} />
          </IconButton>
        </Tooltip>


        {/* Cross Section */}
        <Tooltip title="Cross Section">
          <IconButton
            id="cross_section_btn"
            onClick={() => {
              setIsCrossSectionFeatureEnabled(!isCrossSectionFeatureEnabled);
              setIsChangePropertyValueFeatureEnabled(false);
              setIsChangePositionValueFeatureEnabled(false);
              setIsFindingsVisible(false);
            }}
            title="Cross Section"
          >
            <CrossSection sx={{ color: isCrossSectionFeatureEnabled ? '#EB3678' : "#fff" }} />
          </IconButton>
        </Tooltip>

        {/* Change Position Value */}
        <Tooltip title="Change Position Value">
          <IconButton
            id="change_position_value_btn"
            onClick={() => {
              setIsChangePositionValueFeatureEnabled(!isChangePositionValueFeatureEnabled);
              setIsCrossSectionFeatureEnabled(false);
              setIsChangePropertyValueFeatureEnabled(false);
              setIsFindingsVisible(false);
            }}
            title="Change Position Value"
          >
            <PositionIcon sx={{ color: isChangePositionValueFeatureEnabled ? '#EB3678' : "#fff" }} />
          </IconButton>
        </Tooltip>


        {/* Restore */}
        <Tooltip title="Restore">
          <IconButton
            id="restore_btn"
            onClick={handdleRestore}
            title="Fullscreen"
          >
            <RestoreIcon sx={{ color: "#fff" }} />
          </IconButton>
        </Tooltip>


        {/* rotation */}
        {isRotating ? (
          <Tooltip title="Stop Rotation">
            <IconButton
              id="rotation_btn"
              onClick={handleStopRotation}
              title="Stop Rotation"
            >
              <SyncDisabledOutlinedIcon sx={{ color: "#fff" }} onClick={handleStopRotation} />
            </IconButton>
          </Tooltip>
        ) : (
          <Tooltip title="Start Rotation">
            <IconButton
              id="rotation_btn"
              onClick={handleStartRotation}
              title="Start Rotation"
            >
              <AutorenewOutlinedIcon sx={{ color: "#fff" }} onClick={handleStartRotation} />
            </IconButton>
          </Tooltip>
        )}

        {/* Fullscreen */}
        <Tooltip title="Fullscreen">
          <IconButton
            id="fullscreen_btn"
            onClick={handleFullscreen}
            title="Fullscreen"
          >
            <Fullscreen sx={{ color: "#fff" }} />
          </IconButton>
        </Tooltip>

        {/* Findings Info */}
        <Tooltip title="Show Findings">
          <IconButton
            id="findings_btn"
            onClick={() => {
              setIsFindingsVisible(!isFindingsVisible);
              setIsChangePropertyValueFeatureEnabled(false);
              setIsCrossSectionFeatureEnabled(false);
              setIsChangePositionValueFeatureEnabled(false);
            }}
            title="Show Findings"
          >
            <InfoOutlinedIcon sx={{ color: isFindingsVisible ? '#EB3678' : "#fff" }} />
          </IconButton>
        </Tooltip>
      </div>



      {/* Organ Selection */}
      {rendererInitialized && isChangePositionValueFeatureEnabled && (
        <div 
          style={{ 
              color:'white', 
              position: 'absolute', 
              width:'7%', 
              top: '34%', 
              right: '0px', 
              zIndex: 1, 
              display:'flex', 
              justifyContent:'space-around',
              height:"25%"
          }}>
          {actors.length > 0 && (
              <FormControl variant="outlined" style={{width:'100%', height:"20%", backgroundColor:'gray', color:'white'}}>
                  <InputLabel style={{color:"white"}} id="demo-simple-select-label">Organ</InputLabel>
                  <Select 
                      value={selectedActor} 
                      onChange={(e) => {
                        setSelectedActor(e.target.value);
                        setPositionValueAxial(0);
                        setPositionValueCoronal(0);
                        setPositionValueSagittal(0);
                        setRotationValueAxial(0);
                        setRotationValueCoronal(0);
                        setRotationValueSagittal(0);
                      }}
                      style={{color:'white', backgroundColor:"#EB3678",  width: "100%", height: "100%"}}
                  >
                  {actors.map((actorObj, index) => (
                      <MenuItem key={index} value={index}>
                      {actorObj.name}
                      </MenuItem>
                  ))}
                  </Select>
              </FormControl>
          )}
        </div>
      )}


      {/* shifting sliders */}
      {rendererInitialized && isChangePositionValueFeatureEnabled &&
        <div className='sliders-div-position'>
          <div className="slider-container">
            <label>Axial</label>
            <input
              type="range"
              value={positionValueAxial}
              min={-100}
              max={100}
              onChange={(e) => updateActorPosition(parseInt(e.target.value), 'axial')}
              aria-labelledby="position-slider"
              className="horizontal-slider"
            />
          </div>

          <div className="slider-container">
            <label>Coronal</label>
            <input
              type="range"
              value={positionValueCoronal}
              min={-100}
              max={100}
              onChange={(e) => updateActorPosition(parseInt(e.target.value), 'coronal')}
              aria-labelledby="position-slider"
              className="horizontal-slider"
            />
          </div>

          <div className="slider-container">
            <label>Sagittal</label>
            <input
              type="range"
              value={positionValueSagittal}
              min={-100}
              max={100}
              onChange={(e) => updateActorPosition(parseInt(e.target.value), 'sagittal')}
              aria-labelledby="position-slider"
              className="horizontal-slider"
            />
          </div>
        </div>
      }

      {/* Rotational sliders */}
      {rendererInitialized && isChangePositionValueFeatureEnabled &&
        <div className="sliders-div-rotation">
          <div className="slider-container">
            <label>X-axis</label>
            <input
              type="range"
              value={rotationValueAxial}
              min={-180}
              max={180}
              onChange={(event) => updateActorRotation(parseInt(event.target.value), 'x')}
              aria-labelledby="rotation-slider"
              className="horizontal-slider"
            />
          </div>

          <div className="slider-container">
            <label>Y-axis</label>
            <input
              type="range"
              value={rotationValueCoronal}
              min={-180}
              max={180}
              onChange={(event) => updateActorRotation(parseInt(event.target.value), 'y')}
              aria-labelledby="rotation-slider"
              className="horizontal-slider"
            />
          </div>

          <div className="slider-container">
            <label>Z-axis</label>
            <input
              type="range"
              value={rotationValueSagittal}
              min={-180}
              max={180}
              onChange={(event) => updateActorRotation(parseInt(event.target.value), 'z')}
              aria-labelledby="rotation-slider"
              className="horizontal-slider"
            />
          </div>
        </div>
      }


      {/* 3D Properties vivek */}
      {rendererInitialized && isChangePropertyValueFeatureEnabled && (
        <div
          style={{
            position: 'absolute',
            display: "flex",
            justifyContent: "space-between",
            alignItems: 'center',
            flexDirection: "column",
            top: '35%',
            width: "7%",
            right: '0px',
            height: '60%',
            zIndex: 1
          }}>
          <FormControl variant="outlined" style={{ width: '100%', backgroundColor: 'gray', color: 'white' }}>
            <InputLabel style={{ color: "white" }} id="demo-simple-select-label">Property</InputLabel>
            <Select
              value={selectedProperty}
              onChange={(e) => {
                setSelectedProperty(e.target.value);
              }}
              style={{ color: 'white', backgroundColor: "#EB3678", width: "100%", height: "35px" }}
            >
              <MenuItem value='diffuse'>Diffuse</MenuItem>
              <MenuItem value='specular'>Specular</MenuItem>
              <MenuItem value='specularPower'>Specular Power</MenuItem>
              <MenuItem value='specularColor'>Specular Color</MenuItem>
              <MenuItem value='opacity'>Opacity</MenuItem>
              <MenuItem value='ambient'>Ambient</MenuItem>
              <MenuItem value='roughnessTexture'>Roughness Texture</MenuItem>
              <MenuItem value='metallicTexture'>Metallic Texture</MenuItem>
            </Select>
          </FormControl>
          <input
            type="range"
            min="0"
            max="100"
            // defaultValue="0"
            value={selectedPropertyValue[selectedProperty]}
            className="vertical-slider"
            onChange={(event) => {
              setSelectedPropertyValue({ ...selectedPropertyValue, [selectedProperty]: parseInt(event.target.value) });
              setPropertiesChanged(true);
            }}
            style={{
              position: 'absolute',
              top: '140px',
              transform: 'rotate(-90deg)',
              zIndex: 20000,
              width: '190px',
            }}
          />
          <span style={{ color: 'white', position: 'absolute', top: "260px" }}>{selectedPropertyValue[selectedProperty]}</span>
        </div>
      )}



      {/* Cross Section */}
      {rendererInitialized && isCrossSectionFeatureEnabled && (
        <div
          style={{
            position: 'absolute',
            display: "flex",
            justifyContent: "space-around",
            alignItems: 'center',
            flexDirection: "column",
            top: '27%',
            width: "7%",
            right: '0px',
            height: '40%',
            zIndex: 1
          }}
        >
          <FormControl variant="outlined" style={{ width: '100%', backgroundColor: 'gray', color: 'white' }}>
            <InputLabel style={{ color: "white" }} id="demo-simple-select-label">Cross section</InputLabel>
            <Select
              style={{ color: 'white', backgroundColor: "#EB3678", width: "100%", height: "35px" }}
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




      {/* 3d rendering */}
      <div style={{ height: '100vh', width: '100vw', background: 'radial-gradient(circle, rgba(0, 0, 0, 0) 60%, rgba(0, 0, 0, 0.5) 100%)' }} ref={containerRef} />



      {/* controls icon to hide and show */}
      <div style={{ position: 'absolute', top: '15px', left: '40px', zIndex: 1 }}>
        {isControlsVisible ? (
          <FilterListOutlinedIcon style={{ color: 'white', cursor: 'pointer' }} onClick={() => setIsControlsVisible(false)} />
        ) : (
          <FilterListOffOutlinedIcon style={{ color: 'white', cursor: 'pointer' }} onClick={() => setIsControlsVisible(true)} />
        )}
      </div>



      {rendererInitialized && isControlsVisible && (
        <div className="controls">
          {actors.map((actorObj, index) => (
            <div key={index} style={{ color: actorObj.color }} className="control-item">
              {(() => {
                const { icon, label } = getOrganDetails(actorObj.name);
                const colorPickerRef = React.createRef();
                return (
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    {icon ? (
                      <Tooltip title={label}>
                        <div
                          style={{
                            width: '60px',
                            height: '60px',
                            backgroundColor: actorObj.color,
                            opacity: actorObj.visibilityMode === 'visible' ? 1 : actorObj.visibilityMode === 'transparent' ? 0.7 : 0.4,
                            maskImage: `url(${icon})`,
                            maskSize: 'contain',
                            maskRepeat: 'no-repeat',
                            maskPosition: 'center',
                            WebkitMaskImage: `url(${icon})`,
                            WebkitMaskSize: 'contain',
                            WebkitMaskRepeat: 'no-repeat',
                            WebkitMaskPosition: 'center',
                            cursor: 'pointer',
                            marginRight: '8px'
                          }}
                          onClick={() => toggleVisibility(index)}
                          onContextMenu={(e) => {
                            e.preventDefault();
                            if (colorPickerRef.current) {
                              colorPickerRef.current.click();
                            }
                          }}
                        />
                      </Tooltip>
                    ) : (
                      <span onClick={() => toggleVisibility(index)} style={{ cursor: 'pointer' }}>{label}</span>
                    )}
                    <input
                      ref={colorPickerRef}
                      type="color"
                      value={actorObj.color}
                      onChange={(e) => handleColorChange(index, e.target.value)}
                      style={{
                        visibility: 'hidden',
                        position: 'absolute',
                        width: 0,
                        height: 0
                      }}
                    />
                  </div>
                );
              })()}

            </div>
          ))}
        </div>
      )}

      {/* Findings Panel */}
      {rendererInitialized && isFindingsVisible && (
        <div
          style={{
            position: 'absolute',
            top: '20%',
            right: '20px',
            width: '300px',
            backgroundColor: 'rgba(20, 20, 20, 0.75)',
            backdropFilter: 'blur(10px)',
            borderRadius: '15px',
            padding: '20px',
            color: 'white',
            boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
            border: '1px solid rgba(255, 255, 255, 0.18)',
            zIndex: 10,
            maxHeight: '60%',
            overflowY: 'auto',
            fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif'
          }}
        >
          <h2 style={{
            marginTop: 0,
            marginBottom: '20px',
            fontSize: '1.5rem',
            borderBottom: '1px solid rgba(255,255,255,0.2)',
            paddingBottom: '10px',
            color: '#EB3678'
          }}>
            Radiological Findings
          </h2>

          {Object.entries(demoFindings).map(([organ, findings]) => (
            <div key={organ} style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                {(() => {
                  const { icon } = getOrganDetails(
                    organ === 'Liver' ? 'mtl1' :
                      organ === 'Tumor' ? 'mtl110503' :
                        'mtl111289'
                  );
                  return icon ? (
                    <div
                      style={{
                        width: '24px',
                        height: '24px',
                        backgroundColor: organ === 'Liver' ? '#CD5C5C' : organ === 'Tumor' ? '#8B4513' : '#FF4444',
                        maskImage: `url(${icon})`,
                        maskSize: 'contain',
                        maskRepeat: 'no-repeat',
                        maskPosition: 'center',
                        WebkitMaskImage: `url(${icon})`,
                        WebkitMaskSize: 'contain',
                        WebkitMaskRepeat: 'no-repeat',
                        WebkitMaskPosition: 'center',
                        marginRight: '10px'
                      }}
                    />
                  ) : null;
                })()}
                <h3 style={{ margin: 0, fontSize: '1.2rem' }}>{organ}</h3>
              </div>
              <ul style={{ paddingLeft: '20px', margin: 0 }}>
                {findings.map((finding, idx) => (
                  <li key={idx} style={{ marginBottom: '5px', fontSize: '0.9rem', lineHeight: '1.4' }}>
                    {finding}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ObjFilesRenderer;
