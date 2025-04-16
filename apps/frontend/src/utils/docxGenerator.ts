import { Document, Paragraph, TextRun, HeadingLevel } from 'docx';
import { saveAs } from 'file-saver';

export const generateAndDownloadSummary = async (roomName: string, summary: string, date: string) => {
    // Create new document
    const doc = new Document({
        sections: [{
            properties: {},
            children: [
                // Title
                new Paragraph({
                    heading: HeadingLevel.HEADING_1,
                    children: [
                        new TextRun({
                            text: `Meeting Summary - ${roomName}`,
                            bold: true,
                            size: 32
                        })
                    ]
                }),

                // Date
                new Paragraph({
                    children: [
                        new TextRun({
                            text: `Date: ${new Date(date).toLocaleString()}`,
                            size: 24,
                            italics: true
                        })
                    ],
                    spacing: {
                        after: 400
                    }
                }),

                // Summary content
                ...summary.split('\n').map(line =>
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: line,
                                size: 24
                            })
                        ],
                        spacing: {
                            after: 200
                        }
                    })
                )
            ]
        }]
    });

    // Generate blob
    const blob = await doc.save('blob');

    // Download file
    saveAs(blob, `${roomName}-meeting-summary.docx`);
}; 