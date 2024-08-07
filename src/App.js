import logo from './logo.svg';
import './App.css';
import {BrowserRouter ,Routes, Route} from 'react-router-dom';
// import ConeRender3D from './ConeRender3D';
// import ReadAndRender3D from './ReadAndRender3D';
// import UploadOBJandSTLAndRender3D from './UploadOBJandSTLAndRender3D';
// import UploadJSONAndRender3D from './UploadJSONAndRender3D';
// import UploadZipAndRender3D from './UploadZipAndRender3D';
// import UploadZipOfObjAndRender3D from './UploadZipOfObjAndRender3D';
// import Liver from "./Liver"
// import UploadZipOfObjAndSTLAndRender3D from './UploadZipOfObj_STLAndRender3D';
import TestRender from './testRender';

function App() {
  return (
    <div className="App">
    <BrowserRouter>
    <Routes>
      {/* <Route path="/cone" element={<ConeRender3D />} /> */}
      {/* <Route path='/read' element={<ReadAndRender3D />} /> */}
      {/* <Route path='/upload-obj-stl' element={<UploadOBJandSTLAndRender3D />} /> */}
      {/* <Route path='/upload-json' element={<UploadJSONAndRender3D />} /> */}
      {/* <Route path='/upload-zip' element={<UploadZipAndRender3D />} /> */}
      {/* <Route path='/upload-zip-objs' element={<UploadZipOfObjAndRender3D />} /> */}
      {/* <Route path='/upload-zip-objs-stl' element={<UploadZipOfObjAndSTLAndRender3D />} /> */}
      {/* <Route path='/' element={<Liver />} /> */}
      <Route path='/render/:id' element={<TestRender />} />
      
    </Routes>
    </BrowserRouter>
    </div>
  );
}

export default App;
