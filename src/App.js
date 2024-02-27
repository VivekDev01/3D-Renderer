import logo from './logo.svg';
import './App.css';
import {BrowserRouter ,Routes, Route} from 'react-router-dom';
import Viewer from './Viewer';
import Render3D from './Render3D';

function App() {
  return (
    <div className="App">
    <BrowserRouter>
    <Routes>
      <Route path="/cone" element={<Viewer />} />
      <Route path='/render3d' element={<Render3D />} />
    </Routes>
    </BrowserRouter>
    </div>
  );
}

export default App;
