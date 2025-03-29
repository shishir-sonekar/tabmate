document.addEventListener("DOMContentLoaded", () => {
    const showMoreBtn = document.getElementById("show-more");

    // Open the full page view when "Show More" is clicked
    showMoreBtn.addEventListener("click", () => {
        chrome.tabs.create({ url: "tab-groups.html" });
    });
    
    // const container = document.getElementById("groups");
    // chrome.runtime.sendMessage({ action: "getTabGroups" }, response => {
    //     if (chrome.runtime.lastError) {
    //         console.error("Error:", chrome.runtime.lastError.message);
    //         return;
    //     }

    //     container.innerHTML = "";
    //     if (!response || !response.tabGroups || Object.keys(response.tabGroups).length === 0) {
    //         container.innerHTML = "<p>No tab groups found.</p>";
    //         return;
    //     }

    //     Object.values(response.tabGroups).forEach(group => {
    //         const groupDiv = document.createElement("div");
    //         groupDiv.className = "group";
    //         groupDiv.style.border = `2px solid ${group.color}`;
    //         groupDiv.innerHTML = `<h3>${group.title}</h3><ul class="tab-list"></ul>`;

    //         const list = groupDiv.querySelector(".tab-list");
    //         group.tabs.forEach(tab => {
    //             const listItem = document.createElement("li");
    //             const link = document.createElement("a");
    //             link.href = "#"; // Prevent opening a new tab
    //             link.textContent = tab.title;
    //             link.style.cursor = "pointer";
                
    //             // Activate the original tab when clicked
    //             link.addEventListener("click", () => {
    //                 chrome.tabs.update(tab.id, { active: true });
    //             });

    //             listItem.appendChild(link);
    //             list.appendChild(listItem);
    //         });

    //         container.appendChild(groupDiv);
    //     });
    // });
});