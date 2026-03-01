// Helper function to detect if filename is a version
// Example: "INAUGURACAO FRANCA.mp4" (original) vs "INAUGURACAO FRANCA stories.mp4" (version)
function detectVersion(filename, allFilenames) {
    const cleanName = (name) => name.replace(/\.[^/.]+$/, '').toLowerCase().trim();
    const currentClean = cleanName(filename);
    // Check if this file is a version of another
    for (let i = 0; i < allFilenames.length; i++) {
        const otherClean = cleanName(allFilenames[i]);
        // Skip if same file
        if (currentClean === otherClean)
            continue;
        // Check if current file contains the other filename (meaning it's a version)
        // Example: "inauguracao-franca-stories" contains "inauguracao-franca"
        if (currentClean.includes(otherClean) && currentClean !== otherClean) {
            return { isVersion: true, originalIndex: i };
        }
    }
    return { isVersion: false, originalIndex: null };
}
export {};
