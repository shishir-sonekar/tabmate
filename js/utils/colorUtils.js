export function hexToRgba(color, opacity = 0.2) {
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