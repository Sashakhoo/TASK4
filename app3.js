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
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));  // Limit to handle form data

// Ensure the "generated" directory exists
const generatedDir = path.join(__dirname, 'generated');
if (!fs.existsSync(generatedDir)) {
    fs.mkdirSync(generatedDir);
}

// Setup Multer for file handling
const upload = multer({ dest: 'uploads/' });

// Route to handle form submission
app.post('/submit', upload.single('sitePhotos'), (req, res) => {
    const {
        templateName, projectName, status, creationDate, creatorName, lastModifiedDate,
        workflowStatus, workflowName, workflowLocation, signature,
        inspectionDateTime, siteLocation, clientName, numWorkers, generalActivities, remarks
    } = req.body;

    const photoPath = req.file ? req.file.path : null;

    // Create a PDF document
    const pdfDoc = new PDFDocument({ size: 'A4', margin: 50 });
    const pdfPath = path.join(generatedDir, `Form_Report_${Date.now()}.pdf`);
    pdfDoc.pipe(fs.createWriteStream(pdfPath));

    // Add title
    pdfDoc.fontSize(20).font('Helvetica-Bold').text('Detailed Form Report', { align: 'center' });

    // Subtitle
    pdfDoc.moveDown(0.5);
    pdfDoc.fontSize(12).font('Helvetica-Bold').text('ZCE - DSR - 20241021 - 233050', { align: 'center' });

    // Details Section
    pdfDoc.moveDown(1);
    pdfDoc.fontSize(14).font('Helvetica-Bold').text('Details', { underline: true });
    pdfDoc.fontSize(10).font('Helvetica').text(`Template Name: ${templateName}`);
    pdfDoc.text(`Project Name: ${projectName}`);
    pdfDoc.text(`Status: ${status}`);
    pdfDoc.text(`Creation Date: ${creationDate}`);
    pdfDoc.text(`Creator & Company Name: ${creatorName}`);
    pdfDoc.text(`Last Modified Date: ${lastModifiedDate}`);

    // Workflow History Section
    pdfDoc.moveDown(1);
    pdfDoc.fontSize(14).font('Helvetica-Bold').text('Workflow History', { underline: true });
    pdfDoc.fontSize(10).font('Helvetica').text(`Status: ${workflowStatus}`);
    pdfDoc.text(`Name: ${workflowName}`);
    pdfDoc.text(`Location: ${workflowLocation}`);

    // Add Signature
    pdfDoc.moveDown(0.5);
    pdfDoc.text('Signature:');
    if (signature) {
        const signatureData = signature.replace(/^data:image\/\w+;base64,/, "");
        const signatureBuffer = Buffer.from(signatureData, 'base64');
        pdfDoc.image(signatureBuffer, { fit: [150, 75], align: 'left' });
    }

    // General Information Section
    pdfDoc.moveDown(1);
    pdfDoc.fontSize(14).font('Helvetica-Bold').text('Daily Site Report - General Information', { underline: true });
    pdfDoc.fontSize(10).font('Helvetica').text(`Date and Time of Inspection: ${inspectionDateTime}`);
    pdfDoc.text(`Site Location: ${siteLocation}`);
    pdfDoc.text(`Client Name: ${clientName}`);
    pdfDoc.text(`Number of Workers: ${numWorkers}`);

    // Site Progress Section
    pdfDoc.moveDown(1);
    pdfDoc.fontSize(14).font('Helvetica-Bold').text('Site Progress', { underline: true });
    pdfDoc.fontSize(10).font('Helvetica').text(`General Site Activities: ${generalActivities}`);

    if (photoPath) {
        pdfDoc.moveDown(0.5);
        pdfDoc.fontSize(12).font('Helvetica-Bold').text('Site Photos:');
        pdfDoc.image(photoPath, { fit: [250, 250], align: 'center' });
    }

    pdfDoc.moveDown(0.5);
    pdfDoc.fontSize(10).font('Helvetica').text(`Remarks: ${remarks}`);

    // Footer
    pdfDoc.moveDown(2);
    pdfDoc.fontSize(8).font('Helvetica-Oblique').text(`Detailed Form Report: ${creationDate}`, { align: 'left' });
    pdfDoc.text('Page 1 / 1', { align: 'right' });

    // Finalize the PDF
    pdfDoc.end();

    // Respond to the client
    res.json({ message: 'Form submitted successfully!', pdfPath });
});

// Start the server
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
