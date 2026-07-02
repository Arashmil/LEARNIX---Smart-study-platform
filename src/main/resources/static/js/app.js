// --- Theme and Ambience Initialization ---
const AMBIENCE_MEDIA = {
    default: '',
    'bg-forest': 'media/video/forest.mp4',
    'bg-rain': 'media/video/rain.mp4',
    'bg-space': 'media/video/space.mp4'
};
const AMBIENCE_TIME_KEY = 'ambiencePlaybackTime';

function normalizeMediaSrc(src) {
    if (!src) return '';
    return new URL(src, window.location.href).href;
}

function applyTheme(isDark) {
    document.body.classList.toggle('dark-mode', isDark);
    document.body.classList.toggle('dark', isDark);

    const themeToggle = document.getElementById('themeToggle');
    const themeLabel = document.getElementById('themeLabel');

    if (themeToggle) {
        themeToggle.checked = isDark;
    }

    if (themeLabel) {
        themeLabel.innerHTML = isDark
            ? '<i class="fa-solid fa-moon"></i> Dark Mode'
            : '<i class="fa-solid fa-sun"></i> Light Mode';
    }
}

function ensureBackgroundMediaLayer() {
    let bgVideo = document.getElementById('bgVideo');
    let mediaContainer = document.querySelector('.bg-media-container');
    let overlay = document.querySelector('.bg-overlay');
    const savedAmbience = localStorage.getItem('ambience') || 'default';

    if (!mediaContainer) {
        mediaContainer = document.createElement('div');
        mediaContainer.className = 'bg-media-container';
        document.body.prepend(mediaContainer);
    }

    if (!bgVideo) {
        bgVideo = document.createElement('video');
        bgVideo.id = 'bgVideo';
        bgVideo.className = 'bg-video';
        bgVideo.autoplay = true;
        bgVideo.loop = true;
        bgVideo.muted = true;
        bgVideo.playsInline = true;
        mediaContainer.appendChild(bgVideo);
    }

    if (AMBIENCE_MEDIA[savedAmbience]) {
        bgVideo.dataset.useDarkReloadFade = 'true';
        document.body.classList.add('bg-video-loading');
        document.body.classList.add('has-video-bg');
    }

    if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'bg-overlay';
        mediaContainer.after(overlay);
    }

    return bgVideo;
}

function getSavedAmbienceTime(themeClass) {
    const saved = JSON.parse(localStorage.getItem(AMBIENCE_TIME_KEY) || '{}');
    const entry = saved[themeClass];

    if (typeof entry === 'number') {
        return Number.isFinite(entry) && entry > 0 ? entry : 0;
    }

    const value = Number(entry?.time);
    const savedAt = Number(entry?.savedAt);
    if (!Number.isFinite(value) || value <= 0) return 0;

    if (!Number.isFinite(savedAt)) {
        return value;
    }

    return value + ((Date.now() - savedAt) / 1000);
}

function saveAmbienceTime(bgVideo) {
    const themeClass = localStorage.getItem('ambience') || 'default';
    if (!bgVideo || themeClass === 'default' || !Number.isFinite(bgVideo.currentTime)) return;

    const saved = JSON.parse(localStorage.getItem(AMBIENCE_TIME_KEY) || '{}');
    saved[themeClass] = {
        time: bgVideo.currentTime,
        savedAt: Date.now()
    };
    localStorage.setItem(AMBIENCE_TIME_KEY, JSON.stringify(saved));
}

function applyAmbienceClass(themeClass) {
    Object.keys(AMBIENCE_MEDIA)
        .filter(className => className !== 'default' && className !== themeClass)
        .forEach(className => document.body.classList.remove(className));

    if (themeClass !== 'default') {
        document.body.classList.add(themeClass);
    }
}

function startAmbienceVideo(themeClass, videoSrc, bgVideo) {
    const targetSrc = normalizeMediaSrc(videoSrc);
    const currentSrc = bgVideo.currentSrc || normalizeMediaSrc(bgVideo.getAttribute('src'));
    const isSameVideo = currentSrc === targetSrc;

    const revealVideo = () => {
        bgVideo.classList.add('active');
        bgVideo.play().catch(e => console.log('Video playback prevented:', e));

        if (bgVideo.dataset.useDarkReloadFade === 'true') {
            delete bgVideo.dataset.useDarkReloadFade;
            window.setTimeout(() => {
                document.body.classList.remove('bg-video-loading');
            }, 450);
        }
    };

    if (isSameVideo) {
        revealVideo();
        return;
    }

    bgVideo.dataset.useDarkReloadFade = 'true';
    document.body.classList.add('bg-video-loading');
    bgVideo.classList.remove('active');
    bgVideo.onloadedmetadata = () => {
        const resumeAt = getSavedAmbienceTime(themeClass);
        if (resumeAt > 0 && Number.isFinite(bgVideo.duration) && bgVideo.duration > 0) {
            bgVideo.currentTime = resumeAt % bgVideo.duration;
        }
    };
    bgVideo.oncanplay = () => {
        bgVideo.oncanplay = null;
        revealVideo();
    };
    bgVideo.src = videoSrc;
}

function applyAmbienceVisuals(themeClass, videoSrc, bgVideo, isMuted) {
    applyAmbienceClass(themeClass);

    if (!bgVideo) return;

    if (videoSrc) {
        bgVideo.muted = isMuted;
        document.body.classList.add('has-video-bg');
        startAmbienceVideo(themeClass, videoSrc, bgVideo);
    } else {
        window.setTimeout(() => {
            if (bgVideo.classList.contains('active')) {
                saveAmbienceTime(bgVideo);
                bgVideo.classList.remove('active');
            }

            document.body.classList.remove('has-video-bg');

            if (bgVideo.src) {
                bgVideo.onloadedmetadata = null;
                bgVideo.pause();
                bgVideo.removeAttribute('src');
                bgVideo.load();
            }
        }, 400);
    }
}

function initTheme() {
    const savedTheme = localStorage.getItem('theme');
    applyTheme(savedTheme === 'dark');
    
    const savedAmbience = localStorage.getItem('ambience') || 'default';
    const validAmbiences = Object.keys(AMBIENCE_MEDIA);
    if (!validAmbiences.includes(savedAmbience)) {
        localStorage.setItem('ambience', 'default');
        return;
    }

    if (savedAmbience !== 'default') {
        document.body.classList.add(savedAmbience);
        if (AMBIENCE_MEDIA[savedAmbience]) {
            document.body.classList.add('bg-video-loading');
            document.body.classList.add('has-video-bg');
        }
    }
}
// Apply immediately
initTheme();

document.addEventListener('DOMContentLoaded', () => {
    // Bind Theme Toggle
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        applyTheme(localStorage.getItem('theme') === 'dark');
        themeToggle.addEventListener('change', (e) => {
            const isDark = e.target.checked;
            applyTheme(isDark);
            localStorage.setItem('theme', isDark ? 'dark' : 'light');
        });
    }

    // Advanced Ambience Switcher with Media
    const ambienceBtns = document.querySelectorAll('.ambience-btn');
    const bgVideo = ensureBackgroundMediaLayer();
    const toggleSoundBtn = document.getElementById('toggleSoundBtn');
    const soundIcon = document.getElementById('soundIcon');

    let isMuted = localStorage.getItem('ambienceMuted') !== 'false';
    const savedAmbience = localStorage.getItem('ambience') || 'default';
    const safeAmbience = AMBIENCE_MEDIA.hasOwnProperty(savedAmbience) ? savedAmbience : 'default';

    // Initialize Mute State
    if (bgVideo) {
        bgVideo.muted = isMuted;
        window.addEventListener('beforeunload', () => saveAmbienceTime(bgVideo));
        bgVideo.addEventListener('timeupdate', () => {
            if (Math.floor(bgVideo.currentTime) % 3 === 0) {
                saveAmbienceTime(bgVideo);
            }
        });
    }
    if (soundIcon) {
        soundIcon.className = isMuted ? 'fa-solid fa-volume-xmark' : 'fa-solid fa-volume-high';
    }

    // Handle Mute Toggle
    if (toggleSoundBtn) {
        toggleSoundBtn.addEventListener('click', () => {
            isMuted = !isMuted;
            localStorage.setItem('ambienceMuted', isMuted);
            if (bgVideo) bgVideo.muted = isMuted;
            soundIcon.className = isMuted ? 'fa-solid fa-volume-xmark' : 'fa-solid fa-volume-high';
            
            // Try to play if unmuted and there's a source, in case browser blocked autoplay.
            if (!isMuted && bgVideo && bgVideo.src) {
                bgVideo.play().catch(e => console.log('Video audio playback prevented:', e));
            }
        });
    }

    function applyAmbience(btn) {
        const themeClass = btn.dataset.theme;
        const videoSrc = btn.dataset.video || AMBIENCE_MEDIA[themeClass] || '';

        ambienceBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        localStorage.setItem('ambience', themeClass);
        applyAmbienceVisuals(themeClass, videoSrc, bgVideo, isMuted);
    }

    if (ambienceBtns.length > 0) {
        const targetBtn = Array.from(ambienceBtns).find(b => b.dataset.theme === safeAmbience) || ambienceBtns[0];
        
        // Initial application
        applyAmbience(targetBtn);

        ambienceBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                applyAmbience(e.currentTarget);
            });
        });
    } else {
        applyAmbienceVisuals(safeAmbience, AMBIENCE_MEDIA[safeAmbience], bgVideo, isMuted);
    }

    // Sticky Notes Logic
    const stickyNote = document.getElementById('stickyNote');
    if (stickyNote) {
        // Load saved note
        stickyNote.value = localStorage.getItem('stickyNote') || '';
        // Save on input
        stickyNote.addEventListener('input', (e) => {
            localStorage.setItem('stickyNote', e.target.value);
        });
    }

    // Handle Login
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            try {
                const response = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });

                if (response.ok) {
                    const data = await response.json();
                    localStorage.setItem('user', JSON.stringify(data.user));
                    window.location.href = 'dashboard.html';
                } else {
                    alert('Invalid credentials');
                }
            } catch (error) {
                console.error('Error:', error);
            }
        });
    }

    // Handle Signup
    const signupForm = document.getElementById('signupForm');
    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            try {
                const response = await fetch('/api/auth/signup', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, email, password })
                });

                if (response.ok) {
                    alert('Registration successful! Please login.');
                    window.location.href = 'login.html';
                } else {
                    alert('Error during registration');
                }
            } catch (error) {
                console.error('Error:', error);
            }
        });
    }

    // Handle Logout (Old logout logic removed, now handled in Profile Modal)
    // Initialize Profile System
    initProfileSystem();

    // Scroll Animations using IntersectionObserver
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };
    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    document.querySelectorAll('.slide-up-fade-in').forEach(el => {
        observer.observe(el);
    });
});

