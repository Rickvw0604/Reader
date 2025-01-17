// Constants
const STREAK_STORAGE_KEY = 'streak_data';
const PROGRESS_STORAGE_KEY = 'app_progress';
const SWIPE_THRESHOLD = 50;
const CHARS_PER_PAGE = 450;
const LONG_PRESS_DURATION = 500;

// Global Variables for Exercise State
let vocabulary = {};
let textLibrary = {};
let currentWord = null;
let currentElement = null;
let sentenceMode = false;
let sentences = [];
let currentSentenceIndex = 0;
let lastClickedSentenceIndex = 0;
let currentOverlayWord = null;
let currentOverlayElement = null;
let translationVisible = false;
let currentPage = 0;
let pages = [];
let touchStartX = null;
let touchEndX = null;

// Audio-related Variables
let audioElement = null;
let timestamps = {};
let currentAudioFile = null;
let selectedTextId = null;
let isPlaying = false;
let currentAudioInterval;

// Multi-select Variables
let isMultiSelectMode = false;
let selectedWords = new Set();
let longPressTimeout;
let initialX, initialY;

// Streak Manager Class
class StreakManager {
    constructor() {
        this.data = this.loadStreakData();
        this.checkDayCompletion();
    }

    loadStreakData() {
        const savedData = localStorage.getItem(STREAK_STORAGE_KEY);
        if (!savedData) {
            const initialData = {
                currentStreak: 0,
                lastCompletionDate: null,
                lastCheckDate: new Date().toDateString()
            };
            localStorage.setItem(STREAK_STORAGE_KEY, JSON.stringify(initialData));
            return initialData;
        }
        return JSON.parse(savedData);
    }

    saveStreakData() {
        localStorage.setItem(STREAK_STORAGE_KEY, JSON.stringify(this.data));
    }

    checkDayCompletion() {
        const today = new Date().toDateString();
        
        if (today !== this.data.lastCheckDate) {
            const yesterdayDate = new Date();
            yesterdayDate.setDate(yesterdayDate.getDate() - 1);
            const yesterday = yesterdayDate.toDateString();
            
            if (this.data.lastCompletionDate !== yesterday) {
                this.data.currentStreak = 0;
            }
            
            this.data.lastCheckDate = today;
            this.saveStreakData();
        }
    }

    completeDay() {
        const today = new Date().toDateString();
        
        if (this.data.lastCompletionDate !== today) {
            this.data.lastCompletionDate = today;
            this.data.currentStreak++;
            this.saveStreakData();
            
            const streakElement = document.getElementById('streakCount');
            if (streakElement) {
                streakElement.textContent = this.data.currentStreak.toString();
            }
            
            return true;
        }
        
        return false;
    }

    getCurrentStreak() {
        return this.data.currentStreak;
    }

    reset() {
        this.data = {
            currentStreak: 0,
            lastCompletionDate: null,
            lastCheckDate: new Date().toDateString()
        };
        this.saveStreakData();
    }
}

// Progress Manager Class
class ProgressManager {
    constructor() {
        this.streakManager = new StreakManager();
        this.progress = this.loadProgress();
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        this.updateAllDayTiles();
    }

    updateAllDayTiles() {
        document.querySelectorAll('.day-tile').forEach((tile, index) => {
            const dayNumber = index + 1;
            this.setupDayTileClickHandler(tile, dayNumber);
            this.updateDayTileUI(dayNumber);
        });
    }

    setupDayTileClickHandler(tile, dayNumber) {
        // Remove existing click listener by cloning the tile
        const newTile = tile.cloneNode(true);
        tile.parentNode.replaceChild(newTile, tile);

        newTile.addEventListener('click', () => {
            const dayProgress = this.progress.days[dayNumber];
            console.log('Day click handler - status:', dayProgress?.status);
            
            if (dayProgress && dayProgress.status !== 'locked') {
                showDayContent(dayNumber);
            }
        });
    }

    loadProgress() {
        const savedProgress = localStorage.getItem(PROGRESS_STORAGE_KEY);
        if (!savedProgress) {
            const initialProgress = {
                currentDay: 1,
                lastSaveDate: new Date().toISOString(),
                days: {
                    1: {
                        status: 'unlocked',
                        exercises: {
                            anki: 'not_started',
                            listening: 'not_started',
                            translation: 'not_started',
                            reading: 'not_started'
                        }
                    }
                }
            };
            this.saveProgress(initialProgress);
            return initialProgress;
        }
        return JSON.parse(savedProgress);
    }

