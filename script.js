const wordsContainer = document.getElementById('words-container');
const hiddenInput = document.getElementById('hidden-input');
const wpmDisplay = document.getElementById('wpm-display');
const accuracyDisplay = document.getElementById('accuracy-display');
const timerDisplay = document.getElementById('timer-display');
const restartBtn = document.getElementById('restart-btn');
const summaryRestartBtn = document.getElementById('summary-restart-btn');
const customTimeInput = document.getElementById('custom-time-input');
const themeToggleBtn = document.getElementById('theme-toggle-btn');

// View Screen Element Selectors
const typingTestView = document.getElementById('typing-test-view');
const scoreView = document.getElementById('score-view');
const finalWpm = document.getElementById('final-wpm');
const finalAcc = document.getElementById('final-acc');

let currentWords = [];
let allLetters = []; 
let letterIndex = 0; 

// Dynamic Configuration Variables
let timeLimit = 30; // Default startup timer limit
let timeLeft = timeLimit;
let timerInterval = null;
let isTestRunning = false;
let totalTypedCharacters = 0;
let structuralErrors = 0;

// ==========================================================================
// FEATURE ADDITION: MAIN ENGINE MODE & LANGUAGE TRACKING VARIABLE STATES
// ==========================================================================
let currentMode = 'text';          // Evaluates to: 'text' or 'code'
let currentLanguage = 'javascript';  // Evaluates to: 'javascript', 'cpp', 'java'

// Graph Arrays Data Stores
let wpmHistoryData = [];
let labelsTimelineData = [];
let myChartInstance = null; // Stores Chart.js instance to prevent canvas glitches

// ==========================================================================
// UPGRADED DATAPOOL SEARCH ENGINE
// ==========================================================================
function getRandomWords(amount = 50) {
    let selectedPool = [];

    // Safe lookup verification chain mapping window data states
    if (window.typingData) {
        if (currentMode === 'text') {
            selectedPool = window.typingData.text || [];
        } else if (currentMode === 'code') {
            const codePools = window.typingData.code || {};
            selectedPool = codePools[currentLanguage] || codePools['javascript'] || [];
        }
    } else {
        // Fallback safety catch statement pointing to standard old array structure
        selectedPool = window.wordsPool || ["error", "data", "missing"];
    }

    const shuffled = [...selectedPool].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, amount); 
}

// ==========================================================================
// CORE UI AND LOGIC STATE CONTROLLER SWITCHES
// ==========================================================================
function changeMainMode(mode) {
    if (isTestRunning) return; // Prevent user layout breaking mid-run

    currentMode = mode;

    // Toggle interactive design classes for styling feedback
    document.getElementById('btn-text').classList.toggle('active', mode === 'text');
    document.getElementById('btn-code').classList.toggle('active', mode === 'code');

    // Handle language dropdown visibility block matching mode select
    const languageSelector = document.getElementById('language-select');
    if (mode === 'code') {
        languageSelector.style.display = 'inline-block';
    } else {
        languageSelector.style.display = 'none';
    }

    resetTest();
}

function changeLanguage(lang) {
    if (isTestRunning) return; // Prevent shifting dataset mid-run
    currentLanguage = lang;
    resetTest();
}

function displayWords() {
    wordsContainer.innerHTML = ''; 
    currentWords = getRandomWords();
    allLetters = []; 
    letterIndex = 0; 

    currentWords.forEach((word, wordIndex) => {
        const wordSpan = document.createElement('span');
        wordSpan.classList.add('word');

        word.split('').forEach((letter) => {
            const letterSpan = document.createElement('span');
            letterSpan.classList.add('letter');
            letterSpan.innerText = letter;
            wordSpan.appendChild(letterSpan);
            allLetters.push(letterSpan); 
        });

        if (wordIndex < currentWords.length - 1) {
            const spaceSpan = document.createElement('span');
            spaceSpan.classList.add('letter');
            spaceSpan.innerText = ' '; 
            wordSpan.appendChild(spaceSpan);
            allLetters.push(spaceSpan); 
        }

        wordsContainer.appendChild(wordSpan);
    });

    if (allLetters.length > 0) {
        allLetters[0].classList.add('current');
    }
}