// --- Utility: Number Counter Animation ---
window.animateValue = function(obj, start, end, duration, suffix = '') {
    if (!obj) return;
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        // easeOutQuart
        const easeProgress = 1 - Math.pow(1 - progress, 4);
        obj.innerHTML = Math.floor(easeProgress * (end - start) + start) + suffix;
        if (progress < 1) {
            window.requestAnimationFrame(step);
        } else {
            obj.innerHTML = end + suffix;
        }
    };
    window.requestAnimationFrame(step);
};

// --- Profile System Logic ---
function updateGlobalProfileUI() {
    const userStr = localStorage.getItem('user');
    if (!userStr) return;
    const user = JSON.parse(userStr);
    
    const profileData = JSON.parse(localStorage.getItem(`profile_${user.id}`)) || {};
    const displayName = profileData.displayName || user.name;
    const avatarData = localStorage.getItem(`profileAvatar_${user.id}`);
    
    const userNameDisplays = document.querySelectorAll('#userNameDisplay');
    userNameDisplays.forEach(el => el.textContent = `Welcome, ${displayName}!`);
    
    const profileNameDisplay = document.getElementById('profileNameDisplay');
    if (profileNameDisplay) profileNameDisplay.textContent = displayName;
    
    const profileOfficialNameDisplay = document.getElementById('profileOfficialNameDisplay');
    if (profileOfficialNameDisplay) profileOfficialNameDisplay.textContent = user.name;
    
    const profileAvatarImg = document.getElementById('profileAvatarImg');
    const profileAvatarIcon = document.getElementById('profileAvatarIcon');
    if (profileAvatarImg && profileAvatarIcon) {
        if (avatarData) {
            profileAvatarImg.src = avatarData;
            profileAvatarImg.style.display = 'block';
            profileAvatarIcon.style.display = 'none';
        } else {
            profileAvatarImg.style.display = 'none';
            profileAvatarIcon.style.display = 'block';
        }
    }
}

function initProfileSystem() {
    const profileBtn = document.getElementById('profileBtn');
    const profileModal = document.getElementById('profileModal');
    const closeProfileBtn = document.getElementById('closeProfileBtn');
    const saveProfileBtn = document.getElementById('saveProfileBtn');
    const modalLogoutBtn = document.getElementById('modalLogoutBtn');
    const modalDeleteAccountBtn = document.getElementById('modalDeleteAccountBtn');
    const profilePicUpload = document.getElementById('profilePicUpload');

    updateGlobalProfileUI();

    if (!profileBtn || !profileModal) return;

    const userStr = localStorage.getItem('user');
    if (!userStr) return;
    const user = JSON.parse(userStr);

    const profileDisplayName = document.getElementById('profileDisplayName');
    const profileGrade = document.getElementById('profileGrade');
    const profileStatus = document.getElementById('profileStatus');
    const profileTotalTime = document.getElementById('profileTotalTime');

    if (profilePicUpload) {
        profilePicUpload.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(event) {
                    const dataUrl = event.target.result;
                    localStorage.setItem(`profileAvatar_${user.id}`, dataUrl);
                    updateGlobalProfileUI();
                };
                reader.readAsDataURL(file);
            }
        });
    }

    // Load profile data
    function loadProfileInputs() {
        const profileData = JSON.parse(localStorage.getItem(`profile_${user.id}`)) || {};
        if (profileDisplayName) profileDisplayName.value = profileData.displayName || '';
        if (profileGrade) profileGrade.value = profileData.grade || '';
        if (profileStatus) profileStatus.value = profileData.status || '';
        
        const totalTime = parseInt(localStorage.getItem(`totalStudyTime_${user.id}`)) || 0;
        if (profileTotalTime) profileTotalTime.textContent = formatTime(totalTime);
    }

    profileBtn.addEventListener('click', (e) => {
        e.preventDefault();
        loadProfileInputs();
        profileModal.classList.add('active');
    });

    closeProfileBtn.addEventListener('click', () => {
        profileModal.classList.remove('active');
    });

    saveProfileBtn.addEventListener('click', () => {
        const displayName = profileDisplayName ? profileDisplayName.value : '';
        const grade = profileGrade ? profileGrade.value : '';
        const status = profileStatus ? profileStatus.value : '';
        
        const existingData = JSON.parse(localStorage.getItem(`profile_${user.id}`)) || {};
        const newData = { ...existingData, displayName, grade, status };
        localStorage.setItem(`profile_${user.id}`, JSON.stringify(newData));
        
        updateGlobalProfileUI();
        
        // Visual feedback
        const originalText = saveProfileBtn.innerHTML;
        saveProfileBtn.innerHTML = '<i class="fa-solid fa-check"></i> Saved!';
        saveProfileBtn.style.backgroundColor = 'var(--success-color)';
        setTimeout(() => {
            saveProfileBtn.innerHTML = originalText;
            saveProfileBtn.style.backgroundColor = '';
            profileModal.classList.remove('active');
        }, 1500);
    });

    if (modalLogoutBtn) {
        modalLogoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('user');
            window.location.href = 'login.html';
        });
    }

    if (modalDeleteAccountBtn) {
        modalDeleteAccountBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            if (confirm("Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently lost.")) {
                try {
                    const response = await fetch(`/api/auth/delete/${user.id}`, {
                        method: 'DELETE'
                    });
                    if (response.ok) {
                        alert("Account deleted successfully.");
                        localStorage.removeItem('user');
                        window.location.href = 'login.html';
                    } else {
                        alert("Failed to delete account. Please try again.");
                    }
                } catch (error) {
                    console.error('Error deleting account:', error);
                    alert("An error occurred. Please try again.");
                }
            }
        });
    }
}

// Utility to format seconds into h m
function formatTime(totalSeconds) {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    if (h === 0 && m === 0 && totalSeconds > 0) return '< 1m';
    if (h === 0 && m === 0) return '0m';
    if (h === 0) return `${m}m`;
    return `${h}h ${m}m`;
}

function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, (char) => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    }[char]));
}

function formatDateLabel(dateValue) {
    if (!dateValue) return 'No deadline';
    const date = new Date(`${dateValue}T00:00:00`);
    if (Number.isNaN(date.getTime())) return dateValue;
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function daysUntil(dateValue) {
    if (!dateValue) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(`${dateValue}T00:00:00`);
    if (Number.isNaN(target.getTime())) return null;
    return Math.ceil((target - today) / 86400000);
}


// Load Dashboard Data
async function loadDashboard() {
    const userStr = localStorage.getItem('user');
    if (!userStr) {
        window.location.href = 'login.html';
        return;
    }

    const user = JSON.parse(userStr);

    try {
        const [tasksRes, subjectsRes] = await Promise.all([
            fetch(`/api/tasks/user/${user.id}`),
            fetch(`/api/subjects/user/${user.id}`)
        ]);

        if (!tasksRes.ok || !subjectsRes.ok) {
            throw new Error('Unable to load dashboard data');
        }

        const tasks = await tasksRes.json();
        const subjects = await subjectsRes.json();

        updateStats(tasks);
        generateSmartSuggestions(tasks, subjects);
        renderSubjectsAndTasks(subjects, tasks);
    } catch (error) {
        console.error('Error loading dashboard:', error);
        const suggestionContent = document.getElementById('suggestionContent');
        if (suggestionContent) {
            suggestionContent.innerHTML = `
                <div class="suggestion-item danger">
                    <strong>Dashboard could not load.</strong>
                    <p>Please refresh once your connection is back.</p>
                </div>
            `;
        }
    }
}

function updateStats(tasks) {
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'COMPLETED').length;
    const pending = total - completed;
    const overdue = tasks.filter(t => t.status === 'PENDING' && daysUntil(t.deadline) < 0).length;

    const totalEl = document.getElementById('totalTasks');
    const completedEl = document.getElementById('completedTasks');
    const pendingEl = document.getElementById('pendingTasks');
    if (totalEl) totalEl.textContent = total;
    if (completedEl) completedEl.textContent = completed;
    if (pendingEl) pendingEl.textContent = pending;

    const progressPercentage = total === 0 ? 0 : Math.round((completed / total) * 100);
    const progressBar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');
    if (progressBar) progressBar.style.width = `${progressPercentage}%`;
    if (progressText) progressText.textContent = `${progressPercentage}% completed`;

    const greeting = document.getElementById('dashboardGreeting');
    const summary = document.getElementById('dashboardSummary');
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    const profile = user ? JSON.parse(localStorage.getItem(`profile_${user.id}`)) || {} : {};
    const displayName = user ? profile.displayName || user.name : 'there';
    if (greeting) greeting.textContent = `Ready for today, ${displayName}?`;
    if (summary) {
        const overdueCopy = overdue > 0 ? ` ${overdue} overdue item${overdue === 1 ? '' : 's'} need attention.` : '';
        summary.textContent = total === 0
            ? 'Build your first subject and task to start tracking progress.'
            : `${completed} of ${total} tasks complete. ${pending} still pending.${overdueCopy}`;
    }
}

