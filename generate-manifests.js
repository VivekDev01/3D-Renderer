const fs = require('fs');
const path = require('path');

// Path to the 3d-models directory
const modelsDir = path.join(__dirname, 'public', '3d-models');

// Function to generate manifest.json for a directory
function generateManifest(dirPath) {
    const files = fs.readdirSync(dirPath);

    const objFiles = files.filter(file => file.endsWith('.obj'));
    const mtlFiles = files.filter(file => file.endsWith('.mtl'));

    const manifest = {
        objFiles,
        mtlFiles
    };

    const manifestPath = path.join(dirPath, 'manifest.json');
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

    console.log(`✓ Generated manifest.json for ${path.basename(dirPath)}`);
    console.log(`  - ${objFiles.length} OBJ files`);
    console.log(`  - ${mtlFiles.length} MTL files`);
}

// Main function to process all subdirectories
function generateAllManifests() {
    if (!fs.existsSync(modelsDir)) {
        console.error(`Error: Directory not found: ${modelsDir}`);
        return;
    }

    const folders = fs.readdirSync(modelsDir, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);

    console.log(`Found ${folders.length} model folders\n`);

    folders.forEach(folder => {
        const folderPath = path.join(modelsDir, folder);
        generateManifest(folderPath);
    });

    console.log('\n✓ All manifests generated successfully!');
}

// Run the script
generateAllManifests();