// 1. Handle User Custom Time Changes (10 to 60 boundary lock)
customTimeInput.addEventListener('change', (e) => {
    if (isTestRunning) {
        customTimeInput.value = timeLimit; // Reject mid-test tampering
        return;
    }

    let val = parseInt(e.target.value);

    // Enforce 10s min and 60s max limits strictly
    if (isNaN(val) || val < 10) {
        val = 10;
    } else if (val > 60) {
        val = 60;
    }

    e.target.value = val; 
    timeLimit = val;      
    resetTest();          
});

// 2. Start Countdown Timer
function startTimer() {
    isTestRunning = true;
    customTimeInput.disabled = true; // Freeze selection settings box while user types
    
    // Freeze mode and dropdown controls during live runs
    document.getElementById('btn-text').disabled = true;
    document.getElementById('btn-code').disabled = true;
    document.getElementById('language-select').disabled = true;

    wpmHistoryData = [];
    labelsTimelineData = [];

    timerInterval = setInterval(() => {
        if (timeLeft > 0) {
            timeLeft--;
            timerDisplay.innerText = `${timeLeft}s`;
            
            // Record real-time WPM every single distinct second elapsed
            const timeElapsed = timeLimit - timeLeft;
            const currentWPM = Math.round((totalTypedCharacters / 5) / (timeElapsed / 60));
            
            wpmHistoryData.push(currentWPM > 0 ? currentWPM : 0);
            labelsTimelineData.push(`${timeElapsed}s`);

            calculateMetrics();
        } else {
            endTest();
        }
    }, 1000);
}

// 3. Live Metrics Processing
function calculateMetrics() {
    const timeElapsed = timeLimit - timeLeft;
    if (timeElapsed <= 0) return;

    const grossWPM = Math.round((totalTypedCharacters / 5) / (timeElapsed / 60));
    wpmDisplay.innerText = grossWPM > 0 ? grossWPM : 0;

    const correctCharacters = totalTypedCharacters - structuralErrors;
    const accuracy = totalTypedCharacters > 0 
        ? Math.round((correctCharacters / totalTypedCharacters) * 100) 
        : 100;
    
    accuracyDisplay.innerText = `${accuracy}%`;
}

// 4. Test Complete: Hide Typing Area and Render Summary Graph
function endTest() {
    clearInterval(timerInterval);
    isTestRunning = false;
    hiddenInput.disabled = true;
    
    customTimeInput.disabled = false; // Unlock options box on results page
    
    // Re-enable engine selector toggles for post-test access
    document.getElementById('btn-text').disabled = false;
    document.getElementById('btn-code').disabled = false;
    document.getElementById('language-select').disabled = false;

    // Fill score panel cards text
    finalWpm.innerText = wpmDisplay.innerText;
    finalAcc.innerText = accuracyDisplay.innerText;

    // Flip views using our utility classes
    typingTestView.classList.add('hidden');
    scoreView.classList.remove('hidden');

    renderPerformanceGraph();
}

// 5. ChartJS Configuration Render Loop
function renderPerformanceGraph() {
    const ctx = document.getElementById('wpmChart').getContext('2d');
    
    // Clear old charts instance tracking arrays to prevent rendering overlap hover bugs
    if (myChartInstance) {
        myChartInstance.destroy();
    }

    myChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labelsTimelineData,
            datasets: [{
                label: 'WPM',
                data: wpmHistoryData,
                borderColor: '#00f0ff',
                backgroundColor: 'rgba(0, 240, 255, 0.05)',
                tension: 0.3,
                fill: true,
                pointBackgroundColor: '#ff007f',
                pointRadius: wpmHistoryData.length > 30 ? 1 : 3 // Cleaner looking points on longer test limits
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: 'rgba(100, 102, 105, 0.08)' },
                    ticks: { color: '#646669', font: { family: 'monospace' } }
                },
                x: {
                    grid: { color: 'rgba(100, 102, 105, 0.08)' },
                    ticks: { color: '#646669', font: { family: 'monospace' } }
                }
            },
            plugins: {
                legend: { display: false }
            }
        }
    });
}

