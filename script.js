let tasks = [];
let currentFilter = 'all';

// AI-powered category suggestions
const categoryKeywords = {
    'Work': ['meeting', 'report', 'email', 'project', 'deadline', 'presentation', 'client', 'team', 'review', 'analysis'],
    'Health': ['exercise', 'gym', 'doctor', 'appointment', 'medicine', 'workout', 'run', 'walk', 'diet', 'health'],
    'Personal': ['family', 'friend', 'birthday', 'anniversary', 'vacation', 'hobby', 'personal', 'self'],
    'Home': ['clean', 'repair', 'maintenance', 'garden', 'cook', 'groceries', 'bills', 'utilities'],
    'Learning': ['study', 'course', 'book', 'research', 'learn', 'practice', 'skill', 'tutorial', 'education'],
    'Shopping': ['buy', 'purchase', 'shop', 'order', 'store', 'market', 'clothes', 'food'],
    'Finance': ['budget', 'pay', 'bank', 'investment', 'tax', 'money', 'savings', 'expense']
};

// AI-powered priority suggestions
const priorityKeywords = {
    'high': ['urgent', 'asap', 'important', 'critical', 'deadline', 'emergency', 'priority'],
    'medium': ['soon', 'this week', 'moderate', 'normal'],
    'low': ['later', 'someday', 'optional', 'when possible', 'low priority']
};



const themeToggleBtn = document.getElementById("themeToggle");
const body = document.body;

themeToggleBtn.addEventListener("click", () => {
    body.classList.toggle("dark-theme");
    body.classList.toggle("light-theme");

    // Save theme preference in localStorage
    const currentTheme = body.classList.contains("dark-theme") ? "dark" : "light";
    localStorage.setItem("theme", currentTheme);
});

// Apply saved theme on page load
const savedTheme = localStorage.getItem("theme");
if (savedTheme) {
    body.classList.add(savedTheme + "-theme");
}


function suggestCategory(title, description) {
    const text = (title + ' ' + description).toLowerCase();
    let maxScore = 0;
    let suggestedCategory = 'Personal';

    for (const [category, keywords] of Object.entries(categoryKeywords)) {
        const score = keywords.reduce((acc, keyword) => {
            return acc + (text.includes(keyword) ? 1 : 0);
        }, 0);
        
        if (score > maxScore) {
            maxScore = score;
            suggestedCategory = category;
        }
    }

    return suggestedCategory;
}

function suggestPriority(title, description, dueDate) {
    const text = (title + ' ' + description).toLowerCase();
    
    // Check for priority keywords
    for (const [priority, keywords] of Object.entries(priorityKeywords)) {
        if (keywords.some(keyword => text.includes(keyword))) {
            return priority;
        }
    }

    // Check due date urgency
    if (dueDate) {
        const now = new Date();
        const due = new Date(dueDate);
        const diffDays = (due - now) / (1000 * 60 * 60 * 24);
        
        if (diffDays < 1) return 'high';
        if (diffDays < 3) return 'medium';
        return 'low';
    }

    return 'medium';
}

function showAISuggestions() {
    const title = document.getElementById('taskTitle').value;
    const description = document.getElementById('taskDescription').value;
    const dueDate = document.getElementById('taskDue').value;

    if (!title.trim()) return;

    const suggestedCategory = suggestCategory(title, description);
    const suggestedPriority = suggestPriority(title, description, dueDate);

    const suggestions = document.getElementById('aiSuggestions');
    const suggestionsList = document.getElementById('suggestionsList');

    suggestionsList.innerHTML = `
        <div class="suggestion-item" onclick="applySuggestion('category', '${suggestedCategory}')">
            📁 Category: ${suggestedCategory}
        </div>
        <div class="suggestion-item" onclick="applySuggestion('priority', '${suggestedPriority}')">
            ⚡ Priority: ${suggestedPriority.charAt(0).toUpperCase() + suggestedPriority.slice(1)}
        </div>
    `;

    suggestions.style.display = 'block';
}

function applySuggestion(type, value) {
    if (type === 'category') {
        document.getElementById('taskCategory').value = value;
    } else if (type === 'priority') {
        document.getElementById('taskPriority').value = value;
    }
}

function addTask() {
    const title = document.getElementById('taskTitle').value.trim();
    const description = document.getElementById('taskDescription').value.trim();
    const dueDate = document.getElementById('taskDue').value;
    const priority = document.getElementById('taskPriority').value;
    const category = document.getElementById('taskCategory').value.trim() || suggestCategory(title, description);

    if (!title) {
        alert('Please enter a task title!');
        return;
    }

    const task = {
        id: Date.now(),
        title,
        description,
        dueDate,
        priority,
        category,
        completed: false,
        createdAt: new Date()
    };

    tasks.push(task);
    clearForm();
    renderTasks();
    updateStats();
}

function clearForm() {
    document.getElementById('taskTitle').value = '';
    document.getElementById('taskDescription').value = '';
    document.getElementById('taskDue').value = '';
    document.getElementById('taskPriority').value = 'medium';
    document.getElementById('taskCategory').value = '';
    document.getElementById('aiSuggestions').style.display = 'none';
}

function deleteTask(id) {
    tasks = tasks.filter(task => task.id !== id);
    renderTasks();
    updateStats();
}

function completeTask(id) {
    const task = tasks.find(t => t.id === id);
    if (task) {
        task.completed = !task.completed;
        renderTasks();
        updateStats();
    }
}

function filterTasks(filter) {
    currentFilter = filter;
    
    // Update active tab
    document.querySelectorAll('.filter-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    event.target.classList.add('active');
    
    renderTasks();
}

function renderTasks() {
    const tasksList = document.getElementById('tasksList');
    let filteredTasks = tasks;

    // Apply filters
    switch (currentFilter) {
        case 'pending':
            filteredTasks = tasks.filter(task => !task.completed);
            break;
        case 'completed':
            filteredTasks = tasks.filter(task => task.completed);
            break;
        case 'high':
            filteredTasks = tasks.filter(task => task.priority === 'high');
            break;
    }

    if (filteredTasks.length === 0) {
        tasksList.innerHTML = `
            <div class="empty-state">
                <h3>No tasks found!</h3>
                <p>Try adjusting your filter or add a new task.</p>
            </div>
        `;
        return;
    }

    // Sort by priority and due date
    filteredTasks.sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
            return priorityOrder[b.priority] - priorityOrder[a.priority];
        }
        if (a.dueDate && b.dueDate) {
            return new Date(a.dueDate) - new Date(b.dueDate);
        }
        return 0;
    });

    tasksList.innerHTML = filteredTasks.map(task => {
        const dueText = task.dueDate ? 
            new Date(task.dueDate).toLocaleString() : 'No due date';
        
        const isOverdue = task.dueDate && 
            new Date(task.dueDate) < new Date() && 
            !task.completed;

        return `
            <div class="task-item ${task.priority} ${task.completed ? 'completed' : ''}" 
                 style="${isOverdue ? 'border-left-color: #ff4757;' : ''}">
                <div class="task-header">
                    <div>
                        <div class="task-title">${task.title}</div>
                        <div class="task-category">${task.category}</div>
                    </div>
                    <div class="task-actions">
                        <button class="action-btn complete-btn" onclick="completeTask(${task.id})">
                            ${task.completed ? '↩️' : '✅'}
                        </button>
                        <button class="action-btn delete-btn" onclick="deleteTask(${task.id})">
                            🗑️
                        </button>
                    </div>
                </div>
                ${task.description ? `<div class="task-description">${task.description}</div>` : ''}
                <div class="task-meta">
                    <span>Due: ${dueText} ${isOverdue ? '⚠️ Overdue' : ''}</span>
                    <span>Priority: ${task.priority.toUpperCase()}</span>
                </div>
            </div>
        `;
    }).join('');
}

function updateStats() {
    const total = tasks.length;
    const completed = tasks.filter(task => task.completed).length;
    const pending = total - completed;
    const productivity = total > 0 ? Math.round((completed / total) * 100) : 0;

    document.getElementById('totalTasks').textContent = total;
    document.getElementById('completedTasks').textContent = completed;
    document.getElementById('pendingTasks').textContent = pending;
    document.getElementById('productivityScore').textContent = productivity + '%';
}

function showAIInsights() {
    const insights = generateAIInsights();
    alert(`🤖 AI Insights:\n\n${insights}`);
}

function generateAIInsights() {
    if (tasks.length === 0) {
        return "Start adding tasks to get personalized AI insights!";
    }

    const completed = tasks.filter(task => task.completed).length;
    const pending = tasks.filter(task => !task.completed).length;
    const overdue = tasks.filter(task => 
        task.dueDate && new Date(task.dueDate) < new Date() && !task.completed
    ).length;

    let insights = [];

    if (completed > pending) {
        insights.push("🎉 Great job! You're completing more tasks than you're adding.");
    }

    if (overdue > 0) {
        insights.push(`⚠️ You have ${overdue} overdue task(s). Consider prioritizing them.`);
    }

    const highPriorityPending = tasks.filter(task => 
        task.priority === 'high' && !task.completed
    ).length;
    
    if (highPriorityPending > 0) {
        insights.push(`🔥 Focus on ${highPriorityPending} high-priority task(s) first.`);
    }

    const categoryStats = {};
    tasks.forEach(task => {
        categoryStats[task.category] = (categoryStats[task.category] || 0) + 1;
    });

    const topCategory = Object.keys(categoryStats).reduce((a, b) => 
        categoryStats[a] > categoryStats[b] ? a : b
    );

    insights.push(`📊 Your most active category is: ${topCategory}`);

    return insights.join('\n\n');
}

// Event listeners for AI suggestions
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('taskTitle').addEventListener('input', showAISuggestions);
    document.getElementById('taskDescription').addEventListener('input', showAISuggestions);
    
    // Initialize
    updateStats();
});