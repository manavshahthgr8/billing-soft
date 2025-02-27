// JavaScript for Sidebar and Time Logic

// Live clock for Current Time
function updateTime() {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, "0");
    const minutes = now.getMinutes().toString().padStart(2, "0");
    const seconds = now.getSeconds().toString().padStart(2, "0");
    document.getElementById("currentTime").textContent = `${hours}:${minutes}:${seconds}`;
}
setInterval(updateTime, 1000);
updateTime();



// Sidebar logic
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


    const openSidebar = document.getElementById("openSidebar");
    const closeSidebar = document.getElementById("closeSidebar");
    const sidebar = document.getElementById("sidebar");

    openSidebar.addEventListener("click", () => {
        sidebar.classList.add("open");
    });

    closeSidebar.addEventListener("click", () => {
        sidebar.classList.remove("open");
    });

    // Logout button action
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

     // Fetch firms and financial years on modal open
     const API_URL = "http://localhost:3000"; // Update if hosted elsewhere

// Fetch firms and financial years on modal open
let currentAction = ""; // Stores which button was clicked

// ✅ Attach click event to both buttons
document.getElementById("createBillBtn").addEventListener("click", () => openModal("create"));
document.getElementById("viewTransactionsBtn").addEventListener("click", () => openModal("transactions"));
document.getElementById("PrintBillBtn").addEventListener("click", () => openModal("print"));

function openModal(action) {
    currentAction = action; // Store action type

    // Load dropdowns before showing modal
    loadFirms();
    loadFinancialYears();
    // Clear the password input field to prevent autofill
    document.getElementById("currentPassword").value = "";

    // Show modal
    document.getElementById("selectFirmFYModal").style.display = "flex";
}

// Fetch firms from API and populate dropdown
async function loadFirms() {
    try {
        const firmIds = [1, 2, 3]; // Replace with actual firm IDs
        const selectFirm = document.getElementById("selectFirm");
        selectFirm.innerHTML = `<option value="">-- Select Firm --</option>`;

        for (const firmId of firmIds) {
            const response = await fetch(`${API_URL}/api/firm/${firmId}`);
            if (!response.ok) continue;

            const { firm } = await response.json();
            if (!firm || !firm.firm_name) continue;

            const option = document.createElement("option");
            option.value = firm.firm_id;
            option.textContent = firm.firm_name;
            selectFirm.appendChild(option);
        }
    } catch (error) {
        console.error("❌ Error fetching firms:", error);
    }
}

// ✅ Fetch financial years and populate dropdown
async function loadFinancialYears() {
    try {
        const response = await fetch(`${API_URL}/financial-years`);
        if (!response.ok) throw new Error("Failed to fetch financial years");

        const years = await response.json();
        const selectFY = document.getElementById("selectFY");
        selectFY.innerHTML = `<option value="">-- Select FY --</option>`;

        years.forEach(year => {
            const option = document.createElement("option");
            option.value = year.startYear;
            option.textContent = `${year.startYear}-${year.startYear + 1}`;
            selectFY.appendChild(option);
        });
    } catch (error) {
        console.error("❌ Error fetching financial years:", error);
    }
}

// ✅ Handle form submission and redirect based on clicked button
document.getElementById("firmFyForm").addEventListener("submit", async (event) => {
    event.preventDefault();

    const firmId = document.getElementById("selectFirm").value;
    const fy = document.getElementById("selectFY").value;
    const password = document.getElementById("currentPassword").value;

    if (!firmId || !fy || !password) {
        alert("❌ Please fill all fields.");
        return;
    }

    try {
        const response = await fetch(`${API_URL}/api/account/check-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password })
        });

        const data = await response.json();
        if (response.ok) {
            // ✅ Redirect to correct page based on action
            if (currentAction === "create") {
                window.location.href = `internalpages/transactions.html?firmId=${firmId}&fy=${fy}`;
            } else if (currentAction === "transactions") {
                window.location.href = `internalpages/editTransactions.html?firmId=${firmId}&fy=${fy}`;
            } else if (currentAction === "print") {
                window.location.href = `internalpages/print.html?firmId=${firmId}&fy=${fy}`;
            }
        } else {
            alert("❌ Incorrect password.");
        }
    } catch (error) {
        console.error("❌ Error:", error);
        alert("An error occurred. Please try again.");
    }
});

// ✅ Close modal when cancel is clicked
document.getElementById("cancelFirmFY").addEventListener("click", () => {
    document.getElementById("selectFirmFYModal").style.display = "none";
});


    
});

// Select modal elements
document.addEventListener("DOMContentLoaded", () => {
    const v2FeatureTriggers = document.querySelectorAll(".v2FeatureTrigger"); // Select all elements with the class 'v2FeatureTrigger'
    const dailySaudaModal = document.getElementById("dailySaudaModal");
    const closeModal = document.getElementById("closeModal");

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




