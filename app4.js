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
    const pdfPath = path.join(generatedDir, `20241021_ZCE - DSR - ${Date.now()}.pdf`);
    pdfDoc.pipe(fs.createWriteStream(pdfPath));

    // Style Configuration
    const titleFontSize = 20;
    const headerFontSize = 14;
    const textFontSize = 10;
    const headerLineSpacing = 1.5;
    const textLineSpacing = 1.2;

    // Title
    pdfDoc.fontSize(titleFontSize)
        .font('Helvetica-Bold')
        .text('Detailed Form Report', { align: 'center' });

    // Subtitle
    pdfDoc.moveDown(0.5);
    pdfDoc.fontSize(headerFontSize)
        .font('Helvetica-Bold')
        .text('ZCE - DSR - 20241021 - 233050', { align: 'center' });

    // Details Section
    pdfDoc.moveDown(1.5);
    pdfDoc.fontSize(headerFontSize)
        .font('Helvetica-Bold')
        .text('Details', { underline: true, lineGap: headerLineSpacing });

    pdfDoc.fontSize(textFontSize)
        .font('Helvetica')
        .text(`Template Name: ${templateName}`, { lineGap: textLineSpacing })
        .text(`Project Name: ${projectName}`, { lineGap: textLineSpacing })
        .text(`Status: ${status}`, { lineGap: textLineSpacing })
        .text(`Creation Date: ${creationDate}`, { lineGap: textLineSpacing });

    pdfDoc.moveDown(0.5)
        .font('Helvetica-Bold')
        .text('Creator & Company Name:', { lineGap: textLineSpacing })
        .font('Helvetica')
        .text(creatorName, { indent: 20, lineGap: textLineSpacing })
        .font('Helvetica-Bold')
        .text(`Last Modified Date:`, { lineGap: textLineSpacing })
        .font('Helvetica')
        .text(lastModifiedDate, { indent: 20 });

    // Workflow History Section
    pdfDoc.moveDown(1.5);
    pdfDoc.fontSize(headerFontSize)
        .font('Helvetica-Bold')
        .text('Workflow History', { underline: true, lineGap: headerLineSpacing });

    pdfDoc.fontSize(textFontSize)
        .font('Helvetica')
        .text(`Status: ${workflowStatus}`, { lineGap: textLineSpacing })
        .text(`Name: ${workflowName}`, { lineGap: textLineSpacing })
        .text(`Location: ${workflowLocation}`, { lineGap: textLineSpacing });

    // Add Signature Section
    pdfDoc.moveDown(1);
    pdfDoc.font('Helvetica-Bold').text('Signature:', { lineGap: textLineSpacing });
    if (signature) {
        const signatureData = signature.replace(/^data:image\/\w+;base64,/, "");
        const signatureBuffer = Buffer.from(signatureData, 'base64');
        pdfDoc.image(signatureBuffer, { fit: [150, 75], align: 'left' });
    }

    // Daily Site Report - General Information Section
    pdfDoc.moveDown(1.5);
    pdfDoc.fontSize(headerFontSize)
        .font('Helvetica-Bold')
        .text('Daily Site Report - General Information', { underline: true, lineGap: headerLineSpacing });

    pdfDoc.fontSize(textFontSize)
        .font('Helvetica')
        .text(`Date and Time of Inspection: ${inspectionDateTime}`, { lineGap: textLineSpacing })
        .text(`Site Location: ${siteLocation}`, { lineGap: textLineSpacing })
        .text(`Client Name: ${clientName}`, { lineGap: textLineSpacing })
        .text(`Number of Workers: ${numWorkers}`, { lineGap: textLineSpacing });

    // Site Progress Section
    pdfDoc.moveDown(1.5);
    pdfDoc.fontSize(headerFontSize)
        .font('Helvetica-Bold')
        .text('Site Progress', { underline: true, lineGap: headerLineSpacing });

    pdfDoc.fontSize(textFontSize)
        .font('Helvetica')
        .text(`General Site Activities: ${generalActivities}`, { lineGap: textLineSpacing });

    if (photoPath) {
        pdfDoc.moveDown(1);
        pdfDoc.fontSize(headerFontSize)
            .font('Helvetica-Bold')
            .text('Site Photos:', { lineGap: headerLineSpacing });
        pdfDoc.image(photoPath, { fit: [250, 250], align: 'center' });
    }

    pdfDoc.moveDown(1);
    pdfDoc.fontSize(textFontSize)
        .font('Helvetica')
        .text(`Remarks: ${remarks}`, { lineGap: textLineSpacing });

    // Footer
    pdfDoc.moveDown(2);
    pdfDoc.fontSize(8)
        .font('Helvetica-Oblique')
        .text(`Detailed Form Report: ${creationDate}`, { align: 'left' });
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
