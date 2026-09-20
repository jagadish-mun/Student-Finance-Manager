# Student Finance Manager

A web app that helps students track and understand their personal finances. Users log in with Firebase Authentication, then record income and expenses, view spending summaries with interactive Chart.js charts, search and filter their transaction history, and export records as PDF or CSV. A check scanner lets users snap a photo of a paper check and have its amount, date, and category extracted automatically, and a built-in AI chatbot answers questions about the user's own financial data.

## Features

- Email/password and Google sign-in via Firebase Auth
- Add, search, and filter income/expense transactions
- Financial summary dashboard with Chart.js visualizations
- Export transactions to PDF or CSV
- Check scanner that reads amount, date, and category from a photo
- AI chatbot for financial questions, grounded in the user's transaction data

## Tech Stack

Static HTML/CSS/JavaScript frontend with Firebase (Auth + Realtime Database) and Vercel serverless functions (`/api`) that proxy chat and vision requests to the Groq API, keeping the API key server-side.

## About

Built for FBLA 2024/2025 by J.M. & A.K.

Live at: **[student-finance-manager-five.vercel.app](https://student-finance-manager-five.vercel.app)**
