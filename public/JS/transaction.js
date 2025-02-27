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
            document.getElementById("sno").value = newSno;  // Update the S.No field
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
document.getElementById("transactionForm")?.addEventListener("submit", async (event) => {
    event.preventDefault();

    // 📅 Extract firmId & FY from URL
    const urlParams = new URLSearchParams(window.location.search);
    const firmId = urlParams.get("firmId");
    const fy = urlParams.get("fy");  // ⚠️ Keep as string to match URL pattern

    if (!firmId || !fy) {
        alert("❌ Missing Firm ID or Financial Year. Cannot submit transaction.");
        return;
    }

    // 📥 Collect form data
    const transactionData = {
        sno: document.getElementById("sno")?.value || "",
        firm_id: firmId,       
        financial_year: fy,  // ✅ New field added
        seller_id: document.getElementById("sellerDropdown")?.value || "",
        buyer_id: document.getElementById("buyerDropdown")?.value || "",
        date: document.getElementById("date")?.value || "",
        item: document.getElementById("itemDropdown")?.value || "",
        packaging: document.getElementById("packagingDropdown")?.value || "",  // ✅ New field added
        qty: document.getElementById("sellerQuantity")?.value || "",
        bqty: document.getElementById("buyerQuantity")?.value || "",  // ✅ New field added
        bhav: document.getElementById("TRate")?.value || "",  // ✅ New field added
        seller_rate: document.getElementById("sellerPrice")?.value || "",  // ✅ New field added
        buyer_rate: document.getElementById("buyerPrice")?.value || "",  // ✅ New field added
        seller_amount: "",  // Will be calculated
        buyer_amount: "",  // Will be calculated
        payment_status: "Pending",  // ⚠️ Set default for now (update later if needed)
    };
    //console.log("firm id:", transactionData.firm_id);
    //console.log("FY:", transactionData.financial_year);
    //console.log("seller_id:", transactionData.seller_id); done
    //console.log("Date:", transactionData.date); done
    //console.log("item:", transactionData.item);
    //console.log("qty:", transactionData.qty);
    //console.log("seller_rate:", transactionData.seller_rate);
    //console.log("buyer_rate:", transactionData.buyer_rate);

    // 🛑 Ensure required fields are filled
    if (!transactionData.seller_id || !transactionData.bhav || !transactionData.buyer_id || !transactionData.date || !transactionData.item || !transactionData.qty || !transactionData.seller_rate || !transactionData.buyer_rate) {
        alert("⚠️ Please fill in all required fields (Seller, Buyer, Item, Quantity, Seller Rate, Buyer Rate , Bhav).");
        return;
    }

    // 💰 Calculate Seller & Buyer Amounts
    transactionData.seller_amount = parseFloat(transactionData.qty) * parseFloat(transactionData.seller_rate);
    transactionData.buyer_amount = parseFloat(transactionData.bqty) * parseFloat(transactionData.buyer_rate);

   // console.log("📝 Sending Transaction Data:", transactionData);  // Debugging

    try {
        // 🔗 API Call (Corrected URL with `fy`)
        const response = await fetch(`/transactions/${fy}`, {  // ✅ Fix: Added fy in URL
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(transactionData),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `Server responded with ${response.status}`);
        }

        alert("✅ Transaction saved successfully!");

        // ✅ **Clear only temporary fields (keep firm & FY)**
        document.getElementById("sellerQuantity").value = "";
        document.getElementById("buyerQuantity").value = "";
        //document.getElementById("sellerRate").value = "";
        //document.getElementById("buyerRate").value = "";
        document.getElementById("date").value = "";

        // ✅ **Keep dropdowns same, just reset selection**
        document.getElementById("buyerDropdown").value = "";
        document.getElementById("sellerDropdown").value = "";
        document.getElementById("TRate").value = "";
        
        // Reset dropdowns
        document.getElementById("packagingDropdown").selectedIndex = 0; // Selects the first option in the dropdown
        document.getElementById("stateDropdown").selectedIndex = 0; // Selects the first option in the dropdown
        document.getElementById("cityDropdown").selectedIndex = 0; // Selects the first option in the dropdown
        document.getElementById("buyerStateDropdown").selectedIndex = 0; // Selects the first option in the dropdown
        document.getElementById("buyerCityDropdown").selectedIndex = 0; // Selects the first option in the dropdown

        document.getElementById("packagingDropdown").selectedIndex = 0; // Selects the first option in the dropdown

        document.getElementById("sellerDropdown").selectedIndex = 0;// = '<option value="">Select Your Seller</option>';
        document.getElementById("buyerDropdown").selectedIndex = 0;//.innerHTML = '<option value="">Select Your Buyer</option>';
        // Reload sellers
       // loadSellers();
        //loadBuyers();
       // document.getElementById("packagingDropdown").innerHTML = '<option value="">Katta</option>';
        updateRates();  // Reset rates & amounts
        fetchSno();
    } catch (error) {
        console.error("🚨 Error submitting transaction:", error);
        alert(`❌ Failed to save transaction: ${error.message}`);
    }
});



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
});
