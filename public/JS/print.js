document.addEventListener("DOMContentLoaded", () => {
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
                    <td><button class="print-bill-btn" data-id="${customer.customer_id}">Print</button></td>
                `;
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
                } else {
                    document.getElementById(`billed-${customerId}`).textContent = "Error";
                    document.getElementById(`unbilled-${customerId}`).textContent = "Error";
                }
            } catch (error) {
                console.error("Error fetching billing status:", error);
                document.getElementById(`billed-${customerId}`).textContent = "Error";
                document.getElementById(`unbilled-${customerId}`).textContent = "Error";
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

    
    

   
});

