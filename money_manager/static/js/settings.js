document.addEventListener('DOMContentLoaded', function() {
    const clearDataBtn = document.getElementById('clearDataBtn');
    const setBudgetBtn = document.getElementById('setBudgetBtn');
    const monthlyBudgetInput = document.getElementById('monthlyBudget');

    // Clear all data
    clearDataBtn.addEventListener('click', async function() {
        if (confirm('Are you sure you want to delete all transactions? This cannot be undone.')) {
            try {
                const response = await fetch('http://localhost:8000/clear', {
                    method: 'POST'
                });
                const result = await response.json();
                if (result.status === 'success') {
                    alert('All data has been cleared');
                }
            } catch (error) {
                console.error('Error clearing data:', error);
                alert('Failed to clear data');
            }
        }
    });

    // Set monthly budget
    setBudgetBtn.addEventListener('click', function() {
        const budget = monthlyBudgetInput.value;
        if (budget && !isNaN(budget)) {
            localStorage.setItem('monthlyBudget', budget);
            alert(`Budget set to ₹${budget}`);
        } else {
            alert('Please enter a valid budget amount');
        }
    });

    // Load saved budget
    const savedBudget = localStorage.getItem('monthlyBudget');
    if (savedBudget) {
        monthlyBudgetInput.value = savedBudget;
    }

    // Navigation
    document.querySelector('.fa-home').addEventListener('click', () => {
        window.location.href = 'index.html';
    });
    
    document.querySelector('.fa-history').addEventListener('click', () => {
        window.location.href = 'transactions.html';
    });
    
    document.querySelector('.fa-plus').addEventListener('click', () => {
        window.location.href = 'add-transaction.html';
    });
});