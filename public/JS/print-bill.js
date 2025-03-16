

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
    
                data.transactions.forEach(txn => {
                    totalAmount += parseFloat(txn.amount);
    
                    const row = `
                        <tr>
                            <td>${txn.transaction_id}</td>
                            <td>${txn.sno}</td>
                            <td>${txn.date}</td>
                            <td>${txn.seller_name} </td> <!-- (${txn.seller_city}) Showing city in brackets -->
                            <td>${txn.buyer_name} </td> <!--  (${txn.buyer_city})Showing city in brackets -->
                            <td>${txn.transactionType}</td>
                            <td>${txn.item}</td>
                            <td>${txn.fqty}</td>
                            <td>${txn.bhav}</td>
                            <td>${txn.brokerageRate}</td>
                            <td>₹${txn.amount.toFixed(2)}</td>
                            <td><input type="checkbox" class="txn-checkbox" value="${txn.transaction_id}"></td>

                            
                            <!-- Add hidden fields for future use -->
                            <td class="hidden-seller-city" style="display:none">${txn.seller_city}</td> <!-- Hidden Seller City -->
                            <td class="hidden-buyer-city" style="display:none">${txn.buyer_city}</td> <!-- Hidden Buyer City -->
                            <td>${txn.billedStatus}</td>
                        </tr>
                    `;
                    transactionBody.innerHTML += row;
                });
    
                document.getElementById("totalAmount").textContent = totalAmount.toFixed(2);
            }
        } catch (error) {
            console.error("Error fetching transactions:", error);
        }
    };
    
    
    fetchCustomerTransactions();
    

