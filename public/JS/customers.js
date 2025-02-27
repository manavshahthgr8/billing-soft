document.addEventListener("DOMContentLoaded", () => {
 
  // Global variable to store customer data
  let customers = [];

  // Customer List functionality start
  const searchBar = document.getElementById('search-bar');
  const searchColumn = document.getElementById('search-column');
  const searchButton = document.getElementById('search-btn');
  const prevButton = document.getElementById('prev-btn');
  const nextButton = document.getElementById('next-btn');
  const pageInfo = document.getElementById('page-info');
  const customerList = document.getElementById('customer-list');

  let currentPage = 1;
  const limit = 10; // Number of customers per page

  // Fetch and display customers
  const fetchCustomers = async (params = {}) => {
      const {
          page = 1, search = '', column = 'client_name'
      } = params;

      try {
          const response = await fetch(
              `/customers?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}&column=${column}`
          );

          if (!response.ok) {
              throw new Error(
                  `Failed to fetch: ${response.statusText}`
              );
          }

          const {
              customers: fetchedCustomers,
              total,
              currentPage,
              totalPages
          } = await response.json();

          console.log('Fetched customers:',
              fetchedCustomers); // Debugging log
          customers =
              fetchedCustomers; // Assign to the global customers array
          renderCustomers(customers);
          updatePagination(total, currentPage, totalPages);
      } catch (error) {
          console.error('Error fetching customers:', error);
          alert(
              'Failed to fetch customers. Please try again.'
              );
      }
  };

  // Render customer cards
  const renderCustomers = (customers) => {
      if (!customerList) {
          console.error(
              'Customer list container is not found in the DOM.'
          );
          return;
      }

      if (!customers || customers.length === 0) {
          customerList.innerHTML = '<p>No customers found.</p>';
          return;
      }

      customerList.innerHTML = ''; // Clear previous entries

      customers.forEach((customer) => {
          const customerBlock = `
    <div class="customer-card">
      <div class="customer-details">
        <p class="customer-name"><strong>${customer.client_name}</strong></p>
        <p class="customer-city">${customer.city}, ${customer.state} </p>
        <p class="customer-city">ID: ${customer.customer_id}</p>
      </div>
      <div class="customer-info">
        <p><strong>Type:</strong> ${customer.category}</p>
        <p><strong>Contact:</strong> ${customer.contact || 'N/A'}</p>
        <p><strong>Email:</strong> ${customer.email || 'N/A'}</p>
      </div>
      <div class="customer-actions">
        <button class="edit-btn" data-id="${customer.customer_id}"><i class="fas fa-pencil-alt"></i> Edit</button>
        <button class="delete-btn" data-id="${customer.customer_id}"><i class="fas fa-trash"></i> Delete</button>
      </div>
    </div>
  `;
          customerList.innerHTML += customerBlock;
      });
  };

  // Update pagination controls
  const updatePagination = (total, currentPage, totalPages) => {
      pageInfo.textContent =
          `Page ${currentPage} of ${totalPages}`;
      prevButton.disabled = currentPage === 1;
      nextButton.disabled = currentPage === totalPages;
  };

  // Event listeners for pagination
  prevButton.addEventListener('click', () => {
      if (currentPage > 1) {
          currentPage--;
          fetchCustomers({
              page: currentPage,
              search: searchBar.value.trim(),
              column: searchColumn.value
          });
      }
  });

  nextButton.addEventListener('click', () => {
      currentPage++;
      fetchCustomers({
          page: currentPage,
          search: searchBar.value.trim(),
          column: searchColumn.value
      });
  });

  // Event listener for search
  searchButton.addEventListener('click', () => {
      const search = searchBar.value.trim();
      currentPage = 1; // Reset to the first page
      fetchCustomers({
          page: currentPage,
          search: search,
          column: searchColumn.value
      });
  });

  // Initial fetch on page load
  fetchCustomers({
      page: 1,
      search: '',
      column: 'client_name'
  });

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
                fetchCustomers();

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



  // Get modal and button elements for edit customer
  const modal4 = document.getElementById("edit-customer-modal");
  const closeModalButtons = document.querySelectorAll(
      ".modal-close4");
  const saveCustomerButton = document.getElementById("save-customer");

  // Ensure that the modal is hidden initially on page load
  modal4.classList.remove(
      "modal4"); // Make sure modal4 class is not present initially

  // Function to open the modal with customer data
  // Function to populate cities based on the selected state (real-time API)
// Function to populate cities based on the selected state (real-time API)
const populateCities = async (selectedState, cityDropdownId, currentCity = null) => {
  const cityDropdown = document.getElementById(cityDropdownId);

  // Clear city dropdown
  cityDropdown.innerHTML = '<option value="">Select your City</option>';

  // Exit if no state is selected
  if (!selectedState) return;

  try {
    // Fetch cities for the selected state
    const response = await fetch(`/city/state/${selectedState}`);

    if (response.status === 404) {
      alert("No cities found for the selected state.");
      return;
    }

    // Handle other errors
    if (!response.ok) {
      throw new Error(`Error: ${response.statusText}`);
    }

    const cities = await response.json();

    // Handle empty city list
    if (!cities.length) {
      alert("No cities found for the selected state.");
      return;
    }

    // Populate city dropdown
    let cityExists = false;
    cities.forEach((city) => {
      const option = document.createElement('option');
      option.id = city.city_id; // Use city_id as the value
      option.value = city.city_name; // Use city_name as the value
      option.textContent = city.city_name; // Display city_name
      cityDropdown.appendChild(option);

      // Check if the current city exists in the dropdown
      if (currentCity && city.city_name === currentCity) {
        cityExists = true;
      }
    });

    // Prefill the current city if it exists, otherwise show "Select your City"
    if (cityExists && currentCity) {
      cityDropdown.value = currentCity;
    }
  } catch (error) {
    console.error('Error fetching cities:', error);
    alert('Failed to fetch cities. Please try again.');
  }
};

// Function to open the modal with customer data
const openModal4 = (customer) => {
  // Prefill current customer details in the modal
  document.getElementById("current-name").textContent = customer.client_name;
  document.getElementById("current-city").textContent = customer.city;
  document.getElementById("current-state").textContent = customer.state;
  document.getElementById("current-cid").textContent = customer.customer_id;

  // Prefill input fields
  document.getElementById("new-name").value = customer.client_name;
  document.getElementById("new-state").value = customer.state;
  document.getElementById("contact").value = customer.contact || '';
  document.getElementById("email").value = customer.email || '';
  document.getElementById("new-type").value = customer.category || '';

  // Dynamically populate cities based on the selected state and prefill the city
  populateCities(customer.state, "new-city", customer.city);

  // Show the modal by adding the modal4 class
  document.getElementById("edit-customer-modal").classList.add("modal4");
};

// Attach change event to dynamically load cities for state selection in the modal
document.getElementById("new-state").addEventListener("change", (e) => {
  const selectedState = e.target.value;

  // Reset the city dropdown on state change
  populateCities(selectedState, "new-city");
});





  // Event listener for opening the modal
  customerList.addEventListener('click', (e) => {
      if (e.target && e.target.classList.contains(
              'edit-btn')) {
          const customerId = e.target.getAttribute('data-id');
          const customer = customers.find(c => c
              .customer_id == customerId);
          if (customer) {
              openModal4(
                  customer
                  ); // Open modal if customer is found
          }
      }
  });


  // Close modal function (checking event listeners)
  closeModalButtons.forEach(button => {
      button.addEventListener("click", () => {
          console.log("Closing modal...");
          modal4.classList.remove(
              "modal4"
              ); // Remove modal4 class to hide the modal
          console.log(modal4.classList.contains(
              "modal4"
          )); // Check if class was removed
      });
  });

  // Close modal when clicking outside of the modal content
  window.addEventListener("click", (event) => {
      if (event.target === modal4) {
          console.log(
              "Clicked outside the modal, closing...");
          modal4.classList.remove(
              "modal4"
              ); // Remove modal4 class to hide the modal
      }
  });


  // Close modal when clicking outside of the modal content
  window.addEventListener("click", (event) => {
      if (event.target === modal4) {
          console.log(
              "Clicked outside the modal, closing..."
              ); // Debugging line
          modal4.style.display = "none";
      }
  });
 

    // Event listener for the delete button
    document.getElementById("customer-list").addEventListener("click", (e) => {
        if (e.target && e.target.classList.contains("delete-btn")) {
            const customerId = e.target.getAttribute("data-id");
            const modal = document.getElementById("delete_modal_customer");
            const message = document.getElementById("delete_cust_message");
    message.innerHTML = `⚠️ Recommended to edit Detail or create new customer to avoid Bill loss <br>🚨 All related billing records will also be deleted!`;
            modal.style.display = "block";

            // Handle modal actions
            document.getElementById("confirm_delete").onclick = async () => {
                const password = document.getElementById("delete_password").value;
                if (!password) {
                    alert("Password is required!");
                    return;
                }

                try {
                    const response = await fetch('/api/account/check-password', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ password })
                    });

                    const data = await response.json();

                    if (response.ok) {
                        const deleteResponse = await fetch(`/api/customers/${customerId}`, {
                            method: 'DELETE',
                            headers: { 'Content-Type': 'application/json' },
                        });

                        const deleteData = await deleteResponse.json();

                        if (deleteResponse.ok) {
                            alert("Customer deleted successfully!");
                            window.location.reload();
                        } else {
                            alert(deleteData.message || "Failed to delete customer.");
                        }
                    } else {
                        alert(data.message || "Incorrect password.");
                    }
                } catch (error) {
                    console.error("Error:", error);
                    alert("An error occurred. Please try again.");
                }

                modal.style.display = "none";
            };

            document.getElementById("cancel_delete").onclick = () => {
                modal.style.display = "none";
            };

            document.querySelector(".close-btn").onclick = () => {
                modal.style.display = "none";
            };
        }
    });




  // Handle save button click
  saveCustomerButton.addEventListener("click", async () => {
      const newName = document.getElementById("new-name")
          .value;
      const newState = document.getElementById(
          "new-state").value;
      const newCity = document.getElementById("new-city")
          .value;
      const contact = document.getElementById("contact")
          .value;
      const email = document.getElementById("email")
          .value;
      const customerId = document.getElementById(
          "current-cid").textContent;
    const newType = document.getElementById(
          "new-type").value;

      if (!newName || !newState || !newCity) {
          alert("Name, State, and City are required.");
          return;
      }

      const updatedCustomer = {
          customer_id: customerId,
          client_name: newName,
          state: newState,
          city: newCity,
          contact: contact,
          email: email,
          category: newType
      };

      try {
          const response = await fetch(
              `/api/update-customer`, {
                  method: 'POST',
                  headers: {
                      'Content-Type': 'application/json'
                  },
                  body: JSON.stringify(
                      updatedCustomer)
              });

          const result = await response.json();

          if (response.ok) {
              alert(
                  'Customer details updated successfully!'
                  );
              modal4.style.display = "none";
              fetchCustomers({
                  page: currentPage,
                  search: searchBar.value.trim(),
                  column: searchColumn.value
              });
          } else {
              alert('Error updating customer: ' + result
                  .message);
          }
      } catch (error) {
          console.error('Error:', error);
          alert(
              'Failed to update customer details. Please try again.'
              );
      }
  });

  
  


});
