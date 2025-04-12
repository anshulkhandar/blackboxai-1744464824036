document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const incomeBtn = document.getElementById('incomeBtn');
    const expenseBtn = document.getElementById('expenseBtn');
    const amountInput = document.getElementById('amount');
    const descriptionInput = document.getElementById('description');
    const categorySelect = document.getElementById('category');
    const dateInput = document.getElementById('date');
    const saveBtn = document.getElementById('saveBtn');
    const formTitle = document.getElementById('formTitle');

    // Initialize
    loadCategories();
    setupEventListeners();

    function setupEventListeners() {
        incomeBtn.addEventListener('click', () => toggleTransactionType('income'));
        expenseBtn.addEventListener('click', () => toggleTransactionType('expense'));
        saveBtn.addEventListener('click', handleFormSubmit);
    }

    function toggleTransactionType(type) {
        if (type === 'income') {
            incomeBtn.classList.add('active');
            expenseBtn.classList.remove('active');
            formTitle.textContent = 'Add Income';
        } else {
            incomeBtn.classList.remove('active');
            expenseBtn.classList.add('active');
            formTitle.textContent = 'Add Expense';
        }
    }

    async function loadCategories() {
        try {
            const token = window.authHelper?.getToken();
            const response = await fetch(`${window.appConfig.apiBaseUrl}/categories`, {
                headers: token ? { 'Authorization': `Bearer ${token}` } : {}
            });
            const { data: categories } = await response.json();
            
            categories.forEach(category => {
                const option = document.createElement('option');
                option.value = category.id;
                option.textContent = category.name;
                categorySelect.appendChild(option);
            });
        } catch (error) {
            console.error('Error loading categories:', error);
        }
    }

    async function handleFormSubmit() {
        const transaction = {
            amount: parseFloat(amountInput.value),
            type: incomeBtn.classList.contains('active') ? 'income' : 'expense',
            description: descriptionInput.value,
            category: categorySelect.value,
            date: dateInput.value || new Date().toISOString().split('T')[0]
        };

        try {
            const token = window.authHelper.getToken();
            const response = await fetch(`${window.appConfig.apiBaseUrl}/transactions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(transaction)
            });
            
            const result = await response.json();
            if (result.status === 'success') {
                alert('Transaction saved successfully!');
                window.location.href = 'transactions.html';
            }
        } catch (error) {
            console.error('Error saving transaction:', error);
            alert('Failed to save transaction');
        }
    }

    // Rest of the existing code...
});