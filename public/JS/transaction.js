document.addEventListener("DOMContentLoaded", () => {
    console.log("✅ DOM loaded. Initializing event listeners...");
    fetch('/city/all')
        .then(response => response.json())
        .then(data => {
            const dropdown = document.getElementById("cityDropdown");
            data.forEach(city => {
                const option = document.createElement("option");
                option.value = city.city_name;
                option.textContent = city.city_name;
                dropdown.appendChild(option);
            });
            const dropdown1 = document.getElementById("buyerCityDropdown");
            data.forEach(city => {
                const option = document.createElement("option");
                option.value = city.city_name;
                option.textContent = city.city_name;
                dropdown1.appendChild(option);
            });
        })
        .catch(error => {
            console.error('Error loading cities:', error);
        });

    
    // 📅 Extract firmId & FY from URL
const urlParams = new URLSearchParams(window.location.search);
const firmId = urlParams.get("firmId");
const fy = parseInt(urlParams.get("fy"));
const fyDisplay = `${fy} - ${fy + 1}`;

// 📝 Assign values to form fields
const firmIdInput = document.getElementById("firmId");
const firmNameInput = document.getElementById("firmNameInput");
const financialYearInput = document.getElementById("financialYear");
const fySpan = document.getElementById("fy");
const firmNameSpan = document.getElementById("firmName");

if (firmIdInput) firmIdInput.value = firmId;
if (financialYearInput) financialYearInput.value = fy;
if (fySpan) fySpan.textContent = fyDisplay;

// 🌟 Store initial values for reset
const initialValues = {
    firmId: firmIdInput?.value || "",
    firmName: "",
    financialYear: financialYearInput?.value || "",
};
    loadSellers();
    loadBuyers();
    fetchSno();

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


// 🔄 Fetch firm details
async function fetchFirmDetails() {
    try {
        const response = await fetch(`/api/firm/${firmId}`);
        const data = await response.json();
        if (data.success) {
            firmNameSpan.textContent = data.firm.firm_name;
            firmNameInput.value = data.firm.firm_name;
            initialValues.firmName = data.firm.firm_name;
        }
    } catch (error) {
        console.error("Error fetching firm details:", error);
    }
}
fetchFirmDetails();

async function fetchSno() {
    const firmId1 =  firmId ;// Replace with actual method to get firm_id
    const financialYear1 = fy;  // Replace with actual method to get FY

    if (!firmId1 || !financialYear1) {
        console.error("❌ Missing firmId or financialYear");
        return;
    }

    try {
        const response = await fetch(`/api/transactions/last-sno?firm_id=${firmId1}&financial_year=${financialYear1}`);
        const data = await response.json();

        if (response.ok) {
            const newSno = data.lastSno + 1;
            const lastDate = data.lastDate;
            document.getElementById("sno").value = newSno;  // Update the S.No field
            document.getElementById("date").value = lastDate;  // Update the Date field
        } else {
            console.error("❌ Error fetching S.No:", data.error);
        }
    } catch (error) {
        console.error("❌ Network error:", error);
    }
}




// 🏷️ Load Sellers on Page Load
document.addEventListener("DOMContentLoaded", async () => {
    await loadSellers();
    fetchSno();
});

// 🔄 Reset form while keeping firm details
const clearButton = document.querySelector(".form-btn.clear");
if (clearButton) {
    clearButton.addEventListener("click", () => {
            setTimeout(() => {
                firmIdInput.value = initialValues.firmId;
                financialYearInput.value = initialValues.financialYear;
                firmNameSpan.textContent = initialValues.firmName;
                firmNameInput.value = initialValues.firmName;

                // Reset dropdowns
                document.getElementById("sellerDropdown").innerHTML = '<option value="">Select Your Seller</option>';
                document.getElementById("buyerDropdown").innerHTML = '<option value="">Select Your Buyer</option>';

                // Reload sellers
                loadSellers();
                loadBuyers();
                fetchSno();
                // Initialize default values on page load
                document.getElementById("packagingDropdown").selectedIndex = 0; // Selects the first option in the dropdown

        updateRates();
            }, 0);
    });
}

let sellerDataMap = {}; // Stores seller details in memory
let buyerDataMap = {};  // Stores buyer details in memory

// 📌 Load all sellers
async function loadSellers() {
    try {
        const response = await fetch("http://localhost:3000/sellers/all");
        const data = await response.json();

        if (data.success) {
            const sellerDropdown = document.getElementById("sellerDropdown");
            sellerDropdown.innerHTML = '<option value="">Select Your Seller</option>'; // Reset dropdown

            data.sellers.forEach((seller) => {
                const option = document.createElement("option");
                option.value = seller.customer_id;  // Use customer_id as value
                option.textContent = `${seller.client_name} , => ${seller.city}`; // Display client_name
                sellerDropdown.appendChild(option);

                // Store seller details in memory
                sellerDataMap[seller.customer_id] = {
                    state: seller.state,
                    city: seller.city
                };
            });

            // Update state & city on seller selection
            sellerDropdown.addEventListener("change", () => {
                updateStateAndCity(sellerDropdown.value);
            });
        } else {
            console.error("Failed to fetch sellers:", data.message);
        }
    } catch (error) {
        console.error("Error fetching sellers:", error);
    }
}

// 📌 Load all buyers
async function loadBuyers() {
    try {
        const response = await fetch("http://localhost:3000/sellers/all");  // Correct API if different
        const data = await response.json();

        if (data.success) {
            const buyerDropdown = document.getElementById("buyerDropdown");
            buyerDropdown.innerHTML = '<option value="">Select Your Buyer</option>'; // Reset dropdown

            data.sellers.forEach((buyer) => {
                const option = document.createElement("option");
                option.value = buyer.customer_id;  // Use customer_id as value
                option.textContent = `${buyer.client_name} , => ${buyer.city}`; // Display client_name
                buyerDropdown.appendChild(option);

                // Store buyer details in memory
                buyerDataMap[buyer.customer_id] = {
                    state: buyer.state,
                    city: buyer.city
                };
            });

            // Update state & city on buyer selection
            buyerDropdown.addEventListener("change", () => {
                updateStateAndCityForBuyer(buyerDropdown.value);
            });
        } else {
            console.error("Failed to fetch buyers:", data.message);
        }
    } catch (error) {
        console.error("Error fetching buyers:", error);
    }
}

// 📌 Update state & city for seller
async function updateStateAndCity(sellerId) {
    if (!sellerId || !sellerDataMap[sellerId]) return;

    const { state, city } = sellerDataMap[sellerId];
    await updateDropdowns("stateDropdown", "cityDropdown", state, city);
}

// 📌 Update state & city for buyer
async function updateStateAndCityForBuyer(buyerId) {
    if (!buyerId || !buyerDataMap[buyerId]) return;

    const { state, city } = buyerDataMap[buyerId];
    await updateDropdowns("buyerStateDropdown", "buyerCityDropdown", state, city);
}

// 📌 Generic function to update state & city dropdowns with retry mechanism
async function updateDropdowns(stateDropdownId, cityDropdownId, state, city) {
    const stateDropdown = document.getElementById(stateDropdownId);
    const cityDropdown = document.getElementById(cityDropdownId);

    if (!stateDropdown || !cityDropdown) return;

    // ✅ Select the state
    let matchedState = [...stateDropdown.options].find(opt => opt.value.toLowerCase() === state.toLowerCase());

    if (matchedState) {
        stateDropdown.value = matchedState.value;
        await updateCityDropdown(stateDropdownId, cityDropdownId); // Load cities first
    } else {
        console.warn(`⚠️ No matching state found for '${state}'.`);
        return;
    }

    // ✅ Retry mechanism to ensure city is selected after full population
    await waitForCityDropdownPopulation(cityDropdown, city);
}

// 📌 Retry mechanism with debounce for city selection
async function waitForCityDropdownPopulation(dropdown, city, maxRetries = 10, delay = 100) {
    let retries = 0;

    const trySelectingCity = () => {
        const matchedCity = [...dropdown.options].find(opt => opt.text.toLowerCase() === city.toLowerCase());
        if (matchedCity) {
            dropdown.value = matchedCity.value;
           // console.log(`✅ City selected: ${matchedCity.text}`);
            return true;
        }
        return false;
    };

    // Try selecting city with retries
    while (retries < maxRetries) {
        if (trySelectingCity()) return;  // Exit if city is found
        await new Promise(resolve => setTimeout(resolve, delay));  // Wait before next attempt
        retries++;
    }

    console.warn(`⚠️ Failed to select city '${city}' after ${maxRetries} retries.`);
}

// 📌 Update city dropdown based on state selection
async function updateCityDropdown(stateDropdownId, cityDropdownId) {
    const stateDropdown = document.getElementById(stateDropdownId);
    const cityDropdown = document.getElementById(cityDropdownId);

    if (!stateDropdown || !cityDropdown) return;

    const selectedState = stateDropdown.value.trim();
    cityDropdown.innerHTML = `<option value="">Select City</option>`;  // Reset

    if (!selectedState) return;

    try {
        const response = await fetch(`/city/state/${encodeURIComponent(selectedState)}`);
        const cities = await response.json();

        if (response.status === 404) {
            alert(`⚠️ No cities exist for the selected state: ${selectedState}`);
            return;
        }

        cities.forEach(city => {
            const option = document.createElement("option");
            option.value = city.city_name;
            option.textContent = city.city_name;
            cityDropdown.appendChild(option);
        });

    } catch (error) {
        console.error("🚨 Error fetching cities:", error);
    }
}

// 📌 Update seller dropdown based on city
async function updateSellerDropdown(cityDropdownId, sellerDropdownId) {
    const cityDropdown = document.getElementById(cityDropdownId);
    const sellerDropdown = document.getElementById(sellerDropdownId);

    if (!cityDropdown || !sellerDropdown) return;

    const selectedCity = cityDropdown.value.trim();
    sellerDropdown.innerHTML = `<option value="">Select Seller</option>`; // Reset

    if (!selectedCity) return;

    try {
        const response = await fetch(`/sellers/city/${encodeURIComponent(selectedCity)}`);
        const data = await response.json();
        const sellers = data.sellers || [];

        if (sellers.length === 0) return;

        sellers.forEach(seller => {
            const option = document.createElement("option");
            option.value = seller.customer_id;
            option.textContent = seller.client_name;
            sellerDropdown.appendChild(option);
        });

    } catch (error) {
        console.error("🚨 Error fetching sellers:", error);
    }
}

// 📌 Update buyer dropdown based on city
async function updateBuyerDropdown(cityDropdownId, buyerDropdownId) {
    const cityDropdown = document.getElementById(cityDropdownId);
    const buyerDropdown = document.getElementById(buyerDropdownId);

    if (!cityDropdown || !buyerDropdown) return;

    const selectedCity = cityDropdown.value.trim();
    buyerDropdown.innerHTML = `<option value="">Select Buyer</option>`; // Reset

    if (!selectedCity) return;

    try {
        const response = await fetch(`/buyers/city/${encodeURIComponent(selectedCity)}`);
        const data = await response.json();
        const buyers = data.buyers || [];

        if (buyers.length === 0) return;

        buyers.forEach(buyer => {
            const option = document.createElement("option");
            option.value = buyer.customer_id;
            option.textContent = buyer.client_name;
            buyerDropdown.appendChild(option);
        });

    } catch (error) {
        console.error("🚨 Error fetching buyers:", error);
    }
}

// 🎯 Event delegation for state & city change
document.body.addEventListener("change", (event) => {
    if (event.target.id === "stateDropdown") updateCityDropdown("stateDropdown", "cityDropdown");
    if (event.target.id === "buyerStateDropdown") updateCityDropdown("buyerStateDropdown", "buyerCityDropdown");
    if (event.target.id === "cityDropdown") updateSellerDropdown("cityDropdown", "sellerDropdown");
    if (event.target.id === "buyerCityDropdown") updateBuyerDropdown("buyerCityDropdown", "buyerDropdown");
});




 // 💰 Auto-calculate amount
 
    const packagingDropdown = document.getElementById("packagingDropdown");
    const sRateInput = document.getElementById("sellerPrice");  // Seller Rate
    const bRateInput = document.getElementById("buyerPrice");  // Buyer Rate
    const sQuantityInput = document.getElementById("sellerQuantity");  // Seller Quantity
    const bQuantityInput = document.getElementById("buyerQuantity");  // Buyer Quantity
    const sAmountInput = document.getElementById("sellerAmount");  // Seller Amount
    const bAmountInput = document.getElementById("buyerAmount");  // Buyer Amount

    function updateRates() {
        const packaging = packagingDropdown.value;
        if (packaging === "Katta") {
            sRateInput.value = 2;
            bRateInput.value = 1.5;
        } else if (packaging === "Bags") {
            sRateInput.value = 3;
            bRateInput.value = 2.5;
        }
        updateAmounts();  // Ensure amounts update on packaging change
    }

    function updateAmounts() {
        const sRate = parseFloat(sRateInput.value) || 0;
        const bRate = parseFloat(bRateInput.value) || 0;
        const quantity = parseFloat(sQuantityInput.value) || 0;
        const bqty = parseFloat(bQuantityInput.value) || 0;

        sAmountInput.value = (sRate * quantity).toFixed(2);
        bAmountInput.value = (bRate * bqty).toFixed(2);
    }

    function syncBuyerQuantity() {
        bQuantityInput.value = sQuantityInput.value;  // Sync buyer quantity
        updateAmounts();
    }

    // Initialize default values on page load
    updateRates();

    // Event Listeners
    packagingDropdown.addEventListener("change", updateRates);
    sQuantityInput.addEventListener("input", syncBuyerQuantity);
    sRateInput.addEventListener("input", updateAmounts);
    bRateInput.addEventListener("input", updateAmounts);
    bQuantityInput.addEventListener("input", updateAmounts);

    
    let isSubmitting = false;  // Submit lock flag
// 📝 Handle transaction form submission
async function submitTransactionForm() {
    //e.preventDefault();  // ✅ Use explicit event parameter
    event.preventDefault(); // Prevent default form submission

     // 🔒 Prevent multiple submissions
     if (isSubmitting) {
        console.warn("⚠️ Already submitting...");
        return;
    }
    isSubmitting = true;  // Set lock

    // 📅 Extract firmId & FY from URL
    const urlParams = new URLSearchParams(window.location.search);
    const firmId = urlParams.get("firmId");
    const fy = urlParams.get("fy"); 

    if (!firmId || !fy) {
        alert("❌ Missing Firm ID or Financial Year. Cannot submit transaction.");
        isSubmitting = false;  // Unlock
        return;
    }

    // 📥 Collect form data
    const transactionData = {
        sno: document.getElementById("sno")?.value || "",
        firm_id: firmId,       
        financial_year: fy,  
        seller_id: document.getElementById("sellerDropdown")?.value || "",
        buyer_id: document.getElementById("buyerDropdown")?.value || "",
        date: document.getElementById("date")?.value || "",
        item: document.getElementById("itemDropdown")?.value || "",
        packaging: document.getElementById("packagingDropdown")?.value || "",
        qty: document.getElementById("sellerQuantity")?.value || "",
        bqty: document.getElementById("buyerQuantity")?.value || "",
        bhav: document.getElementById("TRate")?.value || "",
        seller_rate: document.getElementById("sellerPrice")?.value || "",
        buyer_rate: document.getElementById("buyerPrice")?.value || "",
        seller_amount: "",
        buyer_amount: "",
        payment_status: "Pending",
    };

    // 🛑 Ensure required fields are filled
    if (!transactionData.seller_id || !transactionData.bhav || !transactionData.buyer_id || !transactionData.date || !transactionData.item || !transactionData.qty || !transactionData.seller_rate || !transactionData.buyer_rate) {
        alert("⚠️ Please fill in all required fields.");
        isSubmitting = false;  // Unlock
        return;
    }

    // 💰 Calculate Amounts
    transactionData.seller_amount = parseFloat(transactionData.qty) * parseFloat(transactionData.seller_rate);
    transactionData.buyer_amount = parseFloat(transactionData.bqty) * parseFloat(transactionData.buyer_rate);

    try {
        // 🔗 API Call
        const response = await fetch(`/transactions/${fy}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(transactionData),
        });
        // ✅ Check for Duplicate Transaction
        if (response.status === 409) {
            const data = await response.json();
            alert(`⚠️ Duplicate Transaction: ${data.message}`);
            console.warn("🚫 Duplicate Transaction:", data.message);
            return;
        }

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `Server responded with ${response.status}`);
        }

        alert("✅ Transaction saved successfully!");
      

        // ✅ **Reset only required fields**
        document.getElementById("sellerQuantity").value = "";
        document.getElementById("buyerQuantity").value = "";
        document.getElementById("date").value = "";
        document.getElementById("buyerDropdown").value = "";
        document.getElementById("sellerDropdown").value = "";
        document.getElementById("TRate").value = "";
        
        // Reset dropdowns
        ["packagingDropdown", "stateDropdown", "cityDropdown", "buyerStateDropdown", "buyerCityDropdown"].forEach(id => {
            document.getElementById(id).selectedIndex = 0;
        });

        updateRates();  // Reset rates & amounts
        fetchSno(); // Update transaction numbers
        document.getElementById("date").focus();
        loadBuyers();
        loadSellers();
        

    } catch (error) {
        console.error("🚨 Error submitting transaction:", error);
        alert(`❌ Failed to save transaction: ${error.message}`);
    }finally {
        isSubmitting = false;  // Unlock on completion (even on error)
    }
}

document.getElementById("transactionForm")?.addEventListener("submit", submitTransactionForm);




    // 📌 Modal Handling
    const v2FeatureTriggers = document.querySelectorAll(".v2FeatureTrigger");
    const dailySaudaModal = document.getElementById("dailySaudaModal");
    const closeModal12 = document.getElementById("closeModal1");

    v2FeatureTriggers.forEach(trigger => {
        trigger.addEventListener("click", () => dailySaudaModal.style.display = "flex");
    });

    closeModal12.addEventListener("click", () => dailySaudaModal.style.display = "none");

    window.addEventListener("click", (e) => {
        if (e.target === dailySaudaModal) dailySaudaModal.style.display = "none";
    });

    function selectDropdownByText(dropdownId, textToMatch) {
        const dropdown = document.getElementById(dropdownId);
        if (!dropdown) return;
    
        for (let option of dropdown.options) {
            if (option.textContent.trim().toLowerCase() === textToMatch.trim().toLowerCase()) {
                dropdown.value = option.value; // Select the option
                break; // Stop looping once found
            }
        }
    }

    document.getElementById("YourCustomers").addEventListener("click", function() {
        window.open("customers.html", "_blank");
      });
      document.getElementById("edit-txn").addEventListener("click", function() {
    
        window.open(`editTransactions.html?firmId=${firmId}&fy=${fy}`, "_blank");
    });
    
    

    document.getElementById("lastTransaction").onclick = async function () { 
        let sno = document.getElementById("sno").value - 1;
        let firm_id = firmId;
        let fy1 = fy;
    
        console.log(`/lastTransaction/details?sno=${sno}&fy=${fy1}&firm_id=${firm_id}`);
    
        try {
            const response = await fetch(`/lastTransaction/details?sno=${sno}&fy=${fy1}&firm_id=${firm_id}`);
            const data = await response.json();
    
            if (data.success) {
                const txn = data.transaction;

                // **Step 1: Set Seller State and Wait for City Update**
            document.getElementById("stateDropdown").value = txn.seller_state;
            await updateCityDropdown("stateDropdown", "cityDropdown");

            // **Step 2: Set Seller City and Wait for Seller Update**
            document.getElementById("cityDropdown").value = txn.seller_city;
            await updateSellerDropdown("cityDropdown", "sellerDropdown");

           

            // **Step 3: Set Buyer State and Wait for City Update**
            document.getElementById("buyerStateDropdown").value = txn.buyer_state;
            await updateCityDropdown("buyerStateDropdown", "buyerCityDropdown");

            // **Step 4: Set Buyer City and Wait for Buyer Update**
            document.getElementById("buyerCityDropdown").value = txn.buyer_city;
            await updateBuyerDropdown("buyerCityDropdown", "buyerDropdown");
    
                // ✅ **Use Function to Match Text Instead of IDs**
                selectDropdownByText("sellerDropdown", txn.seller_name);
                selectDropdownByText("buyerDropdown", txn.buyer_name);



    
                // ✅ **Set Other Fields**
                document.getElementById("date").value = txn.date;
                document.getElementById("itemDropdown").value = txn.item;
                document.getElementById("packagingDropdown").value = txn.packaging;
                document.getElementById("sellerQuantity").value = txn.qty;
                document.getElementById("buyerQuantity").value = txn.bqty;
                document.getElementById("TRate").value = txn.bhav;
                document.getElementById("sellerPrice").value = txn.seller_rate;
                document.getElementById("buyerPrice").value = txn.buyer_rate;
                document.getElementById("sellerAmount").value = txn.seller_amount;
                document.getElementById("buyerAmount").value = txn.buyer_amount;

                document.getElementById("date").focus();
            }
        } catch (error) {
            console.error("🚨 Error fetching transaction:", error);
        }
    };


    //new code
    const fields = ["date","sellerDropdown", "buyerDropdown", "sellerQuantity", "TRate",  "packagingDropdown" ,"submitbtn"];
    let currentIndex = 0;
    let dropdownOpened = false;
    let submitPressedOnce = false;

    function focusNextField() {
        currentIndex++;
        if (currentIndex < fields.length) {
            let nextField = document.getElementById(fields[currentIndex]);
            nextField.focus();
            dropdownOpened = false;
        }
    }

    document.addEventListener("keydown", function (event) {
        if (event.key === "Enter") {
            event.preventDefault();

            let currentField = document.getElementById(fields[currentIndex]);

            if (currentField.tagName === "SELECT") {
                if (!dropdownOpened) {
                    currentField.focus();
                    currentField.size = 10;
                    if (currentField.id === "buyerDropdown") {
                        currentField.classList.add("dropdown-up");
                    }
                    dropdownOpened = true;
                } else {
                    let selectedIndex = currentField.selectedIndex;
                    if (selectedIndex !== -1) {
                        dropdownOpened = false;
                        currentField.size = 1;
                        currentField.classList.remove("dropdown-up");
                        focusNextField();
                    }
                }
            } else if (currentField.id === "submitbtn") {
                if (!submitPressedOnce) {
                    submitPressedOnce = true;
                } else {
                    submitTransactionForm(); // Call the new function on second Enter
                    setTimeout(() => {
                        submitPressedOnce = false;
                        currentIndex = 0;
                        document.getElementById(fields[0]).focus();
                    }, 500);
                }
            } else {
                focusNextField();
            }
        }
    });

    // Dropdown auto-focus logic
    fields.forEach(id => {
        let field = document.getElementById(id);
        if (field && field.tagName === "SELECT") {
            field.addEventListener("change", function () {
                dropdownOpened = true;
            });

            field.addEventListener("blur", function () {
                dropdownOpened = false;
                field.size = 1;
                field.classList.remove("dropdown-up");
            });
        }
    });

    // Auto-detect last focused field
    fields.forEach((id, index) => {
        let field = document.getElementById(id);
        if (field) {
            field.addEventListener("focus", function () {
                currentIndex = index;
            });
        }
    });

    document.getElementById(fields[0]).focus();


     //open modal based on button footer button
     const modals = {
        addCity: document.getElementById("add-city-modal"),
        editCity: document.getElementById("edit-city-modal"),
        addCustomer: document.getElementById("add-customer-modal")
    };
  
    const openModal = (modalId) => {
        document.getElementById(modalId).style.display = "block";
    };
  
    const closeModal = (modalId) => {
        const modal = document.getElementById(modalId);
        modal.style.display = "none";
  
        // Clear all input fields within the modal
        const inputs = modal.querySelectorAll("input, select");
        inputs.forEach((input) => {
            if (input.tagName === "SELECT") {
                input.selectedIndex =
                    0; // Reset dropdown to the first option
            } else if (input.tagName === "INPUT") {
                input.value = ""; // Clear text fields
            }
        });
    };
  
    document.getElementById("add-city-btn").addEventListener("click",
        () => {
            closeModal("add-customer-modal");
            closeModal("edit-city-modal");
            openModal("add-city-modal");
        });
  
    document.getElementById("edit-city-btn").addEventListener("click",
        () => {
            openModal("edit-city-modal");
            closeModal("add-customer-modal");
            closeModal("add-city-modal");
  
        });
    document.getElementById("add-customer-btn").addEventListener(
        "click", () => {
            openModal("add-customer-modal");
            closeModal("edit-city-modal");
            closeModal("add-city-modal");
  
        });
  
    document.querySelectorAll(".modal-close").forEach((closeBtn) => {
        closeBtn.addEventListener("click", (e) => {
            const modalId = e.target.closest(".modal1")
                .id;
            closeModal(modalId);
        });

    });


    // saving new city
  
    document.getElementById("add-city-save").addEventListener("click",
        async () => {
            const state = document.getElementById(
                "add-city-state").value;
            const cityName = document.getElementById(
                    "add-city-name").value.trim()
                .toLowerCase(); // Normalize input
  
            if (!state || !cityName) {
                alert(
                    "Please fill in both the state and city name."
                    );
                return;
            }
  
            try {
                // Step 1: Check if the city already exists
                const checkResponse = await fetch(
                    `/city/check?city_name=${encodeURIComponent(cityName)}`
                );
                const checkData = await checkResponse.json();
  
                if (checkData.exists) {
                    alert(
                        `City already exists in ${checkData.state}. You can edit it in Edit City or add another name.`
                        );
                    return;
                }
  
                // Step 2: Add the city if it does not exist
                const saveResponse = await fetch('/city', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        state,
                        city_name: cityName
                    }),
                });
  
                if (saveResponse.ok) {
                    const saveData = await saveResponse.json();
                    alert(
                        `City added successfully with ID: ${saveData.cityId}`
                        );
                    closeModal("add-city-modal");
                } else {
                    const errorData = await saveResponse.json();
                    alert(
                        `Failed to add city: ${errorData.error}`
                        );
                }
            } catch (error) {
                console.error("Error handling city:", error);
                alert("An error occurred. Please try again.");
            }
        });
    // based on state render city list
    document.getElementById("edit-city-state").addEventListener(
        "change", async (e) => {
            const selectedState = e.target.value;
            const cityDropdown = document.getElementById(
                "edit-city-name");
            cityDropdown.innerHTML =
                ""; // Clear previous options
  
            try {
                const response = await fetch(
                    `/city/state/${selectedState}`);
                // Check for a 404 error and handle accordingly
                if (response.status === 404) {
                    alert(
                        "No cities found for the selected state."
                        );
                    return;
                }
  
                // Check for other errors (500, etc.)
                if (!response.ok) {
                    throw new Error('Failed to fetch cities.');
                }
  
                const cities = await response.json();
  
                cities.forEach(city => {
                    const option = document
                        .createElement("option");
                    option.value = city.city_id;
                    option.textContent = city.city_name;
                    cityDropdown.appendChild(option);
                });
            } catch (error) {
                console.error("Error fetching cities:", error);
                alert(
                    "Failed to fetch cities. Please try again."
                    );
            }
        });
    // editing saved city
    document.getElementById("edit-city-save").addEventListener("click",
        async () => {
            const cityId = document.getElementById(
                "edit-city-name").value;
            const newState = document.getElementById(
                "edit-city-new-state").value;
            const newCityName = document.getElementById(
                "edit-city-new-name").value.trim();
  
            if (!cityId || !newState || !newCityName) {
                alert("Please fill in all the fields.");
                return;
            }
  
            try {
                const response = await fetch('/city', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        city_id: cityId,
                        new_state: newState,
                        new_city_name: newCityName
                    }),
                });
  
                const result = await response.json();
  
                if (response.ok) {
                    alert(result.message);
                    closeModal("edit-city-modal");
                } else {
                    alert(
                        `Failed to update city: ${result.error}`
                        );
                }
            } catch (error) {
                console.error("Error updating city:", error);
                alert("An error occurred. Please try again.");
            }
        });


        //add customer modal
        // Event listener for state change to fetch cities
  document.getElementById('add-customer-state').addEventListener(
    'change', async (e) => {
        const selectedState = e.target.value;

        // Clear city dropdown
        const cityDropdown = document.getElementById(
            'add-customer-city');
        cityDropdown.innerHTML =
            '<option value="">Select your City</option>';

        if (!selectedState) {
            return; // Exit if no state is selected
        }

        try {
            const response = await fetch(
                `/city/state/${selectedState}`);
            if (response.status === 404) {
                alert(
                    "No cities found for the selected state."
                    );
                return;
            }

            // Check for other errors (500, etc.)
            if (!response.ok) {
                throw new Error('Failed to fetch cities.');
            }
            if (!response.ok) {
                throw new Error(
                    `Error: ${response.statusText}`);
            }

            const cities = await response.json();

            // Check if cities are available
            if (cities.length === 0) {
                alert(
                    'No cities found for the selected state.'
                    );
                return;
            }

            // Populate city dropdown
            cities.forEach((city) => {
                const option = document
                    .createElement('option');
                option.value = city.city_id; // Use city_id as the value
                option.textContent = city
                    .city_name; // Display city_name
                cityDropdown.appendChild(option);
            });
        } catch (error) {
            console.error('Error fetching cities:', error);
            alert(
                'Failed to fetch cities. Please try again.'
                );
        }
    });

// Event listener for "Save" button to add a customer
document.getElementById('add-customer-save').addEventListener(
    'click', async () => {
        const customerType = document.getElementById(
            'add-customer-type').value;
        const customerState = document.getElementById(
            'add-customer-state').value;

        const cityDropdown = document.getElementById(
            'add-customer-city');
        const customerCity = cityDropdown.options[
            cityDropdown.selectedIndex].text;
        if (customerCity === "Select your City" || !
            customerCity) {
            alert('Please select a valid city.');
            return;
        }
        if (customerState === "Select your State" || !
            customerState) {
            alert('Please select a valid State.');
            return;
        }
        const customerCityId = cityDropdown.options[cityDropdown.selectedIndex].value;


        const customerName = document.getElementById(
                'add-customer-name').value
            .trim() //.toLowerCase(); // Normalize to lowercase
        const customerContact = document.getElementById(
            'add-customer-contact').value.trim();
        const customerEmail = document.getElementById(
            'add-customer-email').value.trim();

        if (!customerType || !customerState || !
            customerCity || !customerName) {
            alert('Please fill out all required fields.');
            return;
        }

        const customerData = {
            category: customerType,
            client_name: customerName,
            contact: customerContact || null,
            email: customerEmail || null,
            state: customerState,
            city: customerCity,
            city_id: customerCityId,
        };

        try {
            const response = await fetch('/customers', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(customerData),
            });

            const result = await response.json();

            if (response.ok) {
                alert('Customer added successfully!');
                loadBuyers();
                loadSellers();
                document.getElementById('add-customer-type')
                    .value = '';
                document.getElementById(
                    'add-customer-state').value = '';
                cityDropdown.innerHTML =
                    '<option value="">Select a City</option>';
                document.getElementById('add-customer-name')
                    .value = '';
                document.getElementById(
                    'add-customer-contact').value = '';
                document.getElementById(
                    'add-customer-email').value = '';
                closeModal("add-customer-modal");
                //fetchCustomers();


            } else {
                alert(`Error: ${result.error}`);
            }
        } catch (error) {
            console.error('Error adding customer:', error);
            alert(
                'Failed to add customer. Please try again.'
                );
        }
    });
  

 
    
});


    









    