import React, { useRef, useState } from 'react';
import vtkActor from '@kitware/vtk.js/Rendering/Core/Actor';
import vtkFullScreenRenderWindow from '@kitware/vtk.js/Rendering/Misc/FullScreenRenderWindow';
import vtkMapper from '@kitware/vtk.js/Rendering/Core/Mapper';
import vtkMTLReader from '@kitware/vtk.js/IO/Misc/MTLReader';
import vtkOBJReader from '@kitware/vtk.js/IO/Misc/OBJReader';
import JSZip from 'jszip';
import { useEffect } from 'react';

const UploadZipAndRender3D = () => {
  const containerRef = useRef(null);
  const zipInputRef = useRef(null);
  const [jsonFiles, setJsonFiles]=useState([])

  const initialize3DRenderer = async (jsonFile) => {
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

    try {
        const jsonText = jsonFile.jsonData
        const objText = jsonText.obj;
        reader.parseAsText(objText);
        const mtlText = jsonText.mtl;
        materialsReader.parseAsText(mtlText);
        

        const size = reader.getNumberOfOutputPorts();
        console.log('size', size);
        for (let i = 0; i < size; i++) {
            const polydata = reader.getOutputData(i);
            const name = polydata.get('name').name;
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

  const handleSubmit=async(e)=>{
    e.preventDefault();
  
    const file = zipInputRef.current.files[0];
  
    if (file){
      const reader = new FileReader();
  
      reader.onload = async function (event){
        const zipData = event.target.result;
  
        try{
          const zip = await JSZip.loadAsync(zipData);
  
          const promises = Object.keys(zip.files).map(async (filename) => {
            if (filename.endsWith('.json')) {
              const jsonContent = await zip.files[filename].async('string');
              const jsonData = JSON.parse(jsonContent);
              return { jsonData };
            }
          });
          const extractedJsonData = await Promise.all(promises);
          setJsonFiles(extractedJsonData);
          console.log('Extracted JSON Files.');
          initialize3DRenderer(extractedJsonData[0])
        } catch (error) {
          console.error('Error extracting or processing files:', error);
        }
      };

      reader.readAsArrayBuffer(file);
    } else {
      console.error('Please select the ZIP file.');
    }
  };


  useEffect(()=>{
    console.log(jsonFiles)
  }, [jsonFiles])


  return (
    <>
      <form onSubmit={handleSubmit}>
        <label>
          Select a .zip File:
          <input type="file" accept=".zip" ref={zipInputRef} />
        </label>
        <br />
        <button type="submit">Submit</button>
      </form>

      <div ref={containerRef} />
    </>
  );
};

export default UploadZipAndRender3D;
