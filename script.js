document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('walletForm');
  const usernameInput = document.getElementById('username');
  const addressInput = document.getElementById('address');
  const statusMsg = document.getElementById('statusMsg');

   // Load ledger from localStorage (if any) and update the UI.
   let ledger = JSON.parse(localStorage.getItem('ledger')) || [];
   updateLedgerUI(ledger);
   
   // 1) Let main.tsx know this webview is ready
  //window.parent.postMessage({ 
  //  type: 'formSubmitted', 
  //  data: { address: '0x...' } 
  //}, '*');
  

  // 2) Listen for messages from main.tsx
  window.addEventListener('message', (evt) => {
    const msg = evt.data;
    if (!msg || !msg.type) return;

    // If we got "initialData", fill the username
    if (msg.type === 'initialData') {
      if (msg.data?.username) {
        usernameInput.value = msg.data.username;
      }
    }
  });

  // 3) On form submit, validate, store the registration, update ledger, and send data.
  form.addEventListener('submit', (event) => {
    event.preventDefault();

    const username = usernameInput.value.trim();
    const address = addressInput.value.trim();

    // Basic validation
    if (!username) {
      statusMsg.innerText = 'Username cannot be empty.';
      return;
    }
    if (!address.startsWith('0x')) {
      statusMsg.innerText = 'Wallet must start with 0x...';
      return;
    }

    // Save the registration in the ledger (using localStorage for persistence).
    ledger.push({ username, address });
    localStorage.setItem('ledger', JSON.stringify(ledger));
    updateLedgerUI(ledger);

    // Post data back to main.tsx
    window.parent.postMessage({
      type: 'formSubmitted',
      data: { username, address },
    }, '*');

    statusMsg.innerText = `Submitted: ${username}, ${address}. <a href="https://dapp.badbxar.com/" target="_blank">Proceed to DApp</a>`;
  });
});

// Helper function to update the ledger display.
function updateLedgerUI(ledger) {
  const ledgerList = document.getElementById('ledgerList');
  if (!ledgerList) return;
  ledgerList.innerHTML = ''; // Clear any previous entries.
  ledger.forEach((entry, index) => {
    const li = document.createElement('li');
    li.textContent = `User ${index + 1}: ${entry.username}, Wallet: ${entry.address}`;
    ledgerList.appendChild(li);
  });
}