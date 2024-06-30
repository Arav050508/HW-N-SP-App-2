document.addEventListener('DOMContentLoaded', function() {
    const taskForm = document.getElementById('task-form');
    const taskNameInput = document.getElementById('task-name');
    const subjectSelect = document.getElementById('subject');
    const descInput = document.getElementById('task-desc');
    const dueDateInput = document.getElementById('due-date');
    const taskTypeSelect = document.getElementById('task-type');
    const reminderIntervalSelect = document.getElementById('reminder-interval');
    const groupMembersInput = document.getElementById('group-members');
    const messageDiv = document.getElementById('message');
    const exportButton = document.getElementById('export-tasks');
    const importInput = document.getElementById('import-tasks');
    const calendarEl = document.getElementById('calendar');
    
    // Modal elements
    const modal = document.getElementById('task-modal');
    const modalContent = document.querySelector('.modal-content');
    const modalClose = document.querySelector('.close');
    const modalTaskName = document.getElementById('modal-task-name');
    const modalTaskSubject = document.getElementById('modal-task-subject');
    const modalTaskDueDate = document.getElementById('modal-task-due-date');
    const modalTaskType = document.getElementById('modal-task-type');
    const modalTaskDesc = document.getElementById('modal-task-desc');
    const modalTaskResources = document.getElementById('modal-task-resources');
    const modalTaskGroupMembers = document.getElementById('modal-task-group-members');

    const resources = {
        Math: [
            { name: "Khan Academy", url: "https://www.khanacademy.org/math" },
            { name: "Wolfram Alpha", url: "https://www.wolframalpha.com/" }
        ],
        Science: [
            { name: "NASA", url: "https://www.nasa.gov/" },
            { name: "ScienceDaily", url: "https://www.sciencedaily.com/" }
        ],
        SS: [
            { name: "National Geographic", url: "https://www.nationalgeographic.com/" },
            { name: "Smithsonian", url: "https://www.si.edu/" }
        ],
        ELA: [
            { name: "Grammarly", url: "https://www.grammarly.com/" },
            { name: "Purdue OWL", url: "https://owl.purdue.edu/" }
        ]
    };

    // Initialize FullCalendar
    const calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        events: [],
        eventClick: function(info) {
            showTaskDetails(info.event);
        }
    });

    calendar.render();

    taskForm.addEventListener('submit', function(event) {
        event.preventDefault();
    
        const taskName = taskNameInput.value;
        const subject = subjectSelect.value;
        const description = descInput.value;
        const dueDate = dueDateInput.value;
        const taskType = taskTypeSelect.value;
        const reminderInterval = parseInt(reminderIntervalSelect.value, 10);
        const groupMembers = groupMembersInput.value;
    
        addTask(taskName, subject, description, dueDate, taskType, reminderInterval, groupMembers);
        storeTask(taskName, subject, description, dueDate, taskType, reminderInterval, groupMembers);
        
        trackAssignmentProgress(taskName, new Date(dueDate));
    
        taskForm.reset();
        showMessage('Task added successfully!');
    });
    
    function trackAssignmentProgress(taskName, dueDate) {
        const now = new Date();
        const daysRemaining = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));
        
        for (let i = 1; i <= daysRemaining; i++) {
            const reminderTime = new Date(now.getTime() + i * 24 * 60 * 60 * 1000);
    
            if (reminderTime > now) {
                setTimeout(() => {
                    alert(`Reminder: ${taskName} - You should have completed at least ${i * 10}% of your assignment by now.`);
                }, reminderTime - now);
            }
        }
    }

    function addTask(name, subject, description, date, type, reminderInterval, groupMembers) {
        const dueDateTime = new Date(date);
        
        const event = {
            title: `${name} - ${subject}`,
            start: dueDateTime,
            description: description,
            type: type,
            subject: subject,
            groupMembers: groupMembers,
            backgroundColor: getColorForSubject(subject),
            borderColor: getColorForSubject(subject)
        };
        
        calendar.addEvent(event);
        
        scheduleReminder(dueDateTime, name, reminderInterval);
    }

    function storeTask(name, subject, description, date, type, reminderInterval, groupMembers) {
        const tasks = JSON.parse(localStorage.getItem('tasks')) || [];
        tasks.push({ name, subject, description, date, type, reminderInterval, groupMembers });
        localStorage.setItem('tasks', JSON.stringify(tasks));
    }

    function loadTasks() {
        const tasks = JSON.parse(localStorage.getItem('tasks')) || [];
        tasks.forEach(task => {
            addTask(task.name, task.subject, task.description, task.date, task.type, task.reminderInterval, task.groupMembers);
        });
    }

    function showMessage(message) {
        messageDiv.textContent = message;
        setTimeout(() => {
            messageDiv.textContent = '';
        }, 3000);
    }

    function getColorForSubject(subject) {
        switch (subject) {
            case 'Math': return 'blue';
            case 'Science': return 'green';
            case 'SS': return 'orange';
            case 'ELA': return 'red';
            default: return 'black';
        }
    }

    function scheduleReminder(date, taskName, reminderInterval) {
        const reminderTime = new Date(date.getTime() - reminderInterval);

        if (reminderTime > new Date()) {
            setTimeout(() => {
                alert(`Reminder: ${taskName} is due soon!`);
            }, reminderTime - new Date());
        }
    }

    exportButton.addEventListener('click', function() {
        const tasks = localStorage.getItem('tasks');
        if (tasks) {
            const blob = new Blob([tasks], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'tasks.json';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        }
    });

    importInput.addEventListener('change', function(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const tasks = JSON.parse(e.target.result);
                localStorage.setItem('tasks', JSON.stringify(tasks));
                loadTasks();
                showMessage('Tasks imported successfully!');
            };
            reader.readAsText(file);
        }
    });

    function showTaskDetails(event) {
        clearInterval(countdownInterval);
    
        modalTaskName.textContent = event.title.split(' - ')[0];
        modalTaskSubject.textContent = event.extendedProps.subject;
        modalTaskType.textContent = event.extendedProps.type;
        modalTaskDesc.textContent = event.extendedProps.description;
        modalTaskGroupMembers.textContent = event.extendedProps.groupMembers;
    
        modalTaskResources.innerHTML = '';
        const subjectResources = resources[event.extendedProps.subject];
        if (subjectResources) {
            subjectResources.forEach(resource => {
                const li = document.createElement('li');
                const a = document.createElement('a');
                a.href = resource.url;
                a.textContent = resource.name;
                a.target = '_blank';
                a.style.color = '#FCCF14'; // Ensure the links are visible
                li.appendChild(a);
                modalTaskResources.appendChild(li);
            });
        }
    
        // Update modal styling based on task type
        switch (event.extendedProps.type) {
            case 'homework':
                modalContent.style.backgroundColor = '#FFEFD5'; // Example color for homework
                modalContent.style.boxShadow = '0 5px 15px rgba(255, 239, 213, 0.5)'; // Example box-shadow for homework
                break;
            case 'project':
                modalContent.style.backgroundColor = '#E6E6FA'; // Example color for project
                modalContent.style.boxShadow = '0 5px 15px rgba(230, 230, 250, 0.5)'; // Example box-shadow for project
                break;
            case 'exam':
                modalContent.style.backgroundColor = '#FFB6C1'; // Example color for exam
                modalContent.style.boxShadow = '0 5px 15px rgba(255, 182, 193, 0.5)'; // Example box-shadow for exam
                break;
            default:
                modalContent.style.backgroundColor = '#FFF'; // Default color
                modalContent.style.boxShadow = '0 5px 15px rgba(0, 0, 0, 0.3)'; // Default box-shadow
        }
    
        updateTimeRemaining(event.start);
    
        countdownInterval = setInterval(() => {
            updateTimeRemaining(event.start);
        }, 1000);
    
        deleteTaskButton.onclick = function() {
            calendar.getEventById(event.id).remove();
            removeTaskFromLocalStorage(event.id);
            modal.style.display = 'none';
        };
    
        modal.style.display = 'block';
    }

    modalClose.addEventListener('click', function() {
        modal.style.display = 'none';
    });

    window.addEventListener('click', function(event) {
        if (event.target == modal) {
            modal.style.display = 'none';
        }
    });

    // Dark and light mode functionality
    const darkThemeToggle = document.getElementById('dark-theme-toggle');

    darkThemeToggle.addEventListener('click', function() {
        document.body.classList.toggle('dark');
        if (document.body.classList.contains('dark')) {
            darkThemeToggle.textContent = 'Toggle Light Theme';
        } else {
            darkThemeToggle.textContent = 'Toggle Dark Theme';
        }
    });

    // Initialize button text based on the initial theme
    if (document.body.classList.contains('dark')) {
        darkThemeToggle.textContent = 'Toggle Light Theme';
    } else {
        darkThemeToggle.textContent = 'Toggle Dark Theme';
    }

    // Function to delete task
    const deleteTaskButton = document.getElementById('delete-task');

    deleteTaskButton.addEventListener('click', function() {
        const taskName = modalTaskName.textContent;
        const subject = modalTaskSubject.textContent;

        const tasks = JSON.parse(localStorage.getItem('tasks')) || [];
        const updatedTasks = tasks.filter(task => !(task.name === taskName && task.subject === subject));
        localStorage.setItem('tasks', JSON.stringify(updatedTasks));

        calendar.getEvents().forEach(event => {
            if (event.title === `${taskName} - ${subject}`) {
                event.remove();
            }
        });

        modal.style.display = 'none';
        showMessage('Task deleted successfully!');
    });

    // Function to update the modal for dark theme
    function updateModalForDarkTheme() {
        if (document.body.classList.contains('dark')) {
            modalContent.style.backgroundColor = '#1C1C1C';
            modalContent.style.color = '#FFFFFF';
        } else {
            modalContent.style.backgroundColor = '#F5F5DC';
            modalContent.style.color = '#000000';
        }
    }

    // Call the function to ensure modal is styled correctly on load
    updateModalForDarkTheme();

    // Update modal styles when theme is toggled
    darkThemeToggle.addEventListener('click', updateModalForDarkTheme);

    // Function to calculate time remaining
    function calculateTimeRemaining(dueDate) {
        const now = new Date();
        const timeDifference = new Date(dueDate) - now;
        
        const days = Math.floor(timeDifference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((timeDifference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((timeDifference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((timeDifference % (1000 * 60)) / 1000);

        return `${days}d ${hours}h ${minutes}m ${seconds}s`;
    }

    // Function to update countdown
    function updateCountdown(dueDate) {
        const countdown = calculateTimeRemaining(dueDate);
        modalTaskDueDate.textContent = countdown;

        // Update the countdown every second
        const countdownInterval = setInterval(() => {
            const newCountdown = calculateTimeRemaining(dueDate);
            modalTaskDueDate.textContent = newCountdown;

            // Stop the interval if the task is due
            if (new Date(dueDate) <= new Date()) {
                clearInterval(countdownInterval);
            }
        }, 1000);
    }
    
    let countdownInterval;

    function showTaskDetails(event) {
        clearInterval(countdownInterval);
    
        modalTaskName.textContent = event.title.split(' - ')[0];
        modalTaskSubject.textContent = event.extendedProps.subject;
        modalTaskType.textContent = event.extendedProps.type;
        modalTaskDesc.textContent = event.extendedProps.description;
        modalTaskGroupMembers.textContent = event.extendedProps.groupMembers;
    
        modalTaskResources.innerHTML = '';
        const subjectResources = resources[event.extendedProps.subject];
        if (subjectResources) {
            subjectResources.forEach(resource => {
                const li = document.createElement('li');
                const a = document.createElement('a');
                a.href = resource.url;
                a.textContent = resource.name;
                a.target = '_blank';
                a.style.color = '#13120E'; // Ensure the links are visible
                li.appendChild(a);
                modalTaskResources.appendChild(li);
            });
        }
    
        // Update modal styling based on task type
        switch (event.extendedProps.type) {
            case 'homework':
                modalContent.style.backgroundColor = '#FFEFD5'; // Example color for homework
                modalContent.style.boxShadow = '0 5px 15px rgba(255, 239, 213, 0.5)'; // Example box-shadow for homework
                break;
            case 'project':
                modalContent.style.backgroundColor = '#E6E6FA'; // Example color for project
                modalContent.style.boxShadow = '0 5px 15px rgba(230, 230, 250, 0.5)'; // Example box-shadow for project
                break;
            case 'exam':
                modalContent.style.backgroundColor = '#FFB6C1'; // Example color for exam
                modalContent.style.boxShadow = '0 5px 15px rgba(255, 182, 193, 0.5)'; // Example box-shadow for exam
                break;
            default:
                modalContent.style.backgroundColor = '#FFF'; // Default color
                modalContent.style.boxShadow = '0 5px 15px rgba(0, 0, 0, 0.3)'; // Default box-shadow
        }
    
        updateTimeRemaining(event.start);
    
        countdownInterval = setInterval(() => {
            updateTimeRemaining(event.start);
        }, 1000);
    
        deleteTaskButton.onclick = function() {
            calendar.getEventById(event.id).remove();
            removeTaskFromLocalStorage(event.id);
            modal.style.display = 'none';
        };
    
        modal.style.display = 'block';
    }

    function updateTimeRemaining(dueDate) {
        const now = new Date();
        const timeRemaining = dueDate - now;

        if (timeRemaining <= 0) {
            modalTaskDueDate.textContent = 'Due date has passed';
            clearInterval(countdownInterval);
        } else {
            const days = Math.floor(timeRemaining / (1000 * 60 * 60 * 24));
            const hours = Math.floor((timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((timeRemaining % (1000 * 60)) / 1000);

            modalTaskDueDate.textContent = `${days}d ${hours}h ${minutes}m ${seconds}s remaining`;
        }
    }

    function removeTaskFromLocalStorage(eventId) {
        const tasks = JSON.parse(localStorage.getItem('tasks')) || [];
        const updatedTasks = tasks.filter(task => task.id !== eventId);
        localStorage.setItem('tasks', JSON.stringify(updatedTasks));
    }

    loadTasks();
});