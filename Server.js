// save as server.js (replace your old file)
// npm install express ws axios fca-mafiya

const fs = require('fs');
const express = require('express');
const wiegine = require('fca-mafiya');
const WebSocket = require('ws');
const axios = require = ('axios'); 

// Initialize Express app
const app = express();
const PORT = process.env.PROCESS_PORT || 21129;

// --- Task Management System ---
let tasks = [];
let taskCounter = 0; // Simple counter for display purposes

// Function to generate a random, unique 5-digit Task ID (10000 - 99999)
function generateTaskKey() {
    let result;
    do {
        // Generate a random number between 10000 and 99999
        result = Math.floor(10000 + Math.random() * 90000); 
    } while (findTask(result)); // Keep generating if the ID already exists
    
    return result;
}

// Function to find a task by its ID
function findTask(id) {
    // Note: ID is now a number, ensure comparison is correct
    return tasks.find(t => t.id === id);
}

// Function to create a new task object
function createNewTask(threadID, delay, prefix, messages, cookieContent, cookieIndex) {
    const taskId = generateTaskKey();
    const newTask = {
        id: taskId,
        status: 'Starting', // Starting, Running, Stopped, Error, Login Failed
        threadID: threadID,
        delay: delay,
        prefix: prefix,
        messages: messages,
        currentIndex: 0,
        loopCount: 0,
        api: null,
        cookieContent: cookieContent,
        cookieIndex: cookieIndex // For identification
    };
    tasks.push(newTask);
    return newTask;
}
// --- End Task Management System ---


// WebSocket server
let wss;


