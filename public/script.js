document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('form');
    const signaturePad = document.getElementById('signature-pad');
    const clearButton = document.getElementById('clear-signature');
    const signatureInput = document.getElementById('signature');
    let signaturePadContext = signaturePad.getContext('2d');
    let isDrawing = false;

    // Drawing signature on the canvas
    signaturePad.addEventListener('mousedown', () => isDrawing = true);
    signaturePad.addEventListener('mouseup', () => isDrawing = false);
    signaturePad.addEventListener('mousemove', drawSignature);

    function drawSignature(e) {
        if (!isDrawing) return;
        signaturePadContext.lineWidth = 2;
        signaturePadContext.lineCap = 'round';
        signaturePadContext.strokeStyle = '#000';
        signaturePadContext.lineTo(e.clientX - signaturePad.offsetLeft, e.clientY - signaturePad.offsetTop);
        signaturePadContext.stroke();
    }

    // Clear signature
    clearButton.addEventListener('click', function () {
        signaturePadContext.clearRect(0, 0, signaturePad.width, signaturePad.height);
    });

    // Submit the form
    form.addEventListener('submit', function (e) {
        e.preventDefault();

        // Convert signature canvas to base64 and assign it to the hidden input
        signatureInput.value = signaturePad.toDataURL();

        // Prepare form data for submission
        const formData = new FormData(form);

        // Send data to the server via fetch
        fetch('/submit', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            alert('Form submitted successfully!');
        })
        .catch(error => {
            console.error('Error:', error);
        });
    });
});
