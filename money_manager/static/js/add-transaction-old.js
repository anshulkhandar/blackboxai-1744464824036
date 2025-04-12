document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const incomeBtn = document.getElementById('incomeBtn');
    const expenseBtn = document.getElementById('expenseBtn');
    const amountInput = document.getElementById('amount');
    const descriptionInput = document.getElementById('description');
    const categorySelect = document.getElementById('category');
    const dateInput = document.getElementById('date');
    const isRecurringCheckbox = document.getElementById('isRecurring');
    const recurringOptions = document.getElementById('recurringOptions');
    const frequencySelect = document.getElementById('frequency');
    const endDateInput = document.getElementById('endDate');
    const receiptInput = document.getElementById('receipt');
    const receiptPreview = document.getElementById('receiptPreview');
    const attachmentPreview = document.getElementById('attachmentPreview');
    const saveBtn = document.getElementById('saveBtn');
    const formTitle = document.getElementById('formTitle');

    // Initialize
    loadCategories();
    setupEventListeners();

    function setupEventListeners() {
        // Type toggle
        incomeBtn.addEventListener('click', () => toggleTransactionType('income'));
        expenseBtn.addEventListener('click', () => toggleTransactionType('expense'));

        // Recurring transactions
        isRecurringCheckbox.addEventListener('change', toggleRecurringOptions);

        // Receipt attachment
        receiptInput.addEventListener('change', handleReceiptUpload);

        // Form submission
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

    function toggleRecurringOptions() {
        recurringOptions.classList.toggle('hidden', !isRecurringCheckbox.checked);
    }

    function handleReceiptUpload(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                receiptPreview.src = e.target.result;
                attachmentPreview.style.display = 'block';
            }
            reader.readAsDataURL(file);
        }
    }

    function removeAttachment() {
        receiptInput.value = '';
        receiptPreview.src = '';
        attachmentPreview.style.display = 'none';
    }

    async function loadCategories() {
        try {
            const response = await fetch('http://localhost:8000/categories');
            const categories = await response.json();
            
            categories.forEach(category => {
                const option = document.createElement('option');
                option.value = category._id;
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

        if (isRecurringCheckbox.checked) {
            transaction.recurring = {
                frequency: frequencySelect.value,
                endDate: endDateInput.value || null
            };
        }

        if (receiptInput.files[0]) {
            transaction.receipt = await toBase64(recciptInput.files[0]);
        }

        try {
            const token = localStorage.getItem('moneyManagerToken');
            const response = await fetch('http://localhost:8000/transactions', {
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

    function toBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result.split(',')[1]);
            reader.onerror = error => reject(error);
        });
    }
});