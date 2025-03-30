import { EXTENSION, GROUP_DEFAULTS } from './js/constants.js';

// Handle extension button click
chrome.action.onClicked.addListener(async () => {
    try {
        // Find and close any existing TabMate tabs
        const tabs = await chrome.tabs.query({});
        const tabMateTabs = tabs.filter(tab => 
            tab.url && tab.url.includes(EXTENSION.URLS.NEW_TAB)
        );
        
        // Close existing TabMate tabs
        await Promise.all(tabMateTabs.map(tab => chrome.tabs.remove(tab.id)));
        
        // Open new TabMate tab
        chrome.tabs.create({ url: EXTENSION.URLS.NEW_TAB });
    } catch (error) {
        console.error('Error handling extension click:', error);
    }
});

// Handle tab group data requests
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === EXTENSION.ACTION_TYPES.GET_TAB_GROUPS) {
        if (!chrome.tabGroups) {
            console.error("Tab Groups API not available");
            sendResponse({ error: "Tab Groups API not available" });
            return;
        }

        (async () => {
            try {
                // Get all groups and tabs
                const [groups, tabs] = await Promise.all([
                    chrome.tabGroups.query({}),
                    chrome.tabs.query({})
                ]);

                // Initialize base groups structure
                const tabGroups = {};
                const ungrouped = {
                    title: GROUP_DEFAULTS.UNGROUPED_TITLE,
                    color: GROUP_DEFAULTS.DEFAULT_COLOR,
                    tabs: []
                };

                // Set up groups
                groups.forEach(group => {
                    tabGroups[group.id] = {
                        title: group.title || `Group ${group.id}`,
                        color: group.color,
                        tabs: []
                    };
                });

                // Categorize tabs
                tabs.forEach(tab => {
                    // Skip TabMate tabs
                    if (tab.title?.toLowerCase().includes("tabmate")) {
                        return;
                    }

                    const tabInfo = {
                        title: tab.title,
                        url: tab.url,
                        id: tab.id,
                        pinned: tab.pinned,
                        lastAccessed: tab.lastAccessed,
                        favIconUrl: tab.favIconUrl,
                        incognito: tab.incognito,
                        audible: tab.audible,
                        frozen: tab.frozen,
                        mutedInfo: tab.mutedInfo
                    };

                    // Add to appropriate group or ungrouped
                    if (tab.groupId !== -1 && tabGroups[tab.groupId]) {
                        tabGroups[tab.groupId].tabs.push(tabInfo);
                    } else {
                        ungrouped.tabs.push(tabInfo);
                    }
                });

                // Process and split groups
                let allGroups = [...Object.values(tabGroups), ungrouped];
                
                // Sort initially by title
                allGroups.sort((a, b) => {
                    return a.title.toLowerCase().localeCompare(b.title.toLowerCase());
                });

                // Process each group and split if necessary
                const processedGroups = [];
                allGroups.forEach(group => {
                    if (group.tabs.length <= GROUP_DEFAULTS.MAX_TABS_PER_GROUP) {
                        processedGroups.push(group);
                    } else {
                        // Split into chunks of 8 tabs
                        const totalParts = Math.ceil(group.tabs.length / GROUP_DEFAULTS.TABS_PER_SPLIT);
                        for (let i = 0; i < group.tabs.length; i += GROUP_DEFAULTS.TABS_PER_SPLIT) {
                            const partNumber = Math.floor(i / GROUP_DEFAULTS.TABS_PER_SPLIT) + 1;
                            processedGroups.push({
                                ...group,
                                title: `${group.title} (${partNumber}/${totalParts})`,
                                tabs: group.tabs.slice(i, i + GROUP_DEFAULTS.TABS_PER_SPLIT),
                                originalTitle: group.title,
                                isPartial: true,
                                partNumber: partNumber,
                                totalParts: totalParts
                            });
                        }
                    }
                });

                // Final sort to keep split groups together
                processedGroups.sort((a, b) => {
                    const titleA = (a.originalTitle || a.title).toLowerCase();
                    const titleB = (b.originalTitle || b.title).toLowerCase();
                    if (titleA !== titleB) {
                        return titleA.localeCompare(titleB);
                    }
                    // If from same group, sort by part number
                    if (a.partNumber && b.partNumber) {
                        return a.partNumber - b.partNumber;
                    }
                    return 0;
                });

                sendResponse({ tabGroups: processedGroups });
            } catch (error) {
                console.error('Error processing tab groups:', error);
                sendResponse({ error: 'Failed to process tab groups' });
            }
        })();

        return true; // Keep message channel open for async response
    }
});
