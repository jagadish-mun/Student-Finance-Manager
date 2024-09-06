// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "REDACTED_API_KEY",
    authDomain: "fbla2024-ad8d8.firebaseapp.com",
    databaseURL: "https://fbla2024-ad8d8-default-rtdb.firebaseio.com",
    projectId: "fbla2024-ad8d8",
    storageBucket: "fbla2024-ad8d8.appspot.com",
    messagingSenderId: "1034492028846",
    appId: "1:1034492028846:web:653115981d3a78325c8a3f",
    measurementId: "G-YW4FXGH4TK"
};
// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Get references to auth and database
const auth = firebase.auth();
const database = firebase.database();

// Check if we're on the login page or dashboard
const isLoginPage = window.location.pathname.includes('index.html') || window.location.pathname === '/';

if (isLoginPage) {
    // Login page code
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    const showSignup = document.getElementById('showSignup');
    const showLogin = document.getElementById('showLogin');

    // Show/hide forms
    showSignup.addEventListener('click', () => {
        loginForm.classList.add('hidden');
        signupForm.classList.remove('hidden');
    });

    showLogin.addEventListener('click', () => {
        signupForm.classList.add('hidden');
        loginForm.classList.remove('hidden');
    });

    // Signup
    document.getElementById('signup').addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('signupEmail').value;
        const password = document.getElementById('signupPassword').value;

        auth.createUserWithEmailAndPassword(email, password)
            .then((userCredential) => {
                const user = userCredential.user;
                database.ref('users/' + user.uid).set({
                    email: email,
                    transactions: []
                });
                window.location.href = 'dashboard.html';
            })
            .catch((error) => {
                alert(error.message);
            });
    });

    // Login
    document.getElementById('login').addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;

        auth.signInWithEmailAndPassword(email, password)
            .then((userCredential) => {
                window.location.href = 'dashboard.html';
            })
            .catch((error) => {
                alert(error.message);
            });
    });

    // Check auth state
    auth.onAuthStateChanged((user) => {
        if (user) {
            window.location.href = 'dashboard.html';
        }
    });
} else {
    // Dashboard code
    let transactions = [];

    // DOM elements
    const logoutBtn = document.getElementById('logoutBtn');
    const addTransactionBtn = document.getElementById('addTransactionBtn');
    const viewBalanceBtn = document.getElementById('viewBalanceBtn');
    const generateSummaryBtn = document.getElementById('generateSummaryBtn');
    const transactionForm = document.getElementById('transactionForm');
    const balanceView = document.getElementById('balanceView');
    const summaryView = document.getElementById('summaryView');
    const transactionInputForm = document.getElementById('transactionInputForm');
    const transactionsList = document.getElementById('transactions');
    const currentBalanceElement = document.getElementById('currentBalance');
    const summaryResults = document.getElementById('summaryResults');
    const searchTransactions = document.getElementById('searchTransactions');

    // Check auth state
    auth.onAuthStateChanged((user) => {
        if (user) {
            loadUserData(user);
            showSection(transactionForm); // Show "Add Transaction" by default when dashboard loads
        } else {
            window.location.href = 'index.html';
        }
    });

    // Logout
    logoutBtn.addEventListener('click', () => {
        auth.signOut().then(() => {
            window.location.href = 'index.html';
        }).catch((error) => {
            alert(error.message);
        });
    });

    // Event listeners for app functionality
    addTransactionBtn.addEventListener('click', () => showSection(transactionForm));
    viewBalanceBtn.addEventListener('click', () => showSection(balanceView));
    generateSummaryBtn.addEventListener('click', () => showSection(summaryView));
    transactionInputForm.addEventListener('submit', addTransaction);
    searchTransactions.addEventListener('input', filterTransactions);

document.addEventListener('DOMContentLoaded', function() {
    const navButtons = document.querySelectorAll('nav button');
    const navLine = document.createElement('div');
    navLine.classList.add('nav-line');
    document.querySelector('nav').appendChild(navLine);

    // Function to move the nav-line to the hovered or active button
    function updateNavLine(button) {
        const buttonRect = button.getBoundingClientRect();
        const navRect = button.parentElement.getBoundingClientRect();
        navLine.style.width = `${buttonRect.width}px`;
        navLine.style.left = `${buttonRect.left - navRect.left}px`;
    }

    // Initialize the nav-line on the active page or the first button
    const activeButton = document.querySelector('nav button.active') || navButtons[0];
    updateNavLine(activeButton);

    // Add event listeners for hovering and clicking
    navButtons.forEach(button => {
        button.addEventListener('mouseenter', () => {
            updateNavLine(button);
        });

        button.addEventListener('click', () => {
            navButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            updateNavLine(button);
        });
    });
});


    function loadUserData(user) {
        database.ref('users/' + user.uid + '/transactions').on('value', (snapshot) => {
            transactions = snapshot.val() || [];
            renderTransactions();
            updateBalance();
        });
    }

    function showSection(section) {
        // Hide all sections
        transactionForm.classList.add('hidden');
        balanceView.classList.add('hidden');
        summaryView.classList.add('hidden');
        // Show the selected section
        section.classList.remove('hidden');
        section.style.animation = 'none';
        section.offsetHeight; // Trigger reflow
        section.style.animation = null;
        if (section === balanceView) updateBalance();
        if (section === summaryView) generateSummary();
    }

    function addTransaction(e) {
        e.preventDefault();
        const transaction = {
            type: document.getElementById('transactionType').value,
            amount: parseFloat(document.getElementById('amount').value),
            category: document.getElementById('category').value,
            date: document.getElementById('date').value
        };
        transactions.push(transaction);
        saveTransactions();
        renderTransactions();
        transactionInputForm.reset();
    }

    function renderTransactions() {
        transactionsList.innerHTML = '';
        transactions.forEach((transaction, index) => {
            const li = document.createElement('li');
            li.innerHTML = `
                <span>
                    <i class="fas fa-${transaction.type === 'income' ? 'plus' : 'minus'}"></i>
                    ${transaction.date} - ${transaction.type}: $${transaction.amount.toFixed(2)} (${transaction.category})
                </span>
                <div>
                    <button onclick="editTransaction(${index})" class="btn-edit"><i class="fas fa-edit"></i></button>
                    <button onclick="deleteTransaction(${index})" class="btn-delete"><i class="fas fa-trash"></i></button>
                </div>
            `;
            li.classList.add(transaction.type);
            transactionsList.appendChild(li);
        });
    }

document.addEventListener('DOMContentLoaded', function() {
    // Function to update the balance and color
    function updateBalance(balanceValue) {
        const balanceElement = document.getElementById('currentBalance');

        // Update the balance text with proper formatting
        balanceElement.textContent = `$${balanceValue.toFixed(2)}`;

        // Check if the balance is negative, and update the color
        if (balanceValue < 0) {
            balanceElement.style.color = 'red';
        } else {
            balanceElement.style.color = 'green'; // Set it to green if balance is positive or zero
        }
    }

    // Example of how you might call updateBalance with dynamic data
    let balanceValue = 50.00; // Example balance, can be dynamically set
    updateBalance(balanceValue);

    // Simulate changing the balance to test both positive and negative
    document.getElementById('testNegative').addEventListener('click', function() {
        balanceValue = -25.00;
        updateBalance(balanceValue);
    });

    document.getElementById('testPositive').addEventListener('click', function() {
        balanceValue = 100.00;
        updateBalance(balanceValue);
    });
});



    function editTransaction(index) {
        const transaction = transactions[index];
        document.getElementById('transactionType').value = transaction.type;
        document.getElementById('amount').value = transaction.amount;
        document.getElementById('category').value = transaction.category;
        document.getElementById('date').value = transaction.date;
        transactions.splice(index, 1);
        saveTransactions();
        renderTransactions();
        showSection(transactionForm);
    }

    function deleteTransaction(index) {
        transactions.splice(index, 1);
        saveTransactions();
        renderTransactions();
    }

    function updateBalance() {
        const balance = transactions.reduce((total, transaction) => {
            return transaction.type === 'income' ? total + transaction.amount : total - transaction.amount;
        }, 0);
        currentBalanceElement.textContent = `$${balance.toFixed(2)}`;
        currentBalanceElement.classList.remove('positive', 'negative');
        currentBalanceElement.classList.add(balance >= 0 ? 'positive' : 'negative');
    }


    function generateSummary() {
        const period = document.getElementById('summaryPeriod').value;
        const currentDate = new Date();
        const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - (period === 'weekly' ? 7 : 30));
    
        const filteredTransactions = transactions.filter(transaction => new Date(transaction.date) >= startDate);
    
        const income = filteredTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
        const expenses = filteredTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    
        const categorySummary = filteredTransactions.reduce((summary, t) => {
            if (!summary[t.category]) summary[t.category] = 0;
            summary[t.category] += t.amount;
            return summary;
        }, {});
    
        summaryResults.innerHTML = `
            <div class="summary-item">
                <i class="fas fa-arrow-up"></i>
                <p>Total Income: <span class="income">$${income.toFixed(2)}</span></p>
            </div>
            <div class="summary-item">
                <i class="fas fa-arrow-down"></i>
                <p>Total Expenses: <span class="expense">$${expenses.toFixed(2)}</span></p>
            </div>
            <ul class="category-list">
                ${Object.entries(categorySummary).map(([category, amount]) => `
                    <li>${category}: $${amount.toFixed(2)}</li>
                `).join('')}
            </ul>
        `;
    }
    
    // Edit and delete transaction functions
    function editTransaction(index) {
        const transaction = transactions[index];
        document.getElementById('transactionType').value = transaction.type;
        document.getElementById('amount').value = transaction.amount;
        document.getElementById('category').value = transaction.category;
        document.getElementById('date').value = transaction.date;
        transactions.splice(index, 1);
        saveTransactions();
        renderTransactions();
        showSection(transactionForm);
    }
    
    function deleteTransaction(index) {
        transactions.splice(index, 1);
        saveTransactions();
        renderTransactions();
    }
    
    // Function to filter transactions by search query
    function filterTransactions() {
        const query = searchTransactions.value.toLowerCase();
        Array.from(transactionsList.children).forEach(li => {
            const text = li.textContent.toLowerCase();
            li.style.display = text.includes(query) ? '' : 'none';
        });
    }
}
    // Initialize the application by checking the auth state and setting up event listeners
