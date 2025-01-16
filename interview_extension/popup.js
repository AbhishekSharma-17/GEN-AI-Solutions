let socket;

document.addEventListener('DOMContentLoaded', function() {
    const startBtn = document.getElementById('startBtn');
    const stopBtn = document.getElementById('stopBtn');
    const statusIndicator = document.createElement('div');
    statusIndicator.id = 'status-indicator';
    document.querySelector('.controls').appendChild(statusIndicator);

    startBtn.disabled = true;
    updateStatus('Connecting to server...');

    connectWebSocket();

    startBtn.addEventListener('click', function() {
        startBtn.disabled = true;
        stopBtn.disabled = false;
        updateTranscription('Interview session started. Listening...');
        updateResponse('Waiting for the first question...');
        if (socket && socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({type: "start_session"}));
        } else {
            console.error("WebSocket is not open. Cannot start session.");
            updateStatus('Error: Not connected to server', 'error');
        }
    });

    stopBtn.addEventListener('click', function() {
        startBtn.disabled = false;
        stopBtn.disabled = true;
        updateTranscription('Interview session stopped.');
        stopInterviewSession();
    });

    // Check if marked library is loaded
    if (typeof marked !== 'undefined') {
        console.log("marked library is loaded");
    } else {
        console.error("marked library is not loaded");
    }
});

function connectWebSocket() {
    socket = new WebSocket('ws://localhost:8765');

    socket.onopen = function(e) {
        console.log("Connection established");
        updateStatus('Connected to server', 'success');
        document.getElementById('startBtn').disabled = false;
    };

    socket.onmessage = function(event) {
        console.log("Received message:", event.data);
        try {
            const data = JSON.parse(event.data);
            console.log("Parsed data:", data);
            if (data.type === "session_complete") {
                console.log("Session complete");
                updateTranscription("Interview session complete. Generating final summary...");
            } else if (data.type === "final_summary") {
                console.log("Received final summary");
                updateResponse("Final Summary:\n\n" + data.summary);
            } else if (data.question && data.answer) {
                console.log("Received question and answer");
                updateTranscription(data.question);
                updateResponse(data.answer);
            } else {
                console.error("Unexpected data structure:", data);
            }
        } catch (error) {
            console.error("Error parsing message:", error);
        }
    };

    socket.onclose = function(event) {
        if (event.wasClean) {
            console.log(`Connection closed cleanly, code=${event.code} reason=${event.reason}`);
        } else {
            console.log('Connection died');
        }
        updateStatus('Disconnected from server', 'error');
        document.getElementById('startBtn').disabled = true;
        setTimeout(connectWebSocket, 5000); // Try to reconnect every 5 seconds
    };

    socket.onerror = function(error) {
        console.log(`WebSocket Error: ${error.message}`);
        updateStatus('Error: ' + error.message, 'error');
    };
}

function updateStatus(message, type = 'info') {
    console.log(`Status update: ${message} (${type})`);
    const statusIndicator = document.getElementById('status-indicator');
    statusIndicator.textContent = message;
    statusIndicator.className = type;
}

function stopInterviewSession() {
    if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send("stop");
    }
}

function createPairedContainer() {
    console.log("Creating paired container");
    const contentContainer = document.querySelector('.content-container');
    if (!contentContainer) {
        console.error("Content container not found");
        return null;
    }
    const pairedContainer = document.createElement('div');
    pairedContainer.className = 'paired-container';
    contentContainer.appendChild(pairedContainer);
    console.log("Paired container created and appended");
    return pairedContainer;
}

function updateTranscription(message) {
    console.log("Updating transcription:", message);
    const pairedContainer = createPairedContainer();
    if (!pairedContainer) {
        console.error("Failed to create paired container for transcription");
        return;
    }
    const newTranscription = document.createElement('div');
    newTranscription.className = 'transcription-item';
    newTranscription.textContent = message;
    pairedContainer.appendChild(newTranscription);
    pairedContainer.scrollIntoView({ behavior: 'smooth', block: 'end' });
    console.log("Transcription updated");
}

function updateResponse(message) {
    console.log("Updating response:", message);
    const pairedContainer = document.querySelector('.paired-container:last-child');
    if (!pairedContainer) {
        console.error("No paired container found for response");
        return;
    }
    const newResponse = document.createElement('div');
    newResponse.className = 'response-item';
    try {
        if (typeof marked !== 'undefined') {
            newResponse.innerHTML = marked.parse(message);
            console.log("Markdown parsed successfully");
        } else {
            console.error("marked library is not loaded");
            newResponse.textContent = message;
        }
    } catch (error) {
        console.error("Error parsing Markdown:", error);
        newResponse.textContent = message;
    }
    pairedContainer.appendChild(newResponse);
    pairedContainer.scrollIntoView({ behavior: 'smooth', block: 'end' });
    console.log("Response added to DOM");
}
