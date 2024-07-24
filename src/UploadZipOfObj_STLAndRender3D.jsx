import React, { useRef, useState } from 'react';
import JSZip from 'jszip';
import "./Uploads.css"
import ObjAndMtlFilesRenderer from './components/ObjAndMtlFilesRenderer';

const UploadZipOfObjAndSTLAndRender3D = () => {
  const zipInputRef = useRef(null);
  const [renderingElements, setRenderingElements] = useState([]);
  const [isRendered, setIsRendered] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const file = zipInputRef.current.files[0];

    if (file) {
      const reader = new FileReader();

      reader.onload = async function (event) {
        const zipData = event.target.result;

        try {
          const zip = await JSZip.loadAsync(zipData);
          const objPromises = [];
          const mtlContents = {};

          // Collect promises for obj files and read mtl files into mtlContents
          Object.keys(zip.files).forEach((filename) => {
            if (filename.endsWith('.obj')) {
              objPromises.push(
                zip.files[filename].async('string').then(objContent => ({
                  filename,
                  objContent
                }))
              );
            } else if (filename.endsWith('.mtl')) {
              zip.files[filename].async('string').then(mtlContent => {
                mtlContents[filename.replace('.mtl', '')] = mtlContent;
              });
            }
          });

          // Wait for all obj files to be read
          const extractedObjData = await Promise.all(objPromises);

          // Associate mtl content with corresponding obj files
          const finalRenderingElements = extractedObjData.map(({ filename, objContent }) => {
            const baseFilename = filename.replace('.obj', '');
            const mtlContent = mtlContents[baseFilename] || '';
            return { filename, objContent, mtlContent };
          });

          setRenderingElements(finalRenderingElements);
          console.log(finalRenderingElements);
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
      {!isRendered && (
        <div className='outer-container' style={{ height: isRendered ? "30vh" : "100vh" }}>
          <form className='file-form' style={{ height: isRendered ? "70%" : "20%" }} onSubmit={handleSubmit}>
            <div className='input-container'>
              <label>
                Select a .zip File having Objs & MTLs:
              </label>
              <input type="file" accept=".zip" ref={zipInputRef} />
              <br />
            </div>
            <button className='submit-button' type="submit">
              Submit
            </button>
          </form>
        </div>
      )}

      <div>
        {isRendered && <ObjAndMtlFilesRenderer renderingElements={renderingElements} />}
      </div>
    </div>
  );
};

export default UploadZipOfObjAndSTLAndRender3D;
