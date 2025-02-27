
// JavaScript for logic
// login
// Live clock in the header
// Live clock in the header
function updateTime() {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, "0");
    const minutes = now.getMinutes().toString().padStart(2, "0");
    const seconds = now.getSeconds().toString().padStart(2, "0");
    const currentTimeElement = document.getElementById('currentTime');
    
    // Only attempt to update textContent if element exists
    if (currentTimeElement) {
        currentTimeElement.textContent = `${hours}:${minutes}:${seconds}`;
    }
}
setInterval(updateTime, 1000);
updateTime();

// Login form

document.addEventListener('DOMContentLoaded', function() {

    document.getElementById('staffLogin').addEventListener('click', () => {
        alert("Feature not released. Version 2 will be released soon.\nContact Manav for details.");
    });

    document.getElementById('loginForm').addEventListener('submit', (e) => {
        e.preventDefault();


        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        })
        .then((response) => {
            if (response.ok) {
                return response.json();
            } else {
                throw new Error('Invalid credentials');
            }
        })
        .then((data) => {
            alert(data.message);
            if (data.success) {
                alert("Taking you to the home page.");
                window.location.href = "home.html"; // Redirect on success
            }
        })
        .catch((err) => {
            alert(err.message);
        });
    });
});


