import React, { useRef, useState } from 'react';
import JSZip from 'jszip';
import JsonFileRenderer from './components/JsonFileRenderer';
import "./Uploads.css"

const UploadZipAndRender3D = () => {
  const zipInputRef = useRef(null);
  const [jsonFiles, setJsonFiles]=useState([])
  const [isRendered, setIsRendered]=useState(false)

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
          setIsRendered(true)
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
  <div>
      <div className='outer-container'
          style={{height : isRendered ? "30vh" : "100vh"}}
      >
        <form className='file-form' style={{height:isRendered ? "70%" : "20%"}} onSubmit={handleSubmit}>
        <div className='input-container'>
            <label>
              Select a .zip File:
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

        <div>
          {jsonFiles.length>0 && <JsonFileRenderer jsonFiles={jsonFiles} />}
        </div>
    </div>
  );
};

export default UploadZipAndRender3D;
