document.addEventListener("DOMContentLoaded", () => {
    // Check if the user is logged in
    fetch('/api/session')
        .then(response => response.json())
        .then(data => {
            if (!data.success || !data.user) {
                alert(
                    'You are not logged in. Redirecting to login page...'
                    );
                window.location.href =
                    '/index'; // Redirect to login page
            }
        })
        .catch(() => {
            alert(
                'You are not logged in. Redirecting to login page...'
                );
            window.location.href = '/index';
        });
  
    // Sidebar toggle functionality
    const openSidebar = document.getElementById("openSidebar");
    const closeSidebar = document.getElementById("closeSidebar");
    const sidebar = document.getElementById("sidebar");
  
    openSidebar.addEventListener("click", () => {
        sidebar.classList.add("open");
    });
  
    closeSidebar.addEventListener("click", () => {
        sidebar.classList.remove("open");
    });
  
    document.getElementById("logoutButton").addEventListener("click",
        () => {
            const confirmation = confirm(
                "Are you sure you want to log out?");
            if (confirmation) {
                fetch('/api/logout', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    })
                    .then(response => response.json())
                    .then(data => {
                        if (data.success) {
                            alert(data
                                .message
                                ); // Optionally, alert the user
                            window.location.href =
                                "../index.html"; // Redirect to login page
                        } else {
                            alert(
                                'Error logging out. Please try again.'
                                );
                        }
                    })
                    .catch(() => {
                        alert(
                            'Error logging out. Please try again.'
                            );
                    });
            } else {
                console.log("Logout cancelled.");
            }
        });
  
    document.getElementById("home").addEventListener("click", () => {
        if (confirm("Taking you to the home page?")) {
            window.location.href = "../home.html";
        }
    });
  
    
  
    //open modal based on button
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
            const modalId = e.target.closest(".modal")
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
  
    
  
  
  
    const v2FeatureTriggers = document.querySelectorAll(
        ".v2FeatureTrigger"
    ); // Select all elements with the class 'v2FeatureTrigger'
    const dailySaudaModal = document.getElementById("dailySaudaModal");
    const closeModal1 = document.getElementById("closeModal1");
  
    // Open modal on clicking any of the elements with the 'v2FeatureTrigger' class
    v2FeatureTriggers.forEach((trigger) => {
        trigger.addEventListener("click", () => {
            dailySaudaModal.style.display = "flex";
        });
    });
  
    // Close modal on clicking the close button
    closeModal1.addEventListener("click", () => {
        dailySaudaModal.style.display = "none";
    });
  
    // Close modal when clicking outside the modal content
    window.addEventListener("click", (e) => {
        if (e.target === dailySaudaModal) {
            dailySaudaModal.style.display = "none";
        }
    });
  });

 