let socket;

document.addEventListener('DOMContentLoaded', function() {
    const startBtn = document.getElementById('startBtn');
    const stopBtn = document.getElementById('stopBtn');
    const transcriptionText = document.getElementById('transcriptionText');
    const responseText = document.getElementById('responseText');

    startBtn.addEventListener('click', function() {
        startBtn.disabled = true;
        stopBtn.disabled = false;
        transcriptionText.textContent = 'Interview session started. Listening...';
        responseText.textContent = 'Waiting for the first question...';
        startInterviewSession();
    });

    stopBtn.addEventListener('click', function() {
        startBtn.disabled = false;
        stopBtn.disabled = true;
        transcriptionText.textContent += '\n\nInterview session stopped.';
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

function updateTranscription(message) {
    const transcriptionText = document.getElementById('transcriptionText');
    transcriptionText.textContent += (transcriptionText.textContent ? '\n\n' : '') + message;
    transcriptionText.scrollTop = transcriptionText.scrollHeight;
}

function updateResponse(message) {
    const responseText = document.getElementById('responseText');
    responseText.textContent = message;
    responseText.scrollTop = responseText.scrollHeight;
}
