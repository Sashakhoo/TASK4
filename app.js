const express = require('express');
const puppeteer = require('puppeteer');
const fs = require('fs');
const handlebars = require('handlebars');
const path = require('path');
const bodyParser = require('body-parser');

const app = express();

// Middleware to parse form data
app.use(bodyParser.urlencoded({ extended: true }));

// Serve the form to the user
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/index.html'));
});

// Route to generate PDF from user input
app.post('/generate-pdf', async (req, res) => {
    try {
        // Load HTML Template
        const templateHtml = fs.readFileSync(path.join(__dirname, 'public/example.html'), 'utf8');
        const template = handlebars.compile(templateHtml);

        // Gather user input from the form
        const data = {
            reportTitle: req.body.reportTitle,
            projectName: req.body.projectName,
            location: req.body.location,
            insulationBefore: req.body.insulationBefore,
            resultBefore: req.body.resultBefore,
            dielectricValue: req.body.dielectricValue,
            dielectricResult: req.body.dielectricResult,
            testedBy: req.body.testedBy,
            testDate: req.body.testDate
        };

        // Generate final HTML with user data
        const finalHtml = template(data);

        // Launch Puppeteer to create the PDF
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        await page.setContent(finalHtml);

        // Create PDF from the page content
        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: {
                top: '40px',
                bottom: '40px',
                left: '20px',
                right: '20px'
            }
        });

        await browser.close();

        // Send PDF buffer as the response
        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': 'attachment; filename=report.pdf',
            'Content-Length': pdfBuffer.length
        });
        res.send(pdfBuffer);
    } catch (error) {
        console.error('Error generating PDF:', error);
        res.status(500).send('An error occurred while generating the PDF.');
    }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
