let socket;

document.addEventListener('DOMContentLoaded', function() {
    const startBtn = document.getElementById('startBtn');
    const stopBtn = document.getElementById('stopBtn');
    const transcriptionText = document.getElementById('transcriptionText');
    const responseText = document.getElementById('responseText');

    startBtn.addEventListener('click', function() {
        startBtn.disabled = true;
        stopBtn.disabled = false;
        updateTranscription('Interview session started. Listening...');
        updateResponse('Waiting for the first question...');
        startInterviewSession();
    });

    stopBtn.addEventListener('click', function() {
        startBtn.disabled = false;
        stopBtn.disabled = true;
        updateTranscription('Interview session stopped.');
        stopInterviewSession();
    });
});

function startInterviewSession() {
    socket = new WebSocket('ws://localhost:8765');

    socket.onopen = function(e) {
        console.log("Connection established");
    };

    socket.onmessage = function(event) {
        const data = JSON.parse(event.data);
        if (data.type === "session_complete") {
            updateTranscription("Interview session complete. Generating final summary...");
        } else if (data.type === "final_summary") {
            updateResponse("Final Summary:\n\n" + data.summary);
        } else {
            updateTranscription(data.question);
            updateResponse(data.answer);
        }
    };

    socket.onclose = function(event) {
        if (event.wasClean) {
            console.log(`Connection closed cleanly, code=${event.code} reason=${event.reason}`);
        } else {
            console.log('Connection died');
        }
    };

    socket.onerror = function(error) {
        console.log(`WebSocket Error: ${error.message}`);
    };
}

function stopInterviewSession() {
    if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send("stop");
    }
}

function createPairedContainer() {
    const contentContainer = document.querySelector('.content-container');
    const pairedContainer = document.createElement('div');
    pairedContainer.className = 'paired-container';
    contentContainer.appendChild(pairedContainer);
    return pairedContainer;
}

function updateTranscription(message) {
    const pairedContainer = createPairedContainer();
    const newTranscription = document.createElement('div');
    newTranscription.className = 'transcription-item';
    newTranscription.textContent = message;
    pairedContainer.appendChild(newTranscription);
    pairedContainer.scrollIntoView({ behavior: 'smooth', block: 'end' });
}

function updateResponse(message) {
    const pairedContainer = document.querySelector('.paired-container:last-child');
    const newResponse = document.createElement('div');
    newResponse.className = 'response-item';
    newResponse.textContent = message;
    pairedContainer.appendChild(newResponse);
    pairedContainer.scrollIntoView({ behavior: 'smooth', block: 'end' });
}
