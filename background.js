chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "getTabGroups") {
        if (!chrome.tabGroups) {
            console.error("chrome.tabGroups is not available. Your Chrome version might not support it.");
            sendResponse({ error: "Tab Groups API not available" });
            return;
        }

        (async () => {
            const groups = await chrome.tabGroups.query({});
            const tabs = await chrome.tabs.query({});
            console.log('tabs', tabs);

            let tabGroups = {
            };
            ungrouped = {
                title: "Ungrouped Tabs",
                color: "gray",
                tabs: []
            }

            // Find all "Tab Board" tabs
            const tabBoardTabs = tabs.filter(tab => tab.title && tab.title.toLowerCase().includes("tab board"));

            if (tabBoardTabs.length > 1) {
                // Sort by tab ID (or last opened time if needed)
                const sortedTabs = tabBoardTabs.sort((a, b) => a.id - b.id);

                // ❌ Close all extra instances (keeping the first one)
                for (let i = 0; i < sortedTabs.length-1; i++) {
                    console.log('Closing duplicate Tab Board:', sortedTabs[i].id);
                    await chrome.tabs.remove(sortedTabs[i].id);
                }
            }

            // Initialize group data
            groups.forEach(group => {
                tabGroups[group.id] = {
                    title: group.title || `Group ${group.id}`,
                    color: group.color,
                    tabs: []
                };
            });

            // Categorize tabs into groups
            tabs.forEach(tab => {
                if (tab.groupId !== -1 && tabGroups[tab.groupId]) {
                    // Add to respective group
                    tabGroups[tab.groupId].tabs.push({
                        title: tab.title,
                        url: tab.url,
                        id: tab.id,
                        pinned: tab.pinned,
                        lastAccessed: tab.lastAccessed,
                        favIconUrl: tab.favIconUrl,
                        incognito: tab.incognito,
                    });
                } else {
                    // Add to ungrouped
                    ungrouped.tabs.push({
                        title: tab.title,
                        url: tab.url,
                        id: tab.id,
                        audible: tab.audible,
                        frozen: tab.frozen,
                        mutedInfo: tab.mutedInfo,
                        pinned: tab.pinned,
                        lastAccessed: tab.lastAccessed,
                        favIconUrl: tab.favIconUrl,
                        incognito: tab.incognito,
                    });
                }
            });

            console.log("Tab Groups Data:", tabGroups);
            sendResponse({ tabGroups, ungrouped });

        })();

        return true; // Ensures async sendResponse works
    }
});
