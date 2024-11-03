const express = require('express');
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const handlebars = require('handlebars');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');

const app = express();

// Middleware to parse form data
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Configure multer for file upload
const upload = multer({ dest: 'uploads/' });  // Temp directory for uploaded photos

// Configure nodemailer for email sending
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'sashakhoo8@gmail.com',
        pass: 'jmuaijcieurcqrqr'
    }
});

// Serve the form to the user
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/index.html'));
});

// Route to generate PDF from user input and attached photo
app.post('/generate-pdf', upload.single('photoUpload'), async (req, res) => {
    try {
        const templateHtml = fs.readFileSync(path.join(__dirname, 'public/example.html'), 'utf8');
        const template = handlebars.compile(templateHtml);

        // Convert logo to base64 as before
        const logoPath = path.join(__dirname, 'public/logo.png');
        const logoBase64 = fs.readFileSync(logoPath, 'base64');
        const logoData = `data:image/png;base64,${logoBase64}`;

        // Collect form data and prepare the data object for the template
        const data = {
            reportTitle: req.body.reportTitle,
            projectName: req.body.projectName,
            location: req.body.location,
            insulationBefore: req.body.insulationBefore,
            resultBefore: req.body.resultBefore,
            dielectricValue: req.body.dielectricValue,
            dielectricResult: req.body.dielectricResult,
            testedBy: req.body.testedBy,
            testDate: req.body.testDate,
            signature: req.body.signature,
            logo: logoData  
        };

        // Convert uploaded photo to base64 and include it in data if available
        if (req.file) {
            const photoBuffer = fs.readFileSync(req.file.path);
            data.photo = `data:image/png;base64,${photoBuffer.toString('base64')}`;
            fs.unlinkSync(req.file.path);  // Clean up uploaded file after reading
        }

        // Generate final HTML with template and data
        const finalHtml = template(data);

        // Use Puppeteer to render the final HTML to PDF
        const browser = await puppeteer.launch({ headless: true });
        const page = await browser.newPage();
        await page.setContent(finalHtml, { waitUntil: 'networkidle0' });
        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: { top: '40px', bottom: '40px', left: '20px', right: '20px' }
        });
        await browser.close();

        // Save the PDF file to a temporary location
        const pdfPath = path.join(__dirname, 'GeneratedReport.pdf');
        fs.writeFileSync(pdfPath, pdfBuffer);

        // Set up email data with user-provided recipient email
        const mailOptions = {
            from: 'sashakhoo8@gmail.com',
            to: req.body.receiverEmail,
            subject: 'Test Report',
            text: 'Please find attached the test report.',
            attachments: [
                {
                    filename: 'GeneratedReport.pdf',
                    path: pdfPath
                }
            ]
        };

        // Send email with attachment
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error('Error sending email:', error);
                res.status(500).send('Failed to send email.');
            } else {
                console.log('Email sent:', info.response);
                fs.unlinkSync(pdfPath);  // Clean up temporary PDF file after sending email
                res.set({
                    'Content-Type': 'application/pdf',
                    'Content-Disposition': 'attachment; filename=report.pdf',
                    'Content-Length': pdfBuffer.length
                });
                res.end(pdfBuffer);
            }
        });

    } catch (error) {
        console.error('Error generating PDF:', error.message, error.stack);
        res.status(500).send('An error occurred while generating the PDF.');
    }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
