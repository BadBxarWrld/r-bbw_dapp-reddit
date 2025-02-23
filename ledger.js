// Convert each entry to "username: address"
// const lines = wallets.map((w) => `${w.username}: ${w.address}`);
//context.ui.showToast(`All wallets:\n${lines.join('\n')}`);
document.addEventListener('DOMContentLoaded', () => {
    const ledgerList = document.getElementById('ledgerList');
    // Example: a dummy list of users
    const dummyData = [
      { username: 'User1', address: '0x123...' },
      { username: 'User2', address: '0x456...' }
    ];
    dummyData.for((item) => {
      const li = document.createElement('li');
      li.textContent = `Username: ${item.username}, Wallet: ${item.address}`;
      ledgerList.appendChild(li);
    });
  });
  