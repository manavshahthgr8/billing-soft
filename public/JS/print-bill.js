

document.addEventListener("DOMContentLoaded", () => {
   
    // 🔍 Session Check: Redirect if not logged in
    fetch('/api/session')
        .then(response => response.json())
        .then(data => {
            if (!data.success || !data.user) {
                alert('You are not logged in. Redirecting to login page...');
                window.location.href = '/index';
            }
        })
        .catch(() => {
            alert('You are not logged in. Redirecting to login page...');
            window.location.href = '/index';
        });

    // 🏠 Home button functionality
    const homeButton = document.getElementById("home");
    if (homeButton) {
        homeButton.addEventListener("click", () => {
            if (confirm("Taking you to the home page?")) {
                window.location.href = "../home.html";
            }
        });
    }

    // 📌 Sidebar Toggle
    const openSidebar = document.getElementById("openSidebar");
    const closeSidebar = document.getElementById("closeSidebar");
    const sidebar = document.getElementById("sidebar");
    if (openSidebar && closeSidebar && sidebar) {
        openSidebar.addEventListener("click", () => sidebar.classList.add("open"));
        closeSidebar.addEventListener("click", () => sidebar.classList.remove("open"));
    }

    // 🚪 Logout functionality
    const logoutButton = document.getElementById("logoutButton");
    if (logoutButton) {
        logoutButton.addEventListener("click", () => {
            if (confirm("Are you sure you want to log out?")) {
                fetch('/api/logout', { method: 'POST', headers: { 'Content-Type': 'application/json' } })
                    .then(response => response.json())
                    .then(data => {
                        if (data.success) {
                            alert(data.message);
                            window.location.href = "../index.html";
                        } else {
                            alert('Error logging out. Please try again.');
                        }
                    })
                    .catch(() => alert('Error logging out. Please try again.'));
            }
        });
    }

    

    
    // Assume firmName is fetched and stored globally (or accessible via document.getElementById("firmName").textContent)
    // For example, after fetchFirmDetails(), you could store:
   

   

    // -------------------------------
    // Daily Sauda Modal (Unchanged)
    document.querySelectorAll(".v2FeatureTrigger").forEach(trigger => {
        trigger.addEventListener("click", () => {
            document.getElementById("dailySaudaModal").style.display = "flex";
        });
    });
    document.getElementById("closeModal1").addEventListener("click", () => {
        document.getElementById("dailySaudaModal").style.display = "none";
    });
    window.addEventListener("click", (e) => {
        if (e.target === document.getElementById("dailySaudaModal")) {
            document.getElementById("dailySaudaModal").style.display = "none";
        }
    });

    // 📅 Extract firmId & FY from URL
    const urlParams = new URLSearchParams(window.location.search);
    const firmId = urlParams.get("firmId");
    const customerId = urlParams.get("customer_id");
    const financialYear = parseInt(urlParams.get("fy"));
    if (!firmId || isNaN(financialYear)) {
        console.error("Missing or invalid firmId or financialYear.");
        return;
    }

    // Assign values to form fields
    const firmIdInput = document.getElementById("firmId");
    const financialYearInput = document.getElementById("financialYear");
    const fySpan = document.getElementById("fy");
    const fyDisplay = `${financialYear} - ${financialYear + 1}`;
    if (firmIdInput) firmIdInput.value = firmId;
    if (financialYearInput) financialYearInput.value = financialYear;
    if (fySpan) fySpan.textContent = fyDisplay;
    // let firmName = ""; // Global variable to hold firm name
    // let BankName = ""; // Global variable to hold bank name
    // let PAN = ""; // Global variable to hold PAN number 
    // let IFSC = ""; // Global variable to hold IFSC code 
    // let AcountNo = ""; // Global variable to hold Account number
    // let ProprietorName = ""; // Global variable to hold Proprietor name
    // let Contact= ""; // Global variable to hold Contact number

    const fetchFirmDetails = async () => {
        try {
            const response = await fetch(`/api/firm/${firmId}`);
            const data = await response.json();
            if (data.success) {
                document.getElementById("firmName").textContent = data.firm.firm_name;
                firmName = data.firm.firm_name;
                BankName = data.firm.bank_name;
                PAN = data.firm.pan_no;
                IFSC = data.firm.ifsc_no;
                AcountNo = data.firm.account_no;
                ProprietorName = data.firm.proprietor;
                contact = data.firm.mobile_no;
            }
        } catch (error) {
            console.error("Error fetching firm details:", error);
        }
    };
    fetchFirmDetails();
    // let customerName = ""; // Global variable to hold customer name
    // let customerCity = ""; // Global variable to hold customer city 
    // let customerState = ""; // Global variable to hold customer state
    const fetchCustomerDetails = async () => {
        try {
            const response = await fetch(`/api/customer/${customerId}`);
            const data = await response.json();
            if (data.success) {
                document.getElementById("customerName").textContent = data.customer.client_name;
                document.getElementById("customerCity").textContent = data.customer.city;
                document.getElementById("customerState").textContent = data.customer.state;
                customerName = data.customer.client_name;
                customerCity = data.customer.city;
               
            }
        } catch (error) {
            console.error("Error fetching customer details:", error);
        }
    };
    
    fetchCustomerDetails();
    



    // ✅ "Select All" Checkbox Functionality
    document.getElementById("selectAll").addEventListener("change", function () {
        document.querySelectorAll(".txn-checkbox").forEach(checkbox => {
            checkbox.checked = this.checked;
        });
    });

    const fetchCustomerTransactions = async () => {
        try {
            const response = await fetch(`/api/customer-transactions?fy=${financialYear}&firm_id=${firmId}&customer_id=${customerId}`);
            const data = await response.json();
            
            if (data.success) {
                const transactionBody = document.getElementById("transactionBody");
                transactionBody.innerHTML = ""; // Clear existing data
                
                let totalAmount = 0;
                let totalAmountQuint = 0; // Initialize totalAmountQuint
    
                data.transactions.forEach(txn => {
                    totalAmount += parseFloat(txn.amount);
                    totalAmountQuint += parseFloat(txn.fQuintAmount); // Add to totalAmountQuint
    
                    const row = `
                        <tr>
                            <td>${txn.transaction_id}</td>
                            <td>${txn.sno}</td>
                            <td>${txn.date}</td>
                           <td><div class="scroll-cell" title="${txn.seller_name}, ${txn.seller_city}">${txn.seller_name}</div></td> <!-- commented out (${txn.seller_city}) Showing city in brackets -->
                            <td><div class="scroll-cell" title="${txn.buyer_name}, ${txn.buyer_city}">${txn.buyer_name}</div></td> <!--  (${txn.buyer_city})Showing city in brackets -->
                            <td>${txn.transactionType}</td>
                            <td>${txn.item}</td>
                            <td>${txn.bhav}</td>

                            <td>${txn.fqty}</td>
                            <td>${txn.brokerageRate}</td>
                            <td>₹${txn.amount.toFixed(2)}</td>

                            
                            <td>${txn.fQuintQty}</td> <!-- Showing quantity in quintals -->
                            <td>${txn.fQuintRate}</td> <!-- Showing brokerage in rupees -->
                            <td>₹${txn.fQuintAmount}</td> <!-- Showing brokerage rate in rupees --> 


                            <td><input type="checkbox" class="txn-checkbox" value="${txn.transaction_id}"></td>

                            
                            <!-- Add hidden fields for future use -->
                            <td class="hidden-seller-city" style="display:none">${txn.seller_city}</td> <!-- Hidden Seller City -->
                            <td class="hidden-buyer-city" style="display:none">${txn.buyer_city}</td> <!-- Hidden Buyer City -->
                            <td class="hidden-pkg" style="display:none">${txn.packaging}</td> <!-- Hidden Buyer City -->
                            <td>${txn.billedStatus}</td>
                        </tr>
                    `;
                    transactionBody.innerHTML += row;
                });
    
                document.getElementById("totalAmount").textContent = totalAmount.toFixed(2);
                document.getElementById("totalAmountQuint").textContent = totalAmountQuint.toFixed(2); // Update totalAmountQuint
            }
        } catch (error) {
            console.error("Error fetching transactions:", error);
        }
    };
    
    
    fetchCustomerTransactions();

   
    
    async function fetchBillId(customerId, financialYear) {
        try {
            const response = await fetch(`/bills/${financialYear}/${customerId}`);
            const data = await response.json();
    
            if (data.success && data.bill_id) {
                return data.bill_id;
            } else {
                console.warn(`No Bill ID found for customer ${customerId}`);
                return null;
            }
        } catch (error) {
            console.error("❌ Error fetching Bill ID:", error);
            return null;
        }
    }
    
    

// 📌 Generate PDF
// 📌 Generate PDF
async function generatePDF(action) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    await fetchFirmDetails();
    await fetchCustomerDetails();

    const printType = document.querySelector('input[name="printType"]:checked').value;
    const BillType = document.querySelector('input[name="BillType"]:checked').value;

    const fyDisplay = `${financialYear} - ${financialYear + 1}`;
    const headerText = printType === "1" 
        ? `${firmName} Statement | FY ${fyDisplay}` 
        : `${firmName} Invoice | FY ${fyDisplay}`;
    const headerText0 = printType === "1" ? `Statement` : `Invoice`;

    let firmIdNumber = parseInt(firmId, 10);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text(headerText0, 103, 5.5, { align: "center" });
    doc.setFontSize(13);
    doc.text(headerText, 103, 10.5, { align: "center" });
    doc.setFontSize(10);

    if (firmIdNumber == 1) doc.addImage("../images/B%26B.png", "PNG", 5, 0.1, 19, 19);
    else if (firmIdNumber == 2) doc.addImage("../images/PKC.png", "PNG", 5, 0.1, 19, 19);
    else if (firmIdNumber == 3) doc.addImage("../images/MB.png", "PNG", 5, 0.1, 19, 19);

    doc.setFont("helvetica", "normal");
    doc.text(`32 Bhaktnagar Ujjain (M.P),456010, Contact: ${contact}`, 100, 15.5, { align: "center" });

    const includeTid = document.getElementById("printTidCheckbox").checked;
    const includeSno = document.getElementById("printSnoCheckbox").checked;
    const billId = await fetchBillId(customerId, financialYear);
    if (!billId) return alert("⚠️ No Bill ID found for customer");

    let firmPrefix = ["BB", "PKC", "MB"][firmIdNumber - 1] || "X";
    let baseNumber = [100000, 300000, 600000][firmIdNumber - 1] || 0;
    let finalBillNo = `${firmPrefix}${baseNumber + billId}`;

    doc.setFontSize(10);
    let boxHeight = 18;
    doc.rect(5, 17.5, 200, boxHeight);
    doc.text(`Date: 31/03/${Number(financialYear)+1}`, 205, 9.5, { align: "right" });
    if(printType === "0"){
        doc.text(`Bill No: ${finalBillNo}`, 205, 5.5, { align: "right" });
    }else{
        doc.text(`Stmnt No: ${finalBillNo}`, 205, 5.5, { align: "right" });
    };
    
    doc.text(`Generated for: ${customerName}, ${customerCity}`, 10, 21);
    doc.text(`Bank: ${BankName}`, 150, 21);
    doc.text(`Generated by: ${ProprietorName} | Contact: ${contact}`, 10, 27);
    doc.text(`A/C No: ${AcountNo}`, 150, 27);
    doc.text(`PAN No: ${PAN}`, 10, 33);
    doc.text(`IFSC: ${IFSC}`, 150, 33);

    let headers = printType === "1"
        ? ["Tid", "S.N", "Date", "Party", "City", "Txn", "Item", "Bhav", "Qty" , "Pkg", "Brok", "Amount"]
        : ["Tid", "S.N", "Date", "Party", "City", "Txn", "Item", "Bhav", "Qty", "Pkg", "   ", "Amount"];
    let colWidths = printType === "1"
        ? [9, 8, 20, 52, 22, 10, 12, 12, 10, 15, 10, 18]
        : [9, 8, 20, 52, 22, 15, 13, 12, 10, 14, 3, 18];

    const fitText = (doc, text, maxWidth) => {
        if (doc.getTextWidth(text) <= maxWidth) return text;
        let shortened = text;
        while (doc.getTextWidth(shortened + "...") > maxWidth && shortened.length > 1) {
            shortened = shortened.slice(0, -1);
        }
        return shortened + "...";
    };

    const printTableHeaders = (yPos) => {
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.setFillColor(220, 220, 220);
        doc.rect(5, yPos - 4, 200, 6, "F");
        let colX = 8;
        headers.forEach((header, index) => {
            doc.text(header, colX, yPos);
            colX += colWidths[index];
        });
        return yPos + 6;
    };

    const drawTableBorder = (topY, bottomY) => {
        doc.rect(5, topY - 4, 200, bottomY - topY + 3);
    };

    let startY = 23 + boxHeight;
    let rowY = printTableHeaders(startY);
    let currentPageTopY = rowY - 6;

    let selectedTransactions = [];
    let totalAmount = 0;
    doc.setFont("helvetica", "normal");
    document.querySelectorAll(".txn-checkbox:checked").forEach(checkbox => {
        const row = checkbox.closest("tr").querySelectorAll("td");
        let txnType = row[5].textContent.trim();
        let party = txnType === "Purchased" ? row[3].textContent.trim() : row[4].textContent.trim();
        let city = txnType === "Purchased" ? row[15].textContent.trim() : row[16].textContent.trim();
        party = fitText(doc, party, colWidths[3] - 2);
        city = fitText(doc, city, colWidths[4] - 2);

        let pkg1 = BillType ==="0"? row[17].textContent.trim() : "Quintal";

        let amount = BillType ==="0"? parseFloat(row[10].textContent.replace("₹", "").trim()) : parseFloat(row[13].textContent.replace("₹", "").trim());
        totalAmount += amount;

        selectedTransactions.push({
            tid: includeTid ? row[0].textContent.trim() : "-",
            sno: includeSno ? row[1].textContent.trim() : "-",
            date: row[2].textContent.trim(),
            party: party,
            city: city,
            type: txnType === "Purchased" ? "Buy" : txnType === "Sold" ? "Sell" : "N/A",
            item: row[6].textContent.trim(),
            bhav: row[7].textContent.trim(),
            qty: BillType==="0"? row[8].textContent.trim() : row[11].textContent.trim(), // Showing quantity in quintals
            pkg: pkg1,
            rate: printType === "1"
            ? (BillType === "1" ? row[12].textContent.trim() : row[9].textContent.trim())
            : " ",
            amount: amount.toFixed(2)
        });
    });

    if (selectedTransactions.length === 0) return alert("Please select at least one transaction!");

    let pageHeight = doc.internal.pageSize.height;
    let bottomMargin = 10;
    let rowHeight = 6;
    let pageNumber = 1;

    selectedTransactions.forEach((txn, index) => {
        if (rowY + rowHeight > pageHeight - bottomMargin) {
            drawTableBorder(currentPageTopY, rowY);
            doc.setFontSize(10);
            doc.setFont("times", "normal");
            doc.text(`${firmName} | FY ${fyDisplay} | ${customerName} ${printType === "1" ? 'Statement' : 'Invoice'}`, 10, pageHeight - 3);
            doc.text(`Continued on next page | Page ${pageNumber}`, 170, pageHeight - 3, { align: "center" });

            doc.addPage();
            rowY = printTableHeaders(10);
            currentPageTopY = rowY - 6;
            doc.text(headerText, 100, 5.5, { align: "center" });
            doc.setFont("helvetica", "normal");
            
            if(printType === "0"){
                doc.text(`Bill No: ${finalBillNo}`, 205, 5.5, { align: "right" });
            } else{
                doc.text(`Stmnt No: ${finalBillNo}`, 205, 5.5, { align: "right" });
            }
            

            pageNumber++;
        }

        if (index % 2 === 0) {
            doc.setFillColor(240, 240, 240);
            doc.rect(5, rowY - 4, 200, rowHeight, "F");
        }

        let colX = 8;
        Object.entries(txn).forEach(([key, value], i) => {
            let maxWidth = colWidths[i] - 2;
            let shouldTruncate = ["party", "city"].includes(headers[i].toLowerCase());
            let finalText = shouldTruncate && doc.getTextWidth(value) > maxWidth
                ? value.substring(0, Math.floor(maxWidth / 3)) + "..."
                : value;

            let align = ["qty", "bhav", "pkg", "brok", "amount"].includes(headers[i].toLowerCase()) ? "right" : "left";
            let xPos = (align === "right") ? colX + colWidths[i] - 2 : colX;
            doc.text(finalText.toString(), xPos, rowY, { align });
            colX += colWidths[i];
        });

        rowY += rowHeight;
    });

    drawTableBorder(currentPageTopY, rowY); // ✅ Draw border for last page

    if (rowY + 10 > pageHeight - bottomMargin) {
        doc.addPage();
        rowY = 10;
    }

    doc.line(5, rowY, 205, rowY);
    rowY += 6;
    doc.setFont("helvetica", "bold");
    doc.text(`Total: INR ${totalAmount.toFixed(2)}`, 201, rowY, { align: "right" });

    doc.text(`Verified Stamp`, 60, rowY, { align: "right" });
    doc.setFont("helvetica", "normal");
    doc.text(`Digitally signed by ${ProprietorName}`, 60, rowY + 5, { align: "right" });
    doc.text(`${firmName}`, 60, rowY + 9, { align: "right" });

    rowY += 8;
    doc.setFontSize(11);
    doc.setFont("helvetica", "italic");
    doc.text("Thank you for being a valuable customer.", 105, rowY + 10, { align: "center" });

    doc.setFontSize(9);
    let footerY = doc.internal.pageSize.height - 3;
    let footerX = Math.abs(rowY - footerY) <= 10 ? 70 : 10;
    doc.text(`${firmName} | FY ${fyDisplay} | ${customerName} ${printType === "1" ? 'Statement' : 'Invoice'}`, footerX, footerY);
    doc.text(`Page ${pageNumber}`, 170, footerY);

    const baseType = BillType === "1" ? "Quintal Se" : "Bori Se";
    const oppositeType = BillType === "1" ? "Bori Se" : "Quintal Se";
    
    alert(`PDF generated successfully! \n\nPress OK to preview or download the PDF.\n\n 📌 You have printed Bill (${baseType}). Kuch entry (${oppositeType}) se ho sakti hai , so verify manually to avoid 0 amount`);
    if (action === "preview") {
        window.open(doc.output("bloburl"), "_blank");
    } else if (action === "download") {
        if (!confirm("By pressing OK, selected transactions will be marked as billed.")) return;
        markTransactionsAsBilled();
        const fileName = `${customerName.split(" ")[0]}Invoice_${firmName.split(" ")[0]}FY${financialYear}.pdf`;
        doc.save(fileName);
    } else if (action === "preview1") {
        if (!confirm("By pressing OK, selected transactions will be marked as billed.")) return;
        markTransactionsAsBilled();
        window.open(doc.output("bloburl"), "_blank");
    }
}

    

// 📌 Event Listeners
document.getElementById("preview").addEventListener("click", () => generatePDF("preview"));
document.getElementById("printButton").addEventListener("click", () => generatePDF("download"));
document.getElementById("preview1").addEventListener("click", () => generatePDF("preview1"));
document.getElementById("markBilled").addEventListener("click", markTransactionsAsBilled);

async function markTransactionsAsBilled() {
    let selectedTransactionIds = Array.from(document.querySelectorAll(".txn-checkbox:checked"))
        .map(checkbox => checkbox.value);

    if (selectedTransactionIds.length === 0) {
        alert("Please select at least one transaction!");
        return;
    }

    //if (!confirm("By pressing OK, selected transactions will be marked as billed.")) return;

    try {
        let response = await fetch("/api/transactions/markBilled", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ transactionIds: selectedTransactionIds, financialYear, customer_id: customerId })
        });

        let result = await response.json();

        if (!response.ok) {
            alert("Failed to mark transactions as billed.");
            return;
        }
        alert(result.message);
        console.log("Transactions updated:", result.message);
        fetchCustomerTransactions();
    } catch (error) {
        console.error("Error updating transactions:", error);
        alert("An error occurred while updating transactions.");
    }
}

// Attach event listener

    
    document.getElementById("backButton").addEventListener("click", function () {
        if (document.referrer) {
            history.back();
        } else {
            window.location.href = "/customer-list"; // Change this to your actual customer list page
        }
    });
    

    
      
    
    

   
});

