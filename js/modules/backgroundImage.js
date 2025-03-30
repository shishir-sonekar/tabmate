import { NASA_API } from '../constants.js';

export class BackgroundImageManager {
    constructor() {
        this.descriptionDiv = null;
        this.currentImageUrl = null;
        this.setupThemeToggle();
    }

    setupThemeToggle() {
        const toggleButton = document.getElementById('themeToggle');
        if (toggleButton) {
            toggleButton.addEventListener('click', () => this.toggleTheme());
        }
    }

    toggleTheme() {
        const body = document.body;
        if (body.classList.contains('white-theme')) {
            // Switch back to space background
            body.classList.remove('white-theme');
            if (this.currentImageUrl) {
                this.setBackgroundImage(this.currentImageUrl);
            }
            document.getElementById('themeToggle').textContent = 'Switch to White';
        } else {
            // Switch to white background
            body.classList.add('white-theme');
            document.getElementById('themeToggle').textContent = 'Switch to Space';
        }
    }

    async setSpaceAbstractBackground() {
        const apiUrl = `${NASA_API.API_URL}?q=${encodeURIComponent(NASA_API.SEARCH_QUERY)}&media_type=image`;

        try {
            const response = await fetch(apiUrl);
            const data = await response.json();

            if (!data.collection?.items?.length) {
                console.error("No images found for the search query.");
                return;
            }

            const randomIndex = Math.floor(Math.random() * data.collection.items.length);
            const imageItem = data.collection.items[randomIndex];
            const imageUrl = imageItem.links?.[0]?.href;
            const title = imageItem.data?.[0]?.title || NASA_API.DEFAULT_TITLE;
            const description = imageItem.data?.[0]?.description || NASA_API.DEFAULT_DESCRIPTION;
            const photographer = imageItem.data?.[0]?.photographer || NASA_API.DEFAULT_PHOTOGRAPHER;

            if (!imageUrl) {
                console.error("No valid image URL found.");
                return;
            }

            this.setBackgroundImage(imageUrl);
            this.setupDescription(title, description, photographer);
        } catch (error) {
            console.error("Error fetching space abstract image:", error);
        }
    }

    setBackgroundImage(imageUrl) {
        this.currentImageUrl = imageUrl;
        if (!document.body.classList.contains('white-theme')) {
            document.body.style.background = `url(${imageUrl})`;
            document.body.style.backgroundSize = "cover";
            document.body.style.backgroundPosition = "center";
            document.body.style.backgroundRepeat = "no-repeat";
        }
    }

    setupDescription(title, description, photographer) {
        if (!this.descriptionDiv) {
            this.descriptionDiv = this.createDescriptionDiv();
        }

        this.descriptionDiv.innerHTML = `Source: <strong>${title}</strong> - <em>Credit: ${photographer}</em>Description: ${description}`;
    }

    createDescriptionDiv() {
        const div = document.createElement("div");
        div.id = "image-description";
        div.classList.add('image-description');
        
        div.addEventListener("mouseenter", () => {
            div.classList.add('image-description-expanded');
        });

        div.addEventListener("mouseleave", () => {
            div.classList.remove('image-description-expanded');
        });

        document.body.appendChild(div);
        return div;
    }
} 