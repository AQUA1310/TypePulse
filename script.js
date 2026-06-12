const wordsContainer = document.getElementById('words-container');
const hiddenInput = document.getElementById('hidden-input');
const wpmDisplay = document.getElementById('wpm-display');
const accuracyDisplay = document.getElementById('accuracy-display');
const timerDisplay = document.getElementById('timer-display');
const restartBtn = document.getElementById('restart-btn');

let currentWords = [];
let allLetters = []; 
let letterIndex = 0; 

// Dashboard State Variables
const TIME_LIMIT = 30; // 30-second test length
let timeLeft = TIME_LIMIT;
let timerInterval = null;
let isTestRunning = false;
let totalTypedCharacters = 0;
let structuralErrors = 0;

function getRandomWords(amount = 25) {
    const shuffled = [...window.wordsPool].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, amount);
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

// 1. Start Timer Countdown
function startTimer() {
    isTestRunning = true;
    timerInterval = setInterval(() => {
        if (timeLeft > 0) {
            timeLeft--;
            timerDisplay.innerText = `${timeLeft}s`;
            calculateMetrics();
        } else {
            endTest();
        }
    }, 1000);
}

// 2. Real-Time Math Metrics
function calculateMetrics() {
    const timeElapsed = TIME_LIMIT - timeLeft;
    if (timeElapsed <= 0) return;

    // Standard Typing Metric: 1 word = 5 characters typed
    const grossWPM = Math.round((totalTypedCharacters / 5) / (timeElapsed / 60));
    wpmDisplay.innerText = grossWPM > 0 ? grossWPM : 0;

    // Accuracy Calculation
    const correctCharacters = totalTypedCharacters - structuralErrors;
    const accuracy = totalTypedCharacters > 0 
        ? Math.round((correctCharacters / totalTypedCharacters) * 100) 
        : 100;
    
    accuracyDisplay.innerText = `${accuracy < 0 ? 0 : accuracy}%`;
}

// 3. Stop Test / Game Over State
function endTest() {
    clearInterval(timerInterval);
    hiddenInput.disabled = true; // Lock typing input
    isTestRunning = false;
    
    // Remove blinking visual cursor from text area
    if (allLetters[letterIndex]) {
        allLetters[letterIndex].classList.remove('current');
    }
    
    alert(`🎉 Test Completed!\nSpeed: ${wpmDisplay.innerText} WPM\nAccuracy: ${accuracyDisplay.innerText}`);
}

// 4. Full Factory Reset Control
function resetTest() {
    clearInterval(timerInterval);
    timeLeft = TIME_LIMIT;
    letterIndex = 0;
    totalTypedCharacters = 0;
    structuralErrors = 0;
    isTestRunning = false;
    hiddenInput.disabled = false;
    hiddenInput.value = '';

    // Reset Dashboard UI elements
    timerDisplay.innerText = `${TIME_LIMIT}s`;
    wpmDisplay.innerText = '0';
    accuracyDisplay.innerText = '100%';

    displayWords();
    hiddenInput.focus();
}

// Main Keystroke Input Handler
hiddenInput.addEventListener('input', () => {
    // Start countdown on the very first character stroke
    if (!isTestRunning && timeLeft === TIME_LIMIT && hiddenInput.value.length > 0) {
        startTimer();
    }

    const inputValue = hiddenInput.value;
    const currentExpectedLetter = allLetters[letterIndex];

    if (inputValue.length > letterIndex) {
        const typedChar = inputValue[inputValue.length - 1];
        currentExpectedLetter.classList.remove('current');

        totalTypedCharacters++; // Track total actions for WPM calculation

        if (typedChar === currentExpectedLetter.innerText) {
            currentExpectedLetter.classList.add('correct');
        } else {
            currentExpectedLetter.classList.add('incorrect');
            structuralErrors++; // Track total errors for Accuracy calculation
        }

        letterIndex++;

    } else if (inputValue.length < letterIndex) {
        // Backspace handling
        currentExpectedLetter.classList.remove('current');
        letterIndex--;
        allLetters[letterIndex].classList.remove('correct', 'incorrect', 'current');
    }

    if (letterIndex < allLetters.length) {
        allLetters[letterIndex].classList.add('current');
    } else {
        // Automatically fetch fresh batch of words if user finishes faster than 30s
        hiddenInput.value = '';
        displayWords();
    }
    
    calculateMetrics(); // Refresh dashboard numbers on every character strike
});

// Hook up reset button event listener
restartBtn.addEventListener('click', resetTest);

function init() {
    displayWords();
    document.addEventListener('click', () => hiddenInput.focus());
    hiddenInput.focus();
}

init();