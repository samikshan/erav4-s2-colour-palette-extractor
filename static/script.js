class ColorExtractor {
    constructor() {
        this.initializeElements();
        this.bindEvents();
        this.selectedFile = null;
    }

    initializeElements() {
        this.uploadArea = document.getElementById('uploadArea');
        this.fileInput = document.getElementById('fileInput');
        this.numColorsSlider = document.getElementById('numColors');
        this.numColorsValue = document.getElementById('numColorsValue');
        this.extractBtn = document.getElementById('extractBtn');
        this.loading = document.getElementById('loading');
        this.results = document.getElementById('results');
        this.originalImage = document.getElementById('originalImage');
        this.reducedImage = document.getElementById('reducedImage');
        this.paletteContainer = document.getElementById('paletteContainer');
    }

    bindEvents() {
        // Upload area events
        this.uploadArea.addEventListener('click', () => this.fileInput.click());
        this.uploadArea.addEventListener('dragover', this.handleDragOver.bind(this));
        this.uploadArea.addEventListener('dragleave', this.handleDragLeave.bind(this));
        this.uploadArea.addEventListener('drop', this.handleDrop.bind(this));

        // File input event
        this.fileInput.addEventListener('change', this.handleFileSelect.bind(this));

        // Slider event
        this.numColorsSlider.addEventListener('input', this.updateNumColors.bind(this));

        // Extract button event
        this.extractBtn.addEventListener('click', this.extractColors.bind(this));
    }

    handleDragOver(e) {
        e.preventDefault();
        this.uploadArea.classList.add('dragover');
    }

    handleDragLeave(e) {
        e.preventDefault();
        this.uploadArea.classList.remove('dragover');
    }

    handleDrop(e) {
        e.preventDefault();
        this.uploadArea.classList.remove('dragover');
        
        const files = e.dataTransfer.files;
        if (files.length > 0 && files[0].type.startsWith('image/')) {
            this.selectedFile = files[0];
            this.updateUploadUI();
        }
    }

    handleFileSelect(e) {
        const file = e.target.files[0];
        if (file && file.type.startsWith('image/')) {
            this.selectedFile = file;
            this.updateUploadUI();
        }
    }

    updateUploadUI() {
        if (this.selectedFile) {
            this.uploadArea.querySelector('.upload-content').innerHTML = `
                <div class="upload-icon">✅</div>
                <p><strong>${this.selectedFile.name}</strong></p>
                <p class="upload-hint">Click to select a different image</p>
            `;
            this.extractBtn.disabled = false;
            this.results.style.display = 'none';
        }
    }

    updateNumColors() {
        this.numColorsValue.textContent = this.numColorsSlider.value;
    }

    async extractColors() {
        if (!this.selectedFile) return;

        this.showLoading();

        const formData = new FormData();
        formData.append('file', this.selectedFile);
        formData.append('num_colors', this.numColorsSlider.value);

        try {
            const response = await fetch('/extract-colors', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            if (data.success) {
                this.displayResults(data);
            } else {
                throw new Error(data.detail || 'Unknown error occurred');
            }
        } catch (error) {
            console.error('Error extracting colors:', error);
            alert('Error extracting colors: ' + error.message);
        } finally {
            this.hideLoading();
        }
    }

    showLoading() {
        this.loading.style.display = 'block';
        this.results.style.display = 'none';
        this.extractBtn.disabled = true;
    }

    hideLoading() {
        this.loading.style.display = 'none';
        this.extractBtn.disabled = false;
    }

    displayResults(data) {
        // Display images
        this.originalImage.src = data.original_image;
        this.reducedImage.src = data.reduced_image;

        // Display color palette
        this.paletteContainer.innerHTML = '';
        
        data.palette.forEach((color, index) => {
            const swatch = document.createElement('div');
            swatch.className = 'color-swatch';
            
            swatch.innerHTML = `
                <div class="color-preview" style="background-color: ${color.hex}"></div>
                <div class="color-info">
                    <div class="color-hex">${color.hex}</div>
                    <div class="color-rgb">RGB(${color.rgb.join(', ')})</div>
                    <div class="color-percentage">${color.percentage}%</div>
                </div>
            `;
            
            // Add click to copy functionality
            swatch.addEventListener('click', () => {
                navigator.clipboard.writeText(color.hex).then(() => {
                    this.showCopyFeedback(swatch);
                });
            });
            
            this.paletteContainer.appendChild(swatch);
        });

        // Show results
        this.results.style.display = 'block';
        this.results.scrollIntoView({ behavior: 'smooth' });
    }

    showCopyFeedback(element) {
        const originalContent = element.innerHTML;
        element.innerHTML = `
            <div class="color-preview" style="background-color: #4CAF50"></div>
            <div class="color-info">
                <div class="color-hex">Copied!</div>
            </div>
        `;
        
        setTimeout(() => {
            element.innerHTML = originalContent;
        }, 1000);
    }
}

// Initialize the application when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new ColorExtractor();
});