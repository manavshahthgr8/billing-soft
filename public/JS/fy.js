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

    document.getElementById("home").addEventListener("click", () => {
        if (confirm("Taking you to the home page?")) {
            window.location.href = "../home.html";
        }
    });

    const API_URL = "http://localhost:3000"; // Change this if hosted elsewhere

// Fetch financial years from backend
async function fetchFinancialYears() {
    try {
        const response = await fetch(`${API_URL}/financial-years`);
        const data = await response.json();
        renderFinancialYears(data);
    } catch (error) {
        console.error("❌ Error fetching financial years:", error);
    }
}

// Render financial years in the UI
function renderFinancialYears(financialYears) {
    const listElement = document.getElementById("financialYearList");
    listElement.innerHTML = "";

    financialYears.forEach(({ startYear, endYear }) => {
        const listItem = document.createElement("li");
        listItem.className = "financial-year-item";
        listItem.innerHTML = `
            ${startYear}-${endYear}
            <button class="delete-btn" data-startYear="${startYear}">Delete</button>
        `;
        listElement.appendChild(listItem);
    });

    document.querySelectorAll(".delete-btn").forEach(button => {
        button.addEventListener("click", async (e) => {
            const startYear = e.target.getAttribute("data-startYear");
            deleteFinancialYear(startYear);
        });
    });
}

async function addFinancialYear(startYear) {
    try {
        const endYear = startYear + 1; // Calculate endYear
        const response = await fetch(`${API_URL}/financial-years`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ startYear, endYear }), // Send both startYear & endYear
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || "Failed to add financial year"); // Handle error properly
        }

        alert(`✅ ${startYear} + " created successfully . " ${result.message}`); // Success message
        fetchFinancialYears(); // Refresh FY list
    } catch (error) {
        alert(`❌ ${error.message}`); // Show correct error message
        console.error("❌ Error adding financial year:", error);
    }
}

async function deleteFinancialYear(startYear) {
    const modal = document.getElementById("delete_modal_fy");
    const message = document.getElementById("delete_fy_message");
    message.innerHTML = `⚠️ Do you really want to delete Financial Year <strong>${startYear}-${Number(startYear) + 1}</strong>?<br><br>🚨 All related billing records will also be deleted!`;

    modal.style.display = "block";

    document.getElementById("confirm_delete_fy").onclick = async () => {
        const password = document.getElementById("delete_fy_password").value;
        if (!password) {
            alert("❌ Password is required!");
            return;
        }

        try {
            const response = await fetch(`${API_URL}/api/account/check-password`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ password }),
            });

            const data = await response.json();

            if (!response.ok) {
                alert(data.message || "❌ Incorrect password.");
                return;
            }

            const deleteResponse = await fetch(`${API_URL}/financial-years/${startYear}`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
            });

            const deleteData = await deleteResponse.json();

            if (deleteResponse.ok) {
                alert("✅ Financial Year deleted successfully!");
                fetchFinancialYears(); // Refresh the list
            } else {
                alert(`❌ Error: ${deleteData.error}`);
            }
        } catch (error) {
            console.error("❌ Error deleting financial year:", error);
            alert("An error occurred. Please try again.");
        }

        modal.style.display = "none";
    };

    document.getElementById("cancel_delete_fy").onclick = () => {
        modal.style.display = "none";
    };

    document.querySelector("#delete_modal_fy .close-btn").onclick = () => {
        modal.style.display = "none";
    };
}

// Show modal for adding FY
document.getElementById("createFYBtn").addEventListener("click", () => {
    document.getElementById("startYear").value = "";
    document.getElementById("endYear").value = "";
    document.getElementById("financialYearModal").style.display = "flex";
setTimeout(() => {
    document.getElementById("startYear").focus();
}, 100); // Small delay

});

// Save financial year (calls `addFinancialYear`)
// Save financial year (calls `addFinancialYear`)
document.getElementById("saveFYBtn").addEventListener("click", async (event) => {
    event.preventDefault();
    
    const startYear = parseInt(document.getElementById("startYear").value, 10);
    const currentPassword = document.getElementById("currentPassword").value;

    if (isNaN(startYear)) {
        alert("❌ Please enter a valid start year.");
        return;
    }

    if (!currentPassword) {
        alert("❌ Please enter your current password.");
        return;
    }

    // Verify password with API
    try {
        const response = await fetch('/api/account/check-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password: currentPassword })
        });

        const data = await response.json();

        if (!response.ok) {
            alert(`❌ ${data.message || "Incorrect password"}`);
            return;
        }

        // If password is correct, proceed with adding financial year
        await addFinancialYear(startYear);
        document.getElementById("financialYearModal").style.display = "none";

    } catch (error) {
        console.error("❌ Error verifying password:", error);
        alert("An error occurred while verifying password. Please try again.");
    }
});

// Close modal
document.getElementById("cancelFYBtn").addEventListener("click", () => {
    document.getElementById("financialYearModal").style.display = "none";
});

// Auto-update end year when entering start year
document.getElementById("startYear").addEventListener("input", (e) => {
    const startYear = parseInt(e.target.value, 10);
    document.getElementById("endYear").value = isNaN(startYear) ? "" : startYear + 1;
});

// Fetch financial years on page load
window.onload = fetchFinancialYears;
    const v2FeatureTriggers = document.querySelectorAll(".v2FeatureTrigger"); // Select all elements with the class 'v2FeatureTrigger'
    const dailySaudaModal = document.getElementById("dailySaudaModal");
    const closeModal2 = document.getElementById("closeModal1");

    // Open modal on clicking any of the elements with the 'v2FeatureTrigger' class
    v2FeatureTriggers.forEach((trigger) => {
        trigger.addEventListener("click", () => {
            dailySaudaModal.style.display = "flex";
        });
    });

    // Close modal on clicking the close button
    closeModal2.addEventListener("click", () => {
        dailySaudaModal.style.display = "none";
    });

    // Close modal when clicking outside the modal content
    window.addEventListener("click", (e) => {
        if (e.target === dailySaudaModal) {
            dailySaudaModal.style.display = "none";
        }
    });
});