    saveProgress(progressData) {
        progressData.lastSaveDate = new Date().toISOString();
        localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(progressData));
        this.progress = progressData;
        this.updateAllDayTiles(); // Update UI when progress changes
    }

    getProgress() {
        return this.progress;
    }

    completeExercise(dayNumber, exerciseType) {
        console.log(`Completing exercise: ${exerciseType} for day ${dayNumber}`);
        
        if (!this.progress.days[dayNumber]) {
            this.progress.days[dayNumber] = {
                status: dayNumber === 1 ? 'unlocked' : 'locked',
                exercises: {
                    anki: 'not_started',
                    listening: 'not_started',
                    translation: 'not_started',
                    reading: 'not_started'
                }
            };
        }

        this.progress.days[dayNumber].exercises[exerciseType] = 'completed';
        
        // Update UI for the specific exercise
        const statusElement = document.getElementById(
            `${exerciseType}-status${dayNumber === 1 ? '' : '-day' + dayNumber}`
        );
        if (statusElement) {
            statusElement.textContent = 'Completed';
            statusElement.className = 'completion-badge completed';
        }

        this.checkDayCompletion(dayNumber);
        this.saveProgress(this.progress);
    }

    updateDayTileUI(dayNumber) {
        const dayTile = document.querySelector(`.day-tile:nth-child(${dayNumber})`);
        const dayBadge = document.getElementById(`day${dayNumber}-badge`);
        
        if (!dayTile || !dayBadge) return;

        const dayProgress = this.progress.days[dayNumber];
        if (!dayProgress) return;

        if (dayProgress.status === 'unlocked' || dayProgress.status === 'completed') {
            dayTile.classList.remove('locked');
            dayTile.style.cursor = 'pointer';

            const requirementsText = dayTile.querySelector('p:last-of-type');
            if (requirementsText?.textContent.includes('Requirements')) {
                requirementsText.remove();
            }

            dayBadge.textContent = dayProgress.status === 'completed' ? 'Completed' : 'In Progress';
            dayBadge.className = `completion-badge ${dayProgress.status === 'completed' ? 'completed' : 'in-progress'}`;
        } else {
            dayTile.classList.add('locked');
            dayTile.style.cursor = 'not-allowed';
            dayBadge.textContent = 'Locked';
            dayBadge.className = 'completion-badge locked';
        }
    }

    checkDayCompletion(dayNumber) {
        const dayProgress = this.progress.days[dayNumber];
        if (!dayProgress) return;

        const allCompleted = Object.values(dayProgress.exercises)
            .every(status => status === 'completed');

        if (allCompleted && dayProgress.status !== 'completed') {
            dayProgress.status = 'completed';
            
            const nextDayNumber = dayNumber + 1;
            if (!this.progress.days[nextDayNumber]) {
                this.progress.days[nextDayNumber] = {
                    status: 'unlocked',
                    exercises: {
                        anki: 'not_started',
                        listening: 'not_started',
                        translation: 'not_started',
                        reading: 'not_started'
                    }
                };
            } else {
                this.progress.days[nextDayNumber].status = 'unlocked';
            }

            this.streakManager.completeDay();
            this.saveProgress(this.progress);
            this.showUnlockNotification();
        }
    }

    showUnlockNotification() {
        const toast = document.createElement('div');
        toast.className = 'toast success animate__animated animate__slideIn';
        toast.textContent = '🎉 Next day unlocked!';
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.add('animate__fadeOut');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    loadSavedProgress() {
        const streakElement = document.getElementById('streakCount');
        if (streakElement) {
            streakElement.textContent = this.streakManager.getCurrentStreak().toString();
        }

        Object.keys(this.progress.days).forEach(dayNumber => {
            const dayProgress = this.progress.days[dayNumber];
            
            Object.entries(dayProgress.exercises).forEach(([exerciseType, status]) => {
                if (status === 'completed') {
                    const statusElement = document.getElementById(
                        `${exerciseType}-status${dayNumber === '1' ? '' : '-day' + dayNumber}`
                    );
                    if (statusElement) {
                        statusElement.textContent = 'Completed';
                        statusElement.className = 'completion-badge completed';
                    }
                }
            });

            this.updateDayTileUI(parseInt(dayNumber));
        });
    }
}

