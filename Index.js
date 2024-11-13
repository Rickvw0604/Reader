// Exercise Data
const exercises = [
    {
        dutch: ["Karin", "is", "in", "de", "supermarkt"],
        spanish: ["Karin", "está", "en", "el", "supermercado"],
        fullAnswer: "Karin está en el supermercado.",
        acceptableAlternatives: [],
        unnecessaryPronoun: false,
    },
    {
        dutch: ["Zij", "zoekt", "vers", "fruit", "voor", "het", "ontbijt"],
        spanish: ["Ella", "busca", "fresca", "fruta", "para", "el", "desayuno"],
        fullAnswer: "Busca fruta fresca para el desayuno.",
        acceptableAlternatives: ["Ella busca fruta fresca para el desayuno."],
        unnecessaryPronoun: true,
    },
    {
        dutch: ["Zij", "kiest", "een paar", "appels", "bananen", "en", "druiven"],
        spanish: ["Ella", "elige", "unas", "manzanas", "plátanos", "y", "uvas"],
        fullAnswer: "Elige unas manzanas, plátanos y uvas.",
        acceptableAlternatives: ["Ella elige unas manzanas, plátanos y uvas."],
        unnecessaryPronoun: true,
    },
    {
        dutch: ["Daarna", "loopt", "zij", "langs", "de", "groenteafdeling"],
        spanish: ["Luego", "pasa", "ella", "por", "el", "pasillo de verduras"],
        fullAnswer: "Luego pasa por el pasillo de verduras.",
        acceptableAlternatives: ["Luego ella pasa por el pasillo de verduras."],
        unnecessaryPronoun: true,
    },
    {
        dutch: ["Uiteindelijk", "betaalt", "zij", "bij", "de", "kassa"],
        spanish: ["Finalmente", "paga", "ella", "en", "la", "caja"],
        fullAnswer: "Finalmente paga en la caja.",
        acceptableAlternatives: ["Finalmente ella paga en la caja."],
        unnecessaryPronoun: true,
    }
];

const day2Exercises = [
    {
        dutch: ["Karin", "loopt", "met", "Tokyo", "op", "het", "strand"],
        spanish: ["Karin", "camina", "con", "Tokyo", "en", "la", "playa"],
        fullAnswer: "Karin camina con Tokyo en la playa.",
        acceptableAlternatives: [],
        unnecessaryPronoun: false,
        feedbackMessage: "¡Perfecto! 🎉"
    },
    {
        dutch: ["Tokyo", "speelt", "in", "het", "zand"],
        spanish: ["Tokyo", "juega", "en", "la", "arena"],
        fullAnswer: "Tokyo juega en la arena.",
        acceptableAlternatives: [],
        unnecessaryPronoun: false,
        feedbackMessage: "¡Excelente! 🌟"
    },
    {
        dutch: ["Karin", "gooit", "een", "bal"],
        spanish: ["Karin", "lanza", "una", "pelota"],
        fullAnswer: "Karin lanza una pelota.",
        acceptableAlternatives: [],
        unnecessaryPronoun: false,
        feedbackMessage: "¡Muy bien! 🎈"
    },
    {
        dutch: ["Tokyo", "brengt", "de", "bal", "terug"],
        spanish: ["Tokyo", "trae", "la", "pelota", "de vuelta"],
        fullAnswer: "Tokyo trae la pelota de vuelta.",
        acceptableAlternatives: [],
        unnecessaryPronoun: false,
        feedbackMessage: "¡Fantástico! ⭐"
    },
    {
        dutch: ["Ze", "zijn", "blij", "samen"],
        spanish: ["Ellos", "están", "felices", "juntos"],
        fullAnswer: "Están felices juntos.",
        acceptableAlternatives: ["Ellos están felices juntos."],
        unnecessaryPronoun: true,
        feedbackMessage: "¡Increíble! Remember, we can omit 'ellos' here. 🌟"
    }
];

function getLastActivityDate() {
    return localStorage.getItem('lastActivityDate');
}

