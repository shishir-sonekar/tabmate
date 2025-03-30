import { TabGroupManager } from './js/modules/tabGroupManager.js';
import { BackgroundImageManager } from './js/modules/backgroundImage.js';

document.addEventListener("DOMContentLoaded", () => {
    const container = document.getElementById("groups");

    // Initialize managers
    // new BackgroundImageManager().setSpaceAbstractBackground();
    new TabGroupManager(container).initialize();

    // Setup view toggles
    const cardViewBtn = document.getElementById('cardViewBtn');
    const graphViewBtn = document.getElementById('graphViewBtn');
    const groupsView = document.getElementById('groups');
    const dashboardView = document.getElementById('dashboard');

    cardViewBtn.addEventListener('click', () => {
        cardViewBtn.classList.add('active');
        graphViewBtn.classList.remove('active');
        groupsView.style.display = "flex";
        dashboardView.style.display = "none";
    });

    graphViewBtn.addEventListener('click', () => {
        graphViewBtn.classList.add('active');
        cardViewBtn.classList.remove('active');
        dashboardView.style.display = "contents";
        groupsView.style.display = "none";
    });
});
