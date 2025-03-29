document.addEventListener("DOMContentLoaded", () => {
    function renderTreemap(data) {
        const width = 1000, height = 600;
        const svg = d3.select("svg")
            .attr("width", width)
            .attr("height", height);
    
        const tooltip = d3.select(".tooltip");
    
        // Create a hierarchical structure
        const root = d3.hierarchy({ name: "Tab Groups", children: data })
            .sum(d => d.size)
            .sort((a, b) => b.height - a.height || b.value - a.value);
    
        // Create a treemap layout
        const treemap = d3.treemap()
                        .size([width, height])
                        .paddingInner(2)  // Reduce padding to minimize gaps
                        .paddingOuter(1)  // Slight outer padding for structure
                        .round(true);  
    
        treemap(root);
    
        // Render group tiles first to avoid gaps
        const groups = svg.selectAll(".group")
            .data(root.children)
            .enter().append("g")
            .attr("class", "group")
            .attr("transform", d => `translate(${d.x0}, ${d.y0})`);
    
        groups.append("rect")
            .attr("width", d => d.x1 - d.x0)
            .attr("height", d => d.y1 - d.y0)
            .attr("fill", d => d.data.color || "#ccc")
            .attr("stroke", "#fff");
    
        const nodes = svg.selectAll("g.node")
            .data(root.leaves())
            .enter()
            .append("g")
            .attr("class", "node")
            .attr("transform", d => `translate(${d.x0}, ${d.y0})`);
    
        // Create rectangles for individual tabs
        nodes.append("rect")
            .attr("width", d => d.x1 - d.x0)
            .attr("height", d => d.y1 - d.y0)
            .attr("fill", d => d.parent.data.color || "#ddd")
            .attr("stroke", "#fff")
            .on("mouseover", (event, d) => {
                tooltip.style("display", "block")
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY + 10) + "px")
                    .html(`<strong>${d.data.name}</strong><br>${d.data.size} tabs`);
            })
            .on("mouseout", () => {
                tooltip.style("display", "none");
            })
            .on("click", (event, d) => {
                if (d.data.url) {
                    window.open(d.data.url, "_blank");
                }
            });
    
        // Add labels with better styling
        nodes.append("foreignObject")
            .attr("x", 5)
            .attr("y", 5)
            .attr("width", d => Math.max(0, d.x1 - d.x0 - 10))
            .attr("height", d => Math.max(0, d.y1 - d.y0 - 10))
            .append("xhtml:div")
            .style("font-size", d => `${Math.max(8, (d.x1 - d.x0) / 10)}px`)
            .style("color", "#fff")
            .style("background", "rgba(0,0,0,0.5)")
            .style("padding", "2px")
            .text(d => d.data.name);
    }

    // Fetch tab groups data from background.js
    chrome.runtime.sendMessage({ action: "getTabGroups" }, response => {
        if (chrome.runtime.lastError) {
            console.error("Error:", chrome.runtime.lastError.message);
            return;
        }

        if (!response || !response.tabGroups || Object.keys(response.tabGroups).length === 0) {
            console.log("No tab groups found.");
            return;
        }

        let now = Date.now();
        let allTabs = response.ungrouped.tabs.concat(...Object.values(response.tabGroups).map(g => g.tabs));
        let minTime = d3.min(allTabs, d => d.lastAccessed);
        let maxTime = d3.max(allTabs, d => d.lastAccessed);
        let sizeScale = d3.scaleLinear().domain([minTime, maxTime]).range([1, 5]);

        let data = [];

        // Add ungrouped tabs
        if (response.ungrouped && response.ungrouped.tabs.length > 0) {
            data.push({
                name: "Ungrouped Tabs",
                size: response.ungrouped.tabs.length,
                color: "#ff9800",
                children: response.ungrouped.tabs.map(tab => ({
                    name: tab.title,
                    size: sizeScale(tab.lastAccessed),
                    url: tab.url
                }))
            });
        }

        // Add grouped tabs
        Object.values(response.tabGroups).forEach(group => {
            data.push({
                name: group.title,
                size: group.tabs.length,
                color: group.color || "#2196f3",
                children: group.tabs.map(tab => ({
                    name: tab.title,
                    size: sizeScale(tab.lastAccessed),
                    url: tab.url
                }))
            });
        });

        renderTreemap(data);
    });
});