function setLastActivityDate() {
    localStorage.setItem('lastActivityDate', new Date().toDateString());
}

function hasActivityToday() {
    const lastActivity = getLastActivityDate();
    const today = new Date().toDateString();
    return lastActivity === today;
}

function checkAndResetStreak() {
    const lastActivity = getLastActivityDate();
    if (!lastActivity) return;

    const today = new Date();
    const lastActivityDate = new Date(lastActivity);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // If last activity was before yesterday, reset streak
    if (lastActivityDate < yesterday) {
        localStorage.setItem('streakCount', '0');
        document.getElementById('streakCount').textContent = '0';
    }
}

function getLastStreakDate() {
    return localStorage.getItem('lastStreakDate');
}

function setLastStreakDate(date) {
    localStorage.setItem('lastStreakDate', date);
}

function isNewDay() {
    const lastDate = getLastStreakDate();
    if (!lastDate) return true;
    
    const today = new Date().toDateString();
    return lastDate !== today;
}

function incrementStreak() {
    if (isNewDay()) {
        const streakElement = document.getElementById('streakCount');
        const currentStreak = parseInt(streakElement.textContent) || 0;
        streakElement.textContent = currentStreak + 1;
        
        localStorage.setItem('streakCount', currentStreak + 1);
        setLastStreakDate(new Date().toDateString());
        
        return true;
    }
    return false;
}

function initializeStreak() {
    // Check and reset streak if needed
    checkAndResetStreak();
    
    const savedStreak = localStorage.getItem('streakCount');
    if (savedStreak) {
        document.getElementById('streakCount').textContent = savedStreak;
    }
}

function showUnlockNotification() {
    const existingToast = document.querySelector('.toast');
    if (existingToast) {
        existingToast.remove();
    }

    const toast = document.createElement('div');
    toast.className = 'toast success animate__animated animate__slideIn';
    
    if (isNewDay()) {
        toast.textContent = '🎉 Congratulations! Next day unlocked and daily streak increased!';
    } else {
        toast.textContent = '🎉 Congratulations! Next day has been unlocked!';
    }
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        if (toast.parentElement) {
            toast.classList.add('animate__fadeOut');
            setTimeout(() => toast.remove(), 300);
        }
    }, 3000);
}

// Exercise Manager Class
class ExerciseManager {
    constructor(exercises) {
        this.exercises = exercises;
        this.currentIndex = 0;
        this.correctAnswers = 0;
        this.userAnswers = new Array(exercises.length).fill(null);
        // Fix the day detection in constructor too
        this.currentDay = JSON.stringify(exercises) === JSON.stringify(window.exercises) ? 1 : 2;
        this.initializeElements();
        this.setupEventListeners();
        this.initializeExercise();
    }

    initializeElements() {
        this.elements = {
            sentence: document.querySelector('.sentence'),
            translation: document.getElementById('translation'),
            answer: document.getElementById('answer'),
            feedback: document.getElementById('feedback'),
            checkButton: document.getElementById('checkButton'),
            exerciseCount: document.getElementById('exerciseCount')
        };

        // Ensure sentence element exists and is visible
        if (this.elements.sentence) {
            this.elements.sentence.style.display = 'block';
            this.elements.sentence.style.visibility = 'visible';
        } else {
            console.error('Sentence element not found during initialization');
        }

        // Create progress stepper
        const statsGrid = document.querySelector('.stats-grid');
        if (statsGrid) {
            statsGrid.innerHTML = this.createProgressStepper();
        }

        // Create feedback container if it doesn't exist
        if (!document.querySelector('.feedback-popup')) {
            const feedbackPopup = document.createElement('div');
            feedbackPopup.className = 'feedback-container';
            document.body.appendChild(feedbackPopup);
            this.elements.feedbackPopup = feedbackPopup;
        }
        
        this.updateExerciseCount();
    }

    createProgressStepper() {
        const stepsHtml = Array(this.exercises.length)
            .fill('')
            .map((_, index) => {
                const className = index === this.currentIndex ? 'step current' :
                    index < this.currentIndex ? 'step completed' : 'step';
                return `<div class="${className}" role="progressbar" aria-valuenow="${index + 1}" aria-valuemin="1" aria-valuemax="${this.exercises.length}"></div>`;
            })
            .join('');

        return `<div class="progress-stepper" role="progressbar" aria-label="Exercise progress">${stepsHtml}</div>`;
    }

    updateExerciseCount() {
        if (this.elements.exerciseCount) {
            this.elements.exerciseCount.textContent = `${this.currentIndex + 1}/${this.exercises.length}`;
        }
    }

    updateProgress() {
        const stepper = document.querySelector('.progress-stepper');
        if (stepper) {
            stepper.innerHTML = Array(this.exercises.length)
                .fill('')
                .map((_, index) => {
                    const className = index === this.currentIndex ? 'step current' :
                        index < this.currentIndex ? 'step completed' : 'step';
                    return `<div class="${className}" role="progressbar" aria-valuenow="${index + 1}" aria-valuemin="1" aria-valuemax="${this.exercises.length}"></div>`;
                })
                .join('');

            const progress = (this.currentIndex / (this.exercises.length - 1)) * 100;
            stepper.style.setProperty('--progress-width', `${progress}%`);
        }
    }

    initializeExercise() {
        this.updateProgress();
        this.createSentence();
        this.resetUI();
        this.updateExerciseCount();
    }

    createSentence() {
        const exercise = this.getCurrentExercise();
        if (!exercise) {
            console.error('No exercise found for current index:', this.currentIndex);
            return;
        }

        const sentenceElement = this.elements.sentence;
        if (!sentenceElement) {
            console.error('Sentence element not found');
            return;
        }

        // Create the sentence display with proper styling
        sentenceElement.innerHTML = `
            <div class="exercise-text" style="font-size: 1.25rem; margin: 20px 0;">
                ${exercise.dutch.map((word, index) => `
                    <span class="word animate__animated animate__fadeIn"
                          data-translation="${exercise.spanish[index]}"
                          role="button"
                          tabindex="0"
                          aria-label="Click to see translation">
                        ${word}
                    </span>
                `).join(' ')}.
            </div>
        `;

        // Add click handlers for word translations
        const words = sentenceElement.querySelectorAll('.word');
        words.forEach(word => {
            word.addEventListener('click', (event) => this.showTranslation(word, event));
            word.addEventListener('keypress', (event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                    this.showTranslation(word, event);
                }
            });
        });

        // Make sure the sentence is visible
        sentenceElement.style.display = 'block';
    }

    getCurrentExercise() {
        return this.exercises[this.currentIndex];
    }

    resetUI() {
        if (this.elements.answer) this.elements.answer.value = '';
        if (this.elements.feedback) {
            this.elements.feedback.textContent = '';
            this.elements.feedback.className = 'feedback';
        }
        if (this.elements.checkButton) {
            this.elements.checkButton.textContent = 'Check Answer';
        }
    }

    showTranslation(wordElement, event) {
        if (!event) return;
        
        this.removeSpeechBubble();
        
        const dutch = wordElement.textContent.trim();
        const spanish = wordElement.dataset.translation;
        
        const bubble = document.createElement('div');
        bubble.className = 'speech-bubble animate__animated animate__fadeIn';
        bubble.textContent = `${dutch} → ${spanish}`;
        bubble.setAttribute('role', 'tooltip');
        
        document.body.appendChild(bubble);
        
        const rect = wordElement.getBoundingClientRect();
        const bubbleRect = bubble.getBoundingClientRect();
        
        const left = rect.left + (rect.width / 2) - (bubbleRect.width / 2);
        const top = rect.top - bubbleRect.height - 10;
        
        bubble.style.left = `${Math.max(10, Math.min(left, window.innerWidth - bubbleRect.width - 10))}px`;
        bubble.style.top = `${Math.max(10, top)}px`;
        
        this.currentSpeechBubble = bubble;

        setTimeout(() => {
            document.addEventListener('click', this.handleClickOutside);
        }, 0);
    }

    handleClickOutside = (event) => {
        if (this.currentSpeechBubble && 
            !this.currentSpeechBubble.contains(event.target) && 
            !event.target.classList.contains('word')) {
            this.removeSpeechBubble();
        }
    }

    removeSpeechBubble() {
        if (this.currentSpeechBubble) {
            this.currentSpeechBubble.remove();
            this.currentSpeechBubble = null;
            document.removeEventListener('click', this.handleClickOutside);
        }
    }

    showFeedback(message, type) {
        const existingBar = document.querySelector('.feedback-bar');
        if (existingBar) {
            existingBar.remove();
        }

        const feedbackBar = document.createElement('div');
        feedbackBar.className = `feedback-bar ${type}`;
        
        const emoji = type === 'correct' ? '🎉' : 
                     type === 'warning' ? '💡' : 
                     '❌';
        
        feedbackBar.textContent = `${emoji} ${message}`;
        
        const modalContent = document.querySelector('.translation-modal');
        if (modalContent) {
            modalContent.appendChild(feedbackBar);
            
            requestAnimationFrame(() => {
                feedbackBar.classList.add('show');
            });
        }
    }

    compareAnswers(userAnswer, correctAnswer) {
        const normalize = (text) => {
            return text.toLowerCase()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .replace(/[.,!?¡¿]/g, '')
                .trim();
        };

        const exercise = this.getCurrentExercise();
        const normalizedUser = normalize(userAnswer);
        const normalizedCorrect = normalize(correctAnswer);
        
        return normalizedUser === normalizedCorrect || 
               exercise.acceptableAlternatives.some(alt => normalize(alt) === normalizedUser);
    }

    checkAnswer() {
        const userAnswer = this.elements.answer.value.trim();
        const exercise = this.getCurrentExercise();

        if (!userAnswer) {
            this.showFeedback('Please enter your answer first.', 'warning');
            return;
        }

        const isAcceptableAlternative = exercise.acceptableAlternatives.some(alt => 
            this.compareAnswers(userAnswer, alt)
        );
        
        const isPerfect = this.compareAnswers(userAnswer, exercise.fullAnswer);
        
        const isCorrect = isPerfect || isAcceptableAlternative;

        this.userAnswers[this.currentIndex] = { 
            answer: userAnswer, 
            isCorrect,
            usedPronoun: isAcceptableAlternative
        };

        if (isCorrect) {
            this.correctAnswers++;
            if (isAcceptableAlternative) {
                this.showFeedback(`Almost perfect! The sentence would be better like this: ${exercise.fullAnswer}`, 'warning');
            } else {
                this.showFeedback("Perfect answer! Good job! 🎉", 'correct');
            }
        } else {
            this.showFeedback(`Not quite. The correct answer is: "${exercise.fullAnswer}"`, 'incorrect');
        }

        this.updateProgress();
        this.elements.checkButton.textContent = 'Next';
    }

    next() {
        const feedbackBar = document.querySelector('.feedback-bar');
        if (feedbackBar) {
            feedbackBar.classList.remove('show');
            setTimeout(() => feedbackBar.remove(), 300);
        }

        if (this.currentIndex >= this.exercises.length - 1) {
            this.showFinalResults();
            return;
        }

        this.currentIndex++;
        this.initializeExercise();
        this.updateExerciseCount();
    }

    showFinalResults() {
        const percentage = Math.round((this.correctAnswers / this.exercises.length) * 100);
        
        let achievement = percentage === 100 ? '🏆 Perfectionist' :
                         percentage >= 80 ? '🌟 Expert' :
                         percentage >= 60 ? '📈 Making Progress' :
                         '🌱 Beginner';

        const sentenceReview = this.exercises.map((exercise, index) => {
            const userAnswer = this.userAnswers[index];
            
            let answerColorClass = '';
            if (userAnswer) {
                if (!userAnswer.isCorrect) {
                    answerColorClass = 'color: #ef4444;'; // Red for wrong answer
                } else if (userAnswer.usedPronoun) {
                    answerColorClass = 'color: #f97316;'; // Orange for unnecessary pronoun
                } else {
                    answerColorClass = 'color: #22c55e;'; // Green for perfect answer
                }
            }
            
            return `
                <div class="sentence-review ${userAnswer?.isCorrect ? 'correct' : 'incorrect'}">
                    <div class="review-header">Exercise ${index + 1}</div>
                    <div class="dutch-sentence">${exercise.dutch.join(' ')}.</div>
                    <div class="spanish-sentence">
                        <strong>Correct:</strong> ${exercise.fullAnswer}
                    </div>
                    <div class="user-answer" style="${answerColorClass}">
                        <strong>Your answer:</strong> ${userAnswer?.answer || 'No answer provided'}
                    </div>
                    ${userAnswer?.usedPronoun ? `
                        <div class="user-answer" style="margin-top: 8px; color: #f97316;">
                            <strong>Tip:</strong> The subject pronoun can be omitted here.
                        </div>
                    ` : ''}
                </div>
            `;
        }).join('');
        
        const resultsHTML = `
            <div class="results-overview animate__animated animate__fadeIn">
                <div class="results-header">
                    <h2>Exercise Results</h2>
                    <p>Here's how you did:</p>
                </div>
                <div class="results-stats">
                    <div class="result-stat-card">
                        <div class="stat-label">Accuracy</div>
                        <div class="stat-result">${percentage}%</div>
                    </div>
                    <div class="result-stat-card">
                        <div class="stat-label">Achievement</div>
                        <div class="stat-result">${achievement}</div>
                    </div>
                </div>

                <div class="sentence-reviews">
                    <h3>Exercise Overview</h3>
                    ${sentenceReview}
                </div>
                
                <div class="floating-action-bar animate__animated animate__fadeInUp">
                    <button onclick="window.exerciseManager.restartExercises()" class="button">Try Again</button>
                    ${percentage === 100 ? `
                        <button onclick="window.exerciseManager.completeAndClose()" class="button">Complete & Continue</button>
                    ` : ''}
                </div>
            </div>
        `;

        const translationExerciseContainer = document.getElementById('translationExerciseContainer');
        if (translationExerciseContainer) {
            translationExerciseContainer.innerHTML = resultsHTML;
        }

        // If 100% score, automatically mark as complete
        if (percentage === 100) {
            this.markTranslationComplete();
        }
    }

    markTranslationComplete() {
        // Compare arrays by their content to determine which day
        const isDay1 = JSON.stringify(this.exercises) === JSON.stringify(exercises);
        const dayNumber = isDay1 ? 1 : 2;
        const translationStatus = document.getElementById(`translation-status${dayNumber === 1 ? '' : '-day' + dayNumber}`);
        
        if (translationStatus) {
            translationStatus.textContent = 'Completed';
            translationStatus.className = 'completion-badge completed';
            
            // Check and update day completion status
            checkAndUnlockDay(dayNumber);
        }
    }

    completeAndClose() {
        this.markTranslationComplete();
        closeTranslationModal();
    }

   restartExercises() {
        this.currentIndex = 0;
        this.correctAnswers = 0;
        this.userAnswers = new Array(this.exercises.length).fill(null);

        const translationExerciseContainer = document.getElementById('translationExerciseContainer');
        if (translationExerciseContainer) {
            translationExerciseContainer.innerHTML = `
                <div class="stats-grid" role="status">
                    <div class="stat-card">
                        <div class="stat-value" id="exerciseCount">0/5</div>
                        <div>Oefeningen</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value" id="accuracy">0%</div>
                        <div>Nauwkeurigheid</div>
                    </div>
                </div>
                <div class="sentence-container">
                    <h2>Vertaal deze zin:</h2>
                    <div class="sentence" aria-live="polite"></div>
                </div>
                <div class="input-container">
                    <input type="text" 
                           id="answer" 
                           class="answer-input" 
                           placeholder="Typ je Spaanse vertaling hier..." 
                           autocomplete="off"
                           spellcheck="false">
                </div>
                <div id="feedback" class="feedback" role="alert"></div>
                <button id="checkButton" class="button">
                    Controleer antwoord
                </button>
            `;
        }

        this.initializeElements();
        this.setupEventListeners();
        this.initializeExercise();
    }

    setupEventListeners() {
        this.elements.checkButton.addEventListener('click', () => {
            if (this.elements.checkButton.textContent === 'Check Answer') {
                this.checkAnswer();
            } else {
                this.next();
            }
        });

        this.elements.answer.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                if (this.elements.checkButton.textContent === 'Check Answer') {
                    this.checkAnswer();
                } else {
                    this.next();
                }
            }
        });
    }

    cleanup() {
        this.removeSpeechBubble();
        if (this.elements.feedbackPopup && this.elements.feedbackPopup.parentNode) {
            this.elements.feedbackPopup.parentNode.removeChild(this.elements.feedbackPopup);
        }
    }
}

// Utility Functions
function markComplete(exerciseType, day = 1) {
    const statusElement = document.getElementById(`${exerciseType}-status${day === 1 ? '' : '-day' + day}`);
    if (statusElement) {
        statusElement.textContent = 'Completed';
        statusElement.className = 'completion-badge completed';
    }
    
    // Update last activity date
    setLastActivityDate();
    
    checkAndUnlockDay(day);
}

function markCompleteDay2(exerciseType) {
    const statusElement = document.getElementById(`${exerciseType}-status-day2`);
    if (statusElement) {
        statusElement.textContent = 'Completed';
        statusElement.className = 'completion-badge completed';
    }
    
    checkAndUnlockDay();
}

function checkAndUnlockDay(currentDay) {
        const statuses = [
        `anki-status${currentDay === 1 ? '' : '-day' + currentDay}`,
        `listening-status${currentDay === 1 ? '' : '-day' + currentDay}`,
        `translation-status${currentDay === 1 ? '' : '-day' + currentDay}`,
        `reading-status${currentDay === 1 ? '' : '-day' + currentDay}`
    ];
    
    const allCompleted = statuses.every(status => 
        document.getElementById(status)?.textContent === 'Completed'
    );
    
    if (allCompleted) {
        // Update current day's badge
        const currentDayBadge = document.getElementById(`day${currentDay}-badge`);
        if (currentDayBadge) {
            currentDayBadge.textContent = 'Completed';
            currentDayBadge.className = 'completion-badge completed';
        }
        
        // Find and unlock only the next day
        const nextDay = currentDay + 1;
        const nextDayTile = document.querySelector(`.day-tile:nth-child(${nextDay})`);
        
        if (nextDayTile && nextDayTile.classList.contains('locked')) {
            nextDayTile.classList.remove('locked');
            const nextDayBadge = document.getElementById(`day${nextDay}-badge`);
            if (nextDayBadge) {
                nextDayBadge.textContent = 'Not Started';
                nextDayBadge.className = 'completion-badge';
            }
            
            // Update click handler
            nextDayTile.style.cursor = 'pointer';
            nextDayTile.onclick = () => showDayContent(nextDay);
            
            // Remove requirements text if it exists
            const requirementsText = nextDayTile.querySelector('p:last-of-type');
            if (requirementsText?.textContent.includes('Requirements')) {
                requirementsText.remove();
            }
            
            // Increment streak and show notification
            incrementStreak();
            showUnlockNotification();
        }
    }
}

