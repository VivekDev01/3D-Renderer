# Sample 
<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/c8ddd6b0-7834-4647-8c15-5e1147cdd06d" />

# 3D Models - Auto-Generate Manifests

## How It Works

The `OBJMTLFileRenderer` component automatically loads .obj and .mtl files from any folder in `public/3d-models/`. 

Since browsers cannot list directory contents directly, each folder needs a `manifest.json` file that lists the available .obj and .mtl files.

## Adding New 3D Models

### Step 1: Add Your Files
Create a new folder in `public/3d-models/` and add your .obj and .mtl files:

```
public/3d-models/
  ├── liver/
  │   ├── liver_segmentation.nii.gz.obj
  │   └── liver_segmentation.nii.gz.mtl
  ├── lungs/
  │   ├── lung_left.obj
  │   ├── lung_left.mtl
  │   ├── lung_right.obj
  │   └── lung_right.mtl
  └── heart/          ← Your new folder
      ├── heart.obj
      └── heart.mtl
```

### Step 2: Generate Manifests
Run this command to automatically generate manifest.json files for ALL folders:

```bash
npm run generate-manifests
```

This will scan all folders in `public/3d-models/` and create/update manifest.json files.

### Step 3: Access Your Model
Navigate to: `/render/{folder_name}`

Example: `/render/heart`

## What Gets Generated

For each folder, a `manifest.json` file is created:

```json
{
  "objFiles": ["heart.obj"],
  "mtlFiles": ["heart.mtl"]
}
```

## Important Notes

- ✅ Run `npm run generate-manifests` **every time** you add/remove/rename .obj or .mtl files
- ✅ The script automatically finds all .obj and .mtl files in each folder
- ✅ You can have multiple .obj and .mtl files in one folder
- ✅ File names can be anything - no hardcoding required!

## Workflow

1. Add new 3D model files to a folder in `public/3d-models/`
2. Run `npm run generate-manifests`
3. Start/refresh your app
4. Navigate to `/render-local/{folder_name}`
