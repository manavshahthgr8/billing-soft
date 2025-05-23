//js Code for new transaction page

//fUNCTIONS 
    // 🌐 Global Variables Section
    const billingTypedropSelect = document.getElementById("billingType");
    const billingTypeSelect = document.getElementById("billingType");
    const radioButtons = document.querySelectorAll('input[name="unitStatus"]');
    const urlParams = new URLSearchParams(window.location.search);
    const firmId = urlParams.get("firmId");
    const fy = parseInt(urlParams.get("fy"));
    const fyDisplay = `${fy} - ${fy + 1}`;
    const sellerDataMap = {}; // Stores seller details in memory
	let buyerDataMap = {}; // Stores buyer details in memory

    // Shared DOM references
    const firmIdInput = document.getElementById("firmId");
    const firmNameInput = document.getElementById("firmNameInput");
    const financialYearInput = document.getElementById("financialYear");
    const fySpan = document.getElementById("fy");
    const firmNameSpan = document.getElementById("firmName");

    // 🧩 Function to set values from URL
    function loadDetailsFromURL() {

        if (firmIdInput) firmIdInput.value = firmId;
        if (financialYearInput) financialYearInput.value = fy;
        if (fySpan) fySpan.textContent = fyDisplay;

        // 🌟 Store initial values for reset
        window.initialValues = {
            firmId: firmIdInput?.value || "",
            firmName: "",
            financialYear: financialYearInput?.value || "",
        };
    }


    function ApplyDefaultSetting() {

         // Fetch and apply default setting
         fetch("/api/settings/1")
         .then(res => res.json())
         .then(data => {
             const defaultVal = data.value;

             // Set dropdown
             billingTypeSelect.value = defaultVal;

             // Set radio button
             const matchingRadio = document.querySelector(`input[name="unitStatus"][value="${defaultVal}"]`);
             if (matchingRadio) matchingRadio.checked = true;

             // Apply layout toggle
             updateBillingSections();
         })
         .catch(err => {
             console.error("❌ Failed to load default billing setting:", err);
         });

    }

    function updateBillingSections() {
        const selected = billingTypedropSelect.value;

        const quintalGroups = document.querySelectorAll(".billing-by-quintal");
        const bagsGroups = document.querySelectorAll(".billing-by-bags");

        // Hide all first
        quintalGroups.forEach(el => el.classList.add("hidden"));
        bagsGroups.forEach(el => el.classList.add("hidden"));

        // Show based on selection
        if (selected === "0") {
            quintalGroups.forEach(el => el.classList.remove("hidden"));
        } else if (selected === "1") {
            bagsGroups.forEach(el => el.classList.remove("hidden"));
        } else if (selected === "2") {
            quintalGroups.forEach(el => el.classList.remove("hidden"));
            bagsGroups.forEach(el => el.classList.remove("hidden"));
        }
    }

    async function fetchcityall(){
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
    }


    // 🧩 Function: Setup basic page elements, logo, nav, session check
