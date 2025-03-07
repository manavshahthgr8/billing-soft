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

    // Transaction Pagination and Rendering (Existing Code)
    let transactions = [];
    let currentPage = 1;
    const limit = 15; // Transactions per page
    const transactionListContainer = document.getElementById('transaction-list');
    const prevButton = document.getElementById('prev-btn');
    const nextButton = document.getElementById('next-btn');
    const pageInfo = document.getElementById('page-info');

    const fetchTransactions = async (params = {}) => {
        const { page = 1, financialYear, firmId } = params;
        try {
            const response = await fetch(`/transactions?fy=${financialYear}&firm_id=${firmId}&page=${page}&limit=${limit}`);
            if (!response.ok) throw new Error(`Failed to fetch transactions: ${response.statusText}`);
            const data = await response.json();
            transactions = data.transactions;
            renderTransactions(transactions);
            currentPage = data.currentPage;
            pageInfo.textContent = `Page ${data.currentPage} of ${data.totalPages}`;
            prevButton.disabled = currentPage === 1;
            nextButton.disabled = currentPage >= data.totalPages;
        } catch (error) {
            console.error('Error fetching transactions:', error);
            alert('Failed to fetch transactions. Please try again.');
        }
    };

    const renderTransactions = (transactions) => {
        transactionListContainer.innerHTML = '';
        transactions.forEach(transaction => {
            const card = document.createElement('div');
            card.classList.add('transaction-card');
            card.innerHTML = `
                  <div class="transaction-grid">
        <div class="transaction-column">
            <p><strong>TID:</strong> ${transaction.transaction_id}</p>
            <p><strong>Sn:</strong> ${transaction.sno}</p>
        </div>
        <div class="transaction-column">
            <p><strong>From:</strong> ${transaction.seller_name} (${transaction.seller_city})</p>
            <p><strong>To:</strong> ${transaction.buyer_name} (${transaction.buyer_city})</p>
        </div>
        <div class="transaction-column">
            <p><strong>S Rate:</strong> #${transaction.seller_rate}</p>
            <p><strong>B Rate:</strong> #${transaction.buyer_rate}</p>
        </div>
        <div class="transaction-column">
            <p><strong>Bhav:</strong> ₹${transaction.bhav}</p>
            
        </div>
        <div class="transaction-column">
            <p><strong>FY:</strong> ${transaction.financial_year}</p>
            <p><strong>Date:</strong> ${transaction.date}</p>
            <p><strong>S Qty:</strong> ${transaction.qty} | <strong>B Qty:</strong> ${transaction.bqty}</p>
        </div>
        <div class="transaction-column transaction-actions">
            <button class="edit-btn" data-id="${transaction.transaction_id}">Edit</button>
            <button class="delete-btn" data-id="${transaction.transaction_id}">Delete</button>
        </div>
    </div>
            `;
            transactionListContainer.appendChild(card);
        });
    };

    fetchTransactions({ page: 1, financialYear, firmId });

    prevButton.addEventListener("click", () => {
        if (currentPage > 1) {
            const searchValue = document.getElementById("search-bar").value.trim();
            const transactionType = document.getElementById("transaction-type").value;
            const searchColumn = document.getElementById("search-column").value;
    
            let filters = {};
            if (transactionType !== "all") {
                filters.transaction_type = transactionType;
            }
            if (searchValue !== "") {
                filters[searchColumn] = searchValue;
                fetchFilteredTransactions(filters, currentPage - 1);  // 🔹 Use filtered fetch with updated page
            } else {
                fetchTransactions({ page: --currentPage, financialYear, firmId }); // 🔹 Normal fetch
            }
        }
    });
    
    nextButton.addEventListener("click", () => {
        const searchValue = document.getElementById("search-bar").value.trim();
        const transactionType = document.getElementById("transaction-type").value;
        const searchColumn = document.getElementById("search-column").value;
    
        let filters = {};
        if (transactionType !== "all") {
            filters.transaction_type = transactionType;
        }
        if (searchValue !== "") {
            filters[searchColumn] = searchValue;
            fetchFilteredTransactions(filters, currentPage + 1);  // Move to next page
        } else {
            fetchTransactions({ page: currentPage + 1, financialYear, firmId });
        }
    });
    
    
    

    // -------------------------------
    // Filter & Search (Unchanged)
    const fetchFilteredTransactions = async (filters, page = 1) => {
        try {
            let queryParams = new URLSearchParams({
                fy: financialYear,
                firm_id: firmId,
                page: page,  // Use the dynamic page number
                limit: limit
            });
    
            Object.keys(filters).forEach(key => {
                if (filters[key]) {
                    queryParams.append(key, filters[key]);
                }
            });
    
            const apiUrl = `/filteredTransactions?${queryParams.toString()}`;
            const response = await fetch(apiUrl);
            if (!response.ok) throw new Error(`Failed to fetch filtered transactions: ${response.statusText}`);
    
            const data = await response.json();
            transactions = data.transactions;
            renderTransactions(transactions);
    
            currentPage = data.currentPage;  // Update pagination
            pageInfo.textContent = `Page ${data.currentPage} of ${data.totalPages}`;
            prevButton.disabled = currentPage === 1;
            nextButton.disabled = currentPage >= data.totalPages;
        } catch (error) {
            console.error("Error fetching filtered transactions:", error);
            alert("Failed to fetch filtered transactions. Please try again.");
        }
    };
    

    const applyButton = document.getElementById("apply-btn");
    applyButton.addEventListener("click", () => {
        const transactionType = document.getElementById("transaction-type").value;
        const searchValue = document.getElementById("search-bar").value.trim();
        const searchColumn = document.getElementById("search-column").value;
        let filters = {};
        if (transactionType !== "all") {
            filters.transaction_type = transactionType;
        }
        if (searchValue !== "") {
            filters[searchColumn] = searchValue;
        }
        fetchFilteredTransactions(filters);
    });

    const resetButton = document.getElementById("reset-btn");
    resetButton.addEventListener("click", () => {
        document.getElementById("transaction-type").value = "all";
        document.getElementById("search-bar").value = "";
        document.getElementById("search-column").value = "client_name";
        fetchTransactions({ page: 1, financialYear, firmId });
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

    // -------------------------------
    // Edit Modal Elements & Handling
    const editModal = document.getElementById("edit-transaction-modal");

if (!editModal) {
    console.error("❌ Edit modal not found in DOM!");
}

// 🚀 Open Edit Modal
document.body.addEventListener("click", async function (event) {
    if (!event.target.classList.contains("edit-btn")) return;

    const tid = event.target.getAttribute("data-id");
    if (!tid) {
        console.error("❌ No TID found on edit button!");
        return;
    }

    console.log(`Opening Edit Modal for TID: ${tid}`);
    
    // 🛑 Set Transaction ID, Firm Name, and FY
    document.getElementById("edit-tid").textContent = tid;
    document.getElementById("edit-firm-name").textContent = firmName;
    document.getElementById("edit-fy").textContent = financialYear;

    try {
        // Step 1️⃣: Fetch All Customers (for Dropdowns)
        const customersRes = await fetch("/sellers/all");
        const customersData = await customersRes.json();
        if (!customersData.success) throw new Error("Failed to fetch customers.");

        const sellersDropdown = document.getElementById("edit-seller-name");
        const buyersDropdown = document.getElementById("edit-buyer-name");

        // Clear existing options
        sellersDropdown.innerHTML = '<option value="">Select Seller</option>';
        buyersDropdown.innerHTML = '<option value="">Select Buyer</option>';

        // Populate dropdowns
        customersData.sellers.forEach(customer => {
            const option = `<option value="${customer.customer_id}">${customer.client_name} (${customer.city}, ${customer.state})</option>`;
            sellersDropdown.innerHTML += option;
            buyersDropdown.innerHTML += option;
        });

        // Step 2️⃣: Fetch Transaction Details
        const transactionRes = await fetch(`/api/transactions/${tid}?fy=${financialYear}`);
        const transactionData = await transactionRes.json();
        if (!transactionData.success) throw new Error("Failed to fetch transaction details.");

        const txn = transactionData.transaction;

        // 📝 Pre-fill form
        document.getElementById("edit-seller-name").value = txn.seller_id;
        document.getElementById("edit-seller-rate").value = txn.seller_rate;
        document.getElementById("edit-item").value = txn.item;
        document.getElementById("edit-qty").value = txn.qty;
        document.getElementById("bedit-qty").value = txn.bqty;
        document.getElementById("edit-date").value = txn.date;
        document.getElementById("edit-pkg").value = txn.packaging;
        document.getElementById("edit-buyer-name").value = txn.buyer_id;
        document.getElementById("edit-buyer-rate").value = txn.buyer_rate;
        document.getElementById("bhav").value = txn.bhav;
        document.getElementById("edit-password").value = ""; // Clear password field

        // ✅ Show modal after data is populated
        editModal.style.display = "block";
    } catch (error) {
        console.error("🚨 Error loading transaction details:", error);
        alert("Failed to load transaction data.");
    }
});

// ❌ Close Edit Modal
document.querySelector("#edit-transaction-modal .modal-close4").addEventListener("click", function () {
    editModal.style.display = "none";
});

// ✅ Save Updated Transaction
document.getElementById("save-transaction").addEventListener("click", async function () {
    const tid = document.getElementById("edit-tid").textContent;
    const password = document.getElementById("edit-password").value;

    if(document.getElementById("edit-seller-rate").value=="" || document.getElementById("edit-buyer-rate").value=="" ){
        alert("Seller Rate , Buyer rate can't be empty.");
        return
    }

    if (!password) {
        alert("Please enter your password.");
        return;
    }

    try {
        // Step 1️⃣: Check Password
        const passRes = await fetch('/api/account/check-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password })
        });

        const passData = await passRes.json();
        if (!passData.success) {
            alert("Incorrect password.");
            return;
        }

        console.log("✅ Password verified. Proceeding with update...");

        // Step 2️⃣: Collect updated data
        const updatedTransaction = {
            tid,
            fy: financialYear,
            firmId: firmId,
            seller_id: document.getElementById("edit-seller-name").value,
            seller_rate: parseFloat(document.getElementById("edit-seller-rate").value) || 0 ,
            item: document.getElementById("edit-item").value,
            qty: parseInt(document.getElementById("edit-qty").value),
            bqty: parseInt(document.getElementById("bedit-qty").value),
            bhav: parseInt(document.getElementById("bhav").value),
            date: document.getElementById("edit-date").value,
            packaging: document.getElementById("edit-pkg").value,
            buyer_id: document.getElementById("edit-buyer-name").value,
            buyer_rate: parseFloat(document.getElementById("edit-buyer-rate").value) || 0,
            seller_amount: parseFloat(document.getElementById("edit-seller-rate").value) * parseInt(document.getElementById("edit-qty").value),
            buyer_amount: parseFloat(document.getElementById("edit-buyer-rate").value) * parseInt(document.getElementById("edit-qty").value),
        };

        // Step 3️⃣: Send Update API Request
        const updateRes = await fetch(`/api/transactions/update`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedTransaction)
        });

        const updateData = await updateRes.json();
        if (!updateData.success) throw new Error(updateData.message || "Failed to update transaction.");

        alert("Transaction updated successfully.");
        editModal.style.display = "none";

        // Refresh the transaction list
        document.getElementById("apply-btn").click();

        //fetchFilteredTransactions({  });
      //  fetchTransactions({ page: currentPage, financialYear, firmId });

    } catch (error) {
        console.error("🚨 Error updating transaction:", error);
        alert(error.message || "Transaction update failed.");
    }
});


    // -------------------------------
    // Delete Modal Elements & Handling
    const deleteModal = document.getElementById("delete-transaction-modal");
    if (!deleteModal) {
        console.error("❌ Delete modal not found in DOM!");
    }

    // Open Delete Modal & Store TID in the modal's data attribute
    document.body.addEventListener("click", function (event) {
        if (event.target.classList.contains("delete-btn")) {
            const tid = event.target.getAttribute("data-id");
            if (!tid) {
                //console.error("No TID found on delete button!");
                return;
            }
            currentTransactionId = tid;
          //  console.log("Opening Delete Modal for TID:", currentTransactionId);
            deleteModal.setAttribute("data-tid", currentTransactionId);
            deleteModal.style.display = "block";
        }
    });
    document.querySelector("#delete-transaction-modal .modal-close4").addEventListener("click", function () {
        console.log("Closing Delete Modal...");
        deleteModal.style.display = "none";
    });
    window.addEventListener("click", function (event) {
        if (event.target === deleteModal) {
            deleteModal.style.display = "none";
        }
    });

    // Confirm Delete Logic
    document.getElementById("confirm-delete").addEventListener("click", function () {
        const tid = deleteModal.getAttribute("data-tid");
        if (!tid) {
            alert("Transaction ID is missing! ❌");
            return;
        }
        const password = document.getElementById("delete-password").value;
        if (!password) {
            alert("Please enter your password.");
            return;
        }
       // console.log(`Checking password for deletion of TID: ${tid}`);

        fetch('/api/account/check-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password })
        })
        .then(response => {
            if (!response.ok) {
              //  console.error("Password verification failed. Response:", response);
                return response.json().then(data => { throw new Error(data.message || "Password check failed."); });
            }
            return response.json();
        })
        .then(data => {
            if (!data.success) {
                alert("Incorrect password.");
                return;
            }
            console.log(`Password verified! Proceeding with deletion of TID: ${tid}`);
            return fetch(`/api/transactions/delete`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tid: tid,
                    fy: financialYear,
                    firmId: firmId
                })
            });
        })
        .then(response => {
            if (!response.ok) {
                console.error("Transaction deletion failed. Response:", response);
                return response.json().then(data => { throw new Error(data.message || "Deletion failed."); });
            }
            return response.json();
        })
        .then(data => {
            alert(data.message);
            if (data.success) {
                deleteModal.style.display = "none";
                fetchTransactions({ page: currentPage, financialYear, firmId });
            }
        })
        .catch(error => {
           // console.error("Error during deletion:", error);
            alert(error.message || "Operation failed.");
        });
    });


    // Event Listeners
    const packagingDropdown = document.getElementById("edit-pkg");
    const sRateInput = document.getElementById("edit-seller-rate");  // Seller Rate
    const bRateInput = document.getElementById("edit-buyer-rate");  // Buyer Rate

    function updateRates() {
        const packaging = packagingDropdown.value;
        if (packaging === "Katta") {
            sRateInput.value = 2;
            bRateInput.value = 1.5;
        } else if (packaging === "Bags") {
            sRateInput.value = 3;
            bRateInput.value = 2.5;
        }
        //updateAmounts();  // Ensure amounts update on packaging change
    }

     // Event Listeners
     packagingDropdown.addEventListener("change", updateRates);
});
document.addEventListener("DOMContentLoaded", function () {
    let searchBar = document.getElementById("search-bar");

    setTimeout(() => {
        searchBar.value = "";  // First clear
        searchBar.dispatchEvent(new Event('input'));

        setTimeout(() => {
            searchBar.value = ""; // Clear again in case Edge refills
            searchBar.dispatchEvent(new Event('input'));
        }, 300);
    }, 50);
});
