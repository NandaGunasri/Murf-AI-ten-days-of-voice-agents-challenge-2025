function speakNow() {
    const content = document.getElementById("textInput").value;

    if (!content.trim()) {
        alert("Please enter some text!");
        return;
    }

    const voice = new SpeechSynthesisUtterance(content);
    voice.lang = "en-US";  // language
    voice.rate = 1;        // speed
    voice.pitch = 1;       // tone

    speechSynthesis.speak(voice);
}
