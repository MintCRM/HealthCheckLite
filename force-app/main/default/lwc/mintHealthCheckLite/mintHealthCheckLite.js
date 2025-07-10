import { LightningElement, wire } from 'lwc';
import getOrgMetrics from '@salesforce/apex/mintHealthCheckLite.getOrgMetrics';
import getOrgMetricsFeatureTypeMap from '@salesforce/apex/mintHealthCheckLite.getOrgMetricsFeatureTypeMap';
import getOrgDetails from '@salesforce/apex/mintHealthCheckLite.getOrgDetails';
import jsPDFResource from '@salesforce/resourceUrl/jsPDF';
import jsPDFAutoTable from '@salesforce/resourceUrl/jsPDFAutoTable';
import { loadScript } from 'lightning/platformResourceLoader';
import healthCheckLogo from '@salesforce/resourceUrl/HealthCheckLiteLogo';
import healthCheckNoActionReq from '@salesforce/resourceUrl/HealthCheckNoActionReq';
import healthCheckRecommended from '@salesforce/resourceUrl/HealthCheckRecommended';
import healthCheckAdvisory from '@salesforce/resourceUrl/HealthCheckAdvisory';
import healthCheckMintHex from '@salesforce/resourceUrl/HealthCheckMintHex';
import healthCheckMintLogo from '@salesforce/resourceUrl/HealthCheckMintLogo';
import healthCheckHeader from '@salesforce/resourceUrl/HealthCheckHeader';
import healthCheckFooter from '@salesforce/resourceUrl/HealthCheckFooter';
import healthCheckCoverFooter from '@salesforce/resourceUrl/HealthCheckCoverFooter';
import healthCheckCalibriFont from '@salesforce/resourceUrl/HealthCheckCalibriFontJS';

export default class MintHealthCheckLite extends LightningElement {
    mintLogo = healthCheckMintLogo;
    orgMetrics = [];
    featureTypeMap = {};
    jsPdfInitialized = false;
    isLoading = false;
    companyName = 'Your Company Name';
    orgId = '';
    formattedDate;

    @wire(getOrgDetails)
    wiredOrgDetails({ error, data }) {
        if (data) {
            this.orgId = data.Id;
            this.companyName = data.Name;
        } else if (error) {
            console.error('Error retrieving company name:', error);
        }
    }

    @wire(getOrgMetricsFeatureTypeMap)
    wiredFeatureTypeMap({ error, data }) {
        if (data) {
            this.featureTypeMap = data;
            // console.log('Category Map:', this.featureTypeMap);
        } else if (error) {
            console.error('Error fetching category map:', error);
        }
    }

    @wire(getOrgMetrics)
    wiredOrgMetrics({ error, data }) {
        if (data) {
            this.orgMetrics = data;
        } else if (error) {
            // handle error
        }
    }

    connectedCallback() {
        // if (this.jsPdfInitialized) {
        //     return;
        // }
        // Promise.all([
        //     loadScript(this, jsPDFResource), // or jsPDF.js if using non-UMD
        //     loadScript(this, jsPDFAutoTable),
        //     loadScript(this, healthCheckCalibriFont + '/calibri-global.js')
        // ])
        // .then(() => {
        //     this.jsPdfInitialized = true;
        //     console.log('jsPDF and Calibri loaded');
        // })
        // .catch(error => {
        //     console.error('Error loading scripts', error);
        // });

        if (this.jsPdfInitialized) return;
        const today = new Date();
        this.formattedDate = this.getFormattedDate(today);
        loadScript(this, jsPDFResource)
            .then(() => {})
            .catch(error => {
                // handle error
            });
        loadScript(this, jsPDFAutoTable)
            .then(() => {})
            .catch(error => {
                // handle error
            });
        loadScript(this, healthCheckCalibriFont + '/calibri-global.js')
            .then(() => {})
            .catch(error => {
                // handle error
            });
        loadScript(this, healthCheckCalibriFont + '/calibri-bold-global.js')
            .then(() => {})
            .catch(error => {
                // handle error
            });
        this.jsPdfInitialized = true;
    }
    
