// Get the file path from URL params
const params = new URLSearchParams(window.location.search);
const filePath = params.get('file');

if (filePath) {
    // Open the Repak X protocol
    window.location.href = 'repakx://install?file=' + encodeURIComponent(filePath);

    // Close this tab after a short delay
    setTimeout(() => {
        window.close();
    }, 1000);
} else {
    document.body.innerHTML = '<p>Error: No file specified</p>';
}
