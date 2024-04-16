import React, { useRef, useState } from 'react';
import axios from 'axios';
import ObjFilesRenderer from './components/ObjFilesRenderer';
import CircularProgress from '@mui/joy/CircularProgress';

import "./Uploads.css"

const Home = () => {
  const InputRef = useRef(null);
  const [isRendered, setIsRendered] = useState(false);
  const [isLoading, setIsLoading] = useState(false); 
  const [objFiles, setObjFiles] = useState([]);
  const [jsonFiles, setJsonFiles]= useState([]);
  const [isFormSubmitted, setIsFormSubmitted]=useState(false);
  const [isService1Completed, setIsService1Completed]= useState(false);
  const [isService2Completed, setIsService2Completed]= useState(false);
  const [isService3Completed, setIsService3Completed]= useState(false);


  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true); 
    try {
      const formData = new FormData();
      formData.append('file', InputRef.current.files[0]);
      console.log(formData.get('file'));
      const res = await axios.post('http://localhost:5001/upload');
      if (res.data.success) {
        console.log(res.data)
        setObjFiles(res.data.obj_data)
        setJsonFiles(res.data.json_data)
        console.log(jsonFiles)
        setIsRendered(true)
      }
      else {
        console.log("Error while getting response.")
      }
    } catch (error) {
      console.error('Error while submitting the form:', error);
    } finally {
      setIsLoading(false);
      setIsFormSubmitted(true);
    }
  };

  return (
    <div className='page'>
      {/* {isLoading && <CircularProgress
        color="primary"
        determinate={false}
        size="lg"
        variant="solid"
      />}  */}
      {!isFormSubmitted && (
        <div className='outer-container'>
          <form className='file-form' style={{height:isRendered ? "70%" : "20%"}} onSubmit={handleSubmit}>
            <div className='input-container'>
              <label>
                Select a .nii.gz File:
              </label>
              <input type="file" accept=".nii.gz" ref={InputRef} />
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
        {objFiles.length>0 && <ObjFilesRenderer objFiles={objFiles} jsonFiles={jsonFiles} />}
      </div>
    </div>
  );
};

export default Home;
