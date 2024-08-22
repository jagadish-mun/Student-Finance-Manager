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
        <h3>Spending by Category:</h3>
        <ul class="category-list">
            ${Object.entries(categorySummary).map(([category, amount]) => `
                <li>
                    <span>${category}</span>
                    <span>$${amount.toFixed(2)}</span>
                </li>
            `).join('')}
        </ul>
    `;

    drawSummaryGraph(income, expenses);
}

function drawSummaryGraph(income, expenses) {
    const canvas = document.getElementById('summaryGraph');
    const ctx = canvas.getContext('2d');
    
    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Set up the graph
    const graphWidth = canvas.width - 60; // Leave space for labels
    const graphHeight = canvas.height - 40; // Leave space for title and labels
    const barWidth = graphWidth / 4; // Width for each bar
    
    // Draw title
    ctx.fillStyle = '#34495e';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Income vs Expenses', canvas.width / 2, 20);
    
    // Draw bars
    const maxValue = Math.max(income, expenses);
    const scale = graphHeight / maxValue;
    
    // Income bar
    ctx.fillStyle = '#2ecc71';
    const incomeHeight = income * scale;
    ctx.fillRect(30, canvas.height - incomeHeight - 20, barWidth, incomeHeight);
    
    // Expenses bar
    ctx.fillStyle = '#e74c3c';
    const expensesHeight = expenses * scale;
    ctx.fillRect(30 + barWidth * 2, canvas.height - expensesHeight - 20, barWidth, expensesHeight);
    
    // Draw labels
    ctx.fillStyle = '#34495e';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Income', 30 + barWidth / 2, canvas.height - 5);
    ctx.fillText('Expenses', 30 + barWidth * 2.5, canvas.height - 5);
    
    // Draw values on top of bars
    ctx.fillStyle = '#fff';
    ctx.fillText('$' + income.toFixed(2), 30 + barWidth / 2, canvas.height - incomeHeight - 25);
    ctx.fillText('$' + expenses.toFixed(2), 30 + barWidth * 2.5, canvas.height - expensesHeight - 25);
}

function filterTransactions() {
    const searchTerm = searchTransactions.value.toLowerCase();
    const filteredTransactions = transactions.filter(transaction => 
        transaction.category.toLowerCase().includes(searchTerm) ||
        transaction.date.includes(searchTerm) ||
        transaction.amount.toString().includes(searchTerm)
    );
    renderFilteredTransactions(filteredTransactions);
}

function renderFilteredTransactions(filteredTransactions) {
    transactionsList.innerHTML = '';
    filteredTransactions.forEach((transaction, index) => {
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
const googleSignInBtn = document.getElementById('googleSignInBtn');

// Event listener for Google Sign-In
googleSignInBtn.addEventListener('click', googleSignIn);

function googleSignIn() {
    const provider = new firebase.auth.GoogleAuthProvider();

    auth.signInWithPopup(provider)
        .then((result) => {
            // Successfully signed in with Google
            const user = result.user;
            // Save user data or redirect
            window.location.href = 'dashboard.html'; // Redirect to dashboard after successful login
        })
        .catch((error) => {
            // Handle Errors here.
            const errorCode = error.code;
            const errorMessage = error.message;
            const email = error.email;
            const credential = error.credential;
            console.error('Error during Google Sign-In:', errorCode, errorMessage, email, credential);
            alert('Google Sign-In failed: ' + errorMessage);
        });
}
function saveTransactions() {
    auth.onAuthStateChanged((user) => {
        if (user) {
            database.ref('users/' + user.uid + '/transactions').set(transactions);
        }
    });
}
}