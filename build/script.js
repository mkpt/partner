document.addEventListener('DOMContentLoaded', () => {
    let currentIndex = 0;
    let phrases = [];
    let voices = [];
    let englishVoice;
    let japaneseVoice;

    const englishPhraseElement = document.getElementById('english-phrase');
    const romanizedPhraseElement = document.getElementById('romanized-phrase');
    const startButton = document.getElementById('start-button');
    const promptAudio = document.getElementById('prompt-audio');
    const separator = document.getElementById('separator');
    const turnContainer = document.getElementById('turn-container');
    const myTurnElement = document.getElementById('my-turn');
    const yourTurnElement = document.getElementById('your-turn');
    const spaceToContinueElement = document.getElementById('space-to-continue');

    promptAudio.volume = 0.8; // Reduce volume by 20%

    fetch('/data/phrases')
        .then(response => response.json())
        .then(data => {
            phrases = data;
        })
        .catch(error => {
            console.error('Error fetching phrases:', error);
        });

    startButton.addEventListener('click', () => {
        startButton.style.display = 'none';
        displayPhrase();
        document.addEventListener('keydown', handleKeydown);
    });

    function displayPhrase() {
        if (currentIndex < phrases.length) {
            separator.style.display = 'block';
            turnContainer.style.display = 'flex';

            const phrase = phrases[currentIndex];
            fadeInTextDual(englishPhraseElement, romanizedPhraseElement, phrase.English, phrase.Romanized, () => {
                speak(phrase.English, 'en-US', englishVoice, () => {
                    setTimeout(() => {
                        speak(phrase.Japanese, 'ja-JP', japaneseVoice, () => {
                            playPromptAudio();
                        });
                    }, 500); // 0.5 second gap between English and Japanese audio
                });
            });
        } else {
            englishPhraseElement.textContent = 'No more phrases';
            romanizedPhraseElement.textContent = '';
            separator.style.display = 'none';
            turnContainer.style.display = 'none';
        }
    }

    function playPromptAudio() {
        promptAudio.play().then(() => {
            myTurnElement.classList.remove('highlight');
            yourTurnElement.classList.add('highlight');
            spaceToContinueElement.style.display = 'block';
        }).catch(error => {
            console.error('Error playing prompt audio:', error);
        });
    }

    function speak(text, lang, voice, callback) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = lang;
        utterance.voice = voice;

        utterance.onstart = () => {
            myTurnElement.classList.add('highlight');
            yourTurnElement.classList.remove('highlight');
        };

        utterance.onend = () => {
            if (callback) {
                callback();
            }
        };

        speechSynthesis.speak(utterance);
    }

    function fadeInText(element, text, callback, duration = 500) {
        element.style.opacity = 0;
        element.textContent = text;
        element.style.display = 'block';
        let opacity = 0;
        const fadeIn = setInterval(() => {
            if (opacity < 1) {
                opacity += 0.1;
                element.style.opacity = opacity;
            } else {
                clearInterval(fadeIn);
                if (callback) {
                    callback();
                }
            }
        }, duration / 10);
    }

    function fadeInTextDual(element1, element2, text1, text2, callback, duration = 500) {
        element1.style.opacity = 0;
        element2.style.opacity = 0;
        element1.textContent = text1;
        element2.textContent = text2;
        element1.style.display = 'block';
        element2.style.display = 'block';
        let opacity = 0;
        const fadeIn = setInterval(() => {
            if (opacity < 1) {
                opacity += 0.1;
                element1.style.opacity = opacity;
                element2.style.opacity = opacity;
            } else {
                clearInterval(fadeIn);
                if (callback) {
                    callback();
                }
            }
        }, duration / 10);
    }

    function fadeOutText(element, callback, duration = 500) {
        let opacity = 1;
        const fadeOut = setInterval(() => {
            if (opacity > 0) {
                opacity -= 0.1;
                element.style.opacity = opacity;
            } else {
                clearInterval(fadeOut);
                if (callback) {
                    callback();
                }
            }
        }, duration / 10);
    }

    function fadeOutTextDual(element1, element2, callback, duration = 500) {
        let opacity = 1;
        const fadeOut = setInterval(() => {
            if (opacity > 0) {
                opacity -= 0.1;
                element1.style.opacity = opacity;
                element2.style.opacity = opacity;
            } else {
                clearInterval(fadeOut);
                if (callback) {
                    callback();
                }
            }
        }, duration / 10);
    }

    function nextPhrase() {
        spaceToContinueElement.style.display = 'none';
        fadeOutTextDual(englishPhraseElement, romanizedPhraseElement, () => {
            currentIndex++;
            setTimeout(() => {
                displayPhrase();
            }, 500); // Delay to ensure the fade-out completes before the next fade-in
        }, 500);
    }

    function handleKeydown(event) {
        if (event.code === 'Space') {
            nextPhrase();
        }
    }

    function setVoices() {
        voices = speechSynthesis.getVoices();
        console.log(voices); // Log available voices to console for debugging

        // Select English voice
        englishVoice = voices.find(voice => voice.lang === 'en-US' && voice.name.includes('Male'));
        if (!englishVoice) {
            englishVoice = voices.find(voice => voice.lang === 'en-US');
        }

        // Select Japanese voice
        japaneseVoice = voices.find(voice => voice.lang === 'ja-JP' && voice.name.includes('Male'));
        if (!japaneseVoice) {
            japaneseVoice = voices.find(voice => voice.lang === 'ja-JP');
        }

        console.log('English Voice:', englishVoice);
        console.log('Japanese Voice:', japaneseVoice);
    }

    speechSynthesis.onvoiceschanged = setVoices;
    setVoices();
});
