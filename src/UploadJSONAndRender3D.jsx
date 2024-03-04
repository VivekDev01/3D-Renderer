import React, { useRef , useState} from 'react';
import vtkActor from '@kitware/vtk.js/Rendering/Core/Actor';
import vtkFullScreenRenderWindow from '@kitware/vtk.js/Rendering/Misc/FullScreenRenderWindow';
import vtkMapper from '@kitware/vtk.js/Rendering/Core/Mapper';
import vtkMTLReader from '@kitware/vtk.js/IO/Misc/MTLReader';
import vtkOBJReader from '@kitware/vtk.js/IO/Misc/OBJReader';
import "./Uploads.css"


const UploadJSONAndRender3D = () => {
  const containerRef = useRef(null);
  const JsonInputRef = useRef(null);
  const [isRendered, setIsRendered]=useState(false)


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
        const jsonText = await readFileAsText(jsonFile);
        console.log(jsonText)
        const jsonData = JSON.parse(jsonText);
        console.log(jsonData)
        const objText = jsonData.obj;
        reader.parseAsText(objText);
        const mtlText = jsonData.mtl;
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

  const handleSubmit = (e) => {
    e.preventDefault();

    const jsonFile = JsonInputRef.current.files[0];

    if (jsonFile) {
      setIsRendered(true)
      initialize3DRenderer(jsonFile);
    } else {
      console.error('Please select the JSON file.');
    }
  };

  return (
    <div>
      <div className='outer-container'
        style={{height : isRendered ? "30vh" : "100vh"}}
      >
          <form className='file-form' style={{height:isRendered ? "70%" : "20%"}} onSubmit={handleSubmit}>
            <div className='input-container'>
              <label>
                Select a .JSON File:
              </label>
              <input type="file" accept=".json" ref={JsonInputRef} />
            </div>
            <button className='submit-button'  type="submit">Submit</button>
          </form>
      </div>
      <div ref={containerRef} />
    </div>
  );
};

export default UploadJSONAndRender3D;
