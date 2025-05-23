// ✅ Function to get query parameters from the URL
function getQueryParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}

// ✅ Extract parameters from the URL with fallbacks
const cidsString = getQueryParam('cids') || '';
const customerIds = cidsString ? cidsString.split(',') : [];  // Split into array
const fy = getQueryParam('fy') || 'N/A';
const firmId = getQueryParam('firm_id') || 'N/A';

// console.log("Customer IDs:", customerIds);  // Array of customer IDs
// console.log("FY:", fy);
// console.log("Firm ID:", firmId);



// Fetch customers based on city
// Assign values to DOM elements
document.addEventListener('DOMContentLoaded', async () => {
    const firmIdInput = document.getElementById("firmId");
    const financialYearInput = document.getElementById("financialYear");
    const fySpan = document.getElementById("fy");
    const firmNameSpan = document.getElementById("firmName");
    const customersContainer = document.getElementById("customers-container");

    // Format FY display
    const fyDisplay = fy !== 'N/A' ? `${fy} - ${parseInt(fy) + 1}` : 'N/A';

    if (firmIdInput) firmIdInput.value = firmId;
    if (financialYearInput) financialYearInput.value = fy;
    if (fySpan) fySpan.textContent = fyDisplay;

    // ✅ Fetch firm details
    if (firmId !== 'N/A' && firmNameSpan) {
        try {
            const response = await fetch(`/api/firm/${firmId}`);
            const data = await response.json();
            firmNameSpan.textContent = data.success ? data.firm.firm_name : "Unknown Firm";
        } catch {
            firmNameSpan.textContent = "Error fetching firm";
        }
    }

    // ✅ Load customers by IDs
    if (customerIds.length > 0) {
        const customers = await fetchCustomers(customerIds);
        if (customers.length > 0) {
            renderCustomers(customers);
        } else {
            customersContainer.innerHTML = "<p>No customers found.</p>";
        }
    }
});

// Session check
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

    // Back Button Functionality
    document.getElementById('backButton')?.addEventListener('click', () => window.history.back());

