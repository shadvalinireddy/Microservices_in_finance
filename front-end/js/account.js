// Assuming you're using fetch for API calls
async function displayAccountDetails(custid) {
    try {
        const response = await fetch(`http://localhost:3001/accounts/${custid}`); // Adjust the URL as needed
        const accountData = await response.json();

        // Display account details on the page
        document.getElementById('accountDetails').innerHTML = `
            <p>Customer ID: ${accountData.custid}</p>
            <p>Customer Name: ${accountData.customername}</p>
            <p>Account Type: ${accountData.accountType}</p>
            <p>Email: ${accountData.email}</p>
            <p>Phone Number: ${accountData.phoneNumber}</p>
            <p>Aadhar Card: ${accountData.aadharCard}</p>
        `;
        
        // Fill the update form with current data
        document.getElementById('customerName').value = accountData.customername;
        document.getElementById('accountType').value = accountData.accountType;
        document.getElementById('email').value = accountData.email;
        document.getElementById('phoneNumber').value = accountData.phoneNumber;
        document.getElementById('aadharCard').value = accountData.aadharCard;

    } catch (error) {
        console.error('Error fetching account details:', error);
    }
}

document.getElementById('registrationForm').addEventListener('submit', async function(event) {
    event.preventDefault(); // Prevent the default form submission

    const custid = localStorage.getItem('custid'); // Get the logged-in user's custid

    const updatedAccountDetails = {
        custid: custid,
        customername: document.getElementById('customerName').value,
        accountType: document.getElementById('accountType').value,
        email: document.getElementById('email').value,
        phoneNumber: document.getElementById('phoneNumber').value,
        aadharCard: document.getElementById('aadharCard').value,
        // Add other fields as necessary
    };

    try {
        const response = await fetch(`http://localhost:3001/accounts/${custid}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(updatedAccountDetails),
        });

        if (response.ok) {
            alert('Account updated successfully!');
            displayAccountDetails(custid); // Refresh the account details
        } else {
            const errorData = await response.json();
            alert(`Error updating account: ${errorData.message}`);
        }
    } catch (error) {
        console.error('Error updating account:', error);
    }
});