// Modal Manager Class
class ModalManager {
    constructor() {
        this.preloadedContent = {};
        this.activeModal = null;
        this.setupStyles();
    }

    setupStyles() {
        const styleSheet = document.createElement('style');
        styleSheet.textContent = `
            .modal {
                opacity: 0;
                visibility: visible;
                transition: opacity 0.3s ease;
                will-change: opacity;
            }
            
            .preload-container {
                position: fixed;
                left: -9999px;
                top: -9999px;
                visibility: hidden;
            }
            
            .modal-frame {
                opacity: 0;
                transition: opacity 0.3s ease;
                will-change: opacity;
            }
            
            .modal-frame.visible {
                opacity: 1;
            }
        `;
        document.head.appendChild(styleSheet);
    }

    async preloadDayContent(dayNumber) {
        if (this.preloadedContent[dayNumber]) {
            return Promise.resolve();
        }

        const spinner = document.getElementById('loadingSpinner');
        spinner.style.display = 'flex';

        let preloadContainer = document.getElementById('preloadContainer');
        if (!preloadContainer) {
            preloadContainer = document.createElement('div');
            preloadContainer.id = 'preloadContainer';
            preloadContainer.className = 'preload-container';
            document.body.appendChild(preloadContainer);
        }

        const exercises = [
            { type: 'video', src: `VideoExercise.html?day=${dayNumber}` },
            { type: 'translation', src: `TranslateExercise.html?day=${dayNumber}` },
            { type: 'reading', src: `Reader.html?day=${dayNumber}` },
            { type: 'srs', src: `SRS.html?day=${dayNumber}` }
        ];

        this.preloadedContent[dayNumber] = {};

        try {
            await Promise.all(exercises.map(exercise => 
                new Promise((resolve, reject) => {
                    const frame = document.createElement('iframe');
                    frame.src = exercise.src;
                    frame.className = 'modal-frame';
                    frame.style.width = '100%';
                    frame.style.height = '100%';
                    frame.style.border = 'none';

                    frame.onload = () => {
                        this.preloadedContent[dayNumber][exercise.type] = frame;
                        resolve();
                    };

                    frame.onerror = reject;
                    preloadContainer.appendChild(frame);
                })
            ));

            spinner.style.display = 'none';
            return Promise.resolve();
        } catch (error) {
            console.error('Error preloading content:', error);
            spinner.style.display = 'none';
            return Promise.reject(error);
        }
    }

    showModal(modalId, frameId, type, day) {
        const modal = document.getElementById(modalId);
        const frame = document.getElementById(frameId);
        
        if (!modal || !frame || !this.preloadedContent[day]?.[type]) {
            console.error('Modal, frame, or preloaded content not found');
            return;
        }

        if (this.activeModal) {
            const currentModal = document.getElementById(this.activeModal);
            if (currentModal) {
                currentModal.style.opacity = '0';
                currentModal.style.visibility = 'hidden';
                currentModal.style.display = 'none';
                
                const currentFrame = currentModal.querySelector('iframe');
                if (currentFrame) {
                    currentFrame.classList.remove('visible');
                }
            }
        }

        modal.style.display = 'block';
        modal.style.opacity = '0';
        modal.style.visibility = 'visible';
        
        modal.offsetHeight; // Force reflow
        
        const preloadedFrame = this.preloadedContent[day][type];
        frame.src = preloadedFrame.src;

        requestAnimationFrame(() => {
            modal.style.opacity = '1';
            frame.classList.add('visible');
        });

        this.activeModal = modalId;
        document.body.style.overflow = 'hidden';
    }

    hideModal(modalId) {
        const modal = document.getElementById(modalId);
        if (!modal) return;

        const frame = modal.querySelector('iframe');
        
        modal.style.opacity = '0';
        if (frame) {
            frame.classList.remove('visible');
        }

        setTimeout(() => {
            modal.style.display = 'none';
            modal.style.visibility = 'hidden';
            document.body.style.overflow = 'auto';
        }, 300);

        this.activeModal = null;
    }
}