function setupPageBasics() {
	// 🔖 Set firm logo based on firmId
	const firmLogos = {
		"1": "../images/B%26B.png",
		"2": "../images/PKC.png",
		"3": "../images/MB.png"
	};
	const logoSrc = firmLogos[firmId] || "logos/default.png";
	document.getElementById("firmLogo").src = logoSrc;

	//🔐 Session Check: Redirect if not logged in
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

async function fetchSno() {
    const firmId1 = firmId; // Replace with actual method to get firm_id
    const financialYear1 = fy; // Replace with actual method to get FY

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
            document.getElementById("sno").value = newSno; // Update the S.No field
            document.getElementById("date").value = lastDate; // Update the Date field
        } else {
            console.error("❌ Error fetching S.No:", data.error);
        }
    } catch (error) {
        console.error("❌ Network error:", error);
    }
}


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
                option.value = seller.customer_id; // Use customer_id as value
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
        const response = await fetch("http://localhost:3000/sellers/all"); // Correct API if different
        const data = await response.json();

        if (data.success) {
            const buyerDropdown = document.getElementById("buyerDropdown");
            buyerDropdown.innerHTML = '<option value="">Select Your Buyer</option>'; // Reset dropdown

            data.sellers.forEach((buyer) => {
                const option = document.createElement("option");
                option.value = buyer.customer_id; // Use customer_id as value
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

    const {
        state,
        city
    } = sellerDataMap[sellerId];
    await updateDropdowns("stateDropdown", "cityDropdown", state, city);
}

// 📌 Update state & city for buyer
async function updateStateAndCityForBuyer(buyerId) {
    if (!buyerId || !buyerDataMap[buyerId]) return;

    const {
        state,
        city
    } = buyerDataMap[buyerId];
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
        if (trySelectingCity()) return; // Exit if city is found
        await new Promise(resolve => setTimeout(resolve, delay)); // Wait before next attempt
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
    cityDropdown.innerHTML = `<option value="">Select City</option>`; // Reset

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
//DomContent loaded  & Event Listeners


document.addEventListener("DOMContentLoaded", async () => {
    console.log("✅ DOM loaded. Initializing event listeners...");
    ApplyDefaultSetting(); // Load default setting on page load
    // Store the currently selected radio value before any change
    const previousValue = document.querySelector('input[name="unitStatus"]:checked').value;        
    // On radio change event (default panel)
    radioButtons.forEach(radio => {
        radio.addEventListener("change", (e) => {
            // Ask for confirmation
            const confirmed = confirm(
                "Do you want to update the default billing setting?\n\n" +
                "Click OK to save and reload.\nClick Cancel to discard."
            );

            if (confirmed) {
                const newVal = e.target.value;
                // Update dropdown immediately
                billingTypeSelect.value = newVal;
                updateBillingSections();

                fetch("/api/settings/1", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            value: newVal
                        }),
                    })
                    .then(res => res.json())
                    .then(() => {
                        alert("✅ Default updated. Reloading...");
                        location.reload();
                    })
                    .catch(err => {
                        console.error("❌ Failed to save setting:", err);
                        alert("❌ Update failed.");
                    });
            } else {
                // If user cancels, revert the radio button to the previous state
                document.querySelector(`input[name="unitStatus"][value="${previousValue}"]`).checked = true;
            }
        });
    });
    // On dropdown change
    billingTypedropSelect.addEventListener("change", updateBillingSections);
    updateBillingSections();
                                    
    // Load all cities
    await fetchcityall();
    loadDetailsFromURL(); // Load details from URL
    //Now updatig dropdown for layout auto filling
	await loadSellers();
	loadBuyers();
	fetchSno();
    setupPageBasics(); // Setup page basics
	fetchFirmDetails();

	

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

	// 🎯 Event delegation for state & city change
	document.body.addEventListener("change", (event) => {
		if (event.target.id === "stateDropdown") updateCityDropdown("stateDropdown", "cityDropdown");
		if (event.target.id === "buyerStateDropdown") updateCityDropdown("buyerStateDropdown", "buyerCityDropdown");
		if (event.target.id === "cityDropdown") updateSellerDropdown("cityDropdown", "sellerDropdown");
		if (event.target.id === "buyerCityDropdown") updateBuyerDropdown("buyerCityDropdown", "buyerDropdown");
	});

	// 💰 Auto-calculate amount

	const packagingDropdown = document.getElementById("packagingDropdown");
	const sRateInput = document.getElementById("sellerPrice"); // Seller Rate for packaging
	const bRateInput = document.getElementById("buyerPrice"); // Buyer Rate  for packaging
	const sQuantityInput = document.getElementById("sellerQuantity"); // Seller Quantity  for packaging
	const bQuantityInput = document.getElementById("buyerQuantity"); // Buyer Quantity  for packaging
	const sAmountInput = document.getElementById("sellerAmount"); // Seller Amount  for packaging
	const bAmountInput = document.getElementById("buyerAmount"); // Buyer Amount  for packaging

    const SeQintQuant = document.getElementById("sQuintQuantity"); // Seller Quintal Quantity  for Quintal
    const BeQintQuant = document.getElementById("bQuintQuantity"); // Buyer Quintal Quantity  for Quintal
    const SeQintRate = document.getElementById("sQuintRate"); // Seller Quintal Rate  for Quintal
    const BeQintRate = document.getElementById("bQuintRate"); // Buyer Quintal Rate  for Quintal
    const SeQintAmount = document.getElementById("sQuintAmount"); // Seller Quintal Amount  for Quintal
    const BeQintAmount = document.getElementById("bQuintAmount"); // Buyer Quintal Amount  for Quintal

	function updateRates() {
		const packaging = packagingDropdown.value;
		if (packaging === "Katta") {
			sRateInput.value = 2;
			bRateInput.value = 1.5;
		} else if (packaging === "Bags") {
			sRateInput.value = 3;
			bRateInput.value = 2.5;
		}
		updateAmounts(); // Ensure amounts update on packaging change
	}

	function updateAmounts() {
		const sRate = parseFloat(sRateInput.value) || 0;
		const bRate = parseFloat(bRateInput.value) || 0;
		const quantity = parseFloat(sQuantityInput.value) || 0;
		const bqty = parseFloat(bQuantityInput.value) || 0;

        const sQuintRate = parseFloat(SeQintRate.value) || 0;
        const bQuintRate = parseFloat(BeQintRate.value) || 0;
        const squintQuant = parseFloat(SeQintQuant.value) || 0;
        const bQuintQuant = parseFloat(BeQintQuant.value) || 0;

		sAmountInput.value = (sRate * quantity).toFixed(2);
		bAmountInput.value = (bRate * bqty).toFixed(2);
        SeQintAmount.value = (sQuintRate * squintQuant).toFixed(2);
        BeQintAmount.value = (bQuintQuant * bQuintRate).toFixed(2);
	}

	function syncBuyerQuantity() {
		bQuantityInput.value = sQuantityInput.value; // Sync buyer quantity
        BeQintQuant.value = SeQintQuant.value;
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

    SeQintQuant.addEventListener("input", syncBuyerQuantity);
    BeQintQuant.addEventListener("input", updateAmounts);
    SeQintRate.addEventListener("input", updateAmounts);
    BeQintRate.addEventListener("input", updateAmounts);


	let isSubmitting = false; // Submit lock flag
	// 📝 Handle transaction form submission
	async function submitTransactionForm() {
		//e.preventDefault();  // ✅ Use explicit event parameter
		event.preventDefault(); // Prevent default form submission

		// 🔒 Prevent multiple submissions
		if (isSubmitting) {
			console.warn("⚠️ Already submitting...");
			return;
		}
		isSubmitting = true; // Set lock
		if (!firmId || !fy) {
			alert("❌ Missing Firm ID or Financial Year. Cannot submit transaction.");
			isSubmitting = false; // Unlock
			return;
		}

		// 📥 Collect form data
		const transactionData = {
			//basics
			sno: document.getElementById("sno")?.value || "",
			firm_id: firmId,
			financial_year: fy,
			date: document.getElementById("date")?.value || "",

			//seller & buyer details
			seller_id: document.getElementById("sellerDropdown")?.value || "",
			buyer_id: document.getElementById("buyerDropdown")?.value || "",			
			item: document.getElementById("itemDropdown")?.value || "",
			bhav: document.getElementById("TRate")?.value || "",
			payment_status: "Pending",

			//packaging based data
			packaging: document.getElementById("packagingDropdown")?.value || "",
			qty: document.getElementById("sellerQuantity")?.value || "", //seller qty
			bqty: document.getElementById("buyerQuantity")?.value || "", //buyer qty			
			seller_rate: document.getElementById("sellerPrice")?.value || "",
			buyer_rate: document.getElementById("buyerPrice")?.value || "",
			seller_amount: "",
			buyer_amount: "",

			//Quintal based data
			S_QuintQty: document.getElementById("sQuintQuantity")?.value || "",
			B_QuintQty: document.getElementById("bQuintQuantity")?.value || "",
			S_QuintRate: document.getElementById("sQuintRate")?.value || "",
			B_QuintRate: document.getElementById("bQuintRate")?.value || "",
			S_QuintAmount: "",
			B_QuintAmount: "",
			
		};

		// 🛑 Validate required fields
		const submitType = document.getElementById("billingType").value;
		if (submitType === "0") { // Quintal based submission
			// 🛑 Ensure required fields are filled
			if (!transactionData.seller_id || !transactionData.bhav || !transactionData.buyer_id || !transactionData.date || !transactionData.item || !transactionData.S_QuintQty || !transactionData.S_QuintRate || !transactionData.B_QuintQty || !transactionData.B_QuintRate) {
				alert("⚠️ Please fill in all required fields. \n Your Bill Type: By Quintal");
				isSubmitting = false; // Unlock
				return;
			}
			transactionData.qty = 0; 
			transactionData.bqty = 0; 
			
		}else if (submitType === "1") { // Bags based submission
			// 🛑 Ensure required fields are filled
			if (!transactionData.seller_id || !transactionData.bhav || !transactionData.buyer_id || !transactionData.date || !transactionData.item || !transactionData.qty || !transactionData.bqty || !transactionData.seller_rate || !transactionData.buyer_rate) {
				alert("⚠️ Please fill in all required fields. \n Your Bill Type: By Bori");
				isSubmitting = false; // Unlock
				return;
			}
			transactionData.S_QuintQty = 0;
			transactionData.B_QuintQty = 0;
		}else if (submitType === "2") { // Both types submission
			// 🛑 Ensure required fields are filled
		if (!transactionData.seller_id || !transactionData.bhav || !transactionData.buyer_id || !transactionData.date || !transactionData.item || !transactionData.qty || !transactionData.seller_rate || !transactionData.buyer_rate || !transactionData.S_QuintQty || !transactionData.S_QuintRate || !transactionData.B_QuintQty || !transactionData.B_QuintRate) {
			alert("⚠️ Please fill in all required fields. \n Your Bill Type: Both (Quintal & Bori )");
			isSubmitting = false; // Unlock
			return;
		}
		}else{
			alert("System got issue : ❌ Invalid billing type selected. Contact Manav");
			isSubmitting = false; // Unlock
			return;
		}

		
		// 💰 Safely calculate numeric values
const num = (val) => parseFloat(val) || 0;

transactionData.seller_amount = num(transactionData.qty) * num(transactionData.seller_rate);
transactionData.buyer_amount = num(transactionData.bqty) * num(transactionData.buyer_rate);
transactionData.S_QuintAmount = num(transactionData.S_QuintQty) * num(transactionData.S_QuintRate);
transactionData.B_QuintAmount = num(transactionData.B_QuintQty) * num(transactionData.B_QuintRate);

// Default billing flags for new transaction
transactionData.Seller_Billed = "Not";
transactionData.Buyer_Billed = "Not";

try {
    // 🔗 Submit transaction to API
    const response = await fetch(`/transactions/${fy}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(transactionData),
    });

    // 🔁 Handle duplicate
    if (response.status === 409) {
        const data = await response.json();
        alert(`⚠️ Duplicate Transaction: ${data.message}`);
        console.warn("🚫 Duplicate Transaction:", data.message);
        return;
    }

    // ❌ Handle other errors
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Server responded with ${response.status}`);
    }

    alert("✅ Transaction saved successfully!");

    // 🔄 Reset only required fields
    ["sellerQuantity", "buyerQuantity", "date", "buyerDropdown", "sellerDropdown", "TRate" , "sQuintQuantity" , "bQuintQuantity"].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = "";
    });

    // Reset dropdowns to default
    ["packagingDropdown", "stateDropdown", "cityDropdown", "buyerStateDropdown", "buyerCityDropdown"].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.selectedIndex = 0;
    });

    updateRates();     // Recalculate totals
    fetchSno();        // Get new SNO
    document.getElementById("date").focus();
    loadBuyers();
    loadSellers();

} catch (error) {
    console.error("🚨 Error submitting transaction:", error);
    alert(`❌ Failed to save transaction: ${error.message}`);
} finally {
    isSubmitting = false;
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



	document.getElementById("lastTransaction").onclick = async function() {
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
				document.getElementById("sQuintQuantity").value = txn.S_QuintQty;
				document.getElementById("bQuintQuantity").value = txn.B_QuintQty;
				document.getElementById("sQuintRate").value = txn.S_QuintRate;
				document.getElementById("bQuintRate").value = txn.B_QuintRate;
				document.getElementById("sQuintAmount").value = txn.S_QuintAmount;
				document.getElementById("bQuintAmount").value = txn.B_QuintAmount;

				document.getElementById("date").focus();
			}
		} catch (error) {
			console.error("🚨 Error fetching transaction:", error);
		}
	};


	//new code
	const allFields = [
		"date", "sellerDropdown", "buyerDropdown", "itemDropdown",
		"TRate", "sellerQuantity", "packagingDropdown", "sQuintQuantity", "submitbtn"
	];
	
	let currentIndex = 0;
	let dropdownOpened = false;
	let submitPressedOnce = false;
	
	// billingTypeSelect = 0 
	// billingTypeSelect = 1 
	let billingTypeSelect1 = parseInt(document.getElementById("billingType").value);

