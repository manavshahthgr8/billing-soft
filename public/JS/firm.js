document.addEventListener("DOMContentLoaded", () => {

    fetch('/api/session')
    .then(response => response.json())
    .then(data => {
        if (!data.success || !data.user) {
            alert('You are not logged in. Redirecting to login page...');
            window.location.href = '/index';  // Redirect to login page
        }
    })
    .catch(() => {
        alert('You are not logged in. Redirecting to login page...');
        window.location.href = '/index';
    });


// Fetch real data from the server (use your actual endpoint here)
const fetchFirmData = async (firmId) => {
    try {
        const response = await fetch(`/api/firm/${firmId}`);
        if (!response.ok) {
            throw new Error(`Failed to fetch firm details: ${response.statusText}`);
        }
        const data = await response.json();
        console.log("Fetched Firm Data:", data); // Log the response
        return data;  // Return the fetched firm data
    } catch (error) {
        console.error('Error fetching firm details:', error);
    }
};


const updateFirmDetails = async () => {
    // Loop through the different firm IDs (1, 2, 3 in your example)
    for (let firmId = 1; firmId <= 3; firmId++) {
        const firmData = await fetchFirmData(firmId);

        // Ensure firmData has a valid structure
        if (firmData && firmData.success && firmData.firm) {
            const firm = firmData.firm; // Extract the firm details from the response
            
            const firmDetailsContainer = document.getElementById(`firm-${firmId}-details`);
            
            if (firmDetailsContainer) {
                firmDetailsContainer.innerHTML = `
                    <div class="firm-info"><strong>Firm Name:</strong> ${firm.firm_name}</div>
                    <div class="firm-info"><strong>Account No:</strong> ${firm.account_no}</div>
                    <div class="firm-info"><strong>Mobile No:</strong> ${firm.mobile_no}</div>
                    <div class="firm-info"><strong>IFSC No:</strong> ${firm.ifsc_no}</div>
                    <div class="firm-info"><strong>PAN No:</strong> ${firm.pan_no}</div>
                    <div class="firm-info"><strong>Bank Name:</strong> ${firm.bank_name}</div>
                    <div class="firm-info"><strong>Address:</strong> ${firm.address}</div>
                    <div class="firm-info"><strong>Proprietor:</strong> ${firm.proprietor}</div>
                    <div class="firm-info"><strong>Email:</strong> ${firm.email}</div>
                    <div class="firm-info"><strong>Firm Id:</strong> ${firm.firm_id}</div>
                `;
            }
        } else {
            // Handle case if firmData is not in expected format
            console.error("Firm data is missing or incorrect for firmId:", firmId);
        }
    }
};

// Call the function to load the firm details when page is ready
updateFirmDetails();

    
const editButtons = document.querySelectorAll(".edit-firm");
const firmEditModal = document.getElementById("firmEditModal");
const closeModal = document.getElementById("closeModal1");
const saveChanges = document.getElementById("saveChanges");

// Function to fetch firm details based on firmId


// Open modal and pre-fill details when Edit button is clicked
editButtons.forEach((button) => {
    button.addEventListener("click", async () => {
        const firmId = button.dataset.firm;
        
        // Fetch firm data from the server
        const firmData = await fetchFirmData(firmId);

        if (firmData && firmData.success && firmData.firm) {
            const firm = firmData.firm;

            // Pre-fill the modal with the fetched data
            document.getElementById("firmName").value = firm.firm_name;
            document.getElementById("accountNo").value = firm.account_no;
            document.getElementById("ifscNo").value = firm.ifsc_no;
            document.getElementById("address").value = firm.address;
            document.getElementById("mobileNo").value = firm.mobile_no;
            document.getElementById("email").value = firm.email;
            document.getElementById("BankName").value = firm.bank_name;
            document.getElementById("ProName").value = firm.proprietor;
            document.getElementById("panNo").value = firm.pan_no;  // Handle optional GST field if it doesn't exist
            document.getElementById("currentPassword").value = "";

            // Store the firmId for later use
            firmEditModal.dataset.firmId = firmId;

            // Show modal
            firmEditModal.style.display = "flex";
        } else {
            alert("Error fetching firm data.");
        }
    });
});

// Close modal
closeModal.addEventListener("click", () => {
    firmEditModal.style.display = "none";
});

// Save changes
 



// Save changes
saveChanges.addEventListener("click", async () => {
    // Access the stored firm ID from the modal's dataset
    const firmId = firmEditModal.dataset.firmId;
    const firmName = document.getElementById("firmName").value;
    const accountNo = document.getElementById("accountNo").value;
    const ifscNo = document.getElementById("ifscNo").value;
    const address = document.getElementById("address").value;
    const mobileNo = document.getElementById("mobileNo").value;
    const email = document.getElementById("email").value;
    const panNo = document.getElementById("panNo").value;
    const BankName = document.getElementById("BankName").value;
    const ProName = document.getElementById("ProName").value;
    const currentPassword = document.getElementById("currentPassword").value;

    // Check for empty fields
    if (!currentPassword || !accountNo || !firmName || !ifscNo || !address || !mobileNo || !email || !panNo || !BankName || !ProName) {
        alert("All fields are required!");
        return;  // Stop if any field is empty
    }

    // Password Validation: Check if the entered password is correct
    try {
        const passwordResponse = await fetch('/api/account/check-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ password: currentPassword })
        });

        const passwordData = await passwordResponse.json();

        if (!passwordData.success) {
            alert("Incorrect current password.");
            return;
        }

        // Proceed to update firm details if password is correct
        const updatedFirmDetails = {
            firmName,
            accountNo,
            ifscNo,
            address,
            mobileNo,
            email,
            panNo,
            BankName,
            ProName
        };

        // Send the updated firm details to the backend for saving
        const response = await fetch(`/api/firmupdate/${firmId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updatedFirmDetails)
        });

        if (response.ok) {
            alert("Firm details saved successfully!");
            firmEditModal.style.display = "none"; // Close the modal after saving

            // Update the displayed user info (without reloading the page)
            updateFirmDetails();


        } else {
            alert("Error saving firm details.");
        }
    } catch (error) {
        console.error("Error saving firm details:", error);
        alert("An error occurred, please try again.");
    }
});



    // Home button action
    document.getElementById("home").addEventListener("click", () => {
        const confirmation = confirm("Taking you to home page?");
        if (confirmation) {
            alert("Home Page...");
            window.location.href = "../home.html"; // Redirect to home page
        } else {
            console.log("Query cancelled.");
        }
    });

    document.getElementById("logoutButton").addEventListener("click", () => {

        const confirmation = confirm("Are you sure you want to log out?");
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
                        alert(data.message); // Optionally, alert the user
                        window.location.href =  "../index.html"; // Redirect to login page
                    } else {
                        alert('Error logging out. Please try again.');
                    }
                })
                .catch(() => {
                    alert('Error logging out. Please try again.');
                });
            
        } else {
            console.log("Logout cancelled.");
        }
        
    });

    const openSidebar = document.getElementById("openSidebar");
    const closeSidebar = document.getElementById("closeSidebar");
    const sidebar = document.getElementById("sidebar");

    openSidebar.addEventListener("click", () => {
        sidebar.classList.add("open");
    });

    closeSidebar.addEventListener("click", () => {
        sidebar.classList.remove("open");
    });





});
// Select modal elements
document.addEventListener("DOMContentLoaded", () => {
    const v2FeatureTriggers = document.querySelectorAll(".v2FeatureTrigger"); // Select all elements with the class 'v2FeatureTrigger'
    const dailySaudaModal = document.getElementById("dailySaudaModal");
    const closeModal = document.getElementById("closeModal2");
    

    // Open modal on clicking any of the elements with the 'v2FeatureTrigger' class
    v2FeatureTriggers.forEach((trigger) => {
        trigger.addEventListener("click", () => {
            dailySaudaModal.style.display = "flex";
        });
    });

    // Close modal on clicking the close button
    closeModal.addEventListener("click", () => {
        dailySaudaModal.style.display = "none";
    });

    // Close modal when clicking outside the modal content
    window.addEventListener("click", (e) => {
        if (e.target === dailySaudaModal) {
            dailySaudaModal.style.display = "none";
        }
    });
});

