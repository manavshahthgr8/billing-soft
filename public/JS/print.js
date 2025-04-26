document.addEventListener("DOMContentLoaded", () => {
    fetch('/city/all')
        .then(response => response.json())
        .then(data => {
            const cityDropdown = document.getElementById('city-dropdown');
            data.forEach(city => {
                let option = document.createElement('option');
                option.value = city.city_id;
                option.textContent = city.city_name;
                cityDropdown.appendChild(option);
            });
        })
        .catch(error => console.error('Error loading cities:', error));

       
        
    setTimeout(() => {
        document.getElementById("search-bar").value = "";
    }, 100); // Small delay ensures autofill is overridden// Clear search bar on page load
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

    // 📅 Extract firmId & FY from URL
    const urlParams = new URLSearchParams(window.location.search);
    const firmId = urlParams.get("firmId");
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

    // Assume firmName is fetched and stored globally (or accessible via document.getElementById("firmName").textContent)
    // For example, after fetchFirmDetails(), you could store:
    let firmName = ""; // Global variable to hold firm name
    const fetchFirmDetails = async () => {
        try {
            const response = await fetch(`/api/firm/${firmId}`);
            const data = await response.json();
            if (data.success) {
                document.getElementById("firmName").textContent = data.firm.firm_name;
                firmName = data.firm.firm_name;
            }
        } catch (error) {
            console.error("Error fetching firm details:", error);
        }
    };
    fetchFirmDetails();

    document.getElementById('enter-btn').addEventListener('click', function () {
        const cityDropdown = document.getElementById('city-dropdown');
        const selectedCity = cityDropdown.options[cityDropdown.selectedIndex];
    
        if (!cityDropdown.value) {
            // Alert message
            //alert('Please select a city before proceeding.');
    
            // Set focus back to the dropdown
            //cityDropdown.focus();
    
            // Highlight dropdown with a red border
           cityDropdown.style.border = '2px solid red';
    
            // Remove highlight after 2 seconds
            setTimeout(() => {
                cityDropdown.style.border = '';
            }, 2000);
        } else {
            //console.log('City selected:', cityDropdown.value);
            // Proceed with the action

             // Construct the URL with query parameters
        const url = `multiprint.html?city_id=${cityDropdown.value}&city=${encodeURIComponent(selectedCity.text)}&fy=${financialYear}&firm_id=${firmId}`;

        // Redirect to multiprint.html
        window.location.href = url;
        }
    });

   

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

    
    const customersContainer = document.createElement("div");
customersContainer.id = "customers-container";
document.querySelector(".main-container").appendChild(customersContainer);

const paginationControls = document.querySelector(".pagination");
const prevBtn = document.getElementById("prev-btn");
const nextBtn = document.getElementById("next-btn");
const pageInfo = document.getElementById("page-info");

let customers = [];                  // All customers
let filteredCustomers = [];          // Filtered results (city/status/search)
let billingStatusMap = {};           // Cache billing status across all pages
let currentPage = 1;
const itemsPerPage = 15;             // Customers per page

// ✅ Fetch customers from API
async function fetchCustomers() { //active customer
    try {
        const response = await fetch(`/sellers/active/${financialYear}`);
        const data = await response.json();

        if (data.success) {
            customers = data.sellers;
            filteredCustomers = [...customers];  // Reset filters
            await fetchAllBillingStatuses();
            applyFilters();
        } else {
            console.error("Failed to fetch active customers");
        }
    } catch (error) {
        console.error("Error fetching active customers:", error);
    }
}

// ✅ Fetch and Cache Billing Status for All Customers
async function fetchAllBillingStatuses() {
    const billingPromises = customers.map(async (customer) => {
        const customerId = customer.customer_id;

        if (!billingStatusMap[customerId]) {
            try {
                const response = await fetch(
                    `/api/customer-billing-status?fy=${financialYear}&firm_id=${firmId}&customer_id=${customerId}`
                );
                const data = await response.json();

                if (data.success) {
                    billingStatusMap[customerId] = {
                        billedAmount: data.billedAmount,
                        unbilledAmount: data.unbilledAmount,
                        billedTxnCount: data.billedTxnCount,
                        unbilledTxnCount: data.unbilledTxnCount
                    };
                } else {
                    console.error(`Failed to fetch status for ${customerId}`);
                }
            } catch (error) {
                console.error(`Error fetching billing status for ${customerId}:`, error);
            }
        }
    });

    // Wait until all billing status fetches are completed
    await Promise.all(billingPromises);
}

async function updateBillNumbers(financialYear) {
    try {
        const response = await fetch(`/bills/generate/${financialYear}`, { method: "POST" });
        const data = await response.json();

        if (data.success) {
            console.log(`✅ Bill numbers updated for FY ${financialYear}`);
        } else {
            console.error("⚠️ Failed to update bill numbers");
        }
    } catch (error) {
        console.error("❌ Error updating bill numbers:", error);
    }
}
updateBillNumbers(financialYear);  

// ✅ Render customers dynamically with pagination
function renderCustomers() {
    customersContainer.innerHTML = "";

    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const paginatedCustomers = filteredCustomers.slice(start, end);

    const table = document.createElement("table");
    table.classList.add("customer-table");

    table.innerHTML = `
        <thead>
            <tr>
                <th>Customer Name</th>
                <th>Location</th>
                <th>Category</th>
                <th>Billed Amount</th>
                <th>Unbilled Amount</th>
                <th>Billed Txn</th>
                <th>Unbilled Txn</th>
                <th>Action</th>
                <th>Summary</th>
            </tr>
        </thead>
        <tbody></tbody>
    `;

    const tbody = table.querySelector("tbody");

    paginatedCustomers.forEach(customer => {
        const customerId = customer.customer_id;
        const billing = billingStatusMap[customerId] || {
            billedAmount: "Loading...",
            unbilledAmount: "Loading...",
            billedTxnCount: "Loading...",
            unbilledTxnCount: "Loading..."
        };

        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${customer.client_name}</td>
            <td>${customer.city}, ${customer.state}</td>
            <td>${customer.category.charAt(0).toUpperCase() + customer.category.slice(1)}</td>
            <td>${billing.billedAmount}</td>
            <td>${billing.unbilledAmount}</td>
            <td>${billing.billedTxnCount}</td>
            <td>${billing.unbilledTxnCount}</td>
            <td><button class="print-bill-btn" data-id="${customerId}">View, Print</button></td>
            <td><button class="summary-btn" data-id="${customerId}">Summary</button></td>
        `;

        tbody.appendChild(row);
    });

    customersContainer.appendChild(table);
    updatePaginationControls();
}

// ✅ Apply combined filters (City + Status + Search)
function applyFilters() {
    const cityFilter = document.getElementById("search-bar").value.trim().toLowerCase();
    const statusFilter = document.getElementById("status-dropdown").value;
    const typeFilter = document.getElementById("transaction-type").value;
    const searchColumn = document.getElementById("search-column").value;

    // ✅ Filter based on city or search criteria first
    filteredCustomers = customers.filter(customer => {
        const matchesSearch = cityFilter
            ? (customer[searchColumn] || "").toLowerCase().includes(cityFilter)
            : true;

        const matchesType = typeFilter === "all" || customer.category === typeFilter;

        return matchesSearch && matchesType;
    });

    // ✅ Apply Status filter on the filtered list
    if (statusFilter !== "all") {
        filteredCustomers = filteredCustomers.filter(customer => {
            const status = billingStatusMap[customer.customer_id] || {
                billedAmount: 0,
                unbilledAmount: 0
            };

            const hasBilled = parseFloat(status.billedTxnCount) > 0;
            const hasUnbilled = parseFloat(status.unbilledTxnCount) > 0;

            if (statusFilter === "paid") {
                return hasBilled;
            } else if (statusFilter === "unpaid") {
                return hasUnbilled;
            }

            return true;
        });
    }

    currentPage = 1;
    renderCustomers();
}

// ✅ Update Pagination Controls
function updatePaginationControls() {
    pageInfo.textContent = `Page ${currentPage} of ${Math.ceil(filteredCustomers.length / itemsPerPage)}`;
    prevBtn.disabled = currentPage === 1;
    nextBtn.disabled = currentPage >= Math.ceil(filteredCustomers.length / itemsPerPage);
}

// ✅ Search & Filter Event
document.getElementById("apply-btn").addEventListener("click", () => {
    applyFilters();
});

// ✅ Status Filter Event
document.getElementById("status-dropdown").addEventListener("change", () => {
    applyFilters();
});

// ✅ Pagination Events
prevBtn.addEventListener("click", () => {
    if (currentPage > 1) {
        currentPage--;
        renderCustomers();
    }
});

nextBtn.addEventListener("click", () => {
    if (currentPage < Math.ceil(filteredCustomers.length / itemsPerPage)) {
        currentPage++;
        renderCustomers();
    }
});

// ✅ Initialize customer fetching
fetchCustomers();

    
    
    
        // Event Listener for "Print Bill" Button
        document.body.addEventListener("click", (event) => {
            if (event.target.classList.contains("print-bill-btn")) {
                const customerId = event.target.getAttribute("data-id");
                window.location.href = `print-bill.html?customer_id=${customerId}&firmId=${firmId}&fy=${financialYear}`;
            }
        });

         // Event Listener for "Print Bill" Button
         document.body.addEventListener("click", (event) => {
            if (event.target.classList.contains("summary-btn")) {
                const customerId = event.target.getAttribute("data-id");
                window.location.href = `summary.html?customer_id=${customerId}&firmId=${firmId}&fy=${financialYear}`;
            }
        });
    
        // Fetch customers on page load
        fetchCustomers();

        // 🔄 Reset Button Functionality
document.getElementById("reset-btn").addEventListener("click", () => {
    document.getElementById("search-bar").value = ""; // Clear search
    document.getElementById("search-column").value = "client_name"; // Reset search column
    document.getElementById("transaction-type").value = "all"; // Reset filter

    filteredCustomers = [...customers]; // Restore original customer list
    currentPage = 1; // Reset to first page
    renderCustomers(); // Re-render customer list
});

document.getElementById("report").addEventListener("click", async () => {
    alert("Generating PDF report... \nPlease wait for it to open in next tab.");
});

// ✅ Add event listener to the "Unbilled All" button
// ✅ Add event listener to the "Unbilled All" button
document.getElementById("UnbilledAll").addEventListener("click", () => {
    // Collect unbilled customer IDs
    const unbilledCustomerIds = filteredCustomers
        .filter(customer => {
            const status = billingStatusMap[customer.customer_id] || { unbilledAmount: 0, unbilledTxnCount: 0 };
            return parseFloat(status.unbilledAmount) > 0 || parseInt(status.unbilledTxnCount) > 0;
        })
        .map(customer => customer.customer_id);

    if (unbilledCustomerIds.length === 0) {
        alert("No unbilled customers found.");
        return;
    }

    // ✅ Compress IDs into a single comma-separated string
    const idsString = unbilledCustomerIds.join(",");

    // ✅ Redirect with compressed IDs in the URL
    const redirectUrl = `/internalpages/unbilled.html?cids=${idsString}&fy=${financialYear}&firm_id=${firmId}`;
    window.location.href = redirectUrl;
});

document.getElementById("billedAll").addEventListener("click", () => {
    // Collect unbilled customer IDs
    const unbilledCustomerIds = filteredCustomers
        .filter(customer => {
            const status = billingStatusMap[customer.customer_id] || { billedAmount: 0 };
            return parseFloat(status.billedAmount) > 0;
        })
        .map(customer => customer.customer_id);

    if (unbilledCustomerIds.length === 0) {
        alert("No billed customers found.");
        return;
    }

    // ✅ Compress IDs into a single comma-separated string
    const idsString = unbilledCustomerIds.join(",");

    // ✅ Redirect with compressed IDs in the URL
    const redirectUrl = `/internalpages/billed.html?cids=${idsString}&fy=${financialYear}&firm_id=${firmId}`;
    window.location.href = redirectUrl;
});




document.getElementById("report").addEventListener("click", async () => {
    const fy = financialYear;
    const response = await fetch(`/customers/all/orderbycity/${fy}`);
    const customerData = await response.json();

    if (!customerData.success || !customerData.customers.length) {
        alert("No customers found.");
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: "landscape" });

    const colWidths = [30, 60, 25, 17, 17, 25, 17, 17, 25, 17, 17, 18];  
    const rowHeight = 7;
    let startY = 10;
    let currentCity = "";

    function drawHeader() {
        startY = 10;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.text(`Financial Year Report ${fy}-${parseInt(fy) + 1}`, 150, 5, { align: "center" });

        doc.setFillColor(200, 200, 200);
        doc.rect(5, startY, 290, rowHeight, "F");
        doc.setFontSize(9);
        doc.setTextColor(0);

        let colX = 5;
        doc.text("City", colX + 7, startY + 5);
        colX += colWidths[0];

        doc.text("Party Name", colX + 10, startY + 5);
        colX += colWidths[1];

        const firmNames = ["Brajmohan & Brothers", "Parag Kumar & Company", "Manav Brokers"];
        for (let i = 0; i < 3; i++) {
            doc.text(firmNames[i], colX + 20, startY + 5);
            colX += colWidths[2] + colWidths[3] + colWidths[4];
        }

        startY += rowHeight;
        doc.setFontSize(8);
        colX = 1 + colWidths[0] + colWidths[1];

        for (let i = 0; i < 3; i++) {
            doc.setFont("helvetica", "bold");
            doc.text("Bill No", colX + 5, startY + 5);
            colX += colWidths[2];

            doc.text("Bld $", colX + 5, startY + 5);
            colX += colWidths[3];

            doc.text("UnBld $", colX + 5, startY + 5);
            colX += colWidths[4];
        }

        doc.setFont("helvetica", "bold");
        doc.text("Total Bld", colX + 5, startY + 5);
        colX += colWidths[5];

        let colGridX = 5;
        for (const width of colWidths) {
            doc.line(colGridX, startY, colGridX, startY + rowHeight);
            colGridX += width;
        }

        startY += rowHeight;
    }

    drawHeader();

    for (const customer of customerData.customers) {
        const { city, name, customer_id } = customer;

        if (currentCity !== city) {
            currentCity = city;
            doc.setFont("helvetica", "bold");
            doc.setFontSize(10);
            doc.setTextColor(0);
            doc.setFillColor(230, 230, 250);
            doc.rect(5, startY, 290, rowHeight, "F");
            doc.text(`City: ${currentCity}`, 130, startY + 5);

            startY += rowHeight;

            if (startY > 190) {
                doc.addPage();
                drawHeader();
            }
        }

        let colX = 1;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(0);

        doc.setFillColor(startY % 14 < 7 ? 245 : 255, 245, 245);
        doc.rect(5, startY, 290, rowHeight, "F");

        doc.text(city, colX + 5, startY + 5);
        colX += colWidths[0];

        doc.text(name, colX + 5, startY + 5);
        colX += colWidths[1];

        let totalBilled = 0;

        // ✅ Fetch Bill ID ONCE per customer
        const billId = await fetchBillId(customer_id, fy);
        let validBillId = billId !== null;

        for (let firmId = 1; firmId <= 3; firmId++) {
            const billingResponse = await fetch(
                `/api/customer-billing-status?fy=${fy}&firm_id=${firmId}&customer_id=${customer_id}`
            );
            const billingData = await billingResponse.json();

            const billed = billingData?.billedAmount || 0;
            const unbilled = billingData?.unbilledAmount || 0;

            totalBilled += billed;
            let billNo = "N/A";

            if (billed > 0 && validBillId) {
                let firmPrefix, baseNumber;
                switch (firmId) {
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
                        firmPrefix = "ERR";
                        baseNumber = 0;
                }

                billNo = `${firmPrefix}${baseNumber + billId}`;
            }

            // ✅ PRINT Bill No in correct column
            doc.setFont("helvetica", "normal");
            doc.text(billNo, colX + 5, startY + 5);
            colX += colWidths[2];

            // ✅ PRINT Billed & Unbilled Amounts
            doc.text(billed.toString(), colX + 5, startY + 5);
            colX += colWidths[3];

            doc.text(unbilled.toString(), colX + 5, startY + 5);
            colX += colWidths[4];
        }

        doc.setFont("helvetica", "bold");
        doc.text(totalBilled.toString(), colX + 5, startY + 5);
        colX += colWidths[5];

        let rowColX = 5;
        for (const width of colWidths) {
            doc.line(rowColX, startY, rowColX, startY + rowHeight);
            rowColX += width;
        }

        startY += rowHeight;

        if (startY > 190) {
            doc.addPage();
            drawHeader();
        }
    }

    const pdfBlob = doc.output("blob");
    const pdfUrl = URL.createObjectURL(pdfBlob);
    window.open(pdfUrl, "_blank");
});

async function fetchBillId(customerId, financialYear) {
    try {
        const response = await fetch(`/bills/${financialYear}/${customerId}`);
        const data = await response.json();
        return data.success && data.bill_id ? data.bill_id : null;
    } catch (error) {
        console.error("❌ Error fetching Bill ID:", error);
        return null;
    }
}




    
    

   
});

