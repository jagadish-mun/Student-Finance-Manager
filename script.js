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
    const chatbotMessages = document.getElementById('chatbotMessages');
    const userInput = document.getElementById('userInput');
    const sendMessage = document.getElementById('sendMessage');

    // Check auth state
    auth.onAuthStateChanged((user) => {
        if (user) {
            loadUserData(user);
            showSection(transactionForm); // Show "Add Transaction" by default when dashboard loads
            initializeChatbot(); // Initialize chatbot when the dashboard loads
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
            <ul class="category-list">
                ${Object.entries(categorySummary).map(([category, amount]) => `
                    <li>${category}: $${amount.toFixed(2)}</li>
                `).join('')}
            </ul>
        `;
    }
    
    function filterTransactions() {
        const query = searchTransactions.value.toLowerCase();
        Array.from(transactionsList.children).forEach(li => {
            const text = li.textContent.toLowerCase();
            li.style.display = text.includes(query) ? '' : 'none';
        });
    }

    function saveTransactions() {
        const user = auth.currentUser;
        if (user) {
            database.ref('users/' + user.uid + '/transactions').set(transactions);
        }
    }

    // New and updated functions for chatbot functionality
    function initializeChatbot() {
        if (chatbotMessages) {
            chatbotMessages.innerHTML = '<p class="bot-message">Hello! I\'m your financial assistant. How can I help you today?</p>';
        }
        if (sendMessage) {
            sendMessage.addEventListener('click', handleChatbotInteraction);
        }
        if (userInput) {
            userInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    handleChatbotInteraction();
                }
            });
        }
    }

    async function handleChatbotInteraction() {
        if (!userInput || !chatbotMessages) return;

        const userMessage = userInput.value.trim();
        if (userMessage === '') return;

        // Display user message
        chatbotMessages.innerHTML += `<p class="user-message">${userMessage}</p>`;
        userInput.value = '';

        // Generate chatbot response
        const prompt = await generateFinancialReportPrompt();
        const aiResponse = await getAIResponse(prompt + "\n\nUser question: " + userMessage);

        // Display chatbot response
        chatbotMessages.innerHTML += `<p class="bot-message">${aiResponse}</p>`;

        // Scroll to bottom of chat
        chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
    }

    async function generateFinancialReportPrompt() {
        const income = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
        const expenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
        const balance = income - expenses;

        const categorySummary = transactions.reduce((summary, t) => {
            if (!summary[t.category]) summary[t.category] = 0;
            summary[t.category] += t.amount;
            return summary;
        }, {});

        const prompt = `
            Financial Summary:
            Total Income: $${income.toFixed(2)}
            Total Expenses: $${expenses.toFixed(2)}
            Current Balance: $${balance.toFixed(2)}

            Category Breakdown:
            ${Object.entries(categorySummary).map(([category, amount]) => `${category}: $${amount.toFixed(2)}`).join('\n')}

            Based on this financial information, provide advice and answer the following question:
        `;

        return prompt;
    }

    // Note: The getAIResponse function is not provided in the given code snippets.
    // You'll need to implement this function to interact with your AI service.
    // async function getAIResponse(prompt) {
    //     // Implement AI interaction here
    // }
}