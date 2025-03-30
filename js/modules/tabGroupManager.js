import { hexToRgba } from '../utils/colorUtils.js';
import { timeAgo } from '../utils/timeUtils.js';
import { EXTENSION } from '../constants.js';

export class TabGroupManager {
    constructor(container) {
        this.container = container;
        this.setupContainer();
    }

    setupContainer() {
        this.container.style.display = 'flex';
        this.container.style.flexWrap = 'wrap';
        this.container.style.gap = '10px';
    }

    async initialize() {
        try {
            const response = await this.getTabGroups();
            if (!response || !response.tabGroups) {
                this.container.innerHTML = "<p>No tabs found.</p>";
                return;
            }

            this.renderGroups(response.tabGroups);
            this.setupEventListeners();
        } catch (error) {
            console.error("Error initializing tab groups:", error);
            this.container.innerHTML = "<p>Error loading tabs. Please try again.</p>";
        }
    }

    async getTabGroups() {
        return new Promise((resolve, reject) => {
            chrome.runtime.sendMessage({ 
                action: EXTENSION.ACTION_TYPES.GET_TAB_GROUPS 
            }, response => {
                if (chrome.runtime.lastError) {
                    reject(chrome.runtime.lastError);
                    return;
                }
                resolve(response);
            });
        });
    }

    renderGroups(groups) {
        this.container.innerHTML = "";
        
        groups.forEach(group => {
            const groupDiv = this.createGroupDiv(group);
            this.container.appendChild(groupDiv);
        });
    }

    createGroupDiv(group) {
        const groupDiv = document.createElement("div");
        groupDiv.className = "group fade-in";
        
        // Add special styling for split groups
        if (group.isPartial) {
            groupDiv.classList.add('split-group');
        }
        
        // Create header with part information if it's a split group
        const headerText = group.isPartial 
            ? `${group.title}`  // Already includes part numbers
            : group.title;
            
        groupDiv.innerHTML = `
            <h3 style="background: ${hexToRgba(group.color, 0.8)}">${headerText}</h3>
            <ul class="tab-list" style="list-style: none; padding: 0;"></ul>
        `;

        if (group.title === "Ungrouped Tabs") {
            groupDiv.classList.add("pending-group");
            groupDiv.style.border = "3px dashed orange";
        } else {
            const tabBackgroundColor = hexToRgba(group.color, 0.6);
            groupDiv.style.border = `3px solid ${tabBackgroundColor}`;
        }
        
        // Add visual connection for split groups
        if (group.isPartial) {
            groupDiv.style.borderStyle = 'dashed';
        }
        
        groupDiv.style.backgroundColor = hexToRgba('white', 0.9);

        const list = groupDiv.querySelector(".tab-list");
        group.tabs.forEach(tab => {
            if (!tab.id || tab.title.trim().toLowerCase() === "tab board") {
                return;
            }
            list.appendChild(this.createTabListItem(tab, group.color));
        });

        return groupDiv;
    }

    createTabListItem(tab, groupColor) {
        const listItem = document.createElement("li");
        listItem.className = "tab-list-item";
        listItem.style.border = `1px solid ${hexToRgba(groupColor, 0.6)}`;

        listItem.innerHTML = `
            <img class="tab-favicon" src="${tab.favIconUrl || 'default-icon.png'}" alt="FavIcon">
            ${tab.pinned ? "📌" : ""}
            ${tab.incognito ? "🔒" : ""}
            <a class="tab-link" href="#" data-tab-id="${tab.id}">${tab.title}</a>
            <span class="tab-time">${timeAgo(tab.lastAccessed)}</span>
            <button class="close-tab" data-tab-id="${tab.id}">&times;</button>
        `;

        return listItem;
    }

    setupEventListeners() {
        this.container.addEventListener("click", (event) => {
            event.preventDefault();
            const tabId = event.target.dataset.tabId ? parseInt(event.target.dataset.tabId) : null;
            if (!tabId || isNaN(tabId)) return;

            if (event.target.classList.contains("close-tab")) {
                this.closeTab(tabId, event.target.parentElement);
            } else {
                this.activateTab(tabId);
            }
        });
    }

    async closeTab(tabId, element) {
        try {
            await chrome.tabs.remove(tabId);
            element.remove();
        } catch (error) {
            console.error("Error closing tab:", error);
        }
    }

    async activateTab(tabId) {
        try {
            await chrome.tabs.update(tabId, { active: true });
        } catch (error) {
            console.error("Error activating tab:", error);
        }
    }
} 