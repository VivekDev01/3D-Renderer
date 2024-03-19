import React from 'react'
import vtkActor from '@kitware/vtk.js/Rendering/Core/Actor';
import vtkFullScreenRenderWindow from '@kitware/vtk.js/Rendering/Misc/FullScreenRenderWindow';
import vtkMapper from '@kitware/vtk.js/Rendering/Core/Mapper';
import vtkMTLReader from '@kitware/vtk.js/IO/Misc/MTLReader';
import vtkOBJReader from '@kitware/vtk.js/IO/Misc/OBJReader';
import { useEffect, useRef } from 'react';

const ObjFilesRenderer = (props) => {
  const containerRef = useRef(null);


    const initialize3DRenderer = async (objFiles) => {
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
        // const materialsReader = vtkMTLReader.newInstance();
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
    
        try {
            objFiles.map((objFile, index)=>{
              const objText = objFile.objContent
              reader.parseAsText(objText);
            //   const mtlText = jsonText.mtl;
            //   materialsReader.parseAsText(mtlText);
              
      
              const size = reader.getNumberOfOutputPorts();
              console.log('size', size);
              for (let i = 0; i < size; i++) {
                  const polydata = reader.getOutputData(i);
                  const name = polydata.get('name').name;
                  const mapper = vtkMapper.newInstance();
                  const actor = vtkActor.newInstance();
      
                  actor.setMapper(mapper);
                  mapper.setInputData(polydata);
      
                //   materialsReader.applyMaterialToActor(name, actor);
                  renderer.addActor(actor);
      
                  scene.push({ name, polydata, mapper, actor });
              }
            })
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

      useEffect(() => {
        const objFiles = props.objFiles;
    
        console.log(objFiles)
        if (objFiles) {
          initialize3DRenderer(objFiles);
        } else {
          console.error('Invalid jsonFile or jsonData is undefined.');
        }
      }, [props.objFiles]);
      


  return (
    <div>
      <div style={{
        height:"100vh",
        width:"100vw",
      }} ref={containerRef} />
    </div>

  )
}

export default ObjFilesRenderer