import React, { useEffect } from 'react';
import '@kitware/vtk.js/favicon';
import '@kitware/vtk.js/Rendering/Profiles/Geometry';
import vtkActor from '@kitware/vtk.js/Rendering/Core/Actor';
import vtkConeSource from '@kitware/vtk.js/Filters/Sources/ConeSource';
import vtkMapper from '@kitware/vtk.js/Rendering/Core/Mapper';
import vtkFullScreenRenderWindow from '@kitware/vtk.js/Rendering/Misc/FullScreenRenderWindow';

const Viewer = () => {
  useEffect(() => {
    //The central component responsible for rendering scenes.
    const renderWindow = vtkFullScreenRenderWindow.newInstance({
      background: [0.2, 0.3, 0.4],
    });

    //Represents a 3D scene or viewport within the rendering window.
    const renderer = renderWindow.getRenderer();

    // Simple pipeline: ConeSource --> Mapper --> Actor
    //3D Object
    const coneSource = vtkConeSource.newInstance({ height: 1.0 });


    // Defines the relationship between the actor's 3D geometric data and its appearance on the screen.
    const mapper = vtkMapper.newInstance();
    mapper.setInputConnection(coneSource.getOutputPort());

    //Represents a 3D object in the scene.
    const actor = vtkActor.newInstance();
    actor.setMapper(mapper);

    renderer.addActor(actor);  
    renderer.resetCamera(); 

    return () => {
      renderWindow.delete();
    };
  }, []); 

  return (
    <div>
      <div id="vtk-container"></div>
    </div>
  );
};

export default Viewer;