document.getElementById("billingType").addEventListener("change", function () {
	billingTypeSelect1 = parseInt(this.value);
	currentIndex = 0; // Optional: reset form flow
	document.getElementById(getFieldsByBillingType()[0]).focus();
});

	function getFieldsByBillingType() {
		if (billingTypeSelect1 === 0) {
			//console.log("Billing Type: By Quintal");
			return allFields.filter(id => !["sellerQuantity", "packagingDropdown"].includes(id));
		} else if (billingTypeSelect1 === 1) {
			return allFields.filter(id => ![ "sQuintQuantity"].includes(id));
		}
		return allFields;
	}
	
	function focusNextField() {
		const fields = getFieldsByBillingType();
		currentIndex++;
		if (currentIndex < fields.length) {
			let nextField = document.getElementById(fields[currentIndex]);
			if (nextField) {
				nextField.focus();
				dropdownOpened = false;
			}
		}
	}
	
	document.addEventListener("keydown", function(event) {
		if (event.key === "Enter") {
			event.preventDefault();
			const fields = getFieldsByBillingType();
			let currentField = document.getElementById(fields[currentIndex]);
	
			if (!currentField) return;
	
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
					submitTransactionForm(); // Call your submit logic
					setTimeout(() => {
						submitPressedOnce = false;
						currentIndex = 0;
						document.getElementById(getFieldsByBillingType()[0]).focus();
					}, 500);
				}
			} else {
				focusNextField();
			}
		}
	});
	
	// Setup dropdown behavior
	allFields.forEach(id => {
		let field = document.getElementById(id);
		if (field && field.tagName === "SELECT") {
			field.addEventListener("change", function() {
				dropdownOpened = true;
			});
	
			field.addEventListener("blur", function() {
				setTimeout(() => {
					dropdownOpened = false;
					field.size = 1;
					field.classList.remove("dropdown-up");
				}, 100);
			});
		}
	});
	
	// Track focus for accurate currentIndex
	allFields.forEach((id, index) => {
		let field = document.getElementById(id);
		if (field) {
			field.addEventListener("focus", function() {
				const currentFields = getFieldsByBillingType();
				let i = currentFields.indexOf(id);
				if (i !== -1) currentIndex = i;
			});
		}
	});
	
	// Initial focus
	document.getElementById(getFieldsByBillingType()[0]).focus();
	


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