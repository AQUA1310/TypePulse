const wordsContainer = document.getElementById('words-container');
const hiddenInput = document.getElementById('hidden-input');

let currentWords = [];
let allLetters = []; // Flat list of all letter span elements for easy index tracking
let letterIndex = 0; // Pointer to the letter the user should type next

// 1. Grab random words from data.js
function getRandomWords(amount = 25) {
    const shuffled = [...window.wordsPool].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, amount);
}

// 2. Display words and build our flat letter array
function displayWords() {
    wordsContainer.innerHTML = ''; 
    currentWords = getRandomWords();
    allLetters = []; // Reset flat list
    letterIndex = 0; // Reset pointer

    currentWords.forEach((word, wordIndex) => {
        const wordSpan = document.createElement('span');
        wordSpan.classList.add('word');

        // Letters
        word.split('').forEach((letter) => {
            const letterSpan = document.createElement('span');
            letterSpan.classList.add('letter');
            letterSpan.innerText = letter;
            wordSpan.appendChild(letterSpan);
            allLetters.push(letterSpan); // Collect it
        });

        // Space character (added to the end of every word except the last)
        if (wordIndex < currentWords.length - 1) {
            const spaceSpan = document.createElement('span');
            spaceSpan.classList.add('letter');
            spaceSpan.innerText = ' '; // Explicit space
            wordSpan.appendChild(spaceSpan);
            allLetters.push(spaceSpan); // Collect it
        }

        wordsContainer.appendChild(wordSpan);
    });

    // Highlight the very first letter
    if (allLetters.length > 0) {
        allLetters[0].classList.add('current');
    }
}

// 3. Handle Keyboard Inputs
hiddenInput.addEventListener('input', (e) => {
    const inputValue = hiddenInput.value;
    const currentExpectedLetter = allLetters[letterIndex];

    // If the input value length matches our tracking index + 1, it's a new character typed
    if (inputValue.length > letterIndex) {
        const typedChar = inputValue[inputValue.length - 1];

        // Highlight clean up
        currentExpectedLetter.classList.remove('current');

        if (typedChar === currentExpectedLetter.innerText) {
            currentExpectedLetter.classList.add('correct');
        } else {
            currentExpectedLetter.classList.add('incorrect');
        }

        // Advance pointer forward
        letterIndex++;

    } else if (inputValue.length < letterIndex) {
        // BACKSPACE detected (input string shrunk)
        currentExpectedLetter.classList.remove('current');
        
        // Move pointer backward
        letterIndex--;
        
        // Clean up previous letter styles
        allLetters[letterIndex].classList.remove('correct', 'incorrect', 'current');
    }

    // Move the active blinking cursor highlight to the new active letter
    if (letterIndex < allLetters.length) {
        allLetters[letterIndex].classList.add('current');
    } else {
        // End of the text reached!
        alert("You reached the end of the phrase!");
        hiddenInput.value = "";
        displayWords();
    }
});

// Initialize setup
function init() {
    displayWords();
    document.addEventListener('click', () => hiddenInput.focus());
    hiddenInput.focus();
}

init();