// Get the file path from URL params
const params = new URLSearchParams(window.location.search);
const filePath = params.get('file');

const statusCard = document.getElementById('statusCard');
const statusText = document.getElementById('statusText');
const statusDetail = document.getElementById('statusDetail');

if (filePath) {
    // Extract filename for display
    const fileName = filePath.split(/[/\\]/).pop();

    // Update status with filename
    statusDetail.innerHTML = `
        Installing: <strong style="color: #dc2626;">${fileName}</strong><br>
        Please click "Open Repak X" when prompted by your browser
    `;

    // Open the Repak X protocol
    window.location.href = 'repakx://install?file=' + encodeURIComponent(filePath);

    // Visual feedback stages
    setTimeout(() => {
        statusText.textContent = 'Waiting for confirmation...';
    }, 2000);

    setTimeout(() => {
        statusText.textContent = 'Still waiting...';
        statusDetail.innerHTML = `
            If you don't see a prompt, the app may have already opened!<br>
            Check your taskbar for <strong style="color: #dc2626;">Repak X</strong>
        `;
    }, 3500);

    // Close this tab after a delay (5 seconds to allow user to accept prompt)
    setTimeout(() => {
        // Show success state before closing
        statusCard.classList.add('success');
        statusText.textContent = 'Done!';
        statusDetail.textContent = 'This tab will close shortly...';

        setTimeout(() => {
            window.close();
        }, 1000);
    }, 5000);
} else {
    // Error state
    statusCard.classList.add('error');
    statusText.textContent = 'Error: No file specified';
    statusDetail.textContent = 'Something went wrong. Please try downloading the mod again.';

    // Hide progress bar on error
    document.querySelector('.progress-container').style.display = 'none';
}
