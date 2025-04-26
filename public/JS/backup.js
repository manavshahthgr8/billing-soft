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


   // const backupContainer = document.getElementById("backupContainer");

    

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

    document.getElementById("fullSoftwareBackup").addEventListener("click", () => {
        if (confirm("Full Software Backup can be large. Do you want to continue?")) {
            alert(
                "Hey user, unfortunately you can't backup Software.\n" +
                "GitHub Synced: Last push: Apr 2025.\n" +
                "You can take backup of database instead.\n\n" +
                "For further support, contact Manav."
            );
            alert("Redirecting to Home Page.");
            window.location.href = "/home.html"; // Redirect to homepage after alert
        }
    });
    

    document.getElementById("fullDatabaseBackup").addEventListener("click", () => {
        if (confirm("Initiating Download.\n" +
            "Note: Please always rename the file to 'billing.db' before use.\n" +
            "Also, delete the old 'billing.db' in the folder before adding the new one.\n\n" +
            "For support, contact Manav.")) {
              window.location.href = "/api/backup/database"; // Redirect to the backup endpoint
            };
    });
    // Dynamic Financial Year Backup
    const backupContainer = document.getElementById("backupContainer");

    document.querySelectorAll('[aria-disabled="true"]').forEach(button => {
        button.addEventListener('click', event => {
          event.preventDefault();
        });
      });
      

    // Fetch financial years from the server
    fetch("/financial-years")
                .then(response => response.json())
                .then(fyData => {
                    const backupContainer = document.getElementById("backupContainer");
                    if (!fyData.length) {
                        backupContainer.innerHTML = "<p>No financial years found.</p>";
                        return;
                    }
                    
                    fyData.forEach(({ startYear }) => {
                        const yearCode = startYear; // Assuming startYear is the FY identifier
                        const financialYearSection = document.createElement("div");
                        financialYearSection.classList.add("financial-year-section");

                        financialYearSection.innerHTML = `
                            <h4>Financial Year: ${yearCode}</h4>
                           <div class="backup-options">
                    <button class="backup-btn excel-btn" data-year="${yearCode}" disabled aria-disabled="true">Excel (Coming Soon)</button>
                    <button class="backup-btn database-btn" data-year="${yearCode}">Database</button>
                    <button class="backup-btn pdf-btn" data-year="${yearCode}" disabled aria-disabled="true">PDF (Coming Soon)</button>
                </div>
                        `;

                        backupContainer.appendChild(financialYearSection);
                    });

                    document.querySelectorAll(".database-btn").forEach(button => {
                        button.addEventListener("click", event => {
                            const year = event.target.getAttribute("data-year");
                            // Initiate a download of database backup for that year
                            alert("Feature not implemented yet. You can download the full database backup. For more details, contact Manav.");
                            //window.location.href = `/api/backup/transactions/${year}`;
                        });
                    });
                    document.querySelectorAll(".excel-btn").forEach(button => {
                        button.addEventListener("click", event => {
                            const year = event.target.getAttribute("data-year");
                            window.location.href = `/api/backup/transactions/${year}/excel`;
                        });
                    });

                    document.querySelectorAll(".pdf-btn").forEach(button => {
                        button.addEventListener("click", event => {
                            alert("Feature not implemented yet.");
                        });
                    });
                })
                .catch(() => {
                    document.getElementById("backupContainer").innerHTML = "<p>Error loading financial years.</p>";
                });


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
    

