import  React, {useState, useEffect} from 'react'
import ObjFilesRenderer from './components/ObjFilesRenderer'
import axios from 'axios'
import { useParams } from 'react-router-dom'
import CircularProgress from '@mui/joy/CircularProgress';
import ObjAndMtlFilesRenderer from './components/ObjAndMtlFilesRenderer';


const Render3D = () => {
    const { user_name, record_id } = useParams();
    const [renderingElements, setRenderingElements]=useState([]);
    const [isLoaded, setIsLoaded]=useState(false);
    const id = useParams().id;

    const handleRenderRequest = async () => {
        try {
          const response = await axios.get(`https://training.urologiq.ai/server/render-3d/${id}`);
          console.log(response.data);
          if(response.data.success){
            setRenderingElements(response.data.renderingElements)
            setIsLoaded(true)
            console.log(renderingElements)
          }
        } catch (error) {
          console.error('Error:', error);
        }
    };

    useEffect(() => {
        handleRenderRequest();
    }, []);

  return (
    <div>
        {isLoaded ?
            <ObjAndMtlFilesRenderer renderingElements={renderingElements} />
            :
            <div 
                      style={{
                        display:"flex",
                        width:"100%",
                        height:"100vh",
                        justifyContent:"center",
                        alignItems:'center',
                        flexDirection:"column"
                      }}
                    >
                        {/* <CircularProgress 
                          color="primary"
                          determinate={false}
                          size="lg"
                          variant="solid"
                        /> */}
                        <h3>Uploading the .nii file...</h3>
                        {/* <img src={LiverGIF} alt="Liver" style={{width: '300px', height: '300px'}} /> */}
              </div>
        }
    </div>
  )
}

export default Render3D