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

    const editAccountBtn = document.getElementById("editAccountBtn");
    const accountEditModal = document.getElementById("accountEditModal");
    const closeAccountEditModal = document.getElementById("closeAccountEditModal");
    const saveChangesBtn = document.getElementById("saveChangesBtn");
    const currentPasswordInput = document.getElementById("currentPassword");
    const newPasswordInput = document.getElementById("newPassword");
    const newEmailInput = document.getElementById("newEmail");
    const newUsernameInput = document.getElementById("newUsername");

    const userEmailSpan = document.getElementById("user-email");
    const userIdSpan = document.getElementById("userId");
    const userNameSpan = document.getElementById("userName");
    const userRoleSpan = document.getElementById("userRole");

    // Fetch user session data from the backend (server-side session)
    fetch('/api/session')
        .then(response => response.json())
        .then(data => {
            if (data.success && data.user) {
                const user = data.user;
                const userId = user.uid; // Extract userId from the session
                document.getElementById('user-email').textContent = user.email;
                document.getElementById('userId').textContent = user.uid;
                document.getElementById('userName').textContent = user.username;
                document.getElementById('userRole').textContent = user.role;
            } else {
                console.error('You are not logged in');
                // Optionally, redirect to the login page or show a message
            }
        })
        .catch(error => {
            console.error('Error fetching session:', error);
            document.getElementById('editMessage').textContent = 'You are not logged in.';
            document.getElementById('editMessage').classList.add('error');
        });

    // Handle the modal logic
    editAccountBtn.addEventListener("click", () => {
        accountEditModal.style.display = "flex";
    });

    closeAccountEditModal.addEventListener("click", () => {
        accountEditModal.style.display = "none";
        // Clear form after closing modal
        currentPasswordInput.value = "";
        newPasswordInput.value = "";
        newEmailInput.value = "";
        newUsernameInput.value = "";
    });

    saveChangesBtn.addEventListener("click", () => {
        const currentPassword = currentPasswordInput.value;
        const newPassword = newPasswordInput.value;
        const newEmail = newEmailInput.value;
        const newUsername = newUsernameInput.value;

        // Check for empty fields
        if (!currentPassword || !newPassword || !newEmail || !newUsername) {
            document.getElementById("editMessage").textContent = "All fields are required!";
            document.getElementById("editMessage").classList.remove("success");
            document.getElementById("editMessage").classList.add("error");
            return;  // Stop if any field is empty
        }

        // Send the request to check if the current password is correct
        fetch('/api/account/check-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ password: currentPassword })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Proceed to update the account if current password is correct
                fetch('/api/account', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        username: newUsername,
                        email: newEmail,
                        password: newPassword
                    })
                })
                .then(response => response.json())
                .then(data => {
                    document.getElementById("editMessage").textContent = data.message;
                    document.getElementById("editMessage").classList.remove("error");
                    document.getElementById("editMessage").classList.add(data.success ? "success" : "error");

                    // Clear the input fields if the save was successful
                    currentPasswordInput.value = "";
                    newPasswordInput.value = "";
                    newEmailInput.value = "";
                    newUsernameInput.value = "";

                    alert(data.message); // Optionally, alert the user

                    // Close the modal
                    accountEditModal.style.display = "none";

                    // Update the displayed user info (without reloading the page)
                    document.getElementById('user-email').textContent = newEmail;
                    document.getElementById('userName').textContent = newUsername;

                })
                .catch(error => {
                    document.getElementById("editMessage").textContent = "Failed to save changes.";
                    document.getElementById("editMessage").classList.remove("success");
                    document.getElementById("editMessage").classList.add("error");
                });
            } else {
                // If current password is incorrect
                document.getElementById("editMessage").textContent = "Incorrect current password.";
                document.getElementById("editMessage").classList.remove("success");
                document.getElementById("editMessage").classList.add("error");
            }
        })
        .catch(error => {
            document.getElementById("editMessage").textContent = "Failed to check password.";
            document.getElementById("editMessage").classList.remove("success");
            document.getElementById("editMessage").classList.add("error");
        });
    });
});




// Sidebar logic
document.addEventListener("DOMContentLoaded", () => {
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
});


// Select modal elements
document.addEventListener("DOMContentLoaded", () => {
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

