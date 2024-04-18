import React, { useRef, useState } from 'react';
import JSZip from 'jszip';
import "./Uploads.css"
import ObjFilesRenderer2 from './components/ObjFilesRenderer2';

const UploadZipOfObjAndRender3D = () => {
  const zipInputRef = useRef(null);
  const [objFiles, setObjFiles] = useState([]);
  const [isRendered, setIsRendered] = useState(false);
  const [TableModalOpen, setTableModalOpen] = useState(false);


  const handleSubmit = async (e) => {
    e.preventDefault();
    const file = zipInputRef.current.files[0];

    if (file) {
      const reader = new FileReader();

      reader.onload = async function (event) {
        const zipData = event.target.result;

        try {
          const zip = await JSZip.loadAsync(zipData);

          const promises = Object.keys(zip.files).map(async (filename) => {
            if (filename.endsWith('.obj')) {
              const objContent = await zip.files[filename].async('string');
              return { filename, objContent };
            }
          });
          const extractedObjData = await Promise.all(promises);
          setObjFiles(extractedObjData);
          setIsRendered(true);
        } catch (error) {
          console.error('Error extracting or processing files:', error);
        }
      };

      reader.readAsArrayBuffer(file);
    } else {
      console.error('Please select the ZIP file.');
    }
  };

  return (
    <div className='parent-container'>
        { !isRendered && (

      <div className='outer-container' style={{ height: isRendered ? "30vh" : "100vh" }}>
          <form className='file-form' style={{ height: isRendered ? "70%" : "20%" }} onSubmit={handleSubmit}>
            <div className='input-container'>
              <label>
                Select a .zip File having Objs:
              </label>
              <input type="file" accept=".zip" ref={zipInputRef} />
              <br />
            </div>
            <button
              className='submit-button'
              type="submit"
            >
              Submit
            </button>
          </form>
      </div>
      )}


      <div>
        {isRendered && <ObjFilesRenderer2 objFiles={objFiles} />}
      </div>
    </div>
  );
};

export default UploadZipOfObjAndRender3D;
