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
    const googleSignInBtn = document.getElementById('googleSignInBtn');

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

    // Google Sign-In
    googleSignInBtn.addEventListener('click', () => {
        const provider = new firebase.auth.GoogleAuthProvider();
        auth.signInWithPopup(provider)
            .then((result) => {
                const user = result.user;
                database.ref('users/' + user.uid).once('value').then((snapshot) => {
                    if (!snapshot.exists()) {
                        database.ref('users/' + user.uid).set({
                            email: user.email,
                            transactions: []
                        });
                    }
                    window.location.href = 'dashboard.html';
                });
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
    const helpBtn = document.getElementById('helpBtn');
    const transactionForm = document.getElementById('transactionForm');
    const balanceView = document.getElementById('balanceView');
    const summaryView = document.getElementById('summaryView');
    const helpSection = document.getElementById('helpSection');
    const transactionInputForm = document.getElementById('transactionInputForm');
    const transactionsList = document.getElementById('transactions');
    const currentBalanceElement = document.getElementById('currentBalance');
    const summaryResults = document.getElementById('summaryResults');
    const searchTransactions = document.getElementById('searchTransactions');
    const chatbotMessages = document.getElementById('chatbotMessages');
    const userInput = document.getElementById('userInput');
    const sendMessage = document.getElementById('sendMessage');

    // New Filter Elements
    const filterType = document.getElementById('filterType');
    const filterCategory = document.getElementById('filterCategory');
    const filterSortBy = document.getElementById('filterSortBy');
    const filterSortOrder = document.getElementById('filterSortOrder');

    // Export Buttons
    const exportPdfBtn = document.getElementById('exportPdfBtn');
    const exportCsvBtn = document.getElementById('exportCsvBtn');

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
    helpBtn.addEventListener('click', () => showSection(helpSection));
    transactionInputForm.addEventListener('submit', addTransaction);
    
    // Filter Event Listeners
    filterType.addEventListener('change', applyFilters);
    filterCategory.addEventListener('change', applyFilters);
    filterSortBy.addEventListener('change', applyFilters);
    filterSortOrder.addEventListener('change', applyFilters);
    searchTransactions.addEventListener('input', applyFilters);

    // Export Event Listeners
    exportPdfBtn.addEventListener('click', exportAsPDF);
    exportCsvBtn.addEventListener('click', exportAsCSV);

    // Function to load user data from Firebase
    function loadUserData(user) {
        database.ref('users/' + user.uid + '/transactions').on('value', (snapshot) => {
            const data = snapshot.val() || [];
            // Assign unique IDs if they don't exist
            transactions = data.map(t => t.id ? t : { ...t, id: Date.now() + Math.random() });
            populateCategoryFilter(); // Populate categories
            applyFilters(); // Apply filters to render transactions
            updateBalance();
        });
    }

    // Function to populate the Category filter dynamically
    function populateCategoryFilter() {
        const categories = Array.from(new Set(transactions.map(t => t.category)));
        filterCategory.innerHTML = '<option value="all">All</option>' + 
            categories.map(cat => `<option value="${cat}">${cat}</option>`).join('');
    }

    // Function to show a specific section and hide others
    function showSection(section) {
        // Hide all sections
        transactionForm.classList.add('hidden');
        balanceView.classList.add('hidden');
        summaryView.classList.add('hidden');
        helpSection.classList.add('hidden');
        // Show the selected section
        section.classList.remove('hidden');
        section.style.animation = 'none';
        section.offsetHeight; // Trigger reflow
        section.style.animation = null;
        if (section === balanceView) updateBalance();
        if (section === summaryView) generateSummary();
    }

    // Function to add a new transaction
    function addTransaction(e) {
        e.preventDefault();
        const transaction = {
            id: Date.now(), // Unique ID
            type: document.getElementById('transactionType').value,
            amount: parseFloat(document.getElementById('amount').value),
            category: document.getElementById('category').value,
            date: document.getElementById('date').value
        };
        transactions.push(transaction);
        saveTransactions();
        populateCategoryFilter();
        applyFilters();
        transactionInputForm.reset();
    }

    // Function to render transactions (filtered and sorted)
    function renderTransactions(transactionsToRender = transactions) {
        transactionsList.innerHTML = '';
        transactionsToRender.forEach((transaction) => {
            const li = document.createElement('li');
            li.innerHTML = `
                <span>
                    <i class="fas fa-${transaction.type === 'income' ? 'plus' : 'minus'}"></i>
                    ${transaction.date} - ${capitalizeFirstLetter(transaction.type)}: $${transaction.amount.toFixed(2)} (${transaction.category})
                </span>
                <div>
                    <button onclick="editTransaction(${transaction.id})" class="btn-edit"><i class="fas fa-edit"></i></button>
                    <button onclick="deleteTransaction(${transaction.id})" class="btn-delete"><i class="fas fa-trash"></i></button>
                </div>
            `;
            li.classList.add(transaction.type);
            transactionsList.appendChild(li);
        });
    }

    // Function to edit a transaction
    function editTransaction(id) {
        const index = transactions.findIndex(t => t.id === id);
        if (index === -1) return;
        const transaction = transactions[index];
        document.getElementById('transactionType').value = transaction.type;
        document.getElementById('amount').value = transaction.amount;
        document.getElementById('category').value = transaction.category;
        document.getElementById('date').value = transaction.date;
        transactions.splice(index, 1);
        saveTransactions();
        populateCategoryFilter();
        applyFilters();
        showSection(transactionForm);
    }

    // Function to delete a transaction
    function deleteTransaction(id) {
        if (confirm('Are you sure you want to delete this transaction?')) {
            const index = transactions.findIndex(t => t.id === id);
            if (index === -1) return;
            transactions.splice(index, 1);
            saveTransactions();
            populateCategoryFilter();
            applyFilters();
        }
    }

    // Function to update the current balance
    function updateBalance() {
        const balance = transactions.reduce((total, transaction) => {
            return transaction.type === 'income' ? total + transaction.amount : total - transaction.amount;
        }, 0);
        currentBalanceElement.textContent = `$${balance.toFixed(2)}`;
        currentBalanceElement.classList.remove('positive', 'negative');
        currentBalanceElement.classList.add(balance >= 0 ? 'positive' : 'negative');
    }

    // Function to generate financial summary
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
    
    // Function to apply filters and sort transactions
    function applyFilters() {
        let filteredTransactions = [...transactions];
        
        // Filter by Type
        const type = filterType.value;
        if (type !== 'all') {
            filteredTransactions = filteredTransactions.filter(t => t.type === type);
        }
        
        // Filter by Category
        const category = filterCategory.value;
        if (category !== 'all') {
            filteredTransactions = filteredTransactions.filter(t => t.category === category);
        }
        
        // Search Filter
        const searchQuery = searchTransactions.value.toLowerCase();
        if (searchQuery) {
            filteredTransactions = filteredTransactions.filter(t => 
                t.category.toLowerCase().includes(searchQuery) ||
                t.type.toLowerCase().includes(searchQuery)
                // Add more fields if needed
            );
        }
        
        // Sort
        const sortBy = filterSortBy.value;
        const sortOrder = filterSortOrder.value;
        
        filteredTransactions.sort((a, b) => {
            let comparison = 0;
            if (sortBy === 'date') {
                comparison = new Date(a.date) - new Date(b.date);
            } else if (sortBy === 'amount') {
                comparison = a.amount - b.amount;
            } else if (sortBy === 'category') {
                comparison = a.category.localeCompare(b.category);
            }
            
            return sortOrder === 'asc' ? comparison : -comparison;
        });
        
        // Render the filtered and sorted transactions
        renderTransactions(filteredTransactions);
    }

    // Function to save transactions to Firebase
    function saveTransactions() {
        const user = auth.currentUser;
        if (user) {
            database.ref('users/' + user.uid + '/transactions').set(transactions);
        }
    }

    // Helper function to capitalize first letter
    function capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

    // Chatbot Functionality
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

    // Placeholder for AI response function
    async function getAIResponse(prompt) {
        // Implement AI interaction here, e.g., using OpenAI API
        // For demonstration purposes, we'll return a dummy response
        return "This is a placeholder response. Implement the AI logic to generate meaningful financial advice.";
    }

    // Expose editTransaction and deleteTransaction to the global scope for onclick handlers
    window.editTransaction = editTransaction;
    window.deleteTransaction = deleteTransaction;

    // Export Functions

    // Function to export transactions as CSV
    function exportAsCSV() {
        if (transactions.length === 0) {
            alert('No transactions to export.');
            return;
        }

        const headers = ['Date', 'Type', 'Category', 'Amount'];
        const rows = transactions.map(t => [t.date, capitalizeFirstLetter(t.type), t.category, t.amount.toFixed(2)]);

        let csvContent = "data:text/csv;charset=utf-8," 
            + headers.join(",") + "\n"
            + rows.map(e => e.join(",")).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        const user = auth.currentUser;
        const filename = user ? `${user.uid}_transactions_${new Date().toISOString()}.csv` : `transactions_${new Date().toISOString()}.csv`;
        link.setAttribute("download", filename);
        document.body.appendChild(link); // Required for FF

        link.click();
        document.body.removeChild(link);
    }

    // Function to export transactions as PDF
    function exportAsPDF() {
        if (transactions.length === 0) {
            alert('No transactions to export.');
            return;
        }

        // Initialize jsPDF
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        // Title
        doc.setFontSize(18);
        doc.text("Student Finance Manager - Transactions", 14, 22);

        // Prepare data for AutoTable
        const headers = [["Date", "Type", "Category", "Amount"]];
        const rows = transactions.map(t => [t.date, capitalizeFirstLetter(t.type), t.category, `$${t.amount.toFixed(2)}`]);

        // Add AutoTable
        doc.autoTable({
            head: headers,
            body: rows,
            startY: 30,
            styles: { halign: 'left' },
            headStyles: { fillColor: [41, 128, 185] }
        });

        // Footer
        const pageCount = doc.getNumberOfPages();
        doc.setFontSize(10);
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.text(`Exported on ${new Date().toLocaleString()}`, 14, doc.internal.pageSize.height - 10);
        }

        // Save the PDF
        const user = auth.currentUser;
        const filename = user ? `${user.uid}_transactions_${new Date().toISOString()}.pdf` : `transactions_${new Date().toISOString()}.pdf`;
        doc.save(filename);
    }
}
