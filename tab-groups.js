function hexToRgba(color, opacity = 0.2) {
    // Create a temporary element to get computed color
    let temp = document.createElement("div");
    temp.style.color = color;
    document.body.appendChild(temp);

    let computedColor = getComputedStyle(temp).color;
    document.body.removeChild(temp);

    // Extract RGB values
    let match = computedColor.match(/\d+/g);
    if (!match || match.length < 3) {
        console.error("Invalid color:", color);
        return "rgba(0, 0, 0, " + opacity + ")"; // Default fallback
    }

    let [r, g, b] = match;
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

document.addEventListener("DOMContentLoaded", () => {
    const container = document.getElementById("groups");

    async function setSpaceAbstractBackground() {
        const searchQuery = "space abstract"; // Search for abstract space images
        const apiUrl = `https://images-api.nasa.gov/search?q=${encodeURIComponent(searchQuery)}&media_type=image`;
    
        try {
            const response = await fetch(apiUrl);
            const data = await response.json();
    
            if (!data.collection || !data.collection.items || data.collection.items.length === 0) {
                console.error("No images found for the search query.");
                return;
            }
    
            // Pick a random image from the search results
            const randomIndex = Math.floor(Math.random() * data.collection.items.length);
            const imageItem = data.collection.items[randomIndex];
    
            // Extract the image URL, description, and title from the metadata
            const imageUrl = imageItem.links?.[0]?.href;
            const title = imageItem.data?.[0]?.title || "Unknown Title";
            const description = imageItem.data?.[0]?.description || "No description available.";
            const photographer = imageItem.data?.[0]?.photographer || "NASA";
    
            if (!imageUrl) {
                console.error("No valid image URL found.");
                return;
            }
    
            // Set the background image
            document.body.style.background = `url(${imageUrl})`;
            document.body.style.backgroundSize = "cover";
            document.body.style.backgroundPosition = "center";
            document.body.style.backgroundRepeat = "no-repeat";
    
            // Add description and credits at the bottom
            let descriptionDiv = document.getElementById("image-description");
            if (!descriptionDiv) {
                descriptionDiv = document.createElement("div");
                descriptionDiv.id = "image-description";
                descriptionDiv.style.position = "fixed";
                descriptionDiv.style.bottom = "10px";
                descriptionDiv.style.left = "50%";
                descriptionDiv.style.transform = "translateX(-50%)";
                descriptionDiv.style.background = "rgba(0, 0, 0, 0.9)";
                descriptionDiv.style.color = "#fff";
                descriptionDiv.style.padding = "5px 10px"; // Small padding initially
                descriptionDiv.style.borderRadius = "5px";
                descriptionDiv.style.fontSize = "12px"; // Small font initially
                descriptionDiv.style.textAlign = "center";
                descriptionDiv.style.maxWidth = "60%";
                descriptionDiv.style.overflow = "hidden";
                descriptionDiv.style.whiteSpace = "nowrap"; // Keep it in one line initially
                descriptionDiv.style.transition = "all 0.3s ease-in-out"; // Smooth transition
                descriptionDiv.style.cursor = "pointer";
                descriptionDiv.style.opacity = "0.9";
    
                // Expand on hover
                descriptionDiv.addEventListener("mouseenter", () => {
                    descriptionDiv.style.padding = "10px 20px";
                    descriptionDiv.style.fontSize = "14px";
                    descriptionDiv.style.maxWidth = "80%";
                    descriptionDiv.style.whiteSpace = "normal";
                    descriptionDiv.style.opacity = "1";
                });
    
                descriptionDiv.addEventListener("mouseleave", () => {
                    descriptionDiv.style.padding = "5px 10px";
                    descriptionDiv.style.fontSize = "12px";
                    descriptionDiv.style.maxWidth = "60%";
                    descriptionDiv.style.whiteSpace = "nowrap";
                    descriptionDiv.style.opacity = "0.7";
                });
    
                document.body.appendChild(descriptionDiv);
            }
    
            descriptionDiv.innerHTML = `Source: <strong>${title}</strong> - <em>Credit: ${photographer}</em>Description: ${description}`;
    
            console.log(`Background updated with image: ${imageUrl}`);
        } catch (error) {
            console.error("Error fetching space abstract image:", error);
        }
    }
    
    // Call the function when the page loads
    setSpaceAbstractBackground();

    chrome.runtime.sendMessage({ action: "getTabGroups" }, response => {
        if (chrome.runtime.lastError) {
            console.error("Error:", chrome.runtime.lastError.message);
            return;
        }
    
        // console.log("Response Data:", response);  // 🔥 Log the entire response
    
        container.innerHTML = "";
        if (!response || !response.tabGroups || Object.keys(response.tabGroups).length === 0 || Object.keys(response.ungrouped).length === 0) {
            container.innerHTML = "<p>No tabs found.</p>";
            return;
        }

        container.style.display = 'flex';
        container.style.flexWrap = 'wrap';
        container.style.gap = '10px';
        // container.style.width = '100%';
    
        [response.ungrouped, ...Object.values(response.tabGroups)].forEach(group => {
            // console.log("Processing Group:", group);  // 🔥 Debug Log
    
            const groupDiv = document.createElement("div");
            groupDiv.className = "group fade-in";
            groupDiv.innerHTML = `<h3 style="background: ${hexToRgba(group.color, 0.8)}">${group.title}</h3><ul class="tab-list" style="list-style: none; padding: 0;"></ul>`;
            groupDiv.style.width = '375px'
            // groupDiv.style.minHeight = '300px'
            

            // Special styling for ungrouped tabs
            if (group.title == "Ungrouped Tabs") {
                groupDiv.classList.add("pending-group");
                groupDiv.style.border = "3px dashed orange";
            } else {
                const tabBackgroundColor = hexToRgba(group.color, 0.6); // 20% opacity
                groupDiv.style.border = `6px solid ${tabBackgroundColor}`;
            }
            groupDiv.style.backgroundColor = hexToRgba('white', 0.9);
    
            const list = groupDiv.querySelector(".tab-list");
            group.tabs.forEach(tab => {
                if (!tab.id) {
                    console.error("Tab ID is missing for:", tab);
                    return;
                }

                // ❌ Skip if the tab title is "Tab Board"
                if (tab.title.trim().toLowerCase() === "tab board") {
                    console.log("Skipping 'Tab Board' tab.");
                    return;
                }
            
                function timeAgo(timestamp) {
                    const diff = Date.now() - timestamp;
                    const seconds = Math.floor(diff / 1000);
                    const minutes = Math.floor(seconds / 60);
                    const hours = Math.floor(minutes / 60);
                    const days = Math.floor(hours / 24);
            
                    if (days > 0) return `${days} day${days > 1 ? "s" : ""} ago`;
                    if (hours > 0) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
                    if (minutes > 0) return `${minutes} min${minutes > 1 ? "s" : ""} ago`;
                    return "Just now";
                }
            
                const listItem = document.createElement("li");
                listItem.style.display = "flex";
                listItem.style.alignItems = "center";
                listItem.style.padding = "8px";
                listItem.style.margin = "5px 0";
                listItem.style.border = `1px solid ${hexToRgba(group.color, 0.6)}`;
                listItem.style.borderRadius = "6px";
                listItem.style.background = "rgba(255, 255, 255, 0.1)";
            
                listItem.innerHTML = `
                    <img src="${tab.favIconUrl || 'default-icon.png'}" alt="FavIcon" 
                        style="width: 16px; height: 16px; margin-right: 8px;">
                    ${tab.pinned ? "📌" : ""}
                    ${tab.incognito ? "🔒" : ""}
                    <a href="#" data-tab-id="${tab.id}" 
                        style="cursor: pointer; flex-grow: 1; margin: 0 8px; 
                               white-space: nowrap; overflow: hidden; text-overflow: ellipsis; 
                               display: block; max-width: 275px;">
                        ${tab.title}
                    </a>
                    <span style="font-size: 12px; color: gray; white-space: nowrap;">${timeAgo(tab.lastAccessed)}</span>
                    <button class="close-tab" data-tab-id="${tab.id}" 
                        style="margin-left: 10px; border: none; background: transparent; cursor: pointer;">
                        &times;
                    </button>
                `;
            
                list.appendChild(listItem);
            });
            
            
    
            container.appendChild(groupDiv);
        });

        // 🔥 Attach click listener AFTER elements are added
        container.addEventListener("click", (event) => {
            event.preventDefault();

            const tabId = event.target.dataset.tabId ? parseInt(event.target.dataset.tabId) : null;
            if (!tabId || isNaN(tabId)) return;

            if (event.target.classList.contains("close-tab")) {
                // Handle tab closing
                chrome.tabs.remove(tabId, () => {
                    if (chrome.runtime.lastError) {
                        console.error("Error closing tab:", chrome.runtime.lastError.message);
                    } else {
                        console.log(`Closed tab: ${tabId}`);
                        event.target.parentElement.remove();  // Remove from UI
                    }
                });
            } else {
                // Handle tab switching
                chrome.tabs.update(tabId, { active: true }, () => {
                    if (chrome.runtime.lastError) {
                        console.error("Error activating tab:", chrome.runtime.lastError.message);
                    }
                });
            }
        });
    });
});
