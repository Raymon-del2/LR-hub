class VoiceRecorder {
    constructor() {
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.isRecording = false;
        this.stream = null;
    }

    async startRecording() {
        try {
            this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.mediaRecorder = new MediaRecorder(this.stream);
            this.audioChunks = [];

            this.mediaRecorder.ondataavailable = (event) => {
                this.audioChunks.push(event.data);
            };

            this.mediaRecorder.onstop = () => {
                const audioBlob = new Blob(this.audioChunks, { type: 'audio/wav' });
                const audioUrl = URL.createObjectURL(audioBlob);
                this.onRecordingComplete(audioUrl, audioBlob);
            };

            this.mediaRecorder.start();
            this.isRecording = true;
        } catch (error) {
            console.error('Error accessing microphone:', error);
            alert('Error accessing microphone. Please ensure you have a microphone connected and have granted permission to use it.');
        }
    }

    stopRecording() {
        if (this.mediaRecorder && this.isRecording) {
            this.mediaRecorder.stop();
            this.stream.getTracks().forEach(track => track.stop());
            this.isRecording = false;
        }
    }

    onRecordingComplete(audioUrl, audioBlob) {
        // Create new voice clip element
        const voiceClipsContainer = document.querySelector('.voice-clips');
        const newClip = document.createElement('div');
        newClip.className = 'voice-clip';
        
        const timestamp = new Date().toLocaleString();
        const clipName = `Recording ${timestamp}`;
        
        newClip.innerHTML = `
            <p>${clipName}</p>
            <audio controls src="${audioUrl}"></audio>
            <div class="clip-controls">
                <button class="clip-btn" onclick="downloadRecording('${clipName}', '${audioUrl}')">Download</button>
                <button class="clip-btn delete-btn" onclick="deleteRecording(this)">Delete</button>
            </div>
        `;
        
        voiceClipsContainer.insertBefore(newClip, voiceClipsContainer.firstChild);
    }
}

// Global functions for handling recordings
function downloadRecording(filename, audioUrl) {
    const a = document.createElement('a');
    a.href = audioUrl;
    a.download = `${filename}.wav`;
    a.click();
}

function deleteRecording(button) {
    const clipElement = button.closest('.voice-clip');
    clipElement.remove();
}

// Initialize recorder
let recorder = new VoiceRecorder();

function toggleRecording(button) {
    if (!recorder.isRecording) {
        recorder.startRecording();
        button.textContent = 'Stop Recording';
        button.classList.add('recording');
    } else {
        recorder.stopRecording();
        button.textContent = 'Start Recording';
        button.classList.remove('recording');
    }
}
