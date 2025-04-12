document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const balanceElement = document.getElementById('balance');
    const transactionsContainer = document.getElementById('transactions');
    const addBtn = document.querySelector('.add-btn');
    
    // Fetch transactions from backend
    async function fetchTransactions() {
        try {
            const response = await fetch('http://localhost:8000/transactions');
            const transactions = await response.json();
            displayTransactions(transactions);
            calculateBalance(transactions);
        } catch (error) {
            console.error('Error fetching transactions:', error);
        }
    }

    // Display transactions
    function displayTransactions(transactions) {
        transactionsContainer.innerHTML = '';
        
        transactions.forEach(transaction => {
            const transactionElement = document.createElement('div');
            transactionElement.className = 'transaction-item';
            
            const typeClass = transaction.type === 'income' ? 'income' : 'expense';
            
            transactionElement.innerHTML = `
                <div>
                    <h4>${transaction.description || 'No description'}</h4>
                    <small>${new Date(transaction.date).toLocaleString()}</small>
                </div>
                <div class="${typeClass}">
                    <h4>₹${transaction.amount.toFixed(2)}</h4>
                </div>
            `;
            
            transactionsContainer.appendChild(transactionElement);
        });
    }

    // Calculate and display balance
    function calculateBalance(transactions) {
        const balance = transactions.reduce((total, transaction) => {
            return transaction.type === 'income' ? 
                total + transaction.amount : 
                total - transaction.amount;
        }, 0);
        
        balanceElement.textContent = `₹${balance.toFixed(2)}`;
    }

    // Initialize app
    fetchTransactions();
    
    // Add event listeners
    addBtn.addEventListener('click', () => {
        // Will implement add transaction modal later
        alert('Add transaction functionality will be implemented');
    });
});