// 📌 Generate PDF
async function generatePDF(action) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    await fetchFirmDetails();
    await fetchCustomerDetails();

    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    const fyDisplay = `${financialYear} - ${financialYear + 1}`;
    doc.text(`${firmName} Invoice | FY ${fyDisplay}`, 105, 5.5, { align: "center" });

    // **📌 Firm & Customer Details Box**
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    let boxHeight = 18;
    doc.rect(5, 7.5, 200, boxHeight);
    doc.text(`Generated for: ${customerName}`, 10, 11);
    doc.text(`Bank: ${BankName}`, 150, 11);
    doc.text(`Generated by: ${ProprietorName} | Contact: ${contact}`, 10, 17);
    doc.text(`A/C No: ${AcountNo}`, 150, 17);
    doc.text(`PAN No: ${PAN}`, 10, 23);
    doc.text(`IFSC: ${IFSC}`, 150, 23);

    // **📊 Table Headers**
    const headers = ["Tid", "S.N", "Date", "Party", "City", "Txn Type", "Item", "Qty", "Bhav", "B Rate", "Amount"];
    const colWidths = [9, 9, 20, 48, 18, 25, 12, 10, 13, 15, 18];

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

    let startY = 15 + boxHeight;
    let rowY = printTableHeaders(startY);
    let firstPage = true;

    // **📝 Fetch Selected Transactions**
    let selectedTransactions = [];
    let totalAmount = 0;

    document.querySelectorAll(".txn-checkbox:checked").forEach(checkbox => {
        const row = checkbox.closest("tr").querySelectorAll("td");

        let sellerName = row[3].textContent.trim();
        let buyerName = row[4].textContent.trim();
        let txnType = row[5].textContent.trim();
        let party = txnType === "Purchased" ? sellerName : buyerName;
        let city = txnType === "Purchased" ? row[12].textContent.trim() : row[13].textContent.trim();
        let amount = parseFloat(row[10].textContent.replace("₹", "").trim());
        totalAmount += amount;

        selectedTransactions.push({
            tid: row[0].textContent.trim(),
            sno: row[1].textContent.trim(),
            date: row[2].textContent.trim(),
            party: party,
            city: city,
            type: txnType,
            item: row[6].textContent.trim(),
            qty: row[7].textContent.trim(),
            bhav: row[8].textContent.trim(),
            rate: row[9].textContent.trim(),
            amount: amount.toFixed(2)
        });
    });

    if (selectedTransactions.length === 0) {
        alert("Please select at least one transaction!");
        return;
    }

    // **📊 Print Transactions in PDF**
    doc.setFont("helvetica", "normal");
    let pageHeight = doc.internal.pageSize.height;
    let bottomMargin = 1;
    let rowHeight = 6;
    let pageNumber = 1;

    selectedTransactions.forEach((txn, index) => {
        if (rowY + rowHeight > pageHeight - bottomMargin) {
            doc.setFontSize(10);
            doc.setFont("times", "normal");
            doc.text(`${firmName} | FY ${fyDisplay} | ${customerName} Invoice`, 10, pageHeight - 3);
            doc.text(`Continued on next page | Page ${pageNumber}`, 170, pageHeight - 3, { align: "center" });

            doc.addPage();
            rowY = printTableHeaders(10);
            doc.setFont("helvetica", "normal");
            firstPage = false;
            pageNumber++;
        }

        if (index % 2 === 0) {
            doc.setFillColor(240, 240, 240);
            doc.rect(5, rowY - 4, 200, rowHeight, "F");
        }

        let colX = 8;
        Object.entries(txn).forEach(([key, value], i) => {
            let maxWidth = colWidths[i] - 2;
            let finalText = doc.getTextWidth(value) > maxWidth ? value.substring(0, Math.floor(maxWidth / 3)) + "..." : value;

            let align = ["qty", "bhav", "b rate", "amount"].includes(headers[i].toLowerCase()) ? "right" : "left";
            let xPos = (align === "right") ? colX + colWidths[i] - 2 : colX;
            doc.text(finalText.toString(), xPos, rowY, { align });
            colX += colWidths[i];
        });

        rowY += rowHeight;
    });

    if (firstPage) {
        doc.rect(5, startY - 4, 200, rowY - startY + 3);
    }

    if (rowY + 10 > pageHeight - bottomMargin) {
        doc.addPage();
        rowY = 10;
    }

    doc.line(5, rowY, 205, rowY);
    rowY += 6;
    doc.setFont("helvetica", "bold");
    doc.text(`Total: INR ${totalAmount.toFixed(2)}`, 170, rowY, { align: "right" });

    let footerY = pageHeight - 3; // Fixed Y position for footer
let footerX = Math.abs(rowY - footerY) <= 10 ? 70 : 10; // Adjust X if rowY is too close

doc.text(`Verified Stamp`, 60, rowY, { align: "right" });
doc.setFont("helvetica", "normal");
doc.text(`digitally signed by ${ProprietorName}`, 60, rowY + 5, { align: "right" });

rowY += 8;
doc.setFontSize(11);
doc.setFont("helvetica", "italic");
doc.text("Thank you for being a valuable customer.", 105, rowY + 10, { align: "center" });

// ✅ Adjusted Footer X if Overlap Detected
doc.setFontSize(9);
doc.text(`${firmName} | FY ${fyDisplay} | ${customerName} Invoice`, footerX, footerY);


    doc.setFontSize(9);
    doc.text(`Page ${pageNumber}`, 170, pageHeight - 3);

    // CODE ERROS AS 
    //doc.save(`Invoice_${customerName}_${financialYear}.pdf`);
    if (action === "preview") {
        window.open(doc.output("bloburl"), "_blank");
    } else if (action === "download") {
        if (!confirm("By pressing OK, selected transactions will be marked as billed.")) {
            return; // Stop execution if "Cancel" is pressed
        }
        markTransactionsAsBilled();
        const fileName = `${customerName.split(" ")[0]}Invoice_${firmName.split(" ")[0]}FY${financialYear}.pdf`;
        doc.save(fileName);
    } else if (action === "preview1") {
        if (!confirm("By pressing OK, selected transactions will be marked as billed.")) {
            return; // Stop execution if "Cancel" is pressed
        }
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

