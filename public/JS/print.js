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
    
        let customers = [];  // Store all customers
        let filteredCustomers = []; // Store filtered results
        let currentPage = 1;
        const itemsPerPage = 15; // Number of customers per page
    
        // Fetch customers from API
        async function fetchCustomers() {
            try {
                const response = await fetch("/sellers/all");
                const data = await response.json();
                if (data.success) {
                    customers = data.sellers;
                    filteredCustomers = customers; // Default view
                    renderCustomers();
                } else {
                    console.error("Failed to fetch customers");
                }
            } catch (error) {
                console.error("Error fetching customers:", error);
            }
        }
    
        // Render customers dynamically
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
                    </tr>
                </thead>
                <tbody></tbody>
            `;
        
            const tbody = table.querySelector("tbody");
        
            paginatedCustomers.forEach(customer => {
                const row = document.createElement("tr");
                row.innerHTML = `
                    <td>${customer.client_name}</td>
            <td>${customer.city}, ${customer.state}</td>
            <td>${customer.category.charAt(0).toUpperCase() + customer.category.slice(1)}</td>
            <td id="billed-${customer.customer_id}">Loading...</td>
            <td id="unbilled-${customer.customer_id}">Loading...</td>
            <td id="billed-txn-${customer.customer_id}">Loading...</td>
            <td id="unbilled-txn-${customer.customer_id}">Loading...</td>
            <td><button class="print-bill-btn" data-id="${customer.customer_id}">Print</button></td>
        `;
        tbody.appendChild(row);
                tbody.appendChild(row);
        
                // Fetch Billed & Unbilled Amounts asynchronously
                fetchBillingStatus(customer.customer_id);
            });
        
            customersContainer.appendChild(table);
            updatePaginationControls();
        }
        
        // Fetch and Update Billed & Unbilled Amounts
        async function fetchBillingStatus(customerId) {
            try {
                const response = await fetch(`/api/customer-billing-status?fy=${financialYear}&firm_id=${firmId}&customer_id=${customerId}`);
                const data = await response.json();
        
                if (data.success) {
                    document.getElementById(`billed-${customerId}`).textContent = data.billedAmount;
                    document.getElementById(`unbilled-${customerId}`).textContent = data.unbilledAmount;
                    document.getElementById(`billed-txn-${customerId}`).textContent = data.billedTxnCount;
                    document.getElementById(`unbilled-txn-${customerId}`).textContent = data.unbilledTxnCount;
                } else {
                    document.getElementById(`billed-${customerId}`).textContent = "Error";
                    document.getElementById(`unbilled-${customerId}`).textContent = "Error";
                    document.getElementById(`billed-txn-${customerId}`).textContent = "Error";
                    document.getElementById(`unbilled-txn-${customerId}`).textContent = "Error";
                }
            } catch (error) {
                console.error("Error fetching billing status:", error);
                document.getElementById(`billed-${customerId}`).textContent = "Error";
                document.getElementById(`unbilled-${customerId}`).textContent = "Error";
                document.getElementById(`billed-txn-${customerId}`).textContent = "Error";
                document.getElementById(`unbilled-txn-${customerId}`).textContent = "Error";
            }
        }
        
        
        
    
        // Update Pagination Controls
        function updatePaginationControls() {
            pageInfo.textContent = `Page ${currentPage} of ${Math.ceil(filteredCustomers.length / itemsPerPage)}`;
            prevBtn.disabled = currentPage === 1;
            nextBtn.disabled = currentPage >= Math.ceil(filteredCustomers.length / itemsPerPage);
        }
    
       // Search & Filter Logic
document.getElementById("apply-btn").addEventListener("click", () => {
    const searchValue = document.getElementById("search-bar").value.trim().toLowerCase();
    const searchColumn = document.getElementById("search-column").value;
    const typeFilter = document.getElementById("transaction-type").value;

    filteredCustomers = customers.filter(customer => {
        // Check if the search term matches the selected column
        const matchesSearch = searchValue
            ? (customer[searchColumn] || "").toLowerCase().includes(searchValue)
            : true;

        // Check if the customer matches the selected category
        const matchesType = typeFilter === "all" || customer.category === typeFilter;

        return matchesSearch && matchesType;
    });

    currentPage = 1;
    renderCustomers();
});

    
        // Pagination Events
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
    
        // Event Listener for "Print Bill" Button
        document.body.addEventListener("click", (event) => {
            if (event.target.classList.contains("print-bill-btn")) {
                const customerId = event.target.getAttribute("data-id");
                window.location.href = `print-bill.html?customer_id=${customerId}&firmId=${firmId}&fy=${financialYear}`;
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


document.getElementById("report").addEventListener("click", async () => {
    
    const fy = financialYear;                      // Fiscal year
    const response = await fetch(`/customers/all/orderbycity`);
    const customerData = await response.json();

    if (!customerData.success || !customerData.customers.length) {
        alert("No customers found.");
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: "landscape" });

    const colWidths = [20, 45, 35, 17, 17, 35, 17, 17, 35, 17, 17, 18];  
    const rowHeight = 7;                          
    let startY = 10;                              
    let currentCity = "";

    // ✅ **Reusable function to draw the header**
    function drawHeader() {
        startY = 10;                               

        // ✅ PDF Title
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.text(`Financial Year Report ${fy}-${parseInt(fy) + 1}`, 150, 5, { align: "center" });

        // ✅ Main Header Row
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

        // ✅ Sub-Headers
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

        // ✅ Draw Vertical Grid Lines
        let colGridX = 5;                         
        for (const width of colWidths) {
            doc.line(colGridX, startY, colGridX, startY + rowHeight); 
            colGridX += width;
        }

        startY += rowHeight;                      
    }

    // ✅ Draw initial header
    drawHeader();

    // ✅ Loop through customers
    for (const customer of customerData.customers) {
        const { city, name, customer_id } = customer;

        // ✅ City Group Header
        if (currentCity !== city) {
            currentCity = city;

            // ✅ Add city section
            doc.setFont("helvetica", "bold");
            doc.setFontSize(10);
            doc.setTextColor(0);
            doc.setFillColor(230, 230, 250);      
            doc.rect(5, startY, 290, rowHeight, "F");
            doc.text(`City: ${currentCity}`, 130, startY + 5);

            startY += rowHeight;

            // ✅ Page break and reprint header if needed
            if (startY > 190) {
                doc.addPage();
                drawHeader();
            }
        }

        let colX = 1;                             

        // ✅ Customer Info Row
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(0);

        // ✅ Alternating Row Colors
        doc.setFillColor(startY % 14 < 7 ? 245 : 255, 245, 245);
        doc.rect(5, startY, 290, rowHeight, "F");

        doc.text(city, colX + 5, startY + 5);
        colX += colWidths[0];

        doc.text(name, colX + 5, startY + 5);
        colX += colWidths[1];

        let totalBilled = 0;  // ✅ Initialize total billed amount

        // ✅ Fetch billing data for each firm
        for (let firmId = 1; firmId <= 3; firmId++) {
            const billingResponse = await fetch(
                `/api/customer-billing-status?fy=${fy}&firm_id=${firmId}&customer_id=${customer_id}`
            );
            const billingData = await billingResponse.json();

            const billed = billingData?.billedAmount || 0;
            const unbilled = billingData?.unbilledAmount || 0;

            totalBilled += billed;  // ✅ Accumulate billed amount

            let billNo = "N/A";  

            if (billed > 0) {
                billNo = generateBillNo(firmId, fy, city, name, customer_id);

                // ✅ Split the bill number into two parts:
                const billPrefix = billNo.slice(0, billNo.lastIndexOf(customer_id.toString()));
                const customerIdBold = customer_id.toString();

                // ✅ Print the prefix in normal font
                doc.setFont("helvetica", "normal");
                doc.text(billPrefix, colX + 5, startY + 5);

                // ✅ Print the customer ID in bold
                const prefixWidth = doc.getTextWidth(billPrefix);  
                doc.setFont("helvetica", "bold");
                doc.text(customerIdBold, colX + 5 + prefixWidth, startY + 5);

            } else {
                // ✅ Print "N/A" in normal font only when billed is 0
                doc.setFont("helvetica", "normal");
                doc.text(billNo, colX + 5, startY + 5);
            }

            // ✅ Move to the next column (ONLY FOR AMOUNTS)
            colX += colWidths[2];  

            // ✅ Print billed and unbilled amounts
            doc.setFont("helvetica", "normal");  
            doc.text(billed.toString(), colX + 5, startY + 5);
            colX += colWidths[3];

            doc.text(unbilled.toString(), colX + 5, startY + 5);
            colX += colWidths[4];
        }

        // ✅ Print the `Total Bld` column
        doc.setFont("helvetica", "bold");
        doc.text(totalBilled.toString(), colX + 5, startY + 5);
        
        colX += colWidths[5];

        // ✅ Draw Vertical Grid Lines for Customer Row
        let rowColX = 5;
        for (const width of colWidths) {
            doc.line(rowColX, startY, rowColX, startY + rowHeight);
            rowColX += width;
        }

        startY += rowHeight;

        // ✅ Page break and reprint header if needed
        if (startY > 190) {
            doc.addPage();
            drawHeader();
        }
    }

    // ✅ Generate PDF Blob and open in a new tab
    const pdfBlob = doc.output("blob");
    const pdfUrl = URL.createObjectURL(pdfBlob);

    window.open(pdfUrl, "_blank");
});


// ✅ Bill Number Generator Function
function generateBillNo(firmId, fy, city, customerName, customerId) {
    let firmCode;
    
    switch (parseInt(firmId, 10)) {
        case 1: firmCode = "BB"; break;
        case 2: firmCode = "PKC"; break;
        case 3: firmCode = "MB"; break;
        default: return "Invalid Firm ID";
    }

    const fyLastTwo = fy.toString().slice(-2);
    const cityCode = city.substring(0, 3).toUpperCase();
    const customerCode = customerName.substring(0, 3).toUpperCase();

    const billNo = `${firmId}${firmCode}${fyLastTwo}${cityCode}00${customerCode}${customerId}`;
    return billNo;
}



    
    

   
});

