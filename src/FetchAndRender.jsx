import React, { useRef, useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Lungs3D3 from "./components/Lungs3D3"
import Liver from "./components/Liver"
import { baseURL } from './config';
import LiverGIF from './gifs/liver.gif';



const FetchAndRender = () => {
    const [renderingElements, setRenderingElements] = useState([]);
    const [isRendered, setIsRendered] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { path } = useParams();
    const [details, setDetails] = useState({});

    let filePath = `/3d-models/${path}`;
    console.log('File path:', filePath);

    useEffect(() => {
        const fetchAndProcessFiles = async () => {
            try {
                setLoading(true);
                setError(null);

                const response = await fetch(`${baseURL}/load-model/${path}`);

                if (!response.ok) {
                    throw new Error("Failed to load model from server");
                }

                const data = await response.json();

                setRenderingElements(data.renderingElements);
                setDetails(data.details);
                setIsRendered(true);
                setLoading(false);
            } catch (err) {
                console.error(err);
                setError(err.message);
                setLoading(false);
            }
        };

        if (path) {
            fetchAndProcessFiles();
        }
    }, [path, filePath]);

    return (
        <div style={{ width: '100%', height: '100%' }}>
            {loading && 
            <div
                style={{
                    display: 'flex',
                    width: '100%',
                    height: '100vh',
                    justifyContent: 'center',
                    alignItems: 'center',
                    flexDirection: 'column',
                }}
                >
                <img
                    src={LiverGIF}
                    alt="Liver"
                    style={{ width: '300px', height: '300px' }}
                />
                </div>
            }
            {error && <div style={{ textAlign: 'center', padding: '20px', color: 'red' }}>Error: {error}</div>}
            {isRendered && (
                path.includes('liver') ? (
                    <Liver path={path} renderingElements={renderingElements} details={details} />
                ) : (
                    <Lungs3D3 path={path} renderingElements={renderingElements} details={details} />
                )
            )}
        </div>
    );
};

export default FetchAndRender;
