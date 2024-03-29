import React, { useRef, useState } from 'react';
import axios from 'axios';
import ObjFilesRenderer from './components/ObjFilesRenderer';
import { TableContainer, Table, TableHead, TableRow, TableCell, TableBody, Paper } from '@mui/material';    
import "./Uploads.css"


const Home = () => {
  const InputRef = useRef(null);
  const [isRendered, setIsRendered] = useState(false);
  const [objFiles, setObjFiles] = useState([]);
  const [jsonFiles, setJsonFiles]= useState([]);



  const DataTable = ({ data }) => {
    data = JSON.parse(data);
    return (
      <TableContainer className='table-container' component={Paper}>
        <Table>
          <TableHead className='table-head'>
            <TableRow>
              {Object.keys(data[0]).map((key, index) => (
                <TableCell key={index}>{key}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((row, rowIndex) => (
              <TableRow key={rowIndex}>
                {Object.values(row).map((value, colIndex) => (
                  <TableCell key={colIndex}>{value}</TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };



  const handleSubmit = async (e) => {
      e.preventDefault();
      try {
        const formData = new FormData();
        formData.append('file', InputRef.current.files[0]);
        console.log(formData.get('file'));
        const res = await axios.post('http://localhost:5002/upload', formData);
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
      }
    };

  return (
    <div className='page'>
    <div className='outer-container'
        style={{height : isRendered ? "30vh" : "100vh"}}
    >
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

      <div>
        {objFiles.length>0 && <ObjFilesRenderer objFiles={objFiles} />}
      </div>

    {
    jsonFiles.length>0 &&
      <div className='tables'>

        {<DataTable data={jsonFiles[0]} />}

        {<DataTable data={jsonFiles[1]} />}

        {<DataTable data={jsonFiles[2]} />}

      </div>
    }
  </div>
  );
};

export default Home;
