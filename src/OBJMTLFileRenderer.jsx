import React, { useRef, useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Liver3D from './components/Liver3D';


const OBJMTLFileRenderer = () => {
    const containerRef = useRef(null);
    const [renderingElements, setRenderingElements] = useState([]);
    const [isRendered, setIsRendered] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { path } = useParams();

    let filePath = `/3d-models/${path}`;
    console.log('File path:', filePath);

    useEffect(() => {
        const fetchAndProcessFiles = async () => {
            try {
                setLoading(true);
                setError(null);

                // Fetch the directory listing or manifest file
                // Note: You'll need to know which files exist in the directory
                // For now, I'll assume you have a way to get the file list
                // This could be from a manifest.json file or hardcoded list

                // Example: Fetch a manifest file that lists all obj and mtl files
                const manifestResponse = await fetch(`${filePath}/manifest.json`);

                if (!manifestResponse.ok) {
                    throw new Error(`manifest.json not found. Please create it at: public${filePath}/manifest.json`);
                }

                const manifest = await manifestResponse.json();
                const { objFiles, mtlFiles } = manifest;

                // Fetch all OBJ files
                const objPromises = objFiles.map(async (filename) => {
                    const response = await fetch(`${filePath}/${filename}`);
                    if (!response.ok) {
                        throw new Error(`Failed to fetch ${filename}`);
                    }
                    const objContent = await response.text();
                    return { filename, objContent };
                });

                // Fetch all MTL files
                const mtlPromises = mtlFiles.map(async (filename) => {
                    const response = await fetch(`${filePath}/${filename}`);
                    if (!response.ok) {
                        console.warn(`Failed to fetch ${filename}`);
                        return null;
                    }
                    const mtlContent = await response.text();
                    const baseFilename = filename.replace('.mtl', '');
                    return { baseFilename, mtlContent };
                });

                // Wait for all files to be fetched
                const extractedObjData = await Promise.all(objPromises);
                const extractedMtlData = await Promise.all(mtlPromises);

                // Create mtlContents map
                const mtlContents = {};
                extractedMtlData.forEach((mtlData) => {
                    if (mtlData) {
                        mtlContents[mtlData.baseFilename] = mtlData.mtlContent;
                    }
                });

                // Associate mtl content with corresponding obj files
                const finalRenderingElements = extractedObjData.map(({ filename, objContent }) => {
                    const baseFilename = filename.replace('.obj', '');
                    const mtlContent = mtlContents[baseFilename] || '';
                    return { filename, objContent, mtlContent };
                });

                setRenderingElements(finalRenderingElements);
                console.log('Rendering elements:', finalRenderingElements);
                setIsRendered(true);
                setLoading(false);
            } catch (err) {
                console.error('Error fetching or processing files:', err);
                setError(err.message);
                setLoading(false);
            }
        };

        if (path) {
            fetchAndProcessFiles();
        }
    }, [path, filePath]);

    return (
        <div>
            {loading && <div style={{ textAlign: 'center', padding: '20px' }}>Loading 3D models...</div>}
            {error && <div style={{ textAlign: 'center', padding: '20px', color: 'red' }}>Error: {error}</div>}
            {isRendered && <Liver3D renderingElements={renderingElements} />}
        </div>
    );
};

export default OBJMTLFileRenderer;