    handleCompanyNameChange(event) {
        this.companyName = event.target.value;
    }

    async handleGeneratePdf() {
        this.isLoading = true;
        const doc = new window.jspdf.jsPDF();
        const tocEntries = [];
        const metricEffortList = [];
        const mintHealthCheckLogoBase64 = await this.getImageBase64(healthCheckLogo);
        const mintHexBase64 = await this.getImageBase64(healthCheckMintHex);
        const mintHealthCheckHeader = await this.getImageBase64(healthCheckHeader);
        const mintHealthCheckFooter = await this.getImageBase64(healthCheckFooter);
        const mintHealthCheckCoverFooter = await this.getImageBase64(healthCheckCoverFooter);
        const mintLogoBase64 = await this.getImageBase64(healthCheckMintLogo);
        const noActionReqBase64 = await this.getImageBase64(healthCheckNoActionReq);
        const advisoryReqBase64 = await this.getImageBase64(healthCheckAdvisory);
        const recomenndedBase64 = await this.getImageBase64(healthCheckRecommended);
        const pageHeight = doc.internal.pageSize.getHeight();
        const pageWidth = doc.internal.pageSize.getWidth();
        const bottomMargin = 32;
        const maxOverviewTextWidth = pageWidth - 40;
        const maxTextWidth = pageWidth - 10;
        // ===== COVER PAGE =====
        // Add Calibri fonts
        doc.addFileToVFS('calibri.ttf', window.calibriFont);
        doc.addFont('calibri.ttf', 'calibri', 'normal');
        doc.addFileToVFS('calibrib.ttf', window.calibriBoldFont);
        doc.addFont('calibrib.ttf', 'calibri', 'bold');
        // COVER TITLE START
        doc.setFont('calibri', 'bold');
        doc.setFontSize(34);
        doc.setTextColor(4, 240, 205); //MINT GREEN
        doc.text('ORG HEALTH CHECK LITE', 80, 90, { align: 'center' });
        // COVER TITLE END
        // COVER PREPARED FOR START
        doc.setFont('calibri');
        doc.setFontSize(12);
        doc.setTextColor(87, 87, 87); // GREY
        doc.text('Prepared for: ', 33, 138, { align: 'center' });
        // COVER PREPARED FOR END
        // COVER COMPANY NAME START
        doc.setFont('calibri', 'bold');
        doc.setFontSize(30);
        doc.setTextColor(0, 63, 121); // DARK BLUE
        doc.text(this.companyName, 48, 153, { align: 'center' });
        // COVER COMPANY NAME END
        doc.addImage(mintHealthCheckLogoBase64, 'PNG', 20, 43, 30, 30);
        doc.addImage(mintHealthCheckCoverFooter, 'PNG', 0, 265, doc.internal.pageSize.getWidth(), 32);
        doc.addImage(mintHexBase64, 'PNG', 84, 90, 135, 200);
        doc.addImage(mintLogoBase64, 'PNG', 172, 3, 32, 17);
        // COVER ORG ID START
        doc.setFont('calibri');
        doc.setFontSize(10);
        doc.setTextColor(4, 240, 205);
        doc.text(`Production Org ID: `+this.orgId, 53, 163, { align: 'center' });
        // COVER ORG ID END
        doc.setTextColor(87, 87, 87);
        doc.text(this.formattedDate, 30, 230, { align: 'center' });
        doc.text('Version 1', 27, 238, { align: 'center' });
        doc.text('Confidential', 29, 246, { align: 'center' });

        // Add a new page for the content
        doc.addPage(); // Add placeholder for TOC
        const tocPageNumber = doc.getCurrentPageInfo().pageNumber;
        doc.addPage(); // Add actual contents page
        // Health check doc overview page
        const introText = 'This health check lite review was conducted by Mint® and outlines the findings following the review. It includes both recommendations and Salesforce best practice guidance.';
        const RAGText = 'A RAG approach has been used to help highlight prioritisation of the areas where action is advisable.';
        const endText = 'Where there are actions recommended, an estimated number of hours has been added to show potential time impact to resolve/implement. This is based on a user having strong System Administration skills and knowledge of the client\'s Salesforce platform.';
        const overviewIntroLine = doc.splitTextToSize(introText, maxOverviewTextWidth);
        const overviewRAGLine = doc.splitTextToSize(RAGText, maxOverviewTextWidth);
        const overviewEndLine = doc.splitTextToSize(endText, maxOverviewTextWidth);
        doc.addImage(mintHealthCheckHeader, 'PNG', 0, 0, doc.internal.pageSize.getWidth(), 32);
        doc.addImage(mintHealthCheckFooter, 'PNG', 0, 265, doc.internal.pageSize.getWidth(), 32);
        doc.setFontSize(18);
        doc.setFont('calibri', 'bold');
        doc.setTextColor(0, 63, 121);
        doc.text('Overview', 30, 40, { align: 'center' });
        doc.setFontSize(10);
        doc.setFont('calibri', 'normal');
        doc.setTextColor(87, 87, 87);
        doc.text(overviewIntroLine, 20, 60);
        doc.text(overviewRAGLine, 20, 70);
        doc.setTextColor(255, 0, 0);
        doc.text('Red', 23, 80, { align: 'center' });
        doc.setTextColor(87, 87, 87);
        doc.text(' = Recommended', 38, 80, { align: 'center' });
        doc.setTextColor(232, 151, 12);
        doc.text('Amber', 25, 85, { align: 'center' });
        doc.setTextColor(87, 87, 87);
        doc.text(' = Advisory', 38, 85, { align: 'center' });
        doc.setTextColor(63, 217, 28);
        doc.text('Green', 25, 90, { align: 'center' });
        doc.setTextColor(87, 87, 87);
        doc.text(' = No Action Required', 45, 90, { align: 'center' });
        doc.text(overviewEndLine, 20, 100);
        tocEntries.push({ title: 'Overview', page: doc.getCurrentPageInfo().pageNumber });
        doc.addPage();
        //Estimated Effort Overview Page
        const estimateOverviewPage = doc.getCurrentPageInfo().pageNumber;
        doc.addImage(mintHealthCheckHeader, 'PNG', 0, 0, doc.internal.pageSize.getWidth(), 32);
        doc.addImage(mintHealthCheckFooter, 'PNG', 0, 265, doc.internal.pageSize.getWidth(), 32);
        doc.setFontSize(18);
        doc.setFont('calibri', 'bold');
        doc.setTextColor(0, 63, 121);
        doc.text('Estimated Effort Overview', 50, 40, { align: 'center' });
        tocEntries.push({ title: 'Estimated Effort Overview', page: doc.getCurrentPageInfo().pageNumber });
        doc.addPage();
        // ===== MAIN CONTENT =====
        let y = 40;
        const statusPriority = {
            'ImmediateActionRequired': 1,
            'ActionRequired': 1,
            'ReviewRequired': 2,
            'NoActionRequired': 3,
            'NotCurrentlyEnabled': 4,
            '': 5 // fallback
        };

        const sortedOrgMetrics = JSON.parse(JSON.stringify(this.orgMetrics));


        sortedOrgMetrics.sort((a, b) => {
            const aStatus = a.OrgMetric?.[0]?.Status || '';
            const bStatus = b.OrgMetric?.[0]?.Status || '';
            return (statusPriority[aStatus] || 5) - (statusPriority[bStatus] || 5);
        });
        this.orgMetrics = sortedOrgMetrics;

        this.orgMetrics.forEach(metric => {
            const estimatedSectionHeight = 100; // Estimate base height for header + effort/status/etc.

            // Estimate additional height if there's a table
            let tableHeight = 0;
            if (metric.OrgMetric && metric.OrgMetric.length > 0) {
                const firstChild = metric.OrgMetric[0];
                if (firstChild.OrgMetricScanSummary && firstChild.OrgMetricScanSummary.length > 0) {
                    tableHeight = firstChild.OrgMetricScanSummary.length * 10 + 20; // Approx height
                }
            }

            const totalNeededHeight = estimatedSectionHeight + tableHeight;

            // Check if the content would overflow, add a page if needed
            let totalHeightAvailable = pageHeight - bottomMargin;
            if (y + totalNeededHeight >= totalHeightAvailable) {
                doc.addPage();
                y = 40;
            }

            // ===== SECTION HEADER =====
            doc.addImage(mintHealthCheckHeader, 'PNG', 0, 0, doc.internal.pageSize.getWidth(), 32);
            doc.addImage(mintHealthCheckFooter, 'PNG', 0, 265, doc.internal.pageSize.getWidth(), 32);
            doc.setFontSize(16);
            doc.setFont('calibri', 'bold');
            doc.setTextColor(0, 63, 121);
            let category = metric.Category;

            //Metadata record label limits
            let formattedName = this.featureTypeMap[metric.FeatureType]?.mint__Formatted_Name__c;
            if(formattedName == null || formattedName == undefined) {
                formattedName = metric.FeatureType;
                if(formattedName == 'ReplacingRelatedListswiththeRelatedListQuickLinksComponent'){
                    formattedName = 'Replacing Related Lists With The Related List Quick Links Component';
                }
            }
            category = category.replace(/(?!^)([A-Z])/g, ' $1');
            doc.text(`${category} - ${formattedName}`, 10, y);
            doc.setTextColor(0, 63, 121);
            //Contents page row title
            const sectionTitle = `${category} - ${formattedName}`;
            const sectionPage = doc.getCurrentPageInfo().pageNumber;
            tocEntries.push({ title: sectionTitle, page: sectionPage });
            y += 10;

            if (metric.OrgMetric && metric.OrgMetric.length > 0) {
                const firstChild = metric.OrgMetric[0];
                // Map result label
                let resultLabel = this.featureTypeMap[metric.FeatureType]?.mint__Result_Text__c;
                if (resultLabel != undefined && firstChild.Status !== 'NoActionRequired' && firstChild.Status !== 'NotCurrentlyEnabled') {
                    resultLabel = resultLabel.replace('{X}', firstChild.ItemCount);
                } else {
                    resultLabel = 'Great job! No action required.';
                }
                //Map recommendation label
                let recommendationLabel = this.featureTypeMap[metric.FeatureType]?.mint__Recommendation_Text__c;
                if (recommendationLabel === undefined || firstChild.ItemCount == 0) {
                    recommendationLabel = 'Everything looks good. No recommended next steps.';
                }
                // Map effort label
                let effortLabel = firstChild.ImplementationEffort;
                let statusLabel = firstChild.Status;
                if (effortLabel === 'LessThanThirtyMinutes') effortLabel = '<30 minutes';
                else if (effortLabel === 'ThirtyToSixtyMinutes') effortLabel = '30-60 minutes';
                else if (effortLabel === 'OneToTwoHours') effortLabel = '1-2 hours';
                else if (effortLabel === 'MoreThanTwoHours') effortLabel = '>2 hours';
                
                // let itemCountLabel = firstChild.ItemCount;
                // if (itemCountLabel === undefined || itemCountLabel === null) {
                //     itemCountLabel = 0;
                // }

                // Status
                // doc.setFont('calibri', 'bold');
                // doc.text('Status:', 10, y);

                // Prepare dynamic values
                let statusContent = '';
                let statusImage = null;
                const resultLines = doc.splitTextToSize(resultLabel, maxTextWidth);
                const recommendationLines = doc.splitTextToSize(recommendationLabel, maxTextWidth);
                if (statusLabel === 'NoActionRequired') {
                    statusImage = noActionReqBase64;
                } else if (statusLabel === 'ReviewRequired') {
                    statusImage = advisoryReqBase64;
                    metricEffortList.push([formattedName, effortLabel]);
                } else if (statusLabel === 'ImmediateActionRequired' || statusLabel === 'ActionRequired') {
                    statusImage = recomenndedBase64;
                    metricEffortList.push([formattedName, effortLabel]);
                } else if (statusLabel === 'NotCurrentlyEnabled') {
                    statusContent = 'Not Enabled';
                } else {
                    statusContent = `${firstChild.Status}`;
                }

                // 1. STATUS TABLE (Single-column)
                autoTable(doc, {
                    startY: y,
                    body: [
                        [{ content: 'Status:', styles: { fontStyle: 'bold' } }],
                        [{
                            content: '', // Will be replaced with image or text in didDrawCell
                            styles: { minCellHeight: 71 }
                        }]
                    ],
                    styles: {
                        font: 'calibri',
                        fontSize: 11,
                        valign: 'top'
                    },
                    didParseCell: function (data) {
                        const { row, cell } = data;

                        // Style the header row
                        if (row.index === 0) {
                            cell.styles.fillColor = [4, 240, 205]; // Mint Green background
                            cell.styles.textColor = [0, 63, 121];  // Dark Blue text
                            cell.styles.fontStyle = 'bold';
                        }
                    },
                    didDrawCell: function (data) {
                        const { row, column, cell, doc } = data;

                        if (row.index === 1 && column.index === 0) {
                            const imgX = cell.x + 5;
                            const imgY = cell.y + 25;

                            if (statusImage) {
                                doc.addImage(statusImage, 'PNG', imgX, imgY, 26, 18);
                            } else if (statusContent) {
                                doc.setTextColor(186, 17, 17);
                                doc.setFont('calibri', 'normal');
                                doc.text(statusContent, imgX, imgY + 8);
                            }
                        }
                    },
                    columnStyles: {
                        0: { cellWidth: 36 }
                    },
                    theme: 'grid'
                });

                // 2. RESULT + RECOMMENDATION TABLE
                autoTable(doc, {
                    startY: y,
                    margin: { left: 50 },
                    body: [
                        [{ content: 'Result:', styles: { fontStyle: 'bold' } }],
                        [{
                            content: resultLines.join('\n'),
                            styles: { fontStyle: 'normal', minCellHeight: 28 }
                        }],
                        [{ content: 'Recommendation:', styles: { fontStyle: 'bold' } }],
                        [{ content: recommendationLines.join('\n'), 
                           styles: { fontStyle: 'normal', minCellHeight: 35 } }
                        ],
                    ],
                    styles: {
                        font: 'calibri',
                        fontSize: 11,
                        valign: 'top'
                    },
                    theme: 'grid',
                    columnStyles: {
                        0: { cellWidth: 150 }
                    },
                    didParseCell: function (data) {
                        const { row, cell } = data;

                        const isHeaderRow = (row.index === 0 || row.index === 2);
                        if (isHeaderRow) {
                            cell.styles.fillColor = [4, 240, 205]; // Mint Green
                            cell.styles.textColor = [0, 63, 121];  // Mint Dark Blue
                            cell.styles.fontStyle = 'bold';
                        }
                    }
                });

                y = doc.lastAutoTable.finalY + 10
                if (firstChild.OrgMetricScanSummary && firstChild.OrgMetricScanSummary.length > 0) {
                    // Check if at least one Quantity value is present (non-null, non-zero, and not empty string)
                    const hasQuantity = firstChild.OrgMetricScanSummary.some(detail => {
                        return detail.Quantity !== null && detail.Quantity !== undefined && detail.Quantity !== '' && detail.Quantity !== 0;
                    });
                    const hasObjectId = firstChild.OrgMetricScanSummary.some(detail => {
                        return detail.Object.startsWith('0') || detail.Object.startsWith('/');
                    });

                    const rows = firstChild.OrgMetricScanSummary.map(detail => {
                        const formattedStatus = detail.ItemStatus.replace(/(?!^)([A-Z])/g, ' $1');
                        const baseRow = [
                            detail.Name
                        ];
                        if (!hasObjectId) {
                            baseRow.push(detail.Object);
                        }
                        if (hasQuantity) {
                            baseRow.push(detail.Quantity);
                        }
                        baseRow.push(formattedStatus);
                        return baseRow;
                    });

                    // Define the table head based on the condition
                    let tableHeadRow = ['Name'];
                    if (!hasObjectId) {
                        tableHeadRow.push('Object');
                    }
                    if (hasQuantity) {
                        tableHeadRow.push('Quantity');
                    }
                    tableHeadRow.push('Status');
                    const tableHead = [tableHeadRow];

                    doc.autoTable({
                        startY: y,
                        head: tableHead,
                        body: rows,
                        margin: { top: 40, bottom: 32 }, // Respect header/footer
                        styles: {
                            fontSize: 10,
                            lineWidth: 0.2,
                            lineColor: [0, 0, 0],
                            halign: 'left',
                            valign: 'middle'
                        },
                        headStyles: {
                            font: 'calibri',
                            fillColor: [0, 63, 121],
                            textColor: [255, 255, 255],
                            fontStyle: 'bold',
                            fontSize: 12
                        },
                        bodyStyles: {
                            font: 'calibri',
                            fillColor: [245, 245, 245],
                            textColor: [0, 0, 0]
                        },
                        alternateRowStyles: {
                            fillColor: [255, 255, 255]
                        }
                    });

                    y = doc.lastAutoTable.finalY + 10;
                }

            }

            y += 10;
        });
        doc.setPage(estimateOverviewPage);
        doc.autoTable({
            startY: 50,
            head: [['Feature', 'Estimated Effort']],  // Must be nested array
            body: metricEffortList,                  // Array of arrays
            margin: { left: 10 },
            styles: { 
                fontSize: 10,
                lineWidth: 0.2,              // ← Border thickness
                lineColor: [0, 0, 0],        // ← Black border
                halign: 'left',
                valign: 'middle'
            },
            headStyles: {
                font: 'calibri',
                fillColor: [4, 240, 205],
                textColor: [0, 63, 121],
                fontStyle: 'bold',
                fontSize: 12
            },
            bodyStyles: {
                font: 'calibri',
                fillColor: [245, 245, 245],
                textColor: [0, 0, 0]
            },
            alternateRowStyles: {
                fillColor: [255, 255, 255]
            }
        });
        //Table of Contents page
        doc.setPage(tocPageNumber);
        doc.addImage(mintHealthCheckHeader, 'PNG', 0, 0, doc.internal.pageSize.getWidth(), 32);
        doc.addImage(mintHealthCheckFooter, 'PNG', 0, 265, doc.internal.pageSize.getWidth(), 32);
        doc.setFontSize(18);
        doc.setFont('calibri', 'bold');
        doc.setTextColor(4, 240, 205);
        doc.text('CONTENTS', 105, 45, { align: 'center' });
        doc.setTextColor(0, 63, 121);
        doc.setFontSize(12);
        doc.setFont('calibri', 'normal');
        let tocY = 55;
        tocEntries.forEach(entry => {
            if (tocY > pageHeight - bottomMargin) {
                doc.addPage();
                tocY = 10;
            }
            doc.text(entry.title, 15, tocY);
            doc.text(`${entry.page}`, 195, tocY, { align: 'right' });
            tocY += 5;
        });
        const pageCount = doc.getNumberOfPages();

        for (let i = 1; i < pageCount; i++) {
            doc.setPage(i+2); // Skip cover and TOC pages

            doc.setFontSize(10);
            doc.setTextColor(100);
            doc.setFont('calibri', 'normal');
            doc.text(`Page ${i+2} of ${pageCount} | V.1 | Confidential`, 35, pageHeight - 16, { align: 'center' });
            //doc.text(` ${i+1} / ${pageCount}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
        }

        doc.save('Org_Health_Check_Lite_'+this.companyName+'.pdf');
        this.isLoading = false;
    }

    getImageBase64(url) {
        return fetch(url)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Image fetch failed: ${response.status}`);
                }
                return response.blob();
            })
            .then(blob => new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            }))
            .catch(error => {
                console.error('Image loading failed:', error);
                throw error;
            });
    }

    getFormattedDate(date) {
        const day = date.getDate();
        const suffix = this.getDaySuffix(day);
        const month = date.toLocaleString('en-US', { month: 'long' });
        const year = date.getFullYear();
        return `${day}${suffix} ${month} ${year}`;
    }

    getDaySuffix(day) {
        if (day > 3 && day < 21) return 'th';
        switch (day % 10) {
            case 1: return 'st';
            case 2: return 'nd';
            case 3: return 'rd';
            default: return 'th';
        }
    }
}