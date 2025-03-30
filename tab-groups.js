import { TabGroupManager } from './js/modules/tabGroupManager.js';
import { BackgroundImageManager } from './js/modules/backgroundImage.js';

document.addEventListener("DOMContentLoaded", () => {
    const container = document.getElementById("groups");

    // Initialize managers
    new BackgroundImageManager().setSpaceAbstractBackground();
    new TabGroupManager(container).initialize();
});