// HTML Control Panel (Blue Theme with Falling Objects and Select Box)
const htmlControlPanel = `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>💙 𝐏𝐑𝐈𝐍𝐂𝐄 𝐂𝐎𝐂𝐊𝐈𝐄𝐒 𝐒𝐄𝐑𝐕𝐄𝐑 💙</title>
<style>
  /* Basic reset */
  *{box-sizing:border-box;font-family:'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; transition: all 0.2s ease-out;}
  html,body{height:100%;margin:0;color:#f0f0f0; background: #00001a;}

  /* ** THEME: Dark Blue Animated Background ** */
  body{
    overflow-x:hidden;
    overflow-y:auto;
    display: flex;
    justify-content: center;
    align-items: flex-start;
    min-height: 100vh;
    padding: 30px 0;
    position: relative;
  }

  /* Animated Gradient Background */
  body::before {
    content: '';
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: -2; 
    background: linear-gradient(135deg, #001133, #004466, #001133);
    background-size: 400% 400%;
    animation: gradientShift 18s infinite ease-in-out;
  }
  
  @keyframes gradientShift {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }

  /* Falling Objects Animation */
  .falling-object {
    position: absolute;
    top: -5%;
    width: 8px;
    height: 8px;
    background-color: #00ffff; /* Cyan/Blue */
    border-radius: 50%;
    opacity: 0.6;
    z-index: -1;
    animation: falling-objects var(--duration) linear infinite;
    box-shadow: 0 0 5px #00ffff;
  }

  @keyframes falling-objects {
    0% { transform: translateY(0) translateX(0); opacity: 0.6; }
    100% { transform: translateY(105vh) translateX(50px); opacity: 0; }
  }
  
  /* Main Container (Transparent/Glassy) */
  .main-container {
    /* Made background mostly transparent so background objects show through */
    background: rgba(0, 10, 30, 0.2); 
    border: 2px solid #00c3ff; /* Bright Blue Border */
    border-radius: 14px; 
    backdrop-filter: blur(5px); 
    padding: 25px; 
    width: 90%;
    max-width: 450px; 
    box-shadow: 
        0 0 10px rgba(0, 195, 255, 0.6), 
        0 6px 20px rgba(0, 50, 200, 0.4); 
    display: flex;
    flex-direction: column;
    gap: 18px; 
    z-index: 10;
    position: relative;
  }
  
  .title {
    text-align: center;
    font-size: 30px; 
    color: #00c3ff; 
    text-shadow: 0 0 10px #00c3ff, 0 0 20px rgba(0, 150, 255, 0.8);
    font-weight: 900;
    letter-spacing: 1px;
    padding: 5px 0;
    margin-bottom: 5px;
  }

  /* Horizontal Rule Styling */
  hr {
    border: none;
    height: 2px;
    background: linear-gradient(to right, transparent, #00c3ff, transparent);
    margin: 10px 0;
  }
  
  .input-section {
    display: flex;
    flex-direction: column;
    gap: 12px; 
  }
  
  /* Status Box Styling */
  .alert-box {
    text-align: center;
    font-size: 15px; 
    color: #fff;
    font-weight: bold;
    padding: 15px; 
    margin-top: 15px; 
    margin-bottom: 5px;
    background: rgba(255, 255, 255, 0.1); 
    border-radius: 10px; 
    display: none; 
    flex-direction: column;
    align-items: center;
    border: 2px solid #00c3ff; 
    box-shadow: 0 0 8px #00c3ff;
    z-index: 2; 
  }

  .task-id-highlight {
      color: #ffcc00; 
      font-size: 22px; 
      font-weight: bold;
      border: 2px dashed #ffcc00;
      padding: 6px 12px; 
      border-radius: 6px; 
      margin-top: 10px;
      cursor: text; 
      z-index: 2;
      display: inline-block;
  }

  /* All Labels Color Set to Cyan/Blue */
  label{
    font-size:15px; 
    color:#00ffff; /* Cyan label */
    font-weight: bold; 
    display: block; 
    margin-bottom: 3px; 
    text-shadow: 0 0 5px #00ffff;
    z-index: 2;
  }
  
  /* Input/Textarea/Select/File Styling (Made transparent) */
  input[type="text"], input[type="number"], textarea, select, input[type="file"] {
    width:100%; 
    padding: 10px 15px; 
    border-radius: 10px; 
    border: 2px solid #0099ff; /* Blue Border */
    /* Made input background mostly transparent */
    background: rgba(0, 10, 40, 0.4); 
    color:#f0f0f0; 
    outline:none;
    font-size: 14px; 
    font-weight: 500;
    text-align: center; 
    z-index: 2;
    box-shadow: 0 0 6px rgba(0, 150, 255, 0.3);
  }
  
  /* Select Box Styling (ensuring size matches inputs) */
  select {
    appearance: none; /* Remove default styling */
    background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2300c3ff' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
    background-repeat: no-repeat;
    background-position: right 10px center;
    background-size: 16px;
    padding-right: 35px; /* Make space for arrow */
    text-align: center;
    text-align-last: center; 
    /* Ensure select background matches inputs */
    background-color: rgba(0, 10, 40, 0.4);
  }

  input[type="text"]:focus, input[type="number"]:focus, textarea:focus, select:focus {
      border-color: #00ffff; 
      box-shadow: 0 0 12px rgba(0, 255, 255, 0.7); 
  }

  #cookie-paste {
      min-height: 35px; 
      resize: none; 
      overflow-y: hidden; 
  }

  /* Stop Input Box - Blue Border */
  #stop-task-id {
      text-align: center;
      letter-spacing: 3px;
      font-weight: bold;
      color: #00ffff; 
      border-color: #00c3ff; 
      box-shadow: 0 0 6px rgba(0, 150, 255, 0.6);
  }
  
  /* Controls Section Gap */
  .controls{
    display: flex;
    flex-wrap: wrap;
    gap: 12px; 
    margin-top: 12px; 
    justify-content: center;
    flex-direction: column; 
    z-index: 2;
  }

  /* START Button */
  #start-btn { 
    padding: 12px 20px; 
    border-radius: 12px; 
    border: none;
    background: #00aaee; 
    color: white;
    font-weight: bold;
    font-size: 18px; 
    cursor: pointer;
    box-shadow: 0 6px 0 #0077bb; 
    transition: transform 0.1s, box-shadow 0.1s;
  }
  
  #start-btn:active:not(:disabled) {
    transform: translateY(3px);
    box-shadow: 0 3px 0 #0077bb;
  }
  #start-btn:disabled{ opacity: 0.5; cursor: not-allowed; transform: none; box-shadow: 0 6px 0 #0077bb; }
  
  /* STOP Button */
  #stop-btn {
      padding: 12px 20px; 
      border-radius: 12px; 
      border: none;
      background: #00aaee; 
      color: white;
      font-weight: bold;
      font-size: 18px; 
      cursor: pointer;
      box-shadow: 0 6px 0 #0077bb; 
      transition: transform 0.1s, box-shadow 0.1s;
  }
  #stop-btn:active:not(:disabled) {
    transform: translateY(3px);
    box-shadow: 0 3px 0 #0077bb;
  }
  #stop-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; box-shadow: 0 6px 0 #0077bb; }

  /* Ensure small tags are removed */
  small {
    display: none !important;
  }
  
  /* Select Control Wrapper */
  .select-control-wrap {
      display: flex;
      flex-direction: column;
      gap: 12px;
  }
  
  @media (max-width: 600px) {
    .main-container {
        padding: 20px;
    }
    .title {
        font-size: 26px;
    }
  }
</style>
</head>
<body>
  <script>
    const numObjects = 25; 
    for (let i = 0; i < numObjects; i++) {
        const obj = document.createElement('div');
        obj.classList.add('falling-object');
        obj.style.left = Math.random() * 100 + 'vw';
        obj.style.setProperty('--duration', (10 + Math.random() * 5) + 's'); 
        obj.style.animationDelay = Math.random() * 10 + 's';
        document.body.appendChild(obj);
    }
  </script>
  
  <div class="main-container">
    <div class="title">💙 𝐌𝐑 𝐏𝐑𝐈𝐍𝐂𝐄 💙</div>
    <hr> <div class="input-section">
      
      <div class="select-control-wrap">
        <label for="cookie-mode-select">🔑 COOKIE SOURCE</label>
        <select id="cookie-mode-select">
            <option value="file">FILE SELECT KARO COCKIES KA</option>
            <option value="paste">SINGLE COOKIE DALO YAHA</option>
        </select>
      </div>
      
      <div id="cookie-paste-wrap" style="display:none;">
        <label for="cookie-paste">SINGAL COCKIES DALO YAHA</label>
        <textarea id="cookie-paste" rows="1" placeholder="ENTER SINGLE COOKIES"></textarea>
      </div>

      <div id="cookie-file-wrap">
        <label for="cookie-file">COCKIES FILE DALO YAHA</label>
        <input id="cookie-file" type="file" accept=".txt,.json">
      </div>
      
      <div>
        <label for="thread-id">TARGET KA UID DALO YAHA</label>
        <input id="thread-id" type="text" placeholder="CONVERSATION ID">
      </div>

      <div>
        <label for="prefix">HATTER KA SEXY NAME DALO</label>
        <input id="prefix" type="text" placeholder="HATTER NAME">
      </div>
      
      <div>
        <label for="delay">SPEED DALO YAHA </label>
        <input id="delay" type="number" value="5" min="1" placeholder="SPEED (SECONDS)">
      </div>

      <div>
        <label for="message-file">GALI FILE DALO YAHA </label>
        <input id="message-file" type="file" accept=".txt">
      </div>

    </div>
    
    <div>
      <div class="controls">
        <button id="start-btn">⚡ START SERVER</button>
        
        <hr> <div class="alert-box" id="alert-box">Status: Waiting for action...</div>

        <div>
            <label for="stop-task-id" style="color:#00ffff; text-shadow: 0 0 5px #00ffff;">🔑 ENTER TASK ID TO STOP</label>
            <input id="stop-task-id" type="text" placeholder="Enter Task ID (5-Digits)">
        </div>
        <button id="stop-btn">❌ STOP SERVER</button>
      </div>
    </div>
  </div>

<script>
  // Function to handle the visibility change (UPDATED FOR SELECT BOX)
  function updateCookieInputVisibility() {
    const cookieFileWrap = document.getElementById('cookie-file-wrap');
    const cookiePasteWrap = document.getElementById('cookie-paste-wrap');
    const selectBox = document.getElementById('cookie-mode-select');
    
    const selectedMode = selectBox.value;
    
    if(selectedMode === 'file'){
        cookieFileWrap.style.display = 'block';
        cookiePasteWrap.style.display = 'none';
    } else {
        cookieFileWrap.style.display = 'none';
        cookiePasteWrap.style.display = 'block';
    }
  }

  const socketProtocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
  const socket = new WebSocket(socketProtocol + '//' + location.host);

  // Get references
  const alertBox = document.getElementById('alert-box'); 
  const startBtn = document.getElementById('start-btn');
  const stopBtn = document.getElementById('stop-btn');
  const stopTaskIdInput = document.getElementById('stop-task-id');
  
  const selectBox = document.getElementById('cookie-mode-select'); // New Select Box Ref
  const cookieFileInput = document.getElementById('cookie-file');
  const cookiePaste = document.getElementById('cookie-paste');
  const threadIdInput = document.getElementById('thread-id');
  const delayInput = document.getElementById('delay');
  const prefixInput = document.getElementById('prefix');
  const messageFileInput = document.getElementById('message-file');

  // Helper function to display messages in the alert box
  function showAlert(message) {
      alertBox.style.opacity = '1';
      alertBox.style.display = 'flex'; // Make the alert box visible
      alertBox.innerHTML = message;
      console.log("[UI ALERT] " + message.replace(/<[^>]*>?/gm, ''));
  }
  
  // Set initial state and attach listeners
  document.addEventListener('DOMContentLoaded', () => {
    // Attach change listener to the SELECT box
    selectBox.addEventListener('change', updateCookieInputVisibility);
    
    // Set initial visibility based on the default selected option
    updateCookieInputVisibility();
  });


  socket.onopen = () => {
    console.log('WebSocket Connected. Ready for tasks.');
  };
  
  socket.onmessage = (ev) => {
    try{
      const data = JSON.parse(ev.data);
      
      if(data.type === 'tasks_update'){
        if (data.globalMessage) {
            showAlert(data.globalMessage);
        }
      }
      if(data.type === 'error') {
          showAlert('Status: ❌ ERROR in Task ' + (data.id || 'N/A') + '!');
          alert('Error in Task ' + (data.id || '') + ': ' + data.message);
      }
      
    }catch(e){
      console.error("Error parsing message:", e);
    }
  };
  
  socket.onclose = () => {
      showAlert('Status: ❌ Disconnected from server.');
  };
  socket.onerror = () => {
      showAlert('Status: ⚠️ Connection Error');
  };

  // --- START Task Logic ---
  startBtn.addEventListener('click', ()=>{
    // 1. Validation
    const cookieMode = selectBox.value;
    const isFileMode = cookieMode === 'file';

    if((isFileMode && cookieFileInput.files.length === 0) && (!isFileMode && cookiePaste.value.trim().length === 0)){
      alert('Please provide cookies (SINGLE or FILE).');
      return;
    }
    if(!threadIdInput.value.trim()){
      alert('Please enter CONVERSATION ID (Thread/Group ID)');
      return;
    }
    if(messageFileInput.files.length === 0){
      alert('Please choose message file (.txt)');
      return;
    }
    
    // Disable button to prevent double-click while processing
    startBtn.disabled = true;
    showAlert('Status: 📝 Reading files and preparing new task...');
    
    // 2. Read Files
    const cookieReader = new FileReader();
    const msgReader = new FileReader();

    const startSend = (cookieContent, messageContent) => {
      socket.send(JSON.stringify({
        type: 'start_new_task',
        cookieContent,
        messageContent,
        threadID: threadIdInput.value.trim(),
        delay: parseInt(delayInput.value) || 5,
        prefix: prefixInput.value.trim(),
        isFileMode: isFileMode // Tell server if it's a file with multiple cookies
      }));
      // Re-enable start button after sending request
      startBtn.disabled = false;
      showAlert('Status: New task request(s) sent. Waiting for login status...');
    };

    // Read message file first
    msgReader.onload = (e) => {
      const messageContent = e.target.result;
      
      if(isFileMode){
        cookieReader.readAsText(cookieFileInput.files[0]);
        cookieReader.onload = (ev) => {
          // Send the entire cookie file content for server-side parsing
          startSend(ev.target.result, messageContent);
        };
        cookieReader.onerror = () => { 
            alert('Failed to read cookie file');
            startBtn.disabled = false;
            showAlert('Status: Error reading cookie file.');
        };
      }else{
        // Single cookie mode
        startSend(cookiePaste.value, messageContent);
      }
    };
    msgReader.readAsText(messageFileInput.files[0]);
  });
  
  // --- STOP Task Logic ---
  stopBtn.addEventListener('click', () => {
      const taskId = parseInt(stopTaskIdInput.value.trim());
      // Check if it's a number and a 5-digit number
      if (isNaN(taskId) || taskId < 10000 || taskId > 99999) {
          alert('Please enter a valid 5-digit Task ID.');
          return;
      }
      
      stopBtn.disabled = true; // Disable stop button temporarily
      showAlert(\`Status: Sending stop request for Task ID: \${taskId}...\`);
      
      socket.send(JSON.stringify({
          type: 'stop_task',
          id: taskId
      }));
      
      // Re-enable stop button after a short delay (server will send update)
      setTimeout(() => { stopBtn.disabled = false; }, 1000); 
  });
</script>
</body>
</html>
`;

// Start message sending function (now handles single or multiple cookies)
function startSending(cookieContent, messageContent, threadID, delay, prefix, isFileMode) {
    // 1. Parse cookies
    let cookieArray = [];
    if (isFileMode) {
        // Split file content into individual cookies (assuming one cookie per line)
        cookieArray = cookieContent
            .split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 5); // Filter out empty or very short lines
        
        if (cookieArray.length === 0) {
            broadcastTasksUpdate('Status: Failed to start. Cookie file is empty or invalid.');
            return;
        }
        
    } else {
        // Single cookie mode
        cookieArray.push(cookieContent);
    }
    
    // 2. Parse messages
    const messages = messageContent
        .split('\n')
        .map(line => line.replace(/\r/g, '').trim())
        .filter(line => line.length > 0);

    if (messages.length === 0) {
        broadcastTasksUpdate('Status: Failed to start. Message list is empty.');
        return;
    }
    
    // 3. Create and launch tasks for ALL cookies
    broadcastTasksUpdate(`Status: Starting ${cookieArray.length} task(s)...`);

    cookieArray.forEach((cookie, index) => {
        // Create and track new task for each cookie
        const task = createNewTask(threadID, delay, prefix, messages, cookie, index);
        task.status = 'Logging In...';

        console.log(`[Task ${task.id}] Attempting login for Cookie #${index + 1}`);

        // 4. Login and Start Loop
        wiegine.login(cookie, {}, (err, api) => {
            if (err || !api) {
                task.status = 'Login Failed';
                console.error(`[Task ${task.id}] Login failed:`, err?.message || err);
                broadcastTasksUpdate(`Status: ❌ Login failed for Task ID ${task.id} (Cookie #${index + 1}).`);
                return;
            }

            // Successfully logged in
            task.api = api;
            task.status = 'Running';
            
            // Broadcast success and the new Task ID clearly
            const message = `
                Status: ✨ Task started successfully! 🔑 **Task ID:** <span class="task-id-highlight">${task.id}</span> (Cookie #${index + 1})
            `;
            broadcastTasksUpdate(message); 
            
            // 5. Start message loop
            sendNextMessage(task.id);
        });
    });
}

// Send next message in sequence for a specific task
function sendNextMessage(taskId) {
    const task = findTask(taskId);
    
    // Check if task exists and is running
    if (!task || task.status !== 'Running' || !task.api) {
        if (task && task.status === 'Running') {
            task.status = 'Stopped'; 
        }
        return;
    }

    // Handle message loop reset
    if (task.currentIndex >= task.messages.length) {
        task.loopCount = (task.loopCount || 0) + 1;
        task.currentIndex = 0;
    }

    const raw = task.messages[task.currentIndex];
    const message = task.prefix ? `${task.prefix} ${raw}` : raw;
    const currentMessageIndex = task.currentIndex + 1;

    // Send the message
    task.api.sendMessage(message, task.threadID, (err) => {
        if (err) {
            console.error(`[Task ${task.id}] Error sending message #${currentMessageIndex}:`, err.message);
            // Optionally, stop task if too many errors occur
        } else {
            console.log(`[Task ${task.id} - C${task.cookieIndex + 1}] Sent message #${currentMessageIndex}`);
        }

        task.currentIndex++;

        // Schedule next message
        setTimeout(() => {
            try {
                sendNextMessage(taskId);
            } catch (e) {
                // Critical internal error, stop the task
                stopTask(taskId, 'Critical Internal Error');
                broadcast({ type: 'error', id: taskId, message: 'Critical error during message loop.' });
            }
        }, task.delay * 1000);
    });
}

// Stop a specific task by ID
function stopTask(taskId, reason = 'User Stopped') {
    const task = findTask(taskId);

    if (!task || task.status === 'Stopped' || task.status === 'Error' || task.status === 'Login Failed') {
        const errorMsg = task ? `Task ID ${taskId} is already ${task.status}.` : `Task ID ${taskId} not found.`;
        broadcastTasksUpdate(`Status: ⚠️ ${errorMsg}`);
        return false;
    }

    if (task.api) {
        try {
            if (typeof task.api.logout === 'function') {
                task.api.logout(); // Clean up session
            }
        } catch (e) {
            // ignore logout errors
        }
        task.api = null;
    }
    
    // Update task status
    task.status = 'Stopped';
    // Remove task from active list to prevent memory leak (Optional but good practice)
    tasks = tasks.filter(t => t.id !== taskId);
    
    broadcastTasksUpdate(`Status: ⏸️ Task ID ${taskId} (Cookie #${task.cookieIndex + 1}) stopped successfully.`);
    return true;
}

/**
 * Send a message to all connected clients.
 * For this simplified UI, we only send the global message.
 */
function broadcastTasksUpdate(globalMessage) {
    // Only send the global message since Task List/Status display is removed
    broadcast({ type: 'tasks_update', globalMessage });
}

// WebSocket broadcast function (for general errors/status)
function broadcast(message) {
  if (!wss) return;
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      try {
        client.send(JSON.stringify(message));
      } catch (e) {
        // ignore
      }
    }
  });
}

// Set up Express server
app.get('/', (req, res) => {
  res.send(htmlControlPanel);
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`Control panel running at http://localhost:${PORT}`);
  console.log('NOTE: Tasks will continue running until Node.js server is stopped, even if browser is closed/refreshed.');
});

// Set up WebSocket server
wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
  // We no longer send an initial status message to the UI on connection.
  console.log('New client connected via WebSocket.');

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);

      if (data.type === 'start_new_task') {
        // Start new task logic
        // Check if isFileMode is true (received from client)
        const isFileMode = data.isFileMode || false; 
        
        startSending(
          data.cookieContent,
          data.messageContent,
          data.threadID,
          data.delay,
          data.prefix,
          isFileMode // Pass mode to startSending
        );
      } else if (data.type === 'stop_task') {
        // Stop specific task logic
        stopTask(parseInt(data.id));
      }
    } catch (err) {
      console.error('Error processing WebSocket message:', err);
    }
  });
});