// Daily Sauda Modal
document.querySelectorAll(".v2FeatureTrigger").forEach(trigger => {
    trigger.addEventListener("click", () => {
        document.getElementById("dailySaudaModal").style.display = "flex";
    });
});
document.getElementById("closeModal1")?.addEventListener("click", () => {
    document.getElementById("dailySaudaModal").style.display = "none";
});
window.addEventListener("click", (e) => {
    if (e.target === document.getElementById("dailySaudaModal")) {
        document.getElementById("dailySaudaModal").style.display = "none";
    }
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




// ✅ Fetch multiple customer details by IDs
async function fetchCustomers(customerIds) {
    if (customerIds.length === 0) {
        console.warn("No customer IDs provided.");
        return [];
    }

    try {
        const idsString = customerIds.join(',');
        const response = await fetch(`/api/customers?ids=${idsString}`);
        const data = await response.json();

        if (data.success) {
           // console.log("Fetched Customers:", data.customers);
            return data.customers;  // Return the customer details
        } else {
            console.error("Failed to fetch customer details:", data.message);
            return [];
        }
    } catch (error) {
        console.error("Error fetching customer details:", error);
        return [];
    }
}
const billingStatusMap = {}; // global map


// ✅ Render customers dynamically
function renderCustomers(customers) {
    const customersContainer = document.getElementById("customers-container");
    if (!customersContainer) {
        console.error("Error: customers-container element not found.");
        return;
    }

    // ✅ Clear previous content
    customersContainer.innerHTML = "";

    // ✅ Create customer table
    const table = document.createElement("table");
    table.classList.add("customer-table");

    table.innerHTML = `
        <thead>
            <tr>
                <th><input type="checkbox" id="select-all" checked></th>
                <th>Customer Name</th>
                <th>Location</th>
                <th>Category</th>
                <th>Billed Amnt (Bori)</th>
                <th>Unbilled Amnt (Bori)</th>
                <th>Billed Amnt (Qtl)</th>
                <th>Unbilled Amnt (Qtl)</th>
                <th>Billed Txn</th>
                <th>Unbilled Txn</th>
            </tr>
        </thead>
        <tbody></tbody>
    `;

    const tbody = table.querySelector("tbody");

    customers.forEach(customer => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td><input type="checkbox" class="customer-checkbox" data-id="${customer.customer_id}" checked></td>
            <td>${customer.client_name}</td>
            <td>${customer.city}, ${customer.state}</td>
            <td>${customer.category ? customer.category.charAt(0).toUpperCase() + customer.category.slice(1) : "Unknown"}</td>
            <td id="billed-${customer.customer_id}">Loading...</td>
            <td id="unbilled-${customer.customer_id}">Loading...</td>
            <td id="qtlbilled-txn-${customer.customer_id}">Loading...</td>
            <td id="qtlunbilled-txn-${customer.customer_id}">Loading...</td>
            <td id="billed-txn-${customer.customer_id}">Loading...</td>
            <td id="unbilled-txn-${customer.customer_id}">Loading...</td>
        `;
        tbody.appendChild(row);

        // ✅ Fetch and update billing status dynamically
        fetchBillingStatus(customer.customer_id);
    });

    customersContainer.appendChild(table);

    // ✅ Select All functionality
    document.getElementById("select-all").addEventListener("change", function () {
        document.querySelectorAll(".customer-checkbox").forEach(checkbox => {
            checkbox.checked = this.checked;
        });
    });
}
const skipZeroCheckbox = document.getElementById("skipZeroCheckbox");

if (skipZeroCheckbox) {
    skipZeroCheckbox.addEventListener("change", function () {
        if (this.checked) {
            let skipped = 0;
            document.querySelectorAll(".customer-checkbox").forEach(cb => {
                const customerId = cb.dataset.id;
                const status = billingStatusMap[customerId] || { billedAmount: 0 };
                const bamount = parseFloat(status.billedAmount);
                const ubamount = parseFloat(status.unbilledAmount);
                const count = parseInt(status.unbilledTxnCount);

                if (bamount === 0 && ubamount === 0 && count >= 0) {
                    cb.checked = false;
                    skipped++;
                    cb.closest("tr").style.opacity = "0.5";
                }
            });
            console.log(`${skipped} customers skipped.`);
        } else {
            document.querySelectorAll(".customer-checkbox").forEach(cb => {
                cb.closest("tr").style.opacity = "1";
            });
        }
    });
}





async function fetchBillingStatus(customerId) {
    try {
        const response = await fetch(`/api/customer-billing-status?fy=${fy}&firm_id=${firmId}&customer_id=${customerId}`);
        const data = await response.json();

        if (data.success) {
            // 🟢 Store in billingStatusMap
            billingStatusMap[customerId] = {
                billedAmount: data.billedAmount,
                unbilledAmount: data.unbilledAmount,
                billedQtl: data.QtlBilledAmount,
                unbilledQtl: data.QtlUnbilledAmount,
                billedTxnCount: data.billedTxnCount,
                unbilledTxnCount: data.unbilledTxnCount
           
            };

            document.getElementById(`billed-${customerId}`).textContent = data.billedAmount;
            document.getElementById(`unbilled-${customerId}`).textContent = data.unbilledAmount;
            document.getElementById(`qtlbilled-txn-${customerId}`).textContent = data.QtlBilledAmount;
            document.getElementById(`qtlunbilled-txn-${customerId}`).textContent = data.QtlUnbilledAmount;
            document.getElementById(`billed-txn-${customerId}`).textContent = data.billedTxnCount;
            document.getElementById(`unbilled-txn-${customerId}`).textContent = data.unbilledTxnCount;
        } else {
            ["billed", "unbilled","qtlbilled-txn","stlunbilled-txn", "billed-txn", "unbilled-txn"].forEach(id => {
                document.getElementById(`${id}-${customerId}`).textContent = "Error";
            });
        }
    } catch (error) {
        console.error("Error fetching billing status:", error);
    }
}


// ✅ **Mark Transactions as Billed**
// ✅ Send Separate API Requests for Each Customer
async function markEachCustomerBilled(customerTransactions) {
    const financialYear = getQueryParam("fy");
   // console.log("markEachCustomerBilled - customerTransactions:", customerTransactions);
    
    for (const [customerId, transactionIds] of Object.entries(customerTransactions)) {
        if (!transactionIds.length) continue;

        ///console.log(`🔹 Marking Billed: Customer ID: ${customerId}, Transactions:`, transactionIds);

        try {
            const response = await fetch("/api/transactions/markBilled", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    customer_id: customerId,      // Correct customer ID
                    financialYear,
                    transactionIds
                })
            });

            const result = await response.json();

            if (!response.ok) {
                console.error(`❌ Failed to mark transactions for customer ${customerId}:`, result.error);
            } else {
               // console.log(`✅ Customer ${customerId} marked as billed.`);
            }
        } catch (error) {
            console.error(`⚠️ Error marking customer ${customerId}:`, error);
        }
    }
}

// ✅ Generate Multi-Customer PDF with Separate API Hits for Each Customer
async function generateMultiCustomerPDF(action) {
    // Get all selected customer IDs from checkboxes
    const printType1 = document.querySelector('input[name="printType"]:checked').value;
    const selectedCustomers = Array.from(document.querySelectorAll(".customer-checkbox:checked"))
        .map(cb => cb.dataset.id);
    
    // Deduplicate in case some IDs are repeated
    const uniqueCustomers = [...new Set(selectedCustomers)];
    console.log("Selected customer IDs (unique):", uniqueCustomers);
    
    if (uniqueCustomers.length === 0) {
        alert("Please select at least one customer!");
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    const customerTransactions = {};  // Store transactions by customer ID

    // Loop over unique customer IDs
    for (let i = 0; i < uniqueCustomers.length; i++) {
        const customerId = uniqueCustomers[i];

        const transactions = await fetchCustomerTransactions(customerId);
        const customerDetails = await fetchCustomerDetails(customerId);
        const firmDetails = await fetchFirmDetails();

        if (!firmDetails || !customerDetails || !transactions.length) {
            console.warn(`Skipping customer ID: ${customerId} - Missing data.`);
            continue;
        }

        // Add page break for all customers except the first one
        if (i > 0) doc.addPage();
        await generateCustomerPDF(doc, customerId, transactions, firmDetails, customerDetails);

        // Collect transactions for this customer
        customerTransactions[customerId] = transactions.map(txn => txn.transaction_id);
    }

   // console.log("Final customerTransactions object:", customerTransactions);

    // Mark each customer billed with separate API calls
    if ((action === "download" || action === "preview1") && Object.keys(customerTransactions).length > 0) {
        await markEachCustomerBilled(customerTransactions);
    }

    // Final Action: PDF Preview or Download
    if (action === "preview") {
        window.open(doc.output("bloburl"), "_blank");
    } else if (action === "download") {
        const firmDetails = await fetchFirmDetails();
        const firmName = firmDetails.name || "Unknown name";
        
        let fileName;  // Declare fileName here so it's accessible outside the if block
        
        if (printType1 === "1") {
            fileName = `FY${fy}_${firmName}_Summary_Statement.pdf`;
        } else {
            fileName = `FY${fy}_${firmName}_Dummary_Invoice.pdf`;
        }
        
        doc.save(fileName);
    } else {
        window.open(doc.output("bloburl"), "_blank");
    }
}







// ✅ Event Listeners for PDF
const previewBtn = document.getElementById("preview");
const printBtn = document.getElementById("printButton");
const preview1Btn = document.getElementById("preview1");

if (previewBtn) previewBtn.addEventListener("click", () => generateMultiCustomerPDF("preview"));
if (printBtn) printBtn.addEventListener("click", () => generateMultiCustomerPDF("download"));
if (preview1Btn) preview1Btn.addEventListener("click", () => generateMultiCustomerPDF("preview1"));





// ✅ Generate Multi-Customer PDF with Multiple Customer Billing







// ✅ **Fetch Transactions**
async function fetchCustomerTransactions(customerId) {
    try {
        const response = await fetch(`/api/customer-transactions?fy=${fy}&firm_id=${firmId}&customer_id=${customerId}`);
        const data = await response.json();
        return data.success ? data.transactions : [];
    } catch (error) {
        console.error("Error fetching transactions:", error);
        return [];
    }
}

// ✅ **Fetch Firm Details**
async function fetchFirmDetails() {
    try {
        const response = await fetch(`/api/firm/${firmId}`);
        const data = await response.json();
        if (!data.success || !data.firm) throw new Error("Firm data missing!");
        

        return {
            firmName: data.firm.firm_name || "N/A",
            BankName: data.firm.bank_name || "N/A",
            PAN: data.firm.pan_no || "N/A",
            IFSC: data.firm.ifsc_no || "N/A",
            AccountNo: data.firm.account_no || "N/A",
            ProprietorName: data.firm.proprietor || "N/A",
            Contact: data.firm.mobile_no || "N/A",
        };
    } catch (error) {
        console.error("Error fetching firm details:", error);
        return null;
    }
}

// ✅ **Fetch Customer Details**
async function fetchCustomerDetails(customerId) {
    try {
        const response = await fetch(`/api/customer/${customerId}`);
        const data = await response.json();
        if (!data.success || !data.customer) throw new Error(`Customer data missing for ID: ${customerId}`);

        return {
            name: data.customer.client_name || "N/A",
            city: data.customer.city || "N/A",
            state: data.customer.state || "N/A",
        };
    } catch (error) {
        console.error("Error fetching customer details:", error);
        return null;
    }
}

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

// ✅ **Generate Customer Invoice PDF**
async function generateCustomerPDF(doc, customerId, transactions, firmDetails, customerDetails) {
    // Determine print type (Statement or Invoice)
    const printType = document.querySelector('input[name="printType"]:checked').value;
    const BillType = document.querySelector('input[name="BillType"]:checked').value;
    const fyDisplay = `${fy} - ${parseInt(fy) + 1}`;
    const headerText = printType === "1" 
        ? `${firmDetails.firmName} Statement | FY ${fyDisplay} ` 
        : `${firmDetails.firmName} Invoice | FY ${fyDisplay} `;

        const headerText0 = printType === "1" 
        ? `Statement` 
        : `Invoice`;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
   

    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text(headerText0, 103, 5.5, { align: "center" });
    doc.setFontSize(13);
    doc.text(headerText, 103, 10.5, { align: "center" });
    doc.setFontSize(10);
    if(firmId==1){
        doc.addImage("../images/B%26B.png", "PNG", 5, 0.1, 19, 19);
    }else if(firmId==2){
        doc.addImage("../images/PKC.png", "PNG", 5, 0.1, 19, 19);
    }else if(firmId==3){
        doc.addImage("../images/MB.png", "PNG", 5, 0.1, 19, 19);
    }
    

    
    doc.setFont("helvetica", "normal");
    doc.text(`32 Bhaktnagar Ujjain (M.P),456010, Contact: ${firmDetails.Contact}`, 100, 15.5, { align: "center" });

    // Fetch bill ID for the customer from the database
    const billId = await fetchBillId(customerId, fy); 
    if (!billId) {
        console.warn(`⚠️ No Bill ID found for customer ${customerId}`);
        alert("No Bill ID found for this customer. Please check the database.");
        return;
    }

    let firmPrefix, baseNumber;
    switch (parseInt(firmId, 10)) {
        case 1:
            firmPrefix = "BB";
            baseNumber = 100000;
            break;
        case 2:
            firmPrefix = "PKC";
            baseNumber = 300000;
            break;
        case 3:
            firmPrefix = "MB";
            baseNumber = 600000;
            break;
        default:
            console.error("❌ Invalid Firm ID");
            return;
    }

    // Generate final Bill No
    let finalBillNo = `${firmPrefix}${baseNumber + billId}`;
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
   

    // **Firm & Customer Details Box**
    doc.setFontSize(10);
    let boxHeight = 23;
    doc.rect(5, 17.5, 200, boxHeight);
    
   
    
   
    
    
    //top
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text(`Date: 31/03/${Number(fy)+1}`, 170, 14.5); //new
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    
    //left section
    if(printType === "0"){
        doc.text(`Bill No: ${finalBillNo}`, 10, 21);//new
    }
    doc.text(`Party name : M/S ${customerDetails.name}`, 10, 27);
    doc.text(`Party city : ${customerDetails.city}`, 10, 33);
    doc.text(`Generated by: (${firmDetails.ProprietorName}) | ${firmDetails.firmName}`, 10, 39);

    //right section
    doc.text(`Bank: ${firmDetails.BankName}`, 160, 21); 
    doc.text(`A/C No: ${firmDetails.AccountNo}`, 160, 27);
    doc.text(`IFSC: ${firmDetails.IFSC}`, 160, 33);
    doc.text(`PAN No: ${firmDetails.PAN}`, 160, 39, );
  
    

    const includeTid = document.getElementById("printTidCheckbox").checked;
    const includeSno = document.getElementById("printSnoCheckbox").checked;

    // **Table Headers** - Declare outside of if/else block
    let headers, colWidths;

    if (printType === "1") {
        headers = ["Tid", "S.N", "Date", "Party", "City", "Txn", "Item", "Bhav", "Qty" , "Pkg", "Brok", "Amount"];
        colWidths = [9, 8, 20, 52, 22, 10, 12, 10, 10,14 , 10, 18];  // Reduced width of Txn Type by 2 and added to City column
    } else {
        headers = ["Tid", "S.N", "Date", "Party", "City", "Txn", "Item", "Bhav", "Qty", "Pkg", "   ", "Amount"];
        colWidths = [9, 8, 20, 52, 24, 15, 13, 12, 10,14, 3, 18];  // Reduced width of Txn Type by 2 and added to City column
    }

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

    let startY = 25 + boxHeight;
    let rowY = printTableHeaders(startY);
    let pageHeight = doc.internal.pageSize.height;
    let bottomMargin = 10;
    let rowHeight = 6;
    let pageNumber = 1;
    let totalAmount = 0;
    let firstPage = true;

    // ✅ **Ellipsis Function (Only for Party Name and City)**
    const fitText = (doc, text, maxWidth) => {
        if (doc.getTextWidth(text) <= maxWidth) return text;

        let ellipsis = "...";
        let shortened = text;
        
        while (doc.getTextWidth(shortened + ellipsis) > maxWidth && shortened.length > 1) {
            shortened = shortened.slice(0, -1);
        }

        return shortened + ellipsis;
    };

    transactions.forEach((txn, index) => {
        let txnType = txn.transactionType;
        txnType = txnType === "Purchased" ? "Buy" : txnType === "Sold" ? "Sell" : "N/A";  // Adjusted txn type
        let party = txnType === "Buy" ? txn.seller_name : txn.buyer_name;
        let city = txnType === "Buy" ? txn.seller_city : txn.buyer_city;

        if (rowY + rowHeight > pageHeight - bottomMargin) {
            doc.setFont("helvetica", "normal");
            doc.text(`${firmDetails.firmName} | FY ${fyDisplay} | ${customerDetails.name} ${printType === "1" ? 'Statement' : 'Invoice'}`, 10, pageHeight - 3);
            doc.text(`Continued on next page | Page ${pageNumber}`, 175, pageHeight - 3, { align: "center" });
            doc.addPage();
            rowY = printTableHeaders(12);
            doc.text(headerText, 100, 5.5, { align: "center" });
            if(printType === "0"){
                doc.text(`Bill No: ${finalBillNo}`, 205, 5.5, { align: "right" });
            }
            
            pageNumber++;
            firstPage = false;
            doc.setFont("helvetica", "bold");
        }

        if (index % 2 === 0) {
            doc.setFillColor(240, 240, 240);
            doc.rect(5, rowY - 4, 200, rowHeight, "F");
        }

        let colX = 5;
        let values = [];
        values.push(includeTid ? (txn.transaction_id || "N/A") : "-");
        values.push(includeSno ? (txn.sno || "N/A") : "-");

        let pkg = BillType ==="0"? txn.packaging : "Quintal";
        let qty = BillType ==="0"? txn.fqty : txn.fQuintQty ;

        values.push(
            txn.date || "N/A",
            fitText(doc, party, colWidths[3] - 2),    // ✅ Apply ellipsis only to Party name
            fitText(doc, city, colWidths[4] - 2),     // ✅ Apply ellipsis to City
            txnType,                        // Leave pkg as-is
            txn.item || "N/A",                         // Leave item as-is
            txn.bhav || "0",                           // Swapped order: Bhav now comes first
            qty || "0",
            pkg,  
        );           
        values.push( printType === "1" ?(BillType === "1" ? txn.fQuintRate : txn.brokerageRate): "  " );               // Swapped order: Qty now comes second
            values.push(
        parseFloat(BillType === "1" ? txn.fQuintAmount : txn.amount).toFixed(2)
        );

        values.forEach((value, i) => {
            let align = ["Qty", "Brok", "Amount"].includes(headers[i]) ? "right" : "left";
            let xPos = align === "right" ? colX + colWidths[i] - 2 : colX + 2;
            doc.text(value.toString(), xPos, rowY, { align });
            colX += colWidths[i];
        });

        totalAmount += parseFloat(BillType === "1" ? txn.fQuintAmount : txn.amount) || 0;
        rowY += rowHeight;
    });

    if (firstPage) {
        doc.rect(5, startY - 4, 200, rowY - startY + 3);
    }

    doc.line(5, rowY, 205, rowY);
    rowY += 6;
    doc.setFont("helvetica", "bold");
    doc.text(`Total: INR ${totalAmount.toFixed(2)}`, 201, rowY, { align: "right" });

    let footerY = pageHeight - 3;
    let footerX = Math.abs(rowY - footerY) <= 10 ? 70 : 10;

    doc.text(`Verified Stamp`, 60, rowY, { align: "right" });
    doc.setFont("helvetica", "normal");
    doc.text(`Digitally signed by ${firmDetails.ProprietorName}`, 60, rowY + 3, { align: "right" });
    doc.text(`${firmDetails.firmName}`, 60, rowY + 7, { align: "right" });

    rowY += 8;
    doc.setFontSize(11);
    doc.setFont("helvetica", "italic");
    doc.text("Thank you for being a valuable customer.", 105, rowY + 10, { align: "center" });

    doc.setFontSize(9);
    doc.text(`${firmDetails.firmName} | FY ${fyDisplay} | ${customerDetails.name} ${printType === "1" ? 'Statement' : 'Invoice'}`, footerX, footerY);

    doc.setFontSize(9);
    doc.text(`Page ${pageNumber}`, 170, pageHeight - 3);
}



    

// Attach event to button