// 6. Complete Clean Reset 
function resetTest() {
    clearInterval(timerInterval);
    timeLeft = timeLimit;
    letterIndex = 0;
    totalTypedCharacters = 0;
    structuralErrors = 0;
    isTestRunning = false;
    hiddenInput.disabled = false;
    
    customTimeInput.disabled = false;
    document.getElementById('btn-text').disabled = false;
    document.getElementById('btn-code').disabled = false;
    document.getElementById('language-select').disabled = false;
    
    hiddenInput.value = '';

    timerDisplay.innerText = `${timeLimit}s`;
    wpmDisplay.innerText = '0';
    accuracyDisplay.innerText = '100%';

    // Screen navigation resets back to typing field
    scoreView.classList.add('hidden');
    typingTestView.classList.remove('hidden');

    displayWords();
    setTimeout(() => hiddenInput.focus(), 20); // Small timeout allows DOM to align focus correctly
}

// Core Keyboard Input Event Handler (FIXED)
hiddenInput.addEventListener('input', () => {
    if (!isTestRunning && timeLeft === timeLimit && hiddenInput.value.length > 0) {
        startTimer();
    }

    const inputValue = hiddenInput.value;
    const previousIndex = letterIndex; 
    letterIndex = inputValue.length; // Absolute length mapping prevents array desync

    // 1. Handling Forward Keypress Entry Processing
    if (letterIndex > previousIndex) {
        for (let i = previousIndex; i < letterIndex; i++) {
            if (i >= allLetters.length) break;

            const typedChar = inputValue[i];
            const expectedLetter = allLetters[i];
            
            expectedLetter.classList.remove('current');
            totalTypedCharacters++; 

            if (typedChar === expectedLetter.innerText) {
                expectedLetter.classList.add('correct');
            } else {
                expectedLetter.classList.add('incorrect');
                structuralErrors++; 
            }
        }
    } 
    // 2. Handling Backspace Clear and Selection Removal Operations Safely
    else if (letterIndex < previousIndex) {
        if (previousIndex < allLetters.length) {
            allLetters[previousIndex].classList.remove('current');
        }
        for (let i = letterIndex; i <= previousIndex; i++) {
            if (i < allLetters.length) {
                allLetters[i].classList.remove('correct', 'incorrect', 'current');
            }
        }
    }

    // 3. Update Visual Tracker Elements Placement
    if (letterIndex < allLetters.length) {
        allLetters[letterIndex].classList.add('current');
    } else {
        hiddenInput.value = '';
        displayWords();
    }
    
    calculateMetrics(); 
});

// Theme Toggle Logic
themeToggleBtn.addEventListener('click', () => {
    document.body.classList.toggle('light-theme');
    
    // Save preference to LocalStorage (Icons are now dynamically rendered by CSS)
    if (document.body.classList.contains('light-theme')) {
        localStorage.setItem('theme', 'light');
    } else {
        localStorage.setItem('theme', 'dark');
    }

    // Force the chart gridlines to update colors if a chart is currently visible
    if (myChartInstance && !scoreView.classList.contains('hidden')) {
        renderPerformanceGraph();
    }
});

restartBtn.addEventListener('click', resetTest);
summaryRestartBtn.addEventListener('click', resetTest);

function init() {
    // Look up saved preference on initialization
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
        document.body.classList.add('light-theme');
    }

    displayWords();
    
    document.addEventListener('click', (event) => {
        // Prevent loss of input focus when interacting with config control nodes
        if (
            event.target !== customTimeInput && 
            event.target !== themeToggleBtn &&
            event.target !== document.getElementById('language-select') &&
            !event.target.classList.contains('mode-btn')
        ) {
            hiddenInput.focus();
        }
    });
    hiddenInput.focus();
}

init();