// Modal Functions
function openVideoModal(day) {
    modalManager.showModal('videoModal', 'videoFrame', 'video', day);
}

function openTranslationModal(day) {
    modalManager.showModal('translationModal', 'translationFrame', 'translation', day);
}

function openReadingModal(day) {
    modalManager.showModal('readingModal', 'readerFrame', 'reading', day);
}

function openSRSModal(day) {
    modalManager.showModal('srsModal', 'srsFrame', 'srs', day);
}

function closeVideoModal() {
    modalManager.hideModal('videoModal');
}

function closeTranslationModal() {
    modalManager.hideModal('translationModal');
}

function closeReadingModal() {
    modalManager.hideModal('readingModal');
}

function closeSRSModal() {
    modalManager.hideModal('srsModal');
}

// Navigation Functions
async function showDayContent(dayNumber) {
    const progressManager = new ProgressManager();
    const progress = progressManager.getProgress();
    const dayProgress = progress.days[dayNumber];

    if (!dayProgress || dayProgress.status === 'locked') {
        console.log('Attempted to access locked day:', dayNumber);
        return;
    }

    try {
        await modalManager.preloadDayContent(dayNumber);
        
        document.getElementById('days-overview').style.display = 'none';
        document.getElementById(`day${dayNumber}-content`).style.display = 'block';
        
        const nextDay = dayNumber + 1;
        if (progress.days[nextDay]) {
            modalManager.preloadDayContent(nextDay).catch(console.error);
        }
    } catch (error) {
        console.error('Error loading day content:', error);
    }
}

function showDaysOverview() {
    document.getElementById('days-overview').style.display = 'block';
    document.querySelectorAll('[id^="day"][id$="-content"]').forEach(el => {
        el.style.display = 'none';
    });
}

// Exercise completion handler
function markComplete(exerciseType, day) {
    console.log(`Marking exercise ${exerciseType} complete for day ${day}`);
    const progressManager = new ProgressManager();
    progressManager.completeExercise(day, exerciseType);

    switch (exerciseType) {
        case 'listening': 
            closeVideoModal(); 
            break;
        case 'translation': 
            closeTranslationModal(); 
            break;
        case 'reading': 
            closeReadingModal(); 
            break;
        case 'anki': 
            closeSRSModal(); 
            break;
    }
}

// Audio Functions
function updateAudioProgress() {
    if (!audioElement) return;
    
    const progressFills = document.querySelectorAll('.audio-progress-fill');
    const currentTimeSpans = document.querySelectorAll('#currentTime');
    const durationSpan = document.getElementById('duration');
    
    const progress = (audioElement.currentTime / audioElement.duration) * 100;
    
    progressFills.forEach(fill => {
        fill.style.width = `${progress}%`;
    });
    
    currentTimeSpans.forEach(span => {
        span.textContent = formatTime(audioElement.currentTime);
    });
    
    if (durationSpan) {
        durationSpan.textContent = formatTime(audioElement.duration);
    }
}

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    const progressManager = new ProgressManager();
    window.modalManager = new ModalManager();
    
    // Handle exercise completion messages
    window.addEventListener('message', (event) => {
        if (event.data.type === 'exerciseComplete') {
            console.log('Exercise completed:', event.data.exercise, 'Day:', event.data.day);
            markComplete(event.data.exercise, event.data.day);
        }
    });

    // Close modals on escape key
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            closeVideoModal();
            closeTranslationModal();
            closeReadingModal();
            closeSRSModal();
        }
    });

    // Debug logging for initialization
    console.log('Initializing app...');
    console.log('Loading saved progress...');
    
    // Load saved progress and update UI
    progressManager.loadSavedProgress();
    
    console.log('Initialization complete');
});

// Error handling
window.onerror = function(msg, url, lineNo, columnNo, error) {
    console.error('Error: ', msg);
    console.error('URL: ', url);
    console.error('Line: ', lineNo);
    console.error('Column: ', columnNo);
    console.error('Error object: ', error);
    return false;
};

// Service Worker Registration (if needed)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').then(registration => {
            console.log('ServiceWorker registration successful');
        }).catch(err => {
            console.log('ServiceWorker registration failed: ', err);
        });
    });
}