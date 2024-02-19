// Viewer.js

import React, { useEffect, useRef } from 'react';
import vtk from 'vtk.js/Sources/vtk';

const Viewer = () => {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;

    // Create a renderer
    const renderer = vtk.Rendering.Core.vtkRenderer.newInstance();

    // Create a render window
    const renderWindow = vtk.Rendering.Core.vtkRenderWindow.newInstance();
    renderWindow.addRenderer(renderer);

    // Create an interactor
    const interactor = vtk.Rendering.Core.vtkRenderWindowInteractor.newInstance();
    interactor.setRenderWindow(renderWindow);

    // Initialize the container and add the render window to it
    renderWindow.setContainer(container);

    // Create a cone source
    const coneSource = vtk.Filters.Sources.vtkConeSource.newInstance();
    const mapper = vtk.Rendering.Core.vtkMapper.newInstance();
    const actor = vtk.Rendering.Core.vtkActor.newInstance();

    mapper.setInputConnection(coneSource.getOutputPort());
    actor.setMapper(mapper);

    // Add the actor to the renderer
    renderer.addActor(actor);

    // Reset the camera and render
    renderer.resetCamera();
    renderWindow.render();

    // Set up event listeners for interaction
    interactor.initialize();
    interactor.bindEvents(container);

    return () => {
      // Clean up on component unmount
      interactor.unbindEvents(container);
    };
  }, []);

  return <div ref={containerRef} />;
};

export default Viewer;
