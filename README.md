# Color Palette Extractor

A simple AI application that extracts dominant colors from images using K-means clustering.

## Features

- **Upload Images**: Drag & drop or click to upload JPG, PNG, GIF images
- **Extract Colors**: Use K-means clustering to find 3-10 dominant colors
- **Color Palette**: View extracted colors with HEX, RGB values and percentages
- **Color Reduction**: See how the image looks with only the extracted colors
- **Interactive UI**: Click color swatches to copy HEX values

## How It Works

1. **Image Processing**: Uploaded images are resized for faster processing
2. **K-means Clustering**: Pixels are clustered to find dominant color groups
3. **Color Extraction**: Cluster centers represent the dominant colors
4. **Color Reduction**: Each pixel is mapped to its nearest dominant color

## Installation

1. Install dependencies using uv:
```bash
uv sync
```

2. Run the application:
```bash
uv run python main.py
```

Or activate the virtual environment and run directly:
```bash
uv shell
python main.py
```

3. Open your browser and go to `http://localhost:8000`

## Usage

1. Upload an image by clicking the upload area or dragging and dropping
2. Adjust the number of colors to extract (3-10)
3. Click "Extract Colors" to process the image
4. View the results:
   - Original image vs color-reduced image
   - Color palette with HEX/RGB values and percentages
   - Click any color swatch to copy its HEX value

## Technical Details

- **Backend**: FastAPI with scikit-learn for K-means clustering
- **Frontend**: Vanilla HTML/CSS/JavaScript
- **Image Processing**: PIL (Pillow) for image manipulation
- **Color Analysis**: NumPy for array operations

## API Endpoints

- `GET /`: Serve the main HTML page
- `POST /extract-colors`: Extract colors from uploaded image
  - Parameters: `file` (image), `num_colors` (3-10)
  - Returns: JSON with color palette and processed images