import React, { useRef } from 'react';
import vtkActor from '@kitware/vtk.js/Rendering/Core/Actor';
import vtkFullScreenRenderWindow from '@kitware/vtk.js/Rendering/Misc/FullScreenRenderWindow';
import vtkMapper from '@kitware/vtk.js/Rendering/Core/Mapper';
import vtkMTLReader from '@kitware/vtk.js/IO/Misc/MTLReader';
import vtkOBJReader from '@kitware/vtk.js/IO/Misc/OBJReader';

const UploadOBJandSTLAndRender3D = () => {
  const containerRef = useRef(null);
  const objInputRef = useRef(null);
  const mtlInputRef = useRef(null);

  const initialize3DRenderer = async (objFile, mtlFile) => {
    console.log('Initializing 3D renderer...');
    const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance({
      container: containerRef.current,
      background: [0.5, 0.5, 0.5],
    });
    const renderer = fullScreenRenderer.getRenderer();
    const renderWindow = fullScreenRenderer.getRenderWindow();

    const resetCamera = renderer.resetCamera;
    const render = renderWindow.render;

    const reader = vtkOBJReader.newInstance({ splitMode: 'usemtl' });
    const materialsReader = vtkMTLReader.newInstance();
    const scene = [];
    console.log('Materials and reader set.');

    function onClick(event) {
      const el = event.target;
      const index = Number(el.dataset.index);
      const actor = scene[index].actor;
      const visibility = actor.getVisibility();

      actor.setVisibility(!visibility);
      if (visibility) {
        el.classList.remove('visible');
      } else {
        el.classList.add('visible');
      }
      render();
    }

    const readFileAsText = (file) => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (event) => {
            resolve(event.target.result);
          };
          reader.onerror = (error) => {
            reject(error);
          };
          reader.readAsText(file);
        });
      };
      

    try {
        const objText = await readFileAsText(objFile);
        reader.parseAsText(objText);
        const mtlText = await readFileAsText(mtlFile);
        materialsReader.parseAsText(mtlText);

        const size = reader.getNumberOfOutputPorts();
        console.log('size', size);
        for (let i = 0; i < size; i++) {
            const polydata = reader.getOutputData(i);
            console.log(polydata.get('name').name);
            const name = polydata.get('name').name;
            console.log(materialsReader.getMaterial(name));
            const mapper = vtkMapper.newInstance();
            const actor = vtkActor.newInstance();

            actor.setMapper(mapper);
            mapper.setInputData(polydata);

            materialsReader.applyMaterialToActor(name, actor);
            renderer.addActor(actor);

            scene.push({ name, polydata, mapper, actor });
        }
        resetCamera();
        render();

        const htmlBuffer = [
            '<style>.visible { font-weight: bold; } .click { cursor: pointer; min-width: 150px;}</style>',
        ];
        scene.forEach((item, idx) => {
            htmlBuffer.push(
            `<div class="click visible" data-index="${idx}">${item.name}</div>`
            );
        });

        fullScreenRenderer.addController(htmlBuffer.join('\n'));
        const nodes = document.querySelectorAll('.click');
        for (let i = 0; i < nodes.length; i++) {
            const el = nodes[i];
            el.onclick = onClick;
        }
        console.log('Renderer initialization complete.');
    } catch (error) {
      console.error('Error initializing 3D renderer:', error);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const objFile = objInputRef.current.files[0];
    const mtlFile = mtlInputRef.current.files[0];

    if (objFile && mtlFile) {
      initialize3DRenderer(objFile, mtlFile);
    } else {
      console.error('Please select both OBJ and MTL files.');
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit}>
        <label>
          Select .OBJ File:
          <input type="file" accept=".obj" ref={objInputRef} />
        </label>
        <br />
        <label>
          Select .MTL File:
          <input type="file" accept=".mtl" ref={mtlInputRef} />
        </label>
        <br />
        <button type="submit">Submit</button>
      </form>
      <div ref={containerRef} />
    </>
  );
};

export default UploadOBJandSTLAndRender3D;