function legacyGenerateSmartSuggestions(tasks, subjects) {
    const suggestionContent = document.getElementById('suggestionContent');
    if (!suggestionContent) return;

    if (tasks.length === 0) {
        suggestionContent.innerHTML = '<p>No tasks yet. Add some tasks to get smart suggestions!</p>';
        return;
    }

    const pendingTasks = tasks.filter(t => t.status === 'PENDING');
    
    if (pendingTasks.length === 0) {
        suggestionContent.innerHTML = '<p>Great job! All tasks completed. 🎉</p>';
        return;
    }

    const now = new Date();
    
    // Sort tasks by deadline
    pendingTasks.sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
    
    const nearestTask = pendingTasks[0];
    const isOverdue = new Date(nearestTask.deadline) < now;
    
    let html = `
        <p><strong>Next Task to Focus On:</strong> ${nearestTask.title} (Deadline: ${nearestTask.deadline})</p>
    `;
    
    if (isOverdue) {
        html += `<p style="color: var(--danger-color);">⚠️ <strong>Overdue Alert!</strong> You have overdue tasks.</p>`;
    }

    // Find weak subject (most pending tasks)
    const pendingBySubject = {};
    pendingTasks.forEach(t => {
        pendingBySubject[t.subject.id] = (pendingBySubject[t.subject.id] || 0) + 1;
    });

    let maxPending = 0;
    let weakSubjectId = null;
    
    for (const [subjId, count] of Object.entries(pendingBySubject)) {
        if (count > maxPending) {
            maxPending = count;
            weakSubjectId = parseInt(subjId);
        }
    }

    if (weakSubjectId) {
        const weakSubj = subjects.find(s => s.id === weakSubjectId);
        if (weakSubj) {
            html += `<p>📉 <strong>Weak Subject:</strong> Focus more on <em>${weakSubj.name}</em> (${maxPending} pending tasks).</p>`;
        }
    }

    suggestionContent.innerHTML = html;
}

function legacyRenderSubjectsAndTasks(subjects, tasks) {
    const container = document.getElementById('subjectsContainer');
    if (!container) return;

    container.innerHTML = '';

    subjects.forEach(subject => {
        const subjectTasks = tasks.filter(t => t.subject.id === subject.id);
        
        const card = document.createElement('div');
        card.className = 'card glass';
        card.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                <h3 style="margin: 0; font-weight: 600;">${subject.name}</h3>
                <a href="add-task.html?subjectId=${subject.id}" class="btn" style="padding: 0.4rem 0.8rem; font-size: 0.85rem;"><i class="fa-solid fa-plus"></i> Add Task</a>
            </div>
            <ul class="task-list">
                ${subjectTasks.length === 0 ? '<p style="color: var(--text-secondary); font-size: 0.9rem;">No tasks yet.</p>' : subjectTasks.map(t => `
                    <li class="task-item">
                        <div class="task-info">
                            <i class="fa-solid ${t.status === 'COMPLETED' ? 'fa-check-circle' : 'fa-circle'}"></i>
                            <div>
                                <h4 style="text-decoration: ${t.status === 'COMPLETED' ? 'line-through' : 'none'}; color: ${t.status === 'COMPLETED' ? 'var(--text-secondary)' : 'var(--text-color)'}">${t.title}</h4>
                                <p>Deadline: ${t.deadline}</p>
                            </div>
                            <span class="badge badge-${t.priority.toLowerCase()}">${t.priority}</span>
                            <span class="badge badge-${t.status.toLowerCase()}">${t.status}</span>
                        </div>
                        <div class="task-actions">
                            ${t.status === 'PENDING' ? `<button onclick="markComplete(${t.id})" class="btn" style="padding: 0.3rem 0.6rem; font-size: 0.8rem;"><i class="fa-solid fa-check"></i> Complete</button>` : ''}
                            <button onclick="deleteTask(${t.id})" class="btn btn-danger" style="padding: 0.3rem 0.6rem; font-size: 0.8rem;"><i class="fa-solid fa-trash"></i> Delete</button>
                        </div>
                    </li>
                `).join('')}
            </ul>
        `;
        container.appendChild(card);
    });
}

function generateSmartSuggestions(tasks, subjects) {
    const suggestionContent = document.getElementById('suggestionContent');
    if (!suggestionContent) return;

    if (tasks.length === 0) {
        suggestionContent.innerHTML = `
            <div class="suggestion-item">
                <strong>Create your first study loop.</strong>
                <p>Add a subject, then add a task with a deadline so Learnix can prioritize your day.</p>
            </div>
        `;
        return;
    }

    const pendingTasks = tasks.filter(t => t.status === 'PENDING');

    if (pendingTasks.length === 0) {
        suggestionContent.innerHTML = `
            <div class="suggestion-item success">
                <strong>All clear.</strong>
                <p>Your current tasks are complete. Add the next chapter, assignment, or revision slot when you are ready.</p>
            </div>
        `;
        return;
    }

    pendingTasks.sort((a, b) => new Date(a.deadline) - new Date(b.deadline));

    const nearestTask = pendingTasks[0];
    const nearestDays = daysUntil(nearestTask.deadline);
    const isOverdue = nearestDays !== null && nearestDays < 0;
    const dueCopy = nearestDays === null
        ? formatDateLabel(nearestTask.deadline)
        : nearestDays < 0
            ? `${Math.abs(nearestDays)} day${Math.abs(nearestDays) === 1 ? '' : 's'} overdue`
            : nearestDays === 0
                ? 'due today'
                : `due in ${nearestDays} day${nearestDays === 1 ? '' : 's'}`;

    let html = `
        <div class="suggestion-item ${isOverdue ? 'danger' : ''}">
            <strong>${isOverdue ? 'Catch up first' : 'Focus next'}: ${escapeHtml(nearestTask.title)}</strong>
            <p>${escapeHtml(nearestTask.subject?.name || 'General')} - ${dueCopy} - ${escapeHtml(nearestTask.priority)} priority</p>
        </div>
    `;

    if (isOverdue) {
        html += `
            <div class="suggestion-item danger">
                <strong>Overdue alert</strong>
                <p>Clear the oldest pending deadline before starting new work.</p>
            </div>
        `;
    }

    const pendingBySubject = {};
    pendingTasks.forEach(t => {
        pendingBySubject[t.subject.id] = (pendingBySubject[t.subject.id] || 0) + 1;
    });

    let maxPending = 0;
    let weakSubjectId = null;

    for (const [subjId, count] of Object.entries(pendingBySubject)) {
        if (count > maxPending) {
            maxPending = count;
            weakSubjectId = parseInt(subjId);
        }
    }

    if (weakSubjectId) {
        const weakSubj = subjects.find(s => s.id === weakSubjectId);
        if (weakSubj) {
            html += `
                <div class="suggestion-item">
                    <strong>Subject needing attention: ${escapeHtml(weakSubj.name)}</strong>
                    <p>${maxPending} pending task${maxPending === 1 ? '' : 's'} are waiting here.</p>
                </div>
            `;
        }
    }

    suggestionContent.innerHTML = html;
}

function renderSubjectsAndTasks(subjects, tasks) {
    const container = document.getElementById('subjectsContainer');
    if (!container) return;

    container.innerHTML = '';

    if (subjects.length === 0) {
        container.innerHTML = `
            <div class="dashboard-empty-state">
                <h3>No subjects yet</h3>
                <p>Create a subject to unlock task boards, progress stats, and smarter suggestions.</p>
                <a href="subjects.html" class="btn"><i class="fa-solid fa-plus"></i> Add Subject</a>
            </div>
        `;
        return;
    }

    subjects.forEach(subject => {
        const subjectTasks = tasks
            .filter(t => t.subject.id === subject.id)
            .sort((a, b) => {
                if (a.status !== b.status) return a.status === 'PENDING' ? -1 : 1;
                return new Date(a.deadline) - new Date(b.deadline);
            });
        const completedCount = subjectTasks.filter(t => t.status === 'COMPLETED').length;
        const subjectProgress = subjectTasks.length === 0 ? 0 : Math.round((completedCount / subjectTasks.length) * 100);

        const card = document.createElement('div');
        card.className = 'card glass subject-task-card';
        card.innerHTML = `
            <div class="subject-card-header">
                <div>
                    <h3>${escapeHtml(subject.name)}</h3>
                    <p style="margin: 0.35rem 0 0; color: var(--text-secondary); font-size: 0.9rem;">${completedCount}/${subjectTasks.length} complete - ${subjectProgress}%</p>
                </div>
                <a href="add-task.html?subjectId=${subject.id}" class="btn"><i class="fa-solid fa-plus"></i> Add Task</a>
            </div>
            <div class="mini-progress-bar">
                <div class="mini-progress-fill" style="width: ${subjectProgress}%"></div>
            </div>
            <ul class="task-list">
                ${subjectTasks.length === 0 ? '<li class="task-empty-state">No tasks yet. Add one to build momentum.</li>' : subjectTasks.map(t => `
                    <li class="task-item">
                        <div class="task-info">
                            <i class="fa-solid ${t.status === 'COMPLETED' ? 'fa-check-circle' : 'fa-circle'}"></i>
                            <div>
                                <h4 style="text-decoration: ${t.status === 'COMPLETED' ? 'line-through' : 'none'}; color: ${t.status === 'COMPLETED' ? 'var(--text-secondary)' : 'var(--text-color)'}">${escapeHtml(t.title)}</h4>
                                <p>Deadline: ${formatDateLabel(t.deadline)}</p>
                                <div class="task-meta">
                                    <span class="badge badge-${t.priority.toLowerCase()}">${escapeHtml(t.priority)}</span>
                                    <span class="badge badge-${t.status.toLowerCase()}">${escapeHtml(t.status)}</span>
                                </div>
                            </div>
                        </div>
                        <div class="task-actions">
                            ${t.status === 'PENDING' ? `<button onclick="markComplete(${t.id})" class="btn" title="Mark complete" aria-label="Mark ${escapeHtml(t.title)} complete"><i class="fa-solid fa-check"></i></button>` : ''}
                            <button onclick="deleteTask(${t.id})" class="btn btn-danger" title="Delete task" aria-label="Delete ${escapeHtml(t.title)}"><i class="fa-solid fa-trash"></i></button>
                        </div>
                    </li>
                `).join('')}
            </ul>
        `;
        container.appendChild(card);
    });
}

async function markComplete(taskId) {
    try {
        const response = await fetch(`/api/tasks/${taskId}/complete`, { method: 'PUT' });
        if (response.ok) {
            loadDashboard(); // Reload data
        }
    } catch (error) {
        console.error('Error marking task complete:', error);
    }
}

async function deleteTask(taskId) {
    if (!confirm('Are you sure you want to delete this task?')) return;
    try {
        const response = await fetch(`/api/tasks/${taskId}`, { method: 'DELETE' });
        if (response.ok) {
            loadDashboard(); // Reload data
        }
    } catch (error) {
        console.error('Error deleting task:', error);
    }
}

// --- Study Timer Logic ---
let timerInterval;
let timeLeft = 0;
let initialTime = 0;
let isTimerRunning = false;
const STUDY_TIMER_STATE_KEY = 'studyTimerState';
const FLOATING_TIMER_POSITION_KEY = 'floatingTimerPosition';
const FLOATING_TIMER_MINIMIZED_KEY = 'floatingTimerMinimized';
const FLOATING_TIMER_VISIBLE_KEY = 'floatingTimerVisible';
const FOCUS_MODE_STATE_KEY = 'focusModeState';

function canShowFloatingTimer() {
    const pageName = window.location.pathname.split('/').pop() || 'index.html';
    return !!localStorage.getItem('user') && !['index.html', 'login.html', 'signup.html'].includes(pageName);
}

function getSavedTimer() {
    const saved = localStorage.getItem('customTimer');
    if (saved) return JSON.parse(saved);
    return { h: 0, m: 25, s: 0 };
}

function getTimerState() {
    return JSON.parse(localStorage.getItem(STUDY_TIMER_STATE_KEY) || '{}');
}

function saveTimerState(state) {
    localStorage.setItem(STUDY_TIMER_STATE_KEY, JSON.stringify(state));
}

function clearTimerState() {
    localStorage.removeItem(STUDY_TIMER_STATE_KEY);
}

function getTimerSubjectId() {
    const subjectSelect = document.getElementById('timerSubjectSelect');
    return subjectSelect ? subjectSelect.value : (getTimerState().subjectId || '');
}

function updateTimerDisplay() {
    const displays = document.querySelectorAll('.timerDisplay, .floatingTimerDisplay, .focusModeTimerDisplay');
    const h = Math.floor(timeLeft / 3600);
    const m = Math.floor((timeLeft % 3600) / 60);
    const s = timeLeft % 60;
    
    let timeStr = '';
    if (h > 0) {
        timeStr = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    } else {
        timeStr = `00:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    
    displays.forEach(display => {
        display.textContent = timeStr;
    });
}

function syncTimerButtons() {
    const startBtns = document.querySelectorAll('.startTimerBtn');
    const pauseBtns = document.querySelectorAll('.pauseTimerBtn');
    const floatingStartBtn = document.getElementById('floatingTimerStartBtn');
    const floatingPauseBtn = document.getElementById('floatingTimerPauseBtn');

    startBtns.forEach(btn => btn.style.display = isTimerRunning ? 'none' : 'inline-block');
    pauseBtns.forEach(btn => btn.style.display = isTimerRunning ? 'inline-block' : 'none');

    if (floatingStartBtn) floatingStartBtn.style.display = isTimerRunning ? 'none' : 'inline-flex';
    if (floatingPauseBtn) floatingPauseBtn.style.display = isTimerRunning ? 'inline-flex' : 'none';

    syncFloatingTimerMinimized();
}

function ensureFloatingTimer() {
    if (!canShowFloatingTimer()) return;
    if (document.getElementById('floatingStudyTimer')) return;

    const timer = document.createElement('div');
    timer.id = 'floatingStudyTimer';
    timer.className = 'floating-study-timer glass';
    timer.innerHTML = `
        <div class="floating-timer-icon"><i class="fa-solid fa-stopwatch"></i></div>
        <div class="floating-timer-main">
            <span class="floating-timer-label">Study Timer</span>
            <strong class="floatingTimerDisplay">00:25:00</strong>
        </div>
        <button class="floating-timer-btn hide-btn" id="floatingTimerHideBtn" title="Hide timer"><i class="fa-solid fa-xmark"></i></button>
        <button class="floating-timer-btn minimize-btn" id="floatingTimerMinimizeBtn" title="Minimize timer"><i class="fa-solid fa-window-minimize"></i></button>
        <button class="floating-timer-btn" id="floatingTimerDecreaseBtn" title="Decrease timer by 5 minutes"><i class="fa-solid fa-minus"></i></button>
        <button class="floating-timer-btn" id="floatingTimerIncreaseBtn" title="Increase timer by 5 minutes"><i class="fa-solid fa-plus"></i></button>
        <button class="floating-timer-btn" id="floatingTimerStartBtn" title="Start timer"><i class="fa-solid fa-play"></i></button>
        <button class="floating-timer-btn danger" id="floatingTimerPauseBtn" title="Pause timer" style="display:none;"><i class="fa-solid fa-pause"></i></button>
        <button class="floating-timer-btn" id="floatingTimerResetBtn" title="Reset timer to zero"><i class="fa-solid fa-backward-step"></i></button>
    `;
    document.body.appendChild(timer);
    applyFloatingTimerPosition(timer);
    makeFloatingTimerDraggable(timer);

    document.getElementById('floatingTimerStartBtn').addEventListener('click', startStudyTimer);
    document.getElementById('floatingTimerPauseBtn').addEventListener('click', pauseStudyTimer);
    document.getElementById('floatingTimerResetBtn').addEventListener('click', resetTimerToZero);
    document.getElementById('floatingTimerMinimizeBtn').addEventListener('click', toggleFloatingTimerMinimized);
    document.getElementById('floatingTimerHideBtn').addEventListener('click', hideFloatingTimer);
    document.getElementById('floatingTimerDecreaseBtn').addEventListener('click', () => adjustTimerByMinutes(-5));
    document.getElementById('floatingTimerIncreaseBtn').addEventListener('click', () => adjustTimerByMinutes(5));
    syncFloatingTimerMinimized();
    updateTimerDisplay();
    syncTimerButtons();
}

function hideFloatingTimer() {
    localStorage.setItem(FLOATING_TIMER_VISIBLE_KEY, 'false');
    document.getElementById('floatingStudyTimer')?.remove();
}

function showFloatingTimer() {
    localStorage.setItem(FLOATING_TIMER_VISIBLE_KEY, 'true');
    ensureFloatingTimer();
}

function shouldShowFloatingTimer() {
    return localStorage.getItem(FLOATING_TIMER_VISIBLE_KEY) === 'true';
}

function isFloatingTimerMinimized() {
    return localStorage.getItem(FLOATING_TIMER_MINIMIZED_KEY) === 'true';
}

function syncFloatingTimerMinimized() {
    const timer = document.getElementById('floatingStudyTimer');
    const minimizeBtn = document.getElementById('floatingTimerMinimizeBtn');
    if (!timer || !minimizeBtn) return;

    const minimized = isFloatingTimerMinimized();
    timer.classList.toggle('minimized', minimized);
    minimizeBtn.title = minimized ? 'Expand timer' : 'Minimize timer';
    minimizeBtn.innerHTML = minimized
        ? '<i class="fa-solid fa-expand"></i>'
        : '<i class="fa-solid fa-compress"></i>';
    applyFloatingTimerPosition(timer);
}

function toggleFloatingTimerMinimized() {
    localStorage.setItem(FLOATING_TIMER_MINIMIZED_KEY, isFloatingTimerMinimized() ? 'false' : 'true');
    syncFloatingTimerMinimized();
}

function applyFloatingTimerPosition(timer) {
    const savedPosition = JSON.parse(localStorage.getItem(FLOATING_TIMER_POSITION_KEY) || 'null');
    if (!savedPosition) return;

    const maxLeft = window.innerWidth - timer.offsetWidth - 12;
    const maxTop = window.innerHeight - timer.offsetHeight - 12;
    const left = Math.min(Math.max(12, savedPosition.left), Math.max(12, maxLeft));
    const top = Math.min(Math.max(12, savedPosition.top), Math.max(12, maxTop));

    timer.style.left = `${left}px`;
    timer.style.top = `${top}px`;
    timer.style.right = 'auto';
    timer.style.bottom = 'auto';
}

function makeFloatingTimerDraggable(timer) {
    let dragState = null;

    timer.addEventListener('pointerdown', (event) => {
        if (event.target.closest('button')) return;

        const rect = timer.getBoundingClientRect();
        dragState = {
            offsetX: event.clientX - rect.left,
            offsetY: event.clientY - rect.top
        };

        timer.classList.add('dragging');
        timer.setPointerCapture(event.pointerId);
    });

    timer.addEventListener('pointermove', (event) => {
        if (!dragState) return;

        const maxLeft = window.innerWidth - timer.offsetWidth - 12;
        const maxTop = window.innerHeight - timer.offsetHeight - 12;
        const left = Math.min(Math.max(12, event.clientX - dragState.offsetX), Math.max(12, maxLeft));
        const top = Math.min(Math.max(12, event.clientY - dragState.offsetY), Math.max(12, maxTop));

        timer.style.left = `${left}px`;
        timer.style.top = `${top}px`;
        timer.style.right = 'auto';
        timer.style.bottom = 'auto';
    });

    const endDrag = (event) => {
        if (!dragState) return;

        dragState = null;
        timer.classList.remove('dragging');
        if (timer.hasPointerCapture(event.pointerId)) {
            timer.releasePointerCapture(event.pointerId);
        }

        const rect = timer.getBoundingClientRect();
        localStorage.setItem(FLOATING_TIMER_POSITION_KEY, JSON.stringify({
            left: rect.left,
            top: rect.top
        }));
    };

    timer.addEventListener('pointerup', endDrag);
    timer.addEventListener('pointercancel', endDrag);

    window.addEventListener('resize', () => applyFloatingTimerPosition(timer));
}

function setTimerInputs(h, m, s) {
    const hInput = document.getElementById('timerHours');
    const mInput = document.getElementById('timerMinutes');
    const sInput = document.getElementById('timerSeconds');

    if (hInput) hInput.value = h;
    if (mInput) mInput.value = m;
    if (sInput) sInput.value = s;
}

function setTimerDuration(h, m, s, preserveState = false) {
    clearInterval(timerInterval);
    isTimerRunning = false;
    setTimerInputs(h, m, s);

    timeLeft = (h * 3600) + (m * 60) + s;
    initialTime = timeLeft;
    localStorage.setItem('customTimer', JSON.stringify({h, m, s}));
    if (!preserveState) {
        clearTimerState();
    }
    updateTimerDisplay();
    syncTimerButtons();
}

window.setCustomTimer = function(h, m, s) {
    setTimerDuration(h, m, s);
};

function adjustTimerByMinutes(deltaMinutes) {
    const nextTime = Math.max(0, timeLeft + (deltaMinutes * 60));
    timeLeft = nextTime;
    initialTime = Math.max(initialTime, nextTime);

    const h = Math.floor(nextTime / 3600);
    const m = Math.floor((nextTime % 3600) / 60);
    const s = nextTime % 60;
    setTimerInputs(h, m, s);
    localStorage.setItem('customTimer', JSON.stringify({h, m, s}));

    const state = getTimerState();
    if (isTimerRunning) {
        saveTimerState({
            ...state,
            running: true,
            endAt: Date.now() + (nextTime * 1000),
            initialTime: Math.max(state.initialTime || 0, initialTime, nextTime),
            completed: false
        });
    } else if (nextTime > 0) {
        saveTimerState({
            ...state,
            running: false,
            remaining: nextTime,
            initialTime: Math.max(state.initialTime || 0, initialTime, nextTime),
            completed: false
        });
    } else {
        clearTimerState();
    }

    updateTimerDisplay();
    syncTimerButtons();
}

function resetTimerToZero() {
    clearInterval(timerInterval);
    isTimerRunning = false;
    timeLeft = 0;
    initialTime = 0;
    setTimerInputs(0, 0, 0);
    localStorage.setItem('customTimer', JSON.stringify({h: 0, m: 0, s: 0}));
    clearTimerState();
    clearFocusModeState();
    updateTimerDisplay();
    syncTimerButtons();
    closeFocusModeScreen();
    hideFloatingTimer();
}

function finishStudyTimer() {
    clearInterval(timerInterval);
    isTimerRunning = false;
    timeLeft = 0;
    updateTimerDisplay();
    syncTimerButtons();

    const state = getTimerState();
    if (state.focusMode) {
        handleFocusModeStepComplete(state);
        return;
    }

    if (!state.completed) {
        saveTimerState({ ...state, running: false, remaining: 0, completed: true });
        recordStudyTime(state.initialTime || initialTime, state.subjectId || '');
        alert("Time's up! Great job studying.");
        hideFloatingTimer();
    }
}

function tickStudyTimer() {
    const state = getTimerState();

    if (state.running && state.endAt) {
        timeLeft = Math.max(0, Math.ceil((state.endAt - Date.now()) / 1000));
        initialTime = state.initialTime || initialTime || timeLeft;
    }

    if (timeLeft > 0) {
        updateTimerDisplay();
        return;
    }

    finishStudyTimer();
}

function startStudyTimer() {
    if (isTimerRunning) return;

    const hInput = document.getElementById('timerHours');
    const mInput = document.getElementById('timerMinutes');
    const sInput = document.getElementById('timerSeconds');
    const state = getTimerState();
    const hasPausedTime = Number.isFinite(state.remaining) && state.remaining > 0;

    if (hasPausedTime) {
        timeLeft = state.remaining;
        initialTime = state.initialTime || initialTime || state.remaining;
    } else if (hInput && mInput && sInput) {
        const h = parseInt(hInput.value) || 0;
        const m = parseInt(mInput.value) || 0;
        const s = parseInt(sInput.value) || 0;
        timeLeft = (h * 3600) + (m * 60) + s;
        initialTime = timeLeft;
        localStorage.setItem('customTimer', JSON.stringify({h, m, s}));
    }

    if (timeLeft <= 0) return;

    isTimerRunning = true;
    saveTimerState({
        ...state,
        running: true,
        endAt: Date.now() + (timeLeft * 1000),
        initialTime,
        subjectId: getTimerSubjectId(),
        completed: false
    });
    if (shouldShowFloatingTimer()) {
        ensureFloatingTimer();
    }
    syncTimerButtons();
    updateTimerDisplay();

    clearInterval(timerInterval);
    timerInterval = setInterval(tickStudyTimer, 1000);
}

function pauseStudyTimer() {
    clearInterval(timerInterval);
    isTimerRunning = false;
    saveTimerState({
        running: false,
        remaining: timeLeft,
        initialTime,
        subjectId: getTimerSubjectId(),
        completed: false
    });
    syncTimerButtons();
}

function resetStudyTimer() {
    const saved = getSavedTimer();
    setTimerDuration(saved.h, saved.m, saved.s);
    clearFocusModeState();
    closeFocusModeScreen();
}

function getFocusModeState() {
    return JSON.parse(localStorage.getItem(FOCUS_MODE_STATE_KEY) || '{}');
}

function saveFocusModeState(state) {
    localStorage.setItem(FOCUS_MODE_STATE_KEY, JSON.stringify(state));
}

function clearFocusModeState() {
    localStorage.removeItem(FOCUS_MODE_STATE_KEY);
}

function initFocusModeControls() {
    const openBtn = document.getElementById('openFocusModeBtn');
    const closeBtn = document.getElementById('closeFocusSetupBtn');
    const startBtn = document.getElementById('startFocusModeBtn');
    const exitBtn = document.getElementById('exitFocusModeBtn');
    const setupModal = document.getElementById('focusSetupModal');
    const sessionsInput = document.getElementById('focusSessionsInput');

    if (openBtn && setupModal) {
        openBtn.addEventListener('click', () => {
            setupModal.classList.add('active');
            renderFocusPlanBar();
        });
    }
    if (closeBtn && setupModal) {
        closeBtn.addEventListener('click', () => setupModal.classList.remove('active'));
    }
    if (startBtn) {
        startBtn.addEventListener('click', startFocusMode);
    }
    if (exitBtn) {
        exitBtn.addEventListener('click', () => {
            if (confirm('Exit Deep Focus and stop the current Pomodoro timer?')) {
                resetTimerToZero();
            }
        });
    }
    if (sessionsInput) {
        sessionsInput.addEventListener('input', renderFocusPlanBar);
        renderFocusPlanBar();
    }
}

function getDefaultBreakPlan(sessions) {
    return Array.from({ length: sessions }, (_, index) => index === sessions - 1 ? 'long' : 'short');
}

function getFocusPlan() {
    const slots = Array.from(document.querySelectorAll('#focusPlanBar .focus-plan-slot'));
    if (slots.length === 0) {
        const sessions = Math.max(1, parseInt(document.getElementById('focusSessionsInput')?.value, 10) || 4);
        return Array.from({ length: sessions }, (_, index) => [
            { type: 'focus', session: index + 1 },
            { type: index === sessions - 1 ? 'long' : 'short', session: index + 1 }
        ]).flat();
    }
    return slots.map(slot => ({
        type: slot.dataset.slotType || 'none',
        session: Number(slot.dataset.session) || 1
    }));
}

function renderFocusPlanBar() {
    const sessionsInput = document.getElementById('focusSessionsInput');
    const sessionsCount = document.getElementById('focusSessionsCount');
    const planBar = document.getElementById('focusPlanBar');
    if (!sessionsInput || !sessionsCount || !planBar) return;

    const sessions = Math.max(1, parseInt(sessionsInput.value, 10) || 1);
    sessionsCount.textContent = sessions;

    const existingPlan = getFocusPlan();
    const defaultPlan = Array.from({ length: sessions }, (_, index) => [
        { type: 'focus', session: index + 1 },
        { type: index === sessions - 1 ? 'long' : 'short', session: index + 1 }
    ]).flat();
    const plan = Array.from({ length: sessions * 2 }, (_, index) => existingPlan[index] || defaultPlan[index]);

    planBar.innerHTML = '';
    plan.forEach((item, index) => {
        const slot = document.createElement('button');
        slot.type = 'button';
        slot.className = `focus-plan-slot ${item.type}`;
        slot.dataset.slotType = item.type;
        slot.dataset.session = item.session || Math.floor(index / 2) + 1;
        updateFocusPlanSlotLabel(slot);
        slot.addEventListener('click', () => {
            const nextType = slot.dataset.slotType === 'focus'
                ? 'short'
                : slot.dataset.slotType === 'short'
                    ? 'long'
                    : slot.dataset.slotType === 'long'
                        ? 'none'
                        : 'focus';
            slot.dataset.slotType = nextType;
            slot.className = `focus-plan-slot ${nextType}`;
            updateFocusPlanSlotLabel(slot);
        });
        planBar.appendChild(slot);
    });
}

function updateFocusPlanSlotLabel(slot) {
    const type = slot.dataset.slotType || 'none';
    slot.textContent = type === 'focus' ? 'F' : type === 'short' ? 'S' : type === 'long' ? 'L' : '-';
    slot.title = type === 'focus' ? 'Focus' : type === 'short' ? 'Short break' : type === 'long' ? 'Long break' : 'No slot';
}

function startFocusMode() {
    const sessions = Math.max(1, parseInt(document.getElementById('focusSessionsInput')?.value, 10) || 4);
    const focusMinutes = Math.max(1, parseInt(document.getElementById('focusMinutesInput')?.value, 10) || 25);
    const shortBreakMinutes = Math.max(1, parseInt(document.getElementById('shortBreakMinutesInput')?.value, 10) || 5);
    const longBreakMinutes = Math.max(1, parseInt(document.getElementById('longBreakMinutesInput')?.value, 10) || 15);
    const plan = getFocusPlan().filter(item => item.type !== 'none');
    if (plan.length === 0 || !plan.some(item => item.type === 'focus')) {
        alert('Add at least one focus slot before starting Deep Focus.');
        return;
    }

    const focusState = {
        sessions,
        focusMinutes,
        shortBreakMinutes,
        longBreakMinutes,
        plan,
        stepIndex: 0,
        currentSession: 1,
        phase: plan[0].type
    };
    saveFocusModeState(focusState);
    document.getElementById('focusSetupModal')?.classList.remove('active');
    openFocusModeScreen();
    runFocusModeStep(focusState);
}

function runFocusModeStep(focusState) {
    const isFocus = focusState.phase === 'focus';
    const breakType = focusState.phase === 'long' ? 'long' : 'short';
    const durationMinutes = isFocus
        ? focusState.focusMinutes
        : (breakType === 'long' ? focusState.longBreakMinutes : focusState.shortBreakMinutes);
    const durationSeconds = durationMinutes * 60;
    const durationHours = Math.floor(durationMinutes / 60);
    const remainingMinutes = durationMinutes % 60;

    timeLeft = durationSeconds;
    initialTime = durationSeconds;
    setTimerInputs(durationHours, remainingMinutes, 0);
    localStorage.setItem('customTimer', JSON.stringify({h: durationHours, m: remainingMinutes, s: 0}));

    const timerState = {
        running: true,
        endAt: Date.now() + (durationSeconds * 1000),
        initialTime: durationSeconds,
        subjectId: getTimerSubjectId(),
        completed: false,
        focusMode: true,
        focusPhase: focusState.phase
    };
    saveTimerState(timerState);
    updateFocusModeScreen(timerState, focusState);
    updateTimerDisplay();

    isTimerRunning = true;
    syncTimerButtons();
    clearInterval(timerInterval);
    timerInterval = setInterval(tickStudyTimer, 1000);

    if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(() => {});
    }
}

function handleFocusModeStepComplete(timerState) {
    const focusState = getFocusModeState();

    if (timerState.focusPhase === 'focus') {
        recordStudyTime(timerState.initialTime || initialTime, timerState.subjectId || '');
    }

    focusState.stepIndex = (focusState.stepIndex || 0) + 1;
    if (focusState.stepIndex >= (focusState.plan || []).length) {
        clearTimerState();
        clearFocusModeState();
        closeFocusModeScreen();
        hideFloatingTimer();
        alert('Deep Focus complete. Great work.');
        return;
    }

    const nextStep = focusState.plan[focusState.stepIndex];
    focusState.currentSession = nextStep.session || focusState.currentSession || 1;
    focusState.phase = nextStep.type;
    saveFocusModeState(focusState);
    runFocusModeStep(focusState);
}

function openFocusModeScreen() {
    const screen = document.getElementById('focusModeScreen');
    if (screen) {
        screen.classList.add('active');
    }
}

function closeFocusModeScreen() {
    const screen = document.getElementById('focusModeScreen');
    if (screen) {
        screen.classList.remove('active');
    }
    if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
    }
}

function updateFocusModeScreen(timerState = getTimerState(), focusState = getFocusModeState()) {
    const phase = document.getElementById('focusModePhase');
    const progress = document.getElementById('focusModeProgress');
    if (!phase || !progress || !timerState.focusMode) return;

    const isFocus = (timerState.focusPhase || focusState.phase) === 'focus';
    const activePhase = timerState.focusPhase || focusState.phase;
    phase.textContent = isFocus ? 'Deep Focus' : activePhase === 'long' ? 'Long Break' : 'Short Break';
    progress.textContent = `Session ${focusState.currentSession || 1} of ${focusState.sessions || 1}`;
}

function initStudyTimer() {
    if (!localStorage.getItem('user')) {
        document.getElementById('floatingStudyTimer')?.remove();
        return;
    }

    initFocusModeControls();

    const startBtns = document.querySelectorAll('.startTimerBtn');
    const pauseBtns = document.querySelectorAll('.pauseTimerBtn');
    const resetBtns = document.querySelectorAll('.resetTimerBtn');
    const showFloatingTimerBtns = document.querySelectorAll('.showFloatingTimerBtn');
    const state = getTimerState();

    if (state.running && state.endAt) {
        timeLeft = Math.max(0, Math.ceil((state.endAt - Date.now()) / 1000));
        initialTime = state.initialTime || timeLeft;
        isTimerRunning = timeLeft > 0;
        if (state.focusMode) {
            openFocusModeScreen();
            updateFocusModeScreen(state);
        }
        if (isTimerRunning) {
            if (shouldShowFloatingTimer()) {
                ensureFloatingTimer();
            }
            clearInterval(timerInterval);
            timerInterval = setInterval(tickStudyTimer, 1000);
        } else {
            finishStudyTimer();
        }
    } else if (Number.isFinite(state.remaining) && state.remaining > 0) {
        timeLeft = state.remaining;
        initialTime = state.initialTime || state.remaining;
        if (shouldShowFloatingTimer()) {
            ensureFloatingTimer();
        }
    } else {
        const saved = getSavedTimer();
        setTimerDuration(saved.h, saved.m, saved.s, true);
    }

    const h = Math.floor(timeLeft / 3600);
    const m = Math.floor((timeLeft % 3600) / 60);
    const s = timeLeft % 60;
    setTimerInputs(h, m, s);
    updateTimerDisplay();
    syncTimerButtons();

    startBtns.forEach(btn => btn.addEventListener('click', startStudyTimer));
    pauseBtns.forEach(btn => btn.addEventListener('click', pauseStudyTimer));
    resetBtns.forEach(btn => btn.addEventListener('click', resetStudyTimer));
    showFloatingTimerBtns.forEach(btn => btn.addEventListener('click', showFloatingTimer));
}

document.addEventListener('DOMContentLoaded', () => {
    initStudyTimer();
});

// --- Subject Tracker Logic (Solo Study Mode) ---
window.loadSubjectTracker = async function() {
    const userStr = localStorage.getItem('user');
    if (!userStr) return;
    const user = JSON.parse(userStr);
    
    const container = document.getElementById('subjectTrackerContainer');
    if (!container) return;

    try {
        const [subjectsRes, tasksRes] = await Promise.all([
            fetch(`/api/subjects/user/${user.id}`),
            fetch(`/api/tasks/user/${user.id}`)
        ]);
        
        const subjects = await subjectsRes.json();
        const tasks = await tasksRes.json();
        
        const timerSubjectSelect = document.getElementById('timerSubjectSelect');
        if (timerSubjectSelect) {
            while (timerSubjectSelect.options.length > 1) {
                timerSubjectSelect.remove(1);
            }
            subjects.forEach(s => {
                const opt = document.createElement('option');
                opt.value = s.id;
                opt.textContent = s.name;
                timerSubjectSelect.appendChild(opt);
            });

            const timerSubjectId = getTimerState().subjectId;
            if (timerSubjectId) {
                timerSubjectSelect.value = timerSubjectId;
            }
        }
        
        if (subjects.length === 0) {
            container.innerHTML = '<p style="color: var(--text-secondary); text-align: center;">No subjects found.</p>';
            return;
        }

        const subjectStats = subjects.map(s => {
            const sTasks = tasks.filter(t => t.subject.id === s.id);
            const completed = sTasks.filter(t => t.status === 'COMPLETED').length;
            const pending = sTasks.length - completed;
            return { ...s, completed, pending, total: sTasks.length };
        });

        // Find weak subject (most pending tasks, at least 1)
        let weakId = null;
        let maxPending = 0;
        subjectStats.forEach(s => {
            if (s.pending > maxPending) {
                maxPending = s.pending;
                weakId = s.id;
            }
        });

        const subjectTimes = JSON.parse(localStorage.getItem(`subjectTimes_${user.id}`)) || {};
        container.innerHTML = '';
        subjectStats.forEach(s => {
            const isWeak = s.id === weakId;
            const studyTimeSeconds = subjectTimes[s.id] || 0;
            const timeStr = formatTime(studyTimeSeconds);
            
            const div = document.createElement('div');
            div.className = `subject-tracker-item ${isWeak ? 'weak' : ''}`;
            div.innerHTML = `
                <div class="subject-info" style="width: 100%;">
                    <h4>${s.name} ${isWeak ? '<i class="fa-solid fa-triangle-exclamation" style="color: var(--danger-color); font-size: 0.8rem;" title="Needs Focus"></i>' : ''}</h4>
                    <div class="subject-stats" style="display: flex; flex-wrap: wrap; gap: 15px;">
                        <span title="Total Tasks"><i class="fa-solid fa-list-check"></i> ${s.total}</span>
                        <span style="color: var(--success-color);" title="Completed Tasks"><i class="fa-solid fa-check"></i> ${s.completed}</span>
                        <span style="color: var(--warning-color);" title="Pending Tasks"><i class="fa-solid fa-clock"></i> ${s.pending}</span>
                        <span style="color: var(--primary-color);" title="Time Studied"><i class="fa-solid fa-stopwatch"></i> ${timeStr}</span>
                    </div>
                </div>
            `;
            container.appendChild(div);
        });

    } catch (e) {
        console.error('Error loading subject tracker', e);
        container.innerHTML = '<p style="color: var(--danger-color); text-align: center;">Failed to load subjects.</p>';
    }
};

// --- Calendar Logic ---
let currentDate = new Date();
window.initCalendar = async function() {
    const userStr = localStorage.getItem('user');
    if (!userStr) {
        window.location.href = 'login.html';
        return;
    }
    const user = JSON.parse(userStr);

    const prevBtn = document.getElementById('prevMonthBtn');
    const nextBtn = document.getElementById('nextMonthBtn');
    
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            currentDate.setMonth(currentDate.getMonth() - 1);
            renderCalendar(user.id);
        });
    }
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            currentDate.setMonth(currentDate.getMonth() + 1);
            renderCalendar(user.id);
        });
    }

    // Modal logic
    const closeModalBtn = document.getElementById('closeModalBtn');
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', () => {
            document.getElementById('dateTasksModal').classList.remove('active');
        });
    }

    renderCalendar(user.id);
};

async function renderCalendar(userId) {
    const monthYearDisplay = document.getElementById('currentMonthYear');
    const calendarDays = document.getElementById('calendarDays');
    if (!monthYearDisplay || !calendarDays) return;

    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    monthYearDisplay.textContent = `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Fetch tasks for highlighting
    let tasks = [];
    try {
        const res = await fetch(`/api/tasks/user/${userId}`);
        tasks = await res.json();
    } catch(e) {
        console.error('Error fetching tasks for calendar', e);
    }

    // Group tasks by YYYY-MM-DD
    const tasksByDate = {};
    tasks.forEach(t => {
        if (!tasksByDate[t.deadline]) {
            tasksByDate[t.deadline] = [];
        }
        tasksByDate[t.deadline].push(t);
    });

    calendarDays.innerHTML = '';

    // Empty slots before first day
    for (let i = 0; i < firstDay; i++) {
        const emptyDiv = document.createElement('div');
        emptyDiv.className = 'calendar-day empty';
        calendarDays.appendChild(emptyDiv);
    }

    const today = new Date();
    
    for (let i = 1; i <= daysInMonth; i++) {
        const dayDiv = document.createElement('div');
        dayDiv.className = 'calendar-day';
        
        if (year === today.getFullYear() && month === today.getMonth() && i === today.getDate()) {
            dayDiv.classList.add('today');
        }

        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
        
        let indicatorsHtml = '';
        const dayTasks = tasksByDate[dateStr] || [];
        if (dayTasks.length > 0) {
            indicatorsHtml = '<div class="task-indicators">';
            // Only show up to 3 indicators to save space
            dayTasks.slice(0, 3).forEach(t => {
                let statusClass = t.status === 'COMPLETED' ? 'completed' : '';
                let priorityClass = t.priority === 'HIGH' && t.status !== 'COMPLETED' ? 'high-priority' : '';
                indicatorsHtml += `<div class="task-indicator ${statusClass} ${priorityClass}"></div>`;
            });
            if (dayTasks.length > 3) {
                indicatorsHtml += `<span style="font-size:0.6rem; color:var(--text-secondary); margin-left:2px;">+${dayTasks.length-3}</span>`;
            }
            indicatorsHtml += '</div>';
        }

        dayDiv.innerHTML = `<div class="date-num">${i}</div>${indicatorsHtml}`;
        
        dayDiv.addEventListener('click', () => openDateModal(dateStr, dayTasks));

        calendarDays.appendChild(dayDiv);
    }

    // Render Upcoming Events
    const eventsContainer = document.getElementById('upcomingEventsContainer');
    if (eventsContainer) {
        const pendingTasks = tasks.filter(t => t.status === 'PENDING');
        pendingTasks.sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
        const upcoming = pendingTasks.slice(0, 4);

        eventsContainer.innerHTML = '';
        if (upcoming.length === 0) {
            eventsContainer.innerHTML = '<p style="color: var(--text-secondary); font-size: 0.9rem;">No upcoming tasks. You are all caught up!</p>';
        } else {
            upcoming.forEach(t => {
                const eventDate = new Date(t.deadline);
                const isOverdue = eventDate < new Date(new Date().toDateString());
                const isToday = t.deadline === `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
                
                let dateBadge = `<span class="badge" style="background: var(--primary-color);">${t.deadline}</span>`;
                if (isOverdue) dateBadge = `<span class="badge badge-high">Overdue</span>`;
                else if (isToday) dateBadge = `<span class="badge badge-medium">Today</span>`;

                const div = document.createElement('div');
                div.className = 'task-item fade-in';
                div.style.padding = '0.8rem';
                div.style.background = 'var(--input-bg)';
                div.innerHTML = `
                    <div style="flex: 1;">
                        <h4 style="margin: 0 0 0.2rem 0; font-size: 0.95rem; color: var(--text-color);">${t.title}</h4>
                        <p style="margin: 0; font-size: 0.8rem; color: var(--text-secondary);">${t.subject.name}</p>
                    </div>
                    <div>${dateBadge}</div>
                `;
                eventsContainer.appendChild(div);
            });
        }
    }
}

function openDateModal(dateStr, dayTasks) {
    const modal = document.getElementById('dateTasksModal');
    const title = document.getElementById('modalDateTitle');
    const list = document.getElementById('modalTaskList');
    const addBtn = document.getElementById('modalAddTaskBtn');
    
    if (!modal) return;

    title.textContent = `Tasks for ${dateStr}`;
    list.innerHTML = '';

    if (dayTasks.length === 0) {
        list.innerHTML = '<p style="color: var(--text-secondary); text-align: center; padding: 1rem;">No tasks scheduled for this day.</p>';
    } else {
        dayTasks.forEach(t => {
            list.innerHTML += `
                <li class="task-item">
                    <div class="task-info">
                        <i class="fa-solid ${t.status === 'COMPLETED' ? 'fa-check-circle' : 'fa-circle'}"></i>
                        <div>
                            <h4 style="text-decoration: ${t.status === 'COMPLETED' ? 'line-through' : 'none'}; color: ${t.status === 'COMPLETED' ? 'var(--text-secondary)' : 'var(--text-color)'}">${t.title}</h4>
                            <p>${t.subject.name} - ${t.priority}</p>
                        </div>
                    </div>
                </li>
            `;
        });
    }

    addBtn.onclick = () => {
        window.location.href = `add-task.html?date=${dateStr}`;
    };

    modal.classList.add('active');
}




// --- Study Time Tracking ---
function recordStudyTime(durationSeconds, storedSubjectId = '') {
    const userStr = localStorage.getItem('user');
    if (!userStr) return;
    const user = JSON.parse(userStr);
    
    // Update total time
    let totalTime = parseInt(localStorage.getItem(`totalStudyTime_${user.id}`)) || 0;
    totalTime += durationSeconds;
    localStorage.setItem(`totalStudyTime_${user.id}`, totalTime);
    
    // Server Sync - Total Time
    fetch(`/api/study-time/user/${user.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ duration: durationSeconds })
    }).catch(console.error);

    // Update subject time
    const subjectSelect = document.getElementById('timerSubjectSelect');
    const subjectId = storedSubjectId || (subjectSelect ? subjectSelect.value : '');
    if (subjectId) {
        const subjectTimes = JSON.parse(localStorage.getItem(`subjectTimes_${user.id}`)) || {};
        subjectTimes[subjectId] = (subjectTimes[subjectId] || 0) + durationSeconds;
        localStorage.setItem(`subjectTimes_${user.id}`, JSON.stringify(subjectTimes));
        
        // Server Sync - Subject Time
        fetch(`/api/study-time/subject/${subjectId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ duration: durationSeconds })
        }).catch(console.error);

        // Reload subject tracker if in solo study mode
        if (typeof loadSubjectTracker === 'function') {
            loadSubjectTracker();
        }
    }
}

// --- Subjects Dashboard Logic ---
window.loadSubjectsDashboard = async function() {
    const userStr = localStorage.getItem('user');
    if (!userStr) {
        window.location.href = 'login.html';
        return;
    }
    const user = JSON.parse(userStr);

    // Setup Add Subject Modal
    const openAddBtn = document.getElementById('openAddSubjectBtn');
    const closeAddBtn = document.getElementById('closeAddSubjectBtn');
    const addModal = document.getElementById('addSubjectModal');
    const addForm = document.getElementById('addSubjectForm');

    // Remove old listeners to prevent duplicates if function is called multiple times
    if (openAddBtn) {
        const newOpenBtn = openAddBtn.cloneNode(true);
        openAddBtn.parentNode.replaceChild(newOpenBtn, openAddBtn);
        newOpenBtn.addEventListener('click', () => addModal.classList.add('active'));
    }
    if (closeAddBtn) {
        const newCloseBtn = closeAddBtn.cloneNode(true);
        closeAddBtn.parentNode.replaceChild(newCloseBtn, closeAddBtn);
        newCloseBtn.addEventListener('click', () => addModal.classList.remove('active'));
    }
    
    const currentAddForm = document.getElementById('addSubjectForm');
    if (currentAddForm) {
        const newAddForm = currentAddForm.cloneNode(true);
        currentAddForm.parentNode.replaceChild(newAddForm, currentAddForm);
        newAddForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('newSubjectName').value;
            try {
                const response = await fetch(`/api/subjects/user/${user.id}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name })
                });
                if (response.ok) {
                    addModal.classList.remove('active');
                    newAddForm.reset();
                    loadSubjectsDashboard(); // Reload data
                } else {
                    alert('Error adding subject');
                }
            } catch (error) {
                console.error(error);
            }
        });
    }

    try {
        const [subjectsRes, tasksRes] = await Promise.all([
            fetch(`/api/subjects/user/${user.id}`),
            fetch(`/api/tasks/user/${user.id}`)
        ]);
        const subjects = await subjectsRes.json();
        const tasks = await tasksRes.json();

        // Overall Analytics
        const totalSubjects = subjects.length;
        const totalTasks = tasks.length;
        const completedTasks = tasks.filter(t => t.status === 'COMPLETED').length;
        const pendingTasks = totalTasks - completedTasks;
        const overallPercentage = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

        const elTotalSubj = document.getElementById('overallTotalSubjects');
        const elCompleted = document.getElementById('overallCompletedTasks');
        const elPending = document.getElementById('overallPendingTasks');
        const elCircle = document.getElementById('overallCircularProgress');
        const elPercentage = document.getElementById('overallPercentageText');

        if (elTotalSubj) animateValue(elTotalSubj, 0, totalSubjects, 1200);
        if (elCompleted) animateValue(elCompleted, 0, completedTasks, 1200);
        if (elPending) animateValue(elPending, 0, pendingTasks, 1200);
        if (elPercentage) animateValue(elPercentage, 0, overallPercentage, 1200, '%');
        
        // Render Pie Chart (Subject Distribution)
        const pieChart = document.getElementById('subjectPieChart');
        if (pieChart && subjects.length > 0) {
            let conicStops = [];
            let currentPercentage = 0;
            const colors = ['var(--primary-color)', '#34c759', '#ff9500', '#ff3b30', '#af52de', '#5856d6', '#00c6ff'];
            
            subjects.forEach((subj, index) => {
                const subjTasks = tasks.filter(t => t.subject.id === subj.id).length;
                const portion = totalTasks === 0 ? (100 / subjects.length) : (subjTasks / totalTasks) * 100;
                const color = colors[index % colors.length];
                conicStops.push(`${color} ${currentPercentage}% ${currentPercentage + portion}%`);
                currentPercentage += portion;
            });
            
            // Fallback if no tasks
            if (totalTasks === 0) {
                pieChart.style.background = 'conic-gradient(var(--input-bg) 0% 100%)';
            } else {
                setTimeout(() => {
                    pieChart.style.background = `conic-gradient(${conicStops.join(', ')})`;
                }, 300);
            }
        }

        // Render Bar Chart (Task Completion per Subject)
        const barChart = document.getElementById('subjectBarChart');
        if (barChart) {
            barChart.innerHTML = '';
            // Determine max tasks for scaling
            let maxTasks = 1;
            subjects.forEach(subj => {
                const subjTasks = tasks.filter(t => t.subject.id === subj.id).length;
                if (subjTasks > maxTasks) maxTasks = subjTasks;
            });

            subjects.forEach((subj) => {
                const subjTasks = tasks.filter(t => t.subject.id === subj.id).length;
                const completed = tasks.filter(t => t.subject.id === subj.id && t.status === 'COMPLETED').length;
                
                // Height based on total tasks, opacity/color logic based on completion
                const heightPercentage = (subjTasks / maxTasks) * 100;
                
                const col = document.createElement('div');
                col.className = 'bar-chart-col';
                col.innerHTML = `
                    <div class="bar-chart-fill" data-height="${heightPercentage}%" title="${subj.name}: ${completed}/${subjTasks} completed"></div>
                    <div class="bar-chart-label" title="${subj.name}">${subj.name}</div>
                `;
                barChart.appendChild(col);
            });

            setTimeout(() => {
                barChart.querySelectorAll('.bar-chart-fill').forEach(fill => {
                    fill.style.height = fill.getAttribute('data-height');
                });
            }, 500);
        }
        
        // Animate circular progress
        if (elCircle) {
            setTimeout(() => {
                elCircle.setAttribute('stroke-dasharray', `${overallPercentage}, 100`);
            }, 100);
        }

        // Render Subject Cards
        const container = document.getElementById('subjectsDashboardContainer');
        if (!container) return;
        
        container.innerHTML = '';
        if (subjects.length === 0) {
            container.innerHTML = '<p style="color: var(--text-secondary); grid-column: 1/-1;">No subjects yet. Click "Add Subject" to get started.</p>';
            return;
        }

        subjects.forEach(subj => {
            const subjTasks = tasks.filter(t => t.subject.id === subj.id);
            const subjTotal = subjTasks.length;
            const subjCompleted = subjTasks.filter(t => t.status === 'COMPLETED').length;
            const subjPending = subjTotal - subjCompleted;
            const subjPercentage = subjTotal === 0 ? 0 : Math.round((subjCompleted / subjTotal) * 100);

            const card = document.createElement('div');
            card.className = 'card glass subject-dash-card fade-in';
            
            // Build task list HTML
            let tasksHtml = '';
            if (subjTasks.length === 0) {
                tasksHtml = '<p style="font-size: 0.85rem; color: var(--text-secondary);">No tasks in this subject.</p>';
            } else {
                subjTasks.forEach(t => {
                    const isComp = t.status === 'COMPLETED';
                    tasksHtml += `
                        <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.85rem; margin-bottom: 0.5rem;">
                            <span style="${isComp ? 'text-decoration: line-through; color: var(--text-secondary);' : ''}">
                                <i class="fa-solid ${isComp ? 'fa-check-circle' : 'fa-circle'}"></i> ${t.title}
                            </span>
                            <span class="badge badge-${t.status.toLowerCase()}" style="font-size: 0.65rem;">${t.status}</span>
                        </div>
                    `;
                });
            }

            card.innerHTML = `
                <div>
                    <h3 style="margin: 0 0 1rem 0; color: var(--primary-color); display: flex; justify-content: space-between; align-items: center;">
                        ${subj.name}
                        <span style="font-size: 0.9rem; color: var(--text-secondary); font-weight: normal;">${subjPercentage}%</span>
                    </h3>
                    
                    <div style="display: flex; justify-content: space-between; font-size: 0.9rem; margin-bottom: 0.5rem; color: var(--text-secondary);">
                        <span>Tasks: <strong>${subjTotal}</strong></span>
                        <span style="color: var(--success-color);">Done: <strong>${subjCompleted}</strong></span>
                        <span style="color: var(--warning-color);">Left: <strong>${subjPending}</strong></span>
                    </div>
                    
                    <div class="mini-progress-bar">
                        <div class="mini-progress-fill" style="width: 0%" data-target="${subjPercentage}%"></div>
                    </div>
                </div>
                
                <div class="subject-details">
                    <h4 style="margin: 0 0 0.5rem 0; font-size: 0.95rem;">Topics / Tasks</h4>
                    ${tasksHtml}
                    <div style="margin-top: 1rem; text-align: center;">
                        <a href="add-task.html?subjectId=${subj.id}" class="btn" style="padding: 0.3rem 0.8rem; font-size: 0.8rem;"><i class="fa-solid fa-plus"></i> Add Task</a>
                    </div>
                </div>
            `;
            
            // Expand logic
            card.addEventListener('click', (e) => {
                // Ignore if clicked on button or link
                if (e.target.closest('.btn') || e.target.closest('a')) return;
                
                const details = card.querySelector('.subject-details');
                details.classList.toggle('active');
            });

            container.appendChild(card);
        });

        // Trigger animations for mini progress bars
        setTimeout(() => {
            document.querySelectorAll('.mini-progress-fill').forEach(bar => {
                bar.style.width = bar.getAttribute('data-target');
            });
        }, 100);

    } catch (error) {
        console.error('Error loading subjects dashboard:', error);
    }
};
