import React, { useRef, useState } from 'react';
import JSZip from 'jszip';
import JsonFileRenderer from './components/JsonFileRenderer';

const UploadZipAndRender3D = () => {
  const zipInputRef = useRef(null);
  const [jsonFiles, setJsonFiles]=useState([])

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
    <div style={{
        display:"flex",
        flexDirection:"column",
        justifyContent:"center",
        alignItems:"center",
    }}>
      <form style={{
        height:"30vh",
        width:"50%",
        display:"flex",
        flexDirection:"column",
        justifyContent:"center",
        alignItems:"center",
        border:"1px solid black",
        marginBottom:"10px"
      }} onSubmit={handleSubmit}>
        <label>
          Select a .zip File:
          <input type="file" accept=".zip" ref={zipInputRef} />
        </label>
        <br />
        <button type="submit">Submit</button>
      </form>

      
      <div>
        {jsonFiles.length>0 && <JsonFileRenderer jsonFiles={jsonFiles} />}
      </div>
      
    </div>
  );
};

export default UploadZipAndRender3D;
