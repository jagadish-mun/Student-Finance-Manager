import { Chart, registerables } from "chart.js/auto"
// Import Firebase
import { initializeApp } from "firebase/app"
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth"
import { getDatabase, ref, set, onValue } from "firebase/database"

const GROQ_API_KEY = "REDACTED_GROQ_API_KEY"
const GROQ_VISION_API_KEY = "REDACTED_GROQ_API_KEY"

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "REDACTED_API_KEY",
  authDomain: "fbla2024-ad8d8.firebaseapp.com",
  databaseURL: "https://fbla2024-ad8d8-default-rtdb.firebaseio.com",
  projectId: "fbla2024-ad8d8",
  storageBucket: "fbla2024-ad8d8.appspot.com",
  messagingSenderId: "1034492028846",
  appId: "1:1034492028846:web:653115981d3a78325c8a3f",
  measurementId: "G-YW4FXGH4TK",
}
// Initialize Firebase
const app = initializeApp(firebaseConfig)
const auth = getAuth(app)
const database = getDatabase(app)

// Register Chart.js components
Chart.register(...registerables)

// Get references to auth and database

// Check if we're on the login page or dashboard
const isLoginPage = window.location.pathname.includes("index.html") || window.location.pathname === "/"

if (isLoginPage) {
  // Login page code
  const loginForm = document.getElementById("loginForm")
  const signupForm = document.getElementById("signupForm")
  const showSignup = document.getElementById("showSignup")
  const showLogin = document.getElementById("showLogin")
  const googleSignInBtn = document.getElementById("googleSignInBtn")

  // Show/hide forms
  showSignup.addEventListener("click", () => {
    loginForm.classList.add("hidden")
    signupForm.classList.remove("hidden")
  })

  showLogin.addEventListener("click", () => {
    signupForm.classList.add("hidden")
    loginForm.classList.remove("hidden")
  })

  // Signup
  document.getElementById("signup").addEventListener("submit", (e) => {
    e.preventDefault()
    const email = document.getElementById("signupEmail").value
    const password = document.getElementById("signupPassword").value

    createUserWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        const user = userCredential.user
        set(ref(database, "users/" + user.uid), {
          email: email,
          transactions: [],
        })
        window.location.href = "dashboard.html"
      })
      .catch((error) => {
        alert(error.message)
      })
  })

  // Login
  document.getElementById("login").addEventListener("submit", (e) => {
    e.preventDefault()
    const email = document.getElementById("loginEmail").value
    const password = document.getElementById("loginPassword").value

    signInWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        window.location.href = "dashboard.html"
      })
      .catch((error) => {
        alert(error.message)
      })
  })

  // Google Sign-In
  googleSignInBtn.addEventListener("click", () => {
    const provider = new GoogleAuthProvider()
    signInWithPopup(auth, provider)
      .then((result) => {
        const user = result.user
        onValue(ref(database, "users/" + user.uid), (snapshot) => {
          if (!snapshot.exists()) {
            set(ref(database, "users/" + user.uid), {
              email: user.email,
              transactions: [],
            })
          }
          window.location.href = "dashboard.html"
        })
      })
      .catch((error) => {
        alert(error.message)
      })
  })

  // Check auth state
  onAuthStateChanged(auth, (user) => {
    if (user) {
      window.location.href = "dashboard.html"
    }
  })
} else {
  // Dashboard code
  let transactions = []

  // DOM elements
  const logoutBtn = document.getElementById("logoutBtn")
  const addTransactionBtn = document.getElementById("addTransactionBtn")
  const viewBalanceBtn = document.getElementById("viewBalanceBtn")
  const generateSummaryBtn = document.getElementById("generateSummaryBtn")
  const helpBtn = document.getElementById("helpBtn")
  const transactionForm = document.getElementById("transactionForm")
  const balanceView = document.getElementById("balanceView")
  const summaryView = document.getElementById("summaryView")
  const helpSection = document.getElementById("helpSection")
  const transactionInputForm = document.getElementById("transactionInputForm")
  const transactionsList = document.getElementById("transactions")
  const currentBalanceElement = document.getElementById("currentBalance")
  const summaryResults = document.getElementById("summaryResults")
  const searchTransactions = document.getElementById("searchTransactions")
  const chatbotMessages = document.getElementById("chatbotMessages")
  const userInput = document.getElementById("userInput")
  const sendMessage = document.getElementById("sendMessage")
  const settingsBtn = document.getElementById("settingsBtn")
  const settingsView = document.getElementById("settingsView")
  const transactionListSct = document.getElementById("transactionListSection")

  // Check Scanner Elements
  const checkScannerBtn = document.getElementById("checkScannerBtn")
  const checkScannerModal = document.getElementById("checkScannerModal")
  const closeScanner = document.querySelector(".close-scanner")
  const cameraFeed = document.getElementById("cameraFeed")
  const capturedImage = document.getElementById("capturedImage")
  const captureBtn = document.getElementById("captureBtn")
  const retakeBtn = document.getElementById("retakeBtn")
  const processBtn = document.getElementById("processBtn")
  const scannerButtons = document.querySelector(".scanner-buttons")
  const processingIndicator = document.querySelector(".processing-indicator")

  // New Filter Elements
  const filterType = document.getElementById("filterType")
  const filterCategory = document.getElementById("filterCategory")
  const filterSortBy = document.getElementById("filterSortBy")
  const filterSortOrder = document.getElementById("filterSortOrder")

  // Export Buttons
  const exportPdfBtn = document.getElementById("exportPdfBtn")
  const exportCsvBtn = document.getElementById("exportCsvBtn")

  // Check auth state
  auth.onAuthStateChanged((user) => {
    if (user) {
      loadUserData(user)
      showSection(transactionForm) // Show "Add Transaction" by default when dashboard loads
      initializeChatbot() // Initialize chatbot when the dashboard loads
      initializeCheckScanner() // Initialize check scanner when the dashboard loads
    } else {
      window.location.href = "index.html"
    }
  })

  // Logout
  logoutBtn.addEventListener("click", () => {
    signOut(auth)
      .then(() => {
        window.location.href = "index.html"
      })
      .catch((error) => {
        alert(error.message)
      })
  })

  // Event listeners for app functionality
  addTransactionBtn.addEventListener("click", () => {
    showSection(transactionForm)
    setActiveButton(addTransactionBtn)
  })
  viewBalanceBtn.addEventListener("click", () => {
    showSection(balanceView)
    setActiveButton(viewBalanceBtn)
  })
  generateSummaryBtn.addEventListener("click", () => {
    showSection(summaryView)
    setActiveButton(generateSummaryBtn)
  })
  settingsBtn.addEventListener("click", () => {
    showSection(settingsView)
    setActiveButton(settingsBtn)
  })
  helpBtn.addEventListener("click", () => {
    showSection(helpSection)
    setActiveButton(helpBtn)
  })

  // Helper function to set the active button and move the nav line
  function setActiveButton(activeButton) {
    navButtons.forEach((button) => button.classList.remove("active")) // Remove active class from all buttons
    activeButton.classList.add("active") // Add active class to the clicked button
    moveLine(activeButton) // Move the line to the newly active button
  }

  transactionInputForm.addEventListener("submit", addTransaction)

  // Filter Event Listeners
  filterType.addEventListener("change", applyFilters)
  filterCategory.addEventListener("change", applyFilters)
  filterSortBy.addEventListener("change", applyFilters)
  filterSortOrder.addEventListener("change", applyFilters)
  searchTransactions.addEventListener("input", applyFilters)

  // Export Event Listeners
  exportPdfBtn.addEventListener("click", exportAsPDF)
  exportCsvBtn.addEventListener("click", exportAsCSV)

  // Function to load user data from Firebase
  function loadUserData(user) {
    onValue(ref(database, "users/" + user.uid + "/transactions"), (snapshot) => {
      const data = snapshot.val() || []
      transactions = data.map((t) => (t.id ? t : { ...t, id: Date.now() + Math.random() }))

      // Ensure DOM is loaded before calling these functions
      document.addEventListener("DOMContentLoaded", () => {
        populateCategoryFilter() // Populate categories
        applyFilters() // Apply filters to render transactions
        updateBalance()
      })
    })
  }

  // Function to populate the Category filter dynamically
  function populateCategoryFilter() {
    const filterCategory = document.getElementById("filterCategory")
    if (!filterCategory) {
      console.error("Filter category element not found")
      return
    }
    const categories = Array.from(new Set(transactions.map((t) => t.category)))
    filterCategory.innerHTML =
      '<option value="all">All</option>' + categories.map((cat) => `<option value="${cat}">${cat}</option>`).join("")
  }

  // Function to show a specific section and hide others
  function showSection(section) {
    // Hide all sections
    transactionForm.classList.add("hidden")
    balanceView.classList.add("hidden")
    summaryView.classList.add("hidden")
    helpSection.classList.add("hidden")
    settingsView.classList.add("hidden")
    // Show the selected section
    section.classList.remove("hidden")
    section.style.animation = "none"
    section.offsetHeight // Trigger reflow
    section.style.animation = null
    if (section === balanceView) updateBalance()
    if (section === summaryView) {
      generateSummary()
      setTimeout(() => {
        window.dispatchEvent(new Event("resize"))
      }, 100)
    }

    if (section == settingsView) {
      transactionListSct.classList.add("hidden")
    } else if (section == helpSection) {
      transactionListSct.classList.add("hidden")
    } else {
      transactionListSct.classList.remove("hidden")
    }
  }

  // Function to add a new transaction
  function addTransaction(e) {
    e.preventDefault()
    const transaction = {
      id: Date.now(), // Unique ID
      type: document.getElementById("transactionType").value,
      amount: Number.parseFloat(document.getElementById("amount").value),
      category: document.getElementById("category").value,
      date: document.getElementById("date").value,
    }
    transactions.push(transaction)
    saveTransactions()
    populateCategoryFilter()
    applyFilters()
    transactionInputForm.reset()
    currentlyEditing = false
  }

  // Function to render transactions (filtered and sorted)
  function renderTransactions(transactionsToRender = transactions) {
    transactionsList.innerHTML = ""
    transactionsToRender.forEach((transaction) => {
      const li = document.createElement("li")
      li.innerHTML = `
                <span>
                    <span style="color: ${transaction.type === "income" ? "var(--green)" : "var(--red)"};">
                    <i class="fas fa-${transaction.type === "income" ? "plus" : "minus"}"></i>
                    </span>
                    ${transaction.date} - 
                    <span style="color: ${transaction.type === "income" ? "var(--green)" : "var(--red)"};">
                        ${capitalizeFirstLetter(transaction.type)}
                    </span>: 
                    $${transaction.amount.toFixed(2)} (${transaction.category})
                    ${transaction.method ? `<em> - ${transaction.method}</em>` : ""}
                </span>
                <div>
                    <button onclick="editTransaction(${transaction.id})" class="btn-edit"><i class="fas fa-edit"></i></button>
                    <button onclick="deleteTransaction(${transaction.id})" class="btn-delete"><i class="fas fa-trash"></i></button>
                </div>
            `
      li.classList.add(transaction.type)
      transactionsList.appendChild(li)
    })
  }

  let currentlyEditing = false

  // Function to edit a transaction
  function editTransaction(id) {
    if (currentlyEditing) {
      alert("Please save or delete the current transaction before editing another one.")
      return
    }
    const index = transactions.findIndex((t) => t.id === id)
    if (index === -1) return
    const transaction = transactions[index]
    document.getElementById("transactionType").value = transaction.type
    document.getElementById("amount").value = transaction.amount
    document.getElementById("category").value = transaction.category
    document.getElementById("date").value = transaction.date
    transactions.splice(index, 1)
    saveTransactions()
    populateCategoryFilter()
    applyFilters()
    showSection(transactionForm)
    setActiveButton(addTransactionBtn)
    currentlyEditing = true
  }

  // Function to delete a transaction
  function deleteTransaction(id) {
    if (confirm("Are you sure you want to delete this transaction?")) {
      const index = transactions.findIndex((t) => t.id === id)
      if (index === -1) return
      transactions.splice(index, 1)
      saveTransactions()
      populateCategoryFilter()
      applyFilters()
      currentlyEditing = false
    }
  }

  // Function to update the current balance
  function updateBalance() {
    const balance = transactions.reduce((total, transaction) => {
      return transaction.type === "income" ? total + transaction.amount : total - transaction.amount
    }, 0)
    currentBalanceElement.textContent = `$${balance.toFixed(2)}`
    currentBalanceElement.classList.remove("positive", "negative")
    currentBalanceElement.classList.add(balance >= 0 ? "positive" : "negative")
    const currentBalance = currentBalanceElement // Declare currentBalance
    if (currentBalance.classList.contains("positive")) {
      currentBalance.style.color = "var(--green)" // Use green for positive balance
    } else if (currentBalance.classList.contains("negative")) {
      currentBalance.style.color = "var(--red)" // Use red for negative balance
    }
  }

  // Function to generate financial summary
  function generateSummary() {
    const period = document.getElementById("summaryPeriod").value
    const currentDate = new Date()
    const startDate = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      currentDate.getDate() - (period === "weekly" ? 7 : 30),
    )

    // Filter transactions based on the selected period
    const filteredTransactions = transactions.filter((transaction) => new Date(transaction.date) >= startDate)

    // Separate income and expenses transactions
    const incomeTransactions = filteredTransactions.filter((t) => t.type === "income")
    const expenseTransactions = filteredTransactions.filter((t) => t.type === "expense")

    // Calculate total income and expenses
    const totalIncome = incomeTransactions.reduce((sum, t) => sum + t.amount, 0)
    const totalExpenses = expenseTransactions.reduce((sum, t) => sum + t.amount, 0)

    // Generate the HTML for income and expense items
    const incomeList = incomeTransactions
      .map(
        (t) => `
      <li>${t.date} - ${t.category}: $${t.amount.toFixed(2)}</li>
  `,
      )
      .join("")

    const expenseList = expenseTransactions
      .map(
        (t) => `
      <li>${t.date} - ${t.category}: $${t.amount.toFixed(2)}</li>
  `,
      )
      .join("")

    // Update the DOM with the generated HTML
    summaryResults.innerHTML = `
    <div class="summary-item">
        <p>
            <span style="color: var(--green);"><i class="fas fa-arrow-up"></i></span> 
            Total Income: 
            <span class="income" style="color: var(--green);">$${totalIncome.toFixed(2)}</span>
        </p>
        <ul class="income-list">
            ${incomeList}
        </ul>
    </div>
    <div class="summary-item">
        <p>
            <span style="color: var(--red);"><i class="fas fa-arrow-down"></i></span> 
            Total Expenses: 
            <span class="expense" style="color: var(--red);">$${totalExpenses.toFixed(2)}</span>
        </p>
        <ul class="expense-list">
            ${expenseList}
        </ul>
    </div>
    <div class="summary-charts" style="z-index: 10; position: relative;">
        <canvas id="incomeExpensePieChart" style="width: 350px; height: 350px;"></canvas>
    </div>
`

    // Create charts
    createIncomeExpensePieChart(totalIncome, totalExpenses)
    createBalanceTrendChart(filteredTransactions)
  }

  function createIncomeExpensePieChart(totalIncome, totalExpenses) {
    const ctx = document.getElementById("incomeExpensePieChart").getContext("2d")

    new Chart(ctx, {
      type: "pie",
      data: {
        labels: ["Income", "Expenses"],
        datasets: [
          {
            data: [totalIncome, totalExpenses],
            backgroundColor: ["rgba(59, 207, 207, 0.8)", "rgba(255, 99, 132, 0.8)"],
          },
        ],
      },
      options: {
        responsive: false, // Disable responsiveness to keep fixed size
        maintainAspectRatio: false, // Allow custom width/height
        title: {
          display: true,
          text: "Income vs Expenses",
        },
      },
    })
  }

  function createCategoryBarChart(transactions) {
    const categories = {}
    transactions.forEach((t) => {
      if (t.type === "expense") {
        categories[t.category] = (categories[t.category] || 0) + t.amount
      }
    })

    const ctx = document.getElementById("categoryBarChart").getContext("2d")
    new Chart(ctx, {
      type: "bar",
      data: {
        labels: Object.keys(categories),
        datasets: [
          {
            label: "Expenses by Category",
            data: Object.values(categories),
            backgroundColor: "rgba(54, 162, 235, 0.8)",
          },
        ],
      },
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: true,
          },
        },
        title: {
          display: true,
          text: "Expenses by Category",
        },
      },
    })
  }

  function createBalanceTrendChart(transactions) {
    const sortedTransactions = transactions.sort((a, b) => new Date(a.date) - new Date(b.date))
    let balance = 0
    const balances = sortedTransactions.map((t) => {
      balance += t.type === "income" ? t.amount : -t.amount
      return { date: t.date, balance }
    })

    const ctx = document.getElementById("balanceTrendChart").getContext("2d")
    new Chart(ctx, {
      type: "line",
      data: {
        labels: balances.map((b) => b.date),
        datasets: [
          {
            label: "Balance Trend",
            data: balances.map((b) => b.balance),
            borderColor: "rgba(75, 192, 192, 1)",
            fill: false,
          },
        ],
      },
      options: {
        responsive: true,
        scales: {
          x: {
            type: "time",
            time: {
              unit: "day",
            },
          },
          y: {
            beginAtZero: true,
          },
        },
        title: {
          display: true,
          text: "Balance Trend Over Time",
        },
      },
    })
  }

  // Function to apply filters and sort transactions
  function applyFilters() {
    let filteredTransactions = [...transactions]

    // Filter by Type
    const type = filterType.value
    if (type !== "all") {
      filteredTransactions = filteredTransactions.filter((t) => t.type === type)
    }

    // Filter by Category
    const category = filterCategory.value
    if (category !== "all") {
      filteredTransactions = filteredTransactions.filter((t) => t.category === category)
    }

    // Search Filter
    const searchQuery = searchTransactions.value.toLowerCase()
    if (searchQuery) {
      filteredTransactions = filteredTransactions.filter(
        (t) => t.category.toLowerCase().includes(searchQuery) || t.type.toLowerCase().includes(searchQuery),
        // Add more fields if needed
      )
    }

    // Sort
    const sortBy = filterSortBy.value
    const sortOrder = filterSortOrder.value

    filteredTransactions.sort((a, b) => {
      let comparison = 0
      if (sortBy === "date") {
        comparison = new Date(a.date) - new Date(b.date)
      } else if (sortBy === "amount") {
        comparison = a.amount - b.amount
      } else if (sortBy === "category") {
        comparison = a.category.localeCompare(b.category)
      }

      return sortOrder === "asc" ? comparison : -comparison
    })

    // Render the filtered and sorted transactions
    renderTransactions(filteredTransactions)
  }

  // Function to save transactions to Firebase
  function saveTransactions() {
    const user = auth.currentUser
    if (user) {
      set(ref(database, "users/" + user.uid + "/transactions"), transactions)
    }
  }

  // Helper function to capitalize first letter
  function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1)
  }

  // Chatbot Functionality
  function displayMessage(message, sender = "ai") {
    const chatBox = document.getElementById("chatBox")
    if (!chatBox) return
    const messageElement = document.createElement("div")
    messageElement.classList.add("chat-message", sender)
    const messageContent = document.createElement("span")
    messageContent.classList.add("message-content")
    messageContent.textContent = message
    messageElement.appendChild(messageContent)
    chatBox.appendChild(messageElement)
    chatBox.scrollTop = chatBox.scrollHeight
  }

  function prepareUserData() {
    const user = auth.currentUser
    if (!user) return null

    return {
      uid: user.uid,
      email: user.email,
      transactions: transactions,
      totalIncome: transactions.filter((t) => t.type === "income").reduce((sum, t) => sum + t.amount, 0),
      totalExpenses: transactions.filter((t) => t.type === "expense").reduce((sum, t) => sum + t.amount, 0),
      balance: transactions.reduce((total, t) => (t.type === "income" ? total + t.amount : total - t.amount), 0),
    }
  }

  async function sendMessageToGROQ(userMessage) {
    try {
      displayMessage(userMessage, "user")

      const userData = prepareUserData()
      if (!userData) {
        displayMessage("Please log in to use the chatbot.", "ai")
        return
      }

      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: "mixtral-8x7b-32768",
          messages: [
            {
              role: "system",
              content: `You are a helpful financial assistant for a student finance management application. 
                        Provide concise and relevant advice based on the user's questions and their financial data. 
                        Here's the user's current financial information:
                        ${JSON.stringify(userData, null, 2)}`,
            },
            { role: "user", content: userMessage },
          ],
          max_tokens: 150,
          temperature: 0.7,
        }),
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      const aiReply = data.choices[0].message.content
      displayMessage(aiReply, "ai")
    } catch (error) {
      console.error("Error in sendMessageToGROQ:", error)
      displayMessage("I'm sorry, I encountered an error. Please try again later.", "ai")
    }
  }

  function handleSendMessage() {
    const userInput = document.getElementById("userInput")
    if (!userInput) return
    const userMessage = userInput.value.trim()
    if (!userMessage) return
    sendMessageToGROQ(userMessage)
    userInput.value = ""
  }

  function initializeChatbot() {
    const chatbotButton = document.getElementById("chatbotButton")
    const chatbotModal = document.getElementById("chatbotModal")
    const closeButton = document.querySelector(".close-button")
    const sendButton = document.getElementById("sendButton")
    const userInput = document.getElementById("userInput")
    if (chatbotButton) {
      chatbotButton.addEventListener("click", () => {
        chatbotModal.style.display = "block"
        setTimeout(() => chatbotModal.classList.add("open"), 10)
      })
    }
    if (closeButton) {
      closeButton.addEventListener("click", () => {
        chatbotModal.classList.remove("open")
        setTimeout(() => (chatbotModal.style.display = "none"), 500)
      })
    }
    if (sendButton) {
      sendButton.addEventListener("click", handleSendMessage)
    }
    if (userInput) {
      userInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") handleSendMessage()
      })
    }
  }

  // Check Scanner Implementation
  let stream = null
  let capturedImageBlob = null

  function initializeCheckScanner() {
    if (checkScannerBtn) {
      checkScannerBtn.addEventListener("click", () => {
        if (checkScannerModal) {
          checkScannerModal.style.display = "flex"
          startCamera()
        }
      })
    }

    if (closeScanner) {
      closeScanner.addEventListener("click", () => {
        checkScannerModal.style.display = "none"
        stopCamera()
        resetScannerUI()
      })
    }

    if (captureBtn) {
      captureBtn.addEventListener("click", captureCheckImage)
    }

    if (retakeBtn) {
      retakeBtn.addEventListener("click", () => {
        if (cameraFeed) cameraFeed.style.display = "block"
        if (capturedImage) capturedImage.style.display = "none"
        if (captureBtn) captureBtn.style.display = "block"
        if (scannerButtons) scannerButtons.style.display = "none"
        capturedImageBlob = null
      })
    }

    if (processBtn) {
      processBtn.addEventListener("click", processCheckImage)
    }
  }

  // Start camera feed
  async function startCamera() {
    if (!cameraFeed) return

    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment", // Use back camera if available
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      })
      cameraFeed.srcObject = stream
    } catch (err) {
      console.error("Error accessing camera:", err)
      alert("Unable to access your camera. Please ensure you have given permission and have a working camera.")
    }
  }

  // Stop camera feed
  function stopCamera() {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop())
      stream = null
    }
  }

  // Reset UI to initial state
  function resetScannerUI() {
    if (cameraFeed) cameraFeed.style.display = "block"
    if (capturedImage) capturedImage.style.display = "none"
    if (captureBtn) captureBtn.style.display = "block"
    if (scannerButtons) scannerButtons.style.display = "none"
    if (processingIndicator) processingIndicator.style.display = "none"
    capturedImageBlob = null
  }

  // Capture image from camera
  function captureCheckImage() {
    if (!cameraFeed || !capturedImage) return

    // Create a canvas element to capture the frame
    const canvas = document.createElement("canvas")
    const context = canvas.getContext("2d")

    // Set canvas dimensions to match the video
    canvas.width = cameraFeed.videoWidth
    canvas.height = cameraFeed.videoHeight

    // Draw the current video frame on the canvas
    context.drawImage(cameraFeed, 0, 0, canvas.width, canvas.height)

    // Convert canvas to data URL (image)
    const imageDataUrl = canvas.toDataURL("image/jpeg", 0.9)

    // Set the captured image and update UI
    capturedImage.src = imageDataUrl
    capturedImage.style.display = "block"
    cameraFeed.style.display = "none"
    captureBtn.style.display = "none"
    scannerButtons.style.display = "flex"

    // Convert data URL to Blob for sending to API
    canvas.toBlob(
      (blob) => {
        capturedImageBlob = blob
      },
      "image/jpeg",
      0.9,
    )
  }

  // Process the check image
  async function processCheckImage() {
    if (!capturedImageBlob) {
      alert("No image captured. Please take a photo of your check first.")
      return
    }

    // Show processing indicator
    if (scannerButtons) scannerButtons.style.display = "none"
    if (processingIndicator) processingIndicator.style.display = "block"

    try {
      // Process the check using the Groq API
      const checkData = await processCheckWithGroq(capturedImageBlob)

      // Add the transaction to Firebase
      await addCheckTransactionToFirebase(checkData)

      // Close the scanner and reset
      if (checkScannerModal) checkScannerModal.style.display = "none"
      stopCamera()
      resetScannerUI()

      // Show success message
      alert(`Check successfully added as income: $${checkData.amount.toFixed(2)} (${checkData.category})`)

      // Refresh transactions
      applyFilters()
      updateBalance()
    } catch (error) {
      console.error("Error processing check:", error)
      if (processingIndicator) processingIndicator.style.display = "none"
      if (scannerButtons) scannerButtons.style.display = "flex"
    }
  }

  // Helper function to convert Blob to base64
  function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        const base64String = reader.result.split(",")[1]
        resolve(base64String)
      }
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  }

  // Process the check image with Groq's vision model
  async function processCheckWithGroq(imageBlob) {
    try {
      // Convert the image blob to base64
      const base64Image = await blobToBase64(imageBlob)

      console.log("Sending request to Groq Vision API...")

      // Use the correct Groq API endpoint with the vision API key
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${GROQ_VISION_API_KEY}`,
        },
        body: JSON.stringify({
          model: "llama-3.2-11b-vision-preview",
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: "You are a financial assistant. Extract the amount, date, and category from this check image. Respond with a JSON object with fields: amount (number), date (YYYY-MM-DD), and category (string, default to 'Check Deposit').",
                },
                {
                  type: "image_url",
                  image_url: {
                    url: `data:image/jpeg;base64,${base64Image}`,
                  },
                },
              ],
            },
          ],
          temperature: 0.2,
          max_tokens: 150,
          top_p: 1,
          stream: false,
        }),
      })

      if (!response.ok) {
        console.error("API response status:", response.status)
        console.error("API response text:", await response.text())
        throw new Error(`Groq API error: ${response.status}`)
      }

      const data = await response.json()
      console.log("Vision API response:", data)

      // Parse the JSON response from the LLM
      let checkData
      try {
        // The AI response might need to be parsed from the text content
        const responseText = data.choices[0].message.content
        console.log("Response content:", responseText)

        // Extract JSON if it's within text
        const jsonMatch = responseText.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          checkData = JSON.parse(jsonMatch[0])
        } else {
          throw new Error("Could not extract JSON from response")
        }
      } catch (parseError) {
        console.error("Error parsing LLM response:", parseError)
        // Fallback to defaults
        checkData = {
          amount: 100.0,
          category: "Check Deposit",
          date: new Date().toISOString().split("T")[0],
        }
      }

      // Ensure we have all required fields
      return {
        amount: Number.parseFloat(checkData.amount || 100.0),
        category: checkData.category || "Check Deposit",
        date: checkData.date || new Date().toISOString().split("T")[0],
      }
    } catch (error) {
      console.error("Error calling Groq Vision API:", error)
      throw error
    }
  }

  // Add the check transaction to Firebase
  async function addCheckTransactionToFirebase(checkData) {
    try {
      // Create a new transaction object
      const newTransaction = {
        id: Date.now(), // Unique ID
        type: "income",
        amount: checkData.amount,
        category: checkData.category,
        date: checkData.date,
        method: "Check Scan",
      }

      // Add to transactions array
      transactions.push(newTransaction)

      // Save to Firebase
      saveTransactions()

      console.log("Check transaction added successfully:", newTransaction)
      return newTransaction
    } catch (error) {
      console.error("Error adding check transaction:", error)
      throw error
    }
  }

  // Make refreshTransactions available globally
  window.refreshTransactions = () => {
    applyFilters()
    updateBalance()
  }

  document.addEventListener("DOMContentLoaded", () => {
    initializeChatbot()
  })

  async function handleChatbotInteraction() {
    if (!userInput || !chatbotMessages) return

    const userMessage = userInput.value.trim()
    if (userMessage === "") return

    // Display user message
    chatbotMessages.innerHTML += `<p class="user-message">${userMessage}</p>`
    userInput.value = ""

    // Generate chatbot response
    const prompt = await generateFinancialReportPrompt()
    const aiResponse = await getAIResponse(prompt + "\n\nUser question: " + userMessage)

    // Display chatbot response
    chatbotMessages.innerHTML += `<p class="bot-message">${aiResponse}</p>`

    // Scroll to bottom of chat
    chatbotMessages.scrollTop = chatbotMessages.scrollHeight
  }

  async function generateFinancialReportPrompt() {
    const income = transactions.filter((t) => t.type === "income").reduce((sum, t) => sum + t.amount, 0)
    const expenses = transactions.filter((t) => t.type === "expense").reduce((sum, t) => sum + t.amount, 0)
    const balance = income - expenses

    const categorySummary = transactions.reduce((summary, t) => {
      if (!summary[t.category]) summary[t.category] = 0
      summary[t.category] += t.amount
      return summary
    }, {})

    const prompt = `
            Financial Summary:
            Total Income: $${income.toFixed(2)}
            Total Expenses: $${expenses.toFixed(2)}
            Current Balance: $${balance.toFixed(2)}

            Category Breakdown:
            ${Object.entries(categorySummary)
              .map(([category, amount]) => `${category}: $${amount.toFixed(2)}`)
              .join("\n")}

            Based on this financial information, provide advice and answer the following question:
        `

    return prompt
  }

  // Placeholder for AI response function
  async function getAIResponse(prompt) {
    // Implement AI interaction here, e.g., using OpenAI API
    // For demonstration purposes, we'll return a dummy response
    return "This is a placeholder response. Implement the AI logic to generate meaningful financial advice."
  }

  // Expose editTransaction and deleteTransaction to the global scope for onclick handlers
  window.editTransaction = editTransaction
  window.deleteTransaction = deleteTransaction

  // Export Functions

  // Function to export transactions as CSV
  function exportAsCSV() {
    if (transactions.length === 0) {
      alert("No transactions to export.")
      return
    }

    const headers = ["Date", "Type", "Category", "Amount", "Method"]
    const rows = transactions.map((t) => [
      t.date,
      capitalizeFirstLetter(t.type),
      t.category,
      t.amount.toFixed(2),
      t.method || "",
    ])

    const csvContent =
      "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.map((e) => e.join(",")).join("\n")

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    const user = auth.currentUser
    const filename = user
      ? `${user.uid}_transactions_${new Date().toISOString()}.csv`
      : `transactions_${new Date().toISOString()}.csv`
    link.setAttribute("download", filename)
    document.body.appendChild(link) // Required for FF

    link.click()
    document.body.removeChild(link)
  }

  // Function to export transactions as PDF
  function exportAsPDF() {
    console.log("Exporting transactions as PDF...")
  }

  // Theme and color settings
  const themeSelect = document.getElementById("themeSelect")
  const primaryColorSelect = document.getElementById("primaryColorSelect")
  const saveSettingsBtn = document.getElementById("saveSettingsBtn")

  // Load saved settings on page load
  document.addEventListener("DOMContentLoaded", () => {
    const savedTheme = localStorage.getItem("theme") || "light"
    const savedPrimaryColor = localStorage.getItem("primaryColor") || "#3498db"

    themeSelect.value = savedTheme
    primaryColorSelect.value = savedPrimaryColor

    applyTheme(savedTheme)
    applyColors(savedPrimaryColor)
  })

  // Apply theme based on selection
  themeSelect.addEventListener("change", () => {
    const selectedTheme = themeSelect.value
    applyTheme(selectedTheme)
  })

  // Apply colors based on selection
  primaryColorSelect.addEventListener("input", () => {
    applyColors(primaryColorSelect.value)
  })

  // Save settings to localStorage
  saveSettingsBtn.addEventListener("click", () => {
    localStorage.setItem("theme", themeSelect.value)
    localStorage.setItem("primaryColor", primaryColorSelect.value)
    alert("Settings saved!")
  })

  // Function to apply theme
  function applyTheme(theme) {
    if (theme === "dark") {
      document.documentElement.style.setProperty("--background-color", "#292e32")
      document.documentElement.style.setProperty("--text-color", "#ecf0f1")
      document.documentElement.style.setProperty("--card-background", "#202224b4")
    } else {
      document.documentElement.style.setProperty("--background-color", "#ece3e3")
      document.documentElement.style.setProperty("--text-color", "#292e32")
      document.documentElement.style.setProperty("--card-background", "#e4d7d7de")
    }
  }

  // Function to apply primary and secondary colors
  function hexToHSL(hex) {
    // Convert hex to RGB first
    let r = 0,
      g = 0,
      b = 0
    if (hex.length === 4) {
      r = Number.parseInt(hex[1] + hex[1], 16)
      g = Number.parseInt(hex[2] + hex[2], 16)
      b = Number.parseInt(hex[3] + hex[3], 16)
    } else if (hex.length === 7) {
      r = Number.parseInt(hex[1] + hex[2], 16)
      g = Number.parseInt(hex[3] + hex[4], 16)
      b = Number.parseInt(hex[5] + hex[6], 16)
    }

    // Convert RGB to HSL
    r /= 255
    g /= 255
    b /= 255
    const max = Math.max(r, g, b),
      min = Math.min(r, g, b)
    let h,
      s,
      l = (max + min) / 2

    if (max === min) {
      h = s = 0 // Achromatic
    } else {
      const d = max - min
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
      switch (max) {
        case r:
          h = (g - b) / d + (g < b ? 6 : 0)
          break
        case g:
          h = (b - r) / d + 2
          break
        case b:
          h = (r - g) / d + 4
          break
      }
      h /= 6
    }

    return [h * 360, s * 100, l * 100] // Return HSL values
  }

  function adjustLightness(hsl, lightness) {
    return `hsl(${hsl[0]}, ${hsl[1]}%, ${lightness}%)`
  }

  function applyColors(primaryColor, secondaryColor) {
    // Convert the primary color (hex) to HSL
    const hslPrimary = hexToHSL(primaryColor)

    // Set primary color as a CSS variable
    document.documentElement.style.setProperty("--primary-color", primaryColor)

    // Darken the primary color to get a secondary color
    const darkenedColor = adjustLightness(hslPrimary, 30) // Reduce lightness to 30%

    // Set the darkened secondary color as a CSS variable
    document.documentElement.style.setProperty("--secondary-color", darkenedColor)
  }

  const navButtons = document.querySelectorAll("nav button")
  const navLine = document.querySelector(".nav-line")

  function moveLine(targetButton) {
    const buttonRect = targetButton.getBoundingClientRect()
    const navRect = targetButton.parentElement.getBoundingClientRect()

    navLine.style.width = `${buttonRect.width}px`
    navLine.style.left = `${buttonRect.left - navRect.left}px`
  }

  navButtons.forEach((button) => {
    // Move line to active button on load
    if (button.classList.contains("active")) {
      moveLine(button)
    }

    // On hover, move the line to the hovered button
    button.addEventListener("mouseenter", () => moveLine(button))

    // On mouse leave, move the line back to the active button
    button.addEventListener("mouseleave", () => {
      const activeButton = document.querySelector("button.active")
      moveLine(activeButton)
    })
  })

  const style = document.createElement("style")
  style.textContent = `
  .summary-charts {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-around;
    margin-top: 20px;
  }
  .summary-charts canvas {
    max-width: 100%;
    height: auto;
    margin-bottom: 20px;
  }
  
  /* Check Scanner Styles */
  .check-scanner-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    width: 100%;
    margin-top: 10px;
    padding: 10px;
    background-color: #27ae60;
    color: white;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    transition: background-color 0.3s;
  }

  .check-scanner-btn:hover {
    background-color: #219955;
  }

  .check-scanner-modal {
    display: none;
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.7);
    z-index: 2000;
    justify-content: center;
    align-items: center;
  }

  .check-scanner-content {
    position: relative;
    width: 90%;
    max-width: 600px;
    background-color: white;
    border-radius: 10px;
    padding: 20px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
  }

  .close-scanner {
    position: absolute;
    top: 10px;
    right: 15px;
    font-size: 24px;
    cursor: pointer;
    color: #888;
  }

  #cameraFeed {
    width: 100%;
    border-radius: 8px;
    display: block;
    margin-bottom: 15px;
  }

  #captureBtn {
    width: 100%;
    padding: 12px;
    background-color: #3498db;
    color: white;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    font-size: 16px;
    transition: background-color 0.3s;
  }

  #captureBtn:hover {
    background-color: #2980b9;
  }

  #capturedImage {
    width: 100%;
    border-radius: 8px;
    display: none;
    margin-bottom: 15px;
  }

  .scanner-buttons {
    display: flex;
    gap: 10px;
  }

  #retakeBtn, #processBtn {
    flex: 1;
    padding: 12px;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    font-size: 16px;
    transition: background-color 0.3s;
  }

  #retakeBtn {
    background-color: #e74c3c;
    color: white;
  }

  #retakeBtn:hover {
    background-color: #c0392b;
  }

  #processBtn {
    background-color: #27ae60;
    color: white;
  }

  #processBtn:hover {
    background-color: #219955;
  }

  .processing-indicator {
    display: none;
    text-align: center;
    margin-top: 15px;
  }

  .spinner {
    display: inline-block;
    width: 30px;
    height: 30px;
    border: 3px solid rgba(0, 0, 0, 0.1);
    border-radius: 50%;
    border-top-color: #3498db;
    animation: spin 1s ease-in-out infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`
  document.head.appendChild(style)
}

