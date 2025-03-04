document.addEventListener("DOMContentLoaded", () => {
    console.log("✅ DOM loaded. Initializing event listeners...");
    
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
                option.textContent = seller.client_name; // Display client_name
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

// 📌 Load all buyers (Similar to loadSellers)
async function loadBuyers() {
    try {
        const response = await fetch("http://localhost:3000/sellers/all");
        const data = await response.json();

        if (data.success) {
            const buyerDropdown = document.getElementById("buyerDropdown");
            buyerDropdown.innerHTML = '<option value="">Select Your Buyer</option>'; // Reset dropdown

            data.sellers.forEach((buyer) => {
                const option = document.createElement("option");
                option.value = buyer.customer_id;  // Use customer_id as value
                option.textContent = buyer.client_name; // Display client_name
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

// 📍 Update state & city when a seller is selected
async function updateStateAndCity(sellerId) {
    if (!sellerId || !sellerDataMap[sellerId]) return;

    const { state, city } = sellerDataMap[sellerId];
    await updateDropdowns("stateDropdown", "cityDropdown", state, city);
}

// 📍 Update state & city when a buyer is selected (Similar to updateStateAndCity)
async function updateStateAndCityForBuyer(buyerId) {
    if (!buyerId || !buyerDataMap[buyerId]) return;

    const { state, city } = buyerDataMap[buyerId];
    await updateDropdowns("buyerStateDropdown", "buyerCityDropdown", state, city);
}

// 📍 Generic function to update state & city dropdowns
async function updateDropdowns(stateDropdownId, cityDropdownId, state, city) {
    const stateDropdown = document.getElementById(stateDropdownId);
    const cityDropdown = document.getElementById(cityDropdownId);

    if (!stateDropdown || !cityDropdown) return;

    //console.log(`📌 Updating: ${stateDropdownId} → ${state}, ${cityDropdownId} → ${city}`);

    let matchedState = [...stateDropdown.options].find(opt => opt.value.toLowerCase() === state.toLowerCase());
    
    if (matchedState) {
        stateDropdown.value = matchedState.value;
       // console.log(`✅ State updated: ${matchedState.text} (${matchedState.value})`);
        await updateCityDropdown(stateDropdownId, cityDropdownId);
    } else {
        console.warn(`⚠️ No matching state found for '${state}'.`);
        return;
    }

    setTimeout(() => {
        let matchedCity = [...cityDropdown.options].find(opt => opt.text.toLowerCase() === city.toLowerCase());
        if (matchedCity) {
            cityDropdown.value = matchedCity.value;
           // console.log(`✅ City updated: ${matchedCity.text}`);
        } else {
            console.warn(`⚠️ No matching city found for '${city}'. Keeping default.`);
        }
    }, 500);
}

// 📍 Update city dropdown based on selected state
async function updateCityDropdown(stateDropdownId, cityDropdownId) {
    const stateDropdown = document.getElementById(stateDropdownId);
    const cityDropdown = document.getElementById(cityDropdownId);
    
    if (!stateDropdown || !cityDropdown) {
        console.error(`❌ Dropdowns not found: ${stateDropdownId}, ${cityDropdownId}`);
        return;
    }

    const selectedState = stateDropdown.value.trim();
    cityDropdown.innerHTML = `<option value="">Select City</option>`; // Reset city dropdown

    if (!selectedState) return;

    try {
        const response = await fetch(`/city/state/${encodeURIComponent(selectedState)}`);
        const cities = await response.json();
        if (response.status === 404) {
            alert(`⚠️ No cities exist in the database for the selected state: ${selectedState}`);
            console.warn(`⚠️ No cities found for ${selectedState}`);
            return;
        }
        
        if (!Array.isArray(cities) || cities.length === 0) return;

        cities.forEach(city => {
            cityDropdown.innerHTML += `<option value="${city.city_name}">${city.city_name}</option>`;
        });

    } catch (error) {
        console.error("🚨 Error fetching cities:", error);
    }
}

// 📍 Update seller dropdown based on selected city
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

// 📍 Update buyer dropdown based on selected city (Similar to sellers)
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

    

// 📝 Handle transaction form submission
async function submitTransactionForm() {
    event.preventDefault(); // Prevent default form submission

    // 📅 Extract firmId & FY from URL
    const urlParams = new URLSearchParams(window.location.search);
    const firmId = urlParams.get("firmId");
    const fy = urlParams.get("fy"); 

    if (!firmId || !fy) {
        alert("❌ Missing Firm ID or Financial Year. Cannot submit transaction.");
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

    } catch (error) {
        console.error("🚨 Error submitting transaction:", error);
        alert(`❌ Failed to save transaction: ${error.message}`);
    }
}

document.getElementById("transactionForm")?.addEventListener("submit", submitTransactionForm);




    // 📌 Modal Handling
    const v2FeatureTriggers = document.querySelectorAll(".v2FeatureTrigger");
    const dailySaudaModal = document.getElementById("dailySaudaModal");
    const closeModal = document.getElementById("closeModal1");

    v2FeatureTriggers.forEach(trigger => {
        trigger.addEventListener("click", () => dailySaudaModal.style.display = "flex");
    });

    closeModal.addEventListener("click", () => dailySaudaModal.style.display = "none");

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
            }
        } catch (error) {
            console.error("🚨 Error fetching transaction:", error);
        }
    };


    //new code
    const fields = ["sellerDropdown", "date", "packagingDropdown", "sellerQuantity", "TRate", "buyerDropdown", "submitbtn"];
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

 
    
});


    









    