document.addEventListener('DOMContentLoaded', function() {
    const ctx = document.getElementById('pieChart').getContext('2d');
    const tilesContainer = document.getElementById('transaction-tiles');
    
    // Fetch transactions and render chart
    async function loadTransactions() {
        try {
            const response = await fetch('http://localhost:8000/transactions');
            const transactions = await response.json();
            renderPieChart(transactions);
            renderTransactionTiles(transactions);
        } catch (error) {
            console.error('Error loading transactions:', error);
        }
    }

    // Render pie chart
    function renderPieChart(transactions) {
        const income = transactions.filter(t => t.type === 'income')
                         .reduce((sum, t) => sum + t.amount, 0);
        const expense = transactions.filter(t => t.type === 'expense')
                          .reduce((sum, t) => sum + t.amount, 0);

        new Chart(ctx, {
            type: 'pie',
            data: {
                labels: ['Income', 'Expense'],
                datasets: [{
                    data: [income, expense],
                    backgroundColor: ['#2ecc71', '#e74c3c'],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }

    // Render transaction tiles
    function renderTransactionTiles(transactions) {
        tilesContainer.innerHTML = '';
        
        transactions.forEach(transaction => {
            const tile = document.createElement('div');
            tile.className = `transaction-tile ${transaction.type}-tile`;
            
            tile.innerHTML = `
                <div>
                    <h4>${transaction.description || 'No description'}</h4>
                    <small>${new Date(transaction.date).toLocaleDateString()}</small>
                </div>
                <div class="${transaction.type}">
                    <h4>₹${transaction.amount.toFixed(2)}</h4>
                </div>
            `;
            
            tilesContainer.appendChild(tile);
        });
    }

    // Initialize page
    loadTransactions();
    
    // Navigation
    document.querySelector('.fa-home').addEventListener('click', () => {
        window.location.href = 'index.html';
    });
    
    document.querySelector('.fa-plus').addEventListener('click', () => {
        window.location.href = 'add-transaction.html';
    });
    
    document.querySelector('.fa-cog').addEventListener('click', () => {
        window.location.href = 'settings.html';
    });
});