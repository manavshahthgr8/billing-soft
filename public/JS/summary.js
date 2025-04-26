// ✅ Utility: Get URL parameters
function getQueryParam(param) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
}

// ✅ Extract parameters from URL
const cid = getQueryParam("cid") || getQueryParam("customer_id");
const fy = getQueryParam("fy") || "N/A";
const firmId = getQueryParam("firm_id") || "N/A";

// ✅ Fetch a single customer by ID
async function fetchCustomerById(customerId) {
  try {
          const response = await fetch(`/api/customers?ids=${customerId}`);
          const data = await response.json();

          if (data.success && data.customers.length > 0) {
                  return data.customers[0]; // Single customer
          } else {
                  console.warn("Customer not found");
                  return null;
          }
  } catch (error) {
          console.error("Error fetching customer:", error);
          return null;
  }
}

// ✅ DOM Ready
document.addEventListener("DOMContentLoaded", async () => {
  const customerNameSpan = document.getElementById("customerName");
  const fySpan = document.getElementById("fy");
  const firmIdInput = document.getElementById("firmId");
  const financialYearInput = document.getElementById("financialYear");

  // ✅ Show formatted FY display
  const fyDisplay = fy !== "N/A" ? `${fy} - ${parseInt(fy) + 1}` : "N/A";
  if (fySpan) fySpan.textContent = fyDisplay;
  if (firmIdInput) firmIdInput.value = firmId;
  if (financialYearInput) financialYearInput.value = fy;

  // ✅ Update dynamic table headers
  const fyInt = parseInt(fy);
  if (!isNaN(fyInt)) {
          const nextYear = fyInt + 1;
          const prevYear = fyInt - 1;

          const presentDueHeader = document.getElementById("present-due-header");
          const previousDueHeader = document.getElementById("previous-due-header");

          if (presentDueHeader)
                  presentDueHeader.textContent = `Present Due (FY ${fyInt}-${nextYear})`;

          if (previousDueHeader)
                  previousDueHeader.textContent = `Previous Due (FY ${prevYear}-${fyInt})`;
  }

  // ✅ Fetch and display customer name
  if (cid) {
          const customer = await fetchCustomerById(cid);
          if (customer && customerNameSpan) {
                  customerNameSpan.textContent = customer.client_name;
          } else {
                  customerNameSpan.textContent = "Unknown Customer";
          }
  } else {
          customerNameSpan.textContent = "No Customer ID Provided";
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
                  fetch('/api/logout', {
                                  method: 'POST',
                                  headers: {
                                          'Content-Type': 'application/json'
                                  }
                          })
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

const firmIds = [1, 2, 3];

async function populateFirmNames() {
  for (let i = 0; i < firmIds.length; i++) {
          const firmId = firmIds[i];
          try {
                  const response = await fetch(`/api/firm/${firmId}`);
                  const data = await response.json();

                  if (data.success) {
                          const firmNameCell = document.getElementById(`firm-name-${i + 1}`);
                          if (firmNameCell) {
                                  firmNameCell.textContent = data.firm.firm_name;
                          }
                  } else {
                          document.getElementById(`firm-name-${i + 1}`).textContent = "Unknown";
                  }
          } catch (err) {
                  console.error(`Error fetching firm ${firmId}:`, err);
                  document.getElementById(`firm-name-${i + 1}`).textContent = "Error";
          }
  }
}
const billingStatusMap = {}; // Optional if you want to store results

// ✅ Fetch present due for each firm for this customer
async function fetchPresentDues(customerId, fy) {
  for (const firmId of firmIds) {
          const cellId = `present-due-${firmId}`;
          const cell = document.getElementById(cellId);

          // Show loading...
          if (cell) cell.textContent = "Loading...";

          try {
                  const response = await fetch(`/api/customer-billing-status?fy=${fy}&firm_id=${firmId}&customer_id=${customerId}`);
                  const data = await response.json();

                  if (data.success) {
                          billingStatusMap[firmId] = {
                                  billedAmount: data.billedAmount,
                                  unbilledAmount: data.unbilledAmount
                          };

                          if (cell) {
                                  cell.textContent = `₹${(data.billedAmount || 0).toFixed(2)}`;
                          }
                  } else {
                          if (cell) cell.textContent = "Error";
                          console.warn(`Billing fetch failed for firm ${firmId}`);
                  }
          } catch (err) {
                  console.error(`Error fetching billing status for firm ${firmId}:`, err);
                  if (cell) cell.textContent = "Error";
          }
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  // ✅ Fetch firm names
  await populateFirmNames();

  // ✅ Fetch present dues for each firm
  await fetchPresentDues(cid, fy);

  // ✅ Calculate totals after everything is loaded
  calculateTotals();

  // ✅ Add live total update on old due input change
  for (const firmId of [1, 2, 3]) {
          const input = document.getElementById(`old-due-${firmId}`);
          if (input) {
                  input.addEventListener("input", calculateTotals);
          }
  }
});


function calculateTotals() {
  let totalPresent = 0;
  let totalOld = 0;

  for (const firmId of [1, 2, 3]) {
          // Get present due from the <td> element (₹ amount)
          const presentCell = document.getElementById(`present-due-${firmId}`);
          let presentValue = 0;
          if (presentCell) {
                  const text = presentCell.textContent.replace(/[₹,]/g, '').trim();
                  presentValue = parseFloat(text) || 0;
          }

          // Get old due from the <input type="number">
          const oldInput = document.getElementById(`old-due-${firmId}`);
          let oldValue = 0;
          if (oldInput) {
                  oldValue = parseFloat(oldInput.value) || 0;
          }

          totalPresent += presentValue;
          totalOld += oldValue;
  }

  // Update totals in footer
  document.getElementById("total-present-due").textContent = `₹${totalPresent.toFixed(2)}`;
  document.getElementById("total-old-due").textContent = `₹${totalOld.toFixed(2)}`;
  document.getElementById("grand-total").textContent = `₹${(totalPresent + totalOld).toFixed(2)}`;
}

//pdf code

async function fetchCustomerDetails(customerId) {
  try {
    const res = await fetch(`/api/customer/${customerId}`);
    const data = await res.json();
    if (!data.success || !data.customer) throw new Error("Missing customer");

    return {
      name: data.customer.client_name || "N/A",
      city: data.customer.city || "N/A",
      state: data.customer.state || "N/A",
    };
  } catch (err) {
    console.error("Customer fetch error:", err);
    return null;
  }
}

async function fetchFirmDetails(firmId) {
  try {
    const res = await fetch(`/api/firm/${firmId}`);
    const data = await res.json();
    if (!data.success || !data.firm) throw new Error("Missing firm");

    return {
      firmName: data.firm.firm_name || "N/A",
      BankName: data.firm.bank_name || "N/A",
      PAN: data.firm.pan_no || "N/A",
      IFSC: data.firm.ifsc_no || "N/A",
      AccountNo: data.firm.account_no || "N/A",
      ProprietorName: data.firm.proprietor || "N/A",
      Contact: data.firm.mobile_no || "N/A",
    };
  } catch (err) {
    console.error("Firm fetch error:", err);
    return null;
  }
}

async function fetchCustomerTransactions(customerId, fy, firmId) {
  try {
    const res = await fetch(`/api/customer-transactions?fy=${fy}&firm_id=${firmId}&customer_id=${customerId}`);
    const data = await res.json();
    return data.success ? data.transactions : [];
  } catch (err) {
    console.error("Transaction fetch error:", err);
    return [];
  }
}

async function fetchBillId(customerId, financialYear) {
  try {
    const res = await fetch(`/bills/${financialYear}/${customerId}`);
    const data = await res.json();
    return data.success && data.bill_id ? data.bill_id : null;
  } catch (err) {
    console.error("Bill fetch error:", err);
    return null;
  }
}

async function generateCustomerPDF(doc, customerId, transactions, firmDetails, customerDetails,firmId) {
  // Determine print type (Statement or Invoice)
  const printType = document.querySelector('input[name="printType"]:checked').value;
  const fyDisplay = `${fy} - ${parseInt(fy) + 1}`;
  const headerText = printType === "1" 
      ? `${firmDetails.firmName} Statement | FY ${fyDisplay} ` 
      : `${firmDetails.firmName} Invoice | FY ${fyDisplay} `;

      const headerText0 = printType === "1" 
      ? `Statement` 
      : `Invoice`;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`PAN No: ${firmDetails.PAN}`, 200, 10.5, { align: "right" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(headerText0, 103, 5.5, { align: "center" });
  doc.setFontSize(13);
  doc.text(headerText, 103, 10.5, { align: "center" });
  doc.setFontSize(10);
  const firmId1= Number(firmId);
  //console.log("Raw firmId:", firmId, "Parsed firmId1:", firmId1);


  if(firmId1==1){
   // console.log("B&B logo added");
    doc.addImage("../images/B%26B.png", "PNG", 5, 0.1, 19, 19);
    
}else if(firmId1==2){
    doc.addImage("../images/PKC.png", "PNG", 5, 0.1, 19, 19);
}else if(firmId1==3){
    doc.addImage("../images/MB.png", "PNG", 5, 0.1, 19, 19);
}
  

  
  doc.setFont("helvetica", "normal");
  doc.text(`32 Bhaktnagar Ujjain (M.P),456010, Contact: ${firmDetails.Contact}`, 100, 15.5, { align: "center" });

  const billId = await fetchBillId(customerId, fy);
  if (!billId) {
    console.warn(`⚠️ No Bill ID found for customer ${customerId}`);
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
    let boxHeight = 18;
    doc.rect(5, 17.5, 200, boxHeight);
    doc.text(`Party name : M/S ${customerDetails.name}`, 10, 21);
    doc.text(`Party city : ${customerDetails.city}`, 10, 27);
    if(printType === "0"){
        doc.text(`Bill No: ${finalBillNo}`, 160, 21);//new
    }
    
    
    
    doc.text(`Bill Date: 31/03/25`, 160, 27); //new
    doc.text(`Bank: ${firmDetails.BankName}`, 10, 33); 
    doc.text(`A/C holder : ${firmDetails.ProprietorName}`, 60, 33);
    doc.text(`A/C No: ${firmDetails.AccountNo}`, 110, 33);
    doc.text(`IFSC: ${firmDetails.IFSC}`, 160, 33);
  

  const includeTid = document.getElementById("printTidCheckbox").checked;
  const includeSno = document.getElementById("printSnoCheckbox").checked;

  // **Table Headers** - Declare outside of if/else block
    let headers, colWidths;

    if (printType === "1") {
        headers = ["Tid", "S.N", "Date", "Party", "City", "Txn", "Item", "Bhav", "Qty" , "Pkg", "Brok", "Amount"];
        colWidths = [9, 8, 20, 52, 24, 10, 12, 10, 10,10 , 10, 18];  // Reduced width of Txn Type by 2 and added to City column
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

        values.push(
            txn.date || "N/A",
            fitText(doc, party, colWidths[3] - 2),    // ✅ Apply ellipsis only to Party name
            fitText(doc, city, colWidths[4] - 2),     // ✅ Apply ellipsis to City
            txnType,                        // Leave pkg as-is
            txn.item || "N/A",                         // Leave item as-is
            txn.bhav || "0",                           // Swapped order: Bhav now comes first
            txn.fqty || "0",
            txn.packaging || "N/A",  
        );           
        values.push( printType === "1" ?txn.brokerageRate || "0": "  " );               // Swapped order: Qty now comes second
            values.push(
        parseFloat(txn.amount || 0).toFixed(2)
        );

        values.forEach((value, i) => {
            let align = ["Qty", "Brok", "Amount"].includes(headers[i]) ? "right" : "left";
            let xPos = align === "right" ? colX + colWidths[i] - 2 : colX + 2;
            doc.text(value.toString(), xPos, rowY, { align });
            colX += colWidths[i];
        });

        totalAmount += parseFloat(txn.amount || 0);
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
    doc.text(`Digitally signed by ${firmDetails.ProprietorName}`, 60, rowY + 5, { align: "right" });

    rowY += 8;
    doc.setFontSize(11);
    doc.setFont("helvetica", "italic");
    doc.text("Thank you for being a valuable customer.", 105, rowY + 10, { align: "center" });

    doc.setFontSize(9);
    doc.text(`${firmDetails.firmName} | FY ${fyDisplay} | ${customerDetails.name} ${printType === "1" ? 'Statement' : 'Invoice'}`, footerX, footerY);

    doc.setFontSize(9);
    doc.text(`Page ${pageNumber}`, 170, pageHeight - 3);
}


async function generateMultiCustomerPDF(action) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  const customerDetails = await fetchCustomerDetails(cid);
  if (!customerDetails) {
    alert("Customer details not found.");
    return;
  }

  const customerTransactions = {};
  const firmIds = [1, 2, 3];
  // 👇 Add summary on page 1
await generateSummaryPage(doc, customerDetails, firmIds);
const printType1 = document.querySelector('input[name="printType"]:checked').value;

  for (let i = 0; i < firmIds.length; i++) {
    const firmId = firmIds[i];
    const firmDetails = await fetchFirmDetails(firmId);
    const transactions = await fetchCustomerTransactions(cid, fy, firmId);

    if (!firmDetails || !transactions.length) continue;
    if (i > 0) doc.addPage();

    await generateCustomerPDF(doc, cid, transactions, firmDetails, customerDetails,firmId);
    customerTransactions[firmId] = transactions.map(t => t.transaction_id);
  }

  if ((action === "download" || action === "preview1") && Object.keys(customerTransactions).length > 0) {
    //await markEachCustomerBilled(customerTransactions);
  }

  if (action === "preview") {
    window.open(doc.output("bloburl"), "_blank");
  } else {
    let fileName = ""; // changed const to let
  
    if (printType1 === "1") {
      fileName = `FY${fy}_${customerDetails.name || "stmnt"}stmnt_Summary.pdf`;
    } else {
      fileName = `FY${fy}_${customerDetails.name || "invoice"}invoice__Summary.pdf`;
    }
  
    doc.save(fileName);
  }
  
}

document.getElementById("preview")?.addEventListener("click", () => generateMultiCustomerPDF("preview"));
document.getElementById("printButton")?.addEventListener("click", () => generateMultiCustomerPDF("download"));
document.getElementById("preview1")?.addEventListener("click", () => generateMultiCustomerPDF("preview1"));

async function generateSummaryPage(doc, customerDetails, firmIds) {
  const margin = 5;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  doc.setLineWidth(0.3);
  doc.rect(margin, margin, pageWidth - 2 * margin, pageHeight - 2 * margin);

  // Header
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(`Transaction Summary`, 102, 13, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`(${fy} - ${Number(fy) + 1})`, 140, 13, { align: "center" });

  doc.setFontSize(10);
  doc.setFont('times', 'normal');
  doc.setTextColor(0, 0, 255);
  doc.text('Brijmohan Brothers, Parag Kumar & Company, Manav Brokers, Ujjain 456010, Contact No : 9425332690', 28, 17, {
    maxWidth: 180,
  });

  // Horizontal red line
  doc.setDrawColor(255, 0, 0);
  doc.setLineWidth(0.5);
  doc.line(13, 21, 200, 21);
  doc.setTextColor(0, 0, 0);
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.3);

  // Customer details
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text("Dear Customer,", 15, 28);
  doc.text(`Date : 31/03/${Number(fy) + 1}`, 190, 28, { align: "right" });
  doc.setFontSize(10);
  doc.text(` ${customerDetails.name}`, 14, 33);
  doc.text(`City: ${customerDetails.city}, ${customerDetails.state}`, 15, 38);

  // Summary note
  doc.setFontSize(11);
  doc.text("Dear customer, Please find Summary of Brokerage Amount.", 60, 65);

  // Table setup
  const tableStartY = 70;
  const rowHeight = 10;
  const colWidths = [45, 50, 30, 30, 25];
  const colXs = [15];
  for (let i = 0; i < colWidths.length - 1; i++) {
    colXs.push(colXs[i] + colWidths[i]);
  }

  // Table Header
  const headerLabels = [
    "Bank Details",
    "Firm Name",
    `FY\n${fy}-${Number(fy) + 1}`,
    "Previous Due\n(if any)",
    "Comments\n(if any)"
  ];

  doc.setFont("helvetica", "bold");
  headerLabels.forEach((text, i) => {
    doc.setFillColor(230, 230, 230); // Light gray background
    doc.rect(colXs[i], tableStartY, colWidths[i], rowHeight * 2, "F");

    const lines = text.split('\n');
    lines.forEach((line, k) => {
      doc.text(line, colXs[i] + 2, tableStartY + 6 + k * 5);
    });
  });

  // Table rows
  doc.setFont("helvetica", "normal");
  let y = tableStartY + rowHeight * 2;

  for (let i = 0; i < firmIds.length; i++) {
    const firmId = firmIds[i];
    const firm = await fetchFirmDetails(firmId);

    const presentDueText = document.getElementById(`present-due-${firmId}`)?.textContent.replace(/[₹,]/g, '') || "0";
    const previousDueInput = document.getElementById(`old-due-${firmId}`);
    const commentInput = document.getElementById(`comment-${firmId}`);

    const present = parseFloat(presentDueText) || 0;
    const old = parseFloat(previousDueInput?.value) || 0;
    const comment = commentInput?.value || "-";

    const bankDetails = [
      firm.BankName || "N/A",
      `A/C: ${firm.AccountNo || "N/A"}`,
      `IFSC: ${firm.IFSC || "N/A"}`
    ].join('\n');

    const values = [
      bankDetails,
      firm.firmName || `Firm ${firmId}`,
      `Rs ${present.toFixed(2)}`,
      `Rs ${old.toFixed(2)}`,
      comment
    ];

    doc.setFillColor(255, 255, 255); // White row background
    for (let j = 0; j < values.length; j++) {
      doc.rect(colXs[j], y, colWidths[j], rowHeight * 2);
      let lines;
      if (j === 4) {
        lines = doc.splitTextToSize(values[j].toString(), colWidths[j] - 4);
      } else {
        lines = values[j].toString().split('\n');
      }

      lines.forEach((line, k) => {
        const alignRight = j >= 2 && j <= 3;
        doc.text(
          line,
          alignRight ? colXs[j] + colWidths[j] - 2 : colXs[j] + 2,
          y + 6 + k * 5,
          { align: alignRight ? "right" : "left" }
        );
      });
    }

    y += rowHeight * 2;
  }

  // Totals
  const totalPresent = parseFloat(document.getElementById('total-present-due')?.textContent.replace(/[₹,]/g, '')) || 0;
  const totalPrevious = parseFloat(document.getElementById('total-old-due')?.textContent.replace(/[₹,]/g, '')) || 0;
  const grandTotal = parseFloat(document.getElementById('grand-total')?.textContent.replace(/[₹=,\s]/g, '')) || 0;

  // Totals row
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 0, 0); // Black text
  doc.setFillColor(230, 230, 230); // Light gray background

  const totals = ["", "Total", `Rs ${totalPresent.toFixed(2)}`, `Rs ${totalPrevious.toFixed(2)}`,"    "];

  totals.forEach((val, j) => {
    doc.setFillColor(230, 230, 230);
    doc.rect(colXs[j], y, colWidths[j], rowHeight, "F");

    const alignRight = j >= 2 && j <= 3;
    doc.text(
      val,
      alignRight ? colXs[j] + colWidths[j] - 2 : colXs[j] + 2,
      y + 7,
      { align: alignRight ? "right" : "left" }
    );
  });

  y += rowHeight;

  // Grand total and thanks
  doc.setFont("helvetica", "bold");
  doc.text(`Grand Total: Rs ${grandTotal.toFixed(2)}`, 105, y + 10, { align: "center" });

  doc.setFont("helvetica", "italic");
  doc.text("Thanks for your cooperation.", 105, y + 20, { align: "center" });

  doc.addImage("../images/hands.png", "PNG", 95, 200, 23, 23);

  // New page if needed
  doc.addPage();
}





