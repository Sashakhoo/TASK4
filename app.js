const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const bodyParser = require('body-parser');
const app = express();
const port = 3000;

// Middleware to handle form data
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));

// Ensure the "generated" directory exists
const generatedDir = path.join(__dirname, 'generated');
if (!fs.existsSync(generatedDir)) {
    fs.mkdirSync(generatedDir);
}

// Setup Multer for file handling
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// Route to handle form submission
app.post('/submit', upload.single('photo'), (req, res) => {
    const { name, email, comment, signature } = req.body;
    const photoPath = req.file.path;

    // Create a PDF document
    const pdfDoc = new PDFDocument();
    const pdfPath = path.join(generatedDir, `${name}_form.pdf`);
    pdfDoc.pipe(fs.createWriteStream(pdfPath));

    // Add form details to the PDF
    pdfDoc.fontSize(25).text('Form Submission', { align: 'center' });
    pdfDoc.moveDown();
    pdfDoc.fontSize(15).text(`Name: ${name}`);
    pdfDoc.text(`Email: ${email}`);
    pdfDoc.text(`Comment: ${comment}`);

    // Add photo to the PDF
    pdfDoc.moveDown();
    pdfDoc.image(photoPath, { fit: [250, 250], align: 'center' });

    // Add the signature to the PDF
    pdfDoc.moveDown();
    pdfDoc.text('Signature:');
    const imgData = signature.replace(/^data:image\/\w+;base64,/, "");
    const imgBuffer = Buffer.from(imgData, 'base64');
    pdfDoc.image(imgBuffer, { fit: [250, 100], align: 'center' });

    // Finalize the PDF
    pdfDoc.end();

    // Respond to the client
    res.json({ message: 'Form submitted successfully!', pdfPath });
});

// Start the server
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