// Navigation Functions
function showDayContent(dayNumber) {
    document.getElementById('days-overview').style.display = 'none';
    document.getElementById(`day${dayNumber}-content`).style.display = 'block';
}

function showDaysOverview() {
    document.getElementById('days-overview').style.display = 'block';
    document.querySelectorAll('[id^="day"][id$="content"]').forEach(el => {
        el.style.display = 'none';
    });
}

// Modal Functions
function openVideoModal(day) {
    const modal = document.getElementById('videoModal');
    const videoFrame = document.getElementById('youtubeVideo');
    
    const videoUrls = {
        1: 'https://www.youtube.com/embed/0Hcbd8WfXes?start=30&end=216&enablejsapi=1',
        2: 'https://www.youtube.com/embed/oE1vwNNoJWo?start=281&end=434&enablejsapi=1',
    };
    
    const videoUrl = videoUrls[day];
    
    if (videoUrl) {
        videoFrame.src = videoUrl;
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    } else {
        console.error(`No video URL defined for day ${day}`);
    }
}

function closeVideoModal() {
    const modal = document.getElementById('videoModal');
    const videoFrame = document.getElementById('youtubeVideo');
    
    videoFrame.src = '';
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

function openTranslationModal(day) {
    const modal = document.getElementById('translationModal');
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
    
    const exerciseSets = {
        1: exercises,
        2: day2Exercises
    };
    
    const dayExercises = exerciseSets[day];
    
    if (dayExercises) {
        if (window.exerciseManager) {
            window.exerciseManager.cleanup();
            window.exerciseManager = null;
        }

        const container = document.getElementById('translationExerciseContainer');
        
        if (container) {
            container.innerHTML = `
                <div class="stats-grid" role="status">
                    <div class="stat-card">
                        <div class="stat-value" id="exerciseCount">0/5</div>
                        <div>Oefeningen</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value" id="accuracy">0%</div>
                        <div>Nauwkeurigheid</div>
                    </div>
                </div>
                <div class="sentence-container">
                    <h2>Vertaal deze zin:</h2>
                    <div class="sentence" aria-live="polite"></div>
                </div>
                <div class="input-container">
                    <input type="text" 
                           id="answer" 
                           class="answer-input" 
                           placeholder="Typ je Spaanse vertaling hier..." 
                           autocomplete="off"
                           spellcheck="false">
                </div>
                <div id="feedback" class="feedback" role="alert"></div>
                <button id="checkButton" class="button">
                    Controleer antwoord
                </button>
            `;

            requestAnimationFrame(() => {
                window.exerciseManager = new ExerciseManager(dayExercises);
            });
        }
    } else {
        console.error(`No exercises defined for day ${day}`);
    }
}

function closeTranslationModal() {
    const modal = document.getElementById('translationModal');
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
    
    if (window.exerciseManager) {
        window.exerciseManager.cleanup();
    }
}

function openReadingModal(day) {
    const modal = document.getElementById('readingModal');
    const readerFrame = document.getElementById('readerFrame');
    
    // Update paths to be relative to the current directory
    const readingTexts = {
        1: './Reader.html',  // Changed to direct file path
        2: './Reader.html'   // Changed to direct file path
    };
    
    const readerUrl = readingTexts[day];
    
    if (readerUrl) {
        readerFrame.src = readerUrl;
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
      
    } else {
        console.error(`No reading text defined for day ${day}`);
    }
}

function closeReadingModal() {
    const modal = document.getElementById('readingModal');
    const readerFrame = document.getElementById('readerFrame');
    
    if (modal) {
        modal.style.display = 'none';
        if (readerFrame) {
            readerFrame.src = '';
        }
        document.body.style.overflow = 'auto';
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Initialize streak and check for reset
    initializeStreak();
    
    // Set today's activity if there's a stored streak
    if (parseInt(localStorage.getItem('streakCount')) > 0) {
        setLastActivityDate();
    }
    
    // Existing modal click handlers
    window.onclick = function(event) {
        const videoModal = document.getElementById('videoModal');
        const translationModal = document.getElementById('translationModal');
        const readingModal = document.getElementById('readingModal');
        
        if (event.target === videoModal) {
            closeVideoModal();
        }
        if (event.target === translationModal) {
            closeTranslationModal();
        }
        if (event.target === readingModal) {
            closeReadingModal();
        }
    };

    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            closeVideoModal();
            closeTranslationModal();
            closeReadingModal();
        }
    });
});