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


    const backupContainer = document.getElementById("backupContainer");

    

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

    // Sample data to simulate stored FYs
    const storedFinancialYears = [
        { year: "2024-2025", firms: ["Firm 1", "Firm 2", "Firm 3"] },
        { year: "2023-2024", firms: ["Firm 1", "Firm 2", "Firm 3"] },
        { year: "2022-2023", firms: ["Firm 1", "Firm 2", "Firm 3"] },
        
    ];

    // Function to render stored FYs
    function renderStoredFinancialYears() {
        backupContainer.innerHTML = ""; // Clear existing content

        storedFinancialYears.forEach(({ year, firms }) => {
            const financialYearSection = document.createElement("div");
            financialYearSection.classList.add("financial-year-section");

            financialYearSection.innerHTML = `
                <h4>Financial Year: ${year}</h4>
                <div class="backup-options">
                    ${firms
                        .map(
                            (firm) => `
                        <div class="firm-backup">
                            ${firm}
                            <button class="backup-btn excel-btn">Excel</button>
                            <button class="backup-btn database-btn">Database</button>
                            <button class="backup-btn pdf-btn">PDF</button>
                        </div>
                    `
                        )
                        .join("")}
                </div>
            `;

            backupContainer.appendChild(financialYearSection);
        });
    }

    // Initial render of stored FYs
    renderStoredFinancialYears();

    const v2FeatureTriggers = document.querySelectorAll(".v2FeatureTrigger"); // Select all elements with the class 'v2FeatureTrigger'
    const dailySaudaModal = document.getElementById("dailySaudaModal");
    const closeModal = document.getElementById("closeModal1");

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
    

