const wordsContainer = document.getElementById('words-container');
const hiddenInput = document.getElementById('hidden-input');
const wpmDisplay = document.getElementById('wpm-display');
const accuracyDisplay = document.getElementById('accuracy-display');
const timerDisplay = document.getElementById('timer-display');
const restartBtn = document.getElementById('restart-btn');
const summaryRestartBtn = document.getElementById('summary-restart-btn');
const customTimeInput = document.getElementById('custom-time-input');

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

// Graph Arrays Data Stores
let wpmHistoryData = [];
let labelsTimelineData = [];
let myChartInstance = null; // Stores Chart.js instance to prevent canvas glitches

function getRandomWords(amount = 50) {
    const shuffled = [...window.wordsPool].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, amount); // Pulled 50 words so fast typers don't run out
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

// Core Keyboard Input Event Handler
hiddenInput.addEventListener('input', () => {
    if (!isTestRunning && timeLeft === timeLimit && hiddenInput.value.length > 0) {
        startTimer();
    }

    const inputValue = hiddenInput.value;
    const currentExpectedLetter = allLetters[letterIndex];

    if (inputValue.length > letterIndex) {
        const typedChar = inputValue[inputValue.length - 1];
        currentExpectedLetter.classList.remove('current');

        totalTypedCharacters++; 

        if (typedChar === currentExpectedLetter.innerText) {
            currentExpectedLetter.classList.add('correct');
        } else {
            currentExpectedLetter.classList.add('incorrect');
            structuralErrors++; 
        }

        letterIndex++;

    } else if (inputValue.length < letterIndex) {
        // Backspace management
        currentExpectedLetter.classList.remove('current');
        letterIndex--;
        allLetters[letterIndex].classList.remove('correct', 'incorrect', 'current');
    }

    if (letterIndex < allLetters.length) {
        allLetters[letterIndex].classList.add('current');
    } else {
        hiddenInput.value = '';
        displayWords();
    }
    
    calculateMetrics(); 
});

restartBtn.addEventListener('click', resetTest);
summaryRestartBtn.addEventListener('click', resetTest);

function init() {
    displayWords();
    document.addEventListener('click', (event) => {
        if (event.target !== customTimeInput) {
            hiddenInput.focus();
        }
    });
    hiddenInput.focus();
}
init();