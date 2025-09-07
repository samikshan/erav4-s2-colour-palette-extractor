from fastapi import FastAPI, File, UploadFile, HTTPException, Form
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse, JSONResponse
import numpy as np
from PIL import Image
from sklearn.cluster import KMeans
import io
import base64
from typing import List, Dict

app = FastAPI(title="Color Palette Extractor", description="Extract dominant colors from images")

# Serve static files
app.mount("/static", StaticFiles(directory="static"), name="static")

def extract_colors(image: Image.Image, num_colors: int = 6) -> List[Dict]:
    """Extract dominant colors from an image using K-means clustering"""
    # Convert image to RGB if it's not already
    if image.mode != 'RGB':
        image = image.convert('RGB')
    
    # Resize image for faster processing
    image.thumbnail((150, 150))
    
    # Convert image to numpy array
    img_array = np.array(image)
    
    # Reshape to list of pixels
    pixels = img_array.reshape(-1, 3)
    
    # Apply K-means clustering
    kmeans = KMeans(n_clusters=num_colors, random_state=42, n_init=10)
    kmeans.fit(pixels)
    
    # Get the dominant colors
    colors = kmeans.cluster_centers_.astype(int)
    
    # Get the percentage of each color
    labels = kmeans.labels_
    percentages = np.bincount(labels) / len(labels) * 100
    
    # Create color palette
    palette = []
    for i, (color, percentage) in enumerate(zip(colors, percentages)):
        r, g, b = color
        hex_color = f"#{r:02x}{g:02x}{b:02x}"
        palette.append({
            "rgb": [int(r), int(g), int(b)],
            "hex": hex_color,
            "percentage": round(float(percentage), 1)
        })
    
    # Sort by percentage (most dominant first)
    palette.sort(key=lambda x: x["percentage"], reverse=True)
    
    return palette

def create_reduced_image(image: Image.Image, palette: List[Dict]) -> str:
    """Create an image using only the extracted colors"""
    if image.mode != 'RGB':
        image = image.convert('RGB')
    
    # Get colors from palette
    colors = np.array([color["rgb"] for color in palette])
    
    # Convert image to numpy array
    img_array = np.array(image)
    original_shape = img_array.shape
    pixels = img_array.reshape(-1, 3)
    
    # Find closest color for each pixel
    reduced_pixels = np.zeros_like(pixels)
    for i, pixel in enumerate(pixels):
        distances = np.sqrt(np.sum((colors - pixel) ** 2, axis=1))
        closest_color_index = np.argmin(distances)
        reduced_pixels[i] = colors[closest_color_index]
    
    # Reshape back to image
    reduced_array = reduced_pixels.reshape(original_shape)
    reduced_image = Image.fromarray(reduced_array.astype(np.uint8))
    
    # Convert to base64
    buffer = io.BytesIO()
    reduced_image.save(buffer, format="PNG")
    img_str = base64.b64encode(buffer.getvalue()).decode()
    
    return f"data:image/png;base64,{img_str}"

@app.get("/", response_class=HTMLResponse)
async def index():
    """Serve the main HTML page"""
    with open("static/index.html", "r") as f:
        return HTMLResponse(content=f.read())

@app.post("/extract-colors")
async def extract_colors_endpoint(file: UploadFile = File(...), num_colors: int = Form(6)):
    """Extract dominant colors from uploaded image"""
    try:
        # Debug: Print the received num_colors value
        print(f"DEBUG: Received num_colors = {num_colors} (type: {type(num_colors)})")
        
        # Validate file type
        if not file.content_type.startswith("image/"):
            raise HTTPException(status_code=400, detail="File must be an image")
        
        # Read and process image
        contents = await file.read()
        image = Image.open(io.BytesIO(contents))
        
        # Extract color palette
        palette = extract_colors(image, num_colors)
        
        # Debug: Print the actual palette length
        print(f"DEBUG: Generated palette has {len(palette)} colors")
        
        # Create reduced color image
        reduced_image_data = create_reduced_image(image, palette)
        
        # Convert original image to base64 for display
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        buffer = io.BytesIO()
        image.save(buffer, format="PNG")
        original_image_data = f"data:image/png;base64,{base64.b64encode(buffer.getvalue()).decode()}"
        
        return JSONResponse({
            "success": True,
            "palette": palette,
            "original_image": original_image_data,
            "reduced_image": reduced_image_data,
            "filename": file.filename
        })
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing image: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)