let enhancedState = {
    userFavorites: [],
    userPhone: null,
    userName: null,
    currentView: 'grid', 
    selectedRating: 0,
    currentCalendarDate: new Date(),
    searchHistory: [],
    userPreferences: {}
};


document.addEventListener('DOMContentLoaded', function() {
    if (window.enhancedFeaturesLoaded) return; 
    window.enhancedFeaturesLoaded = true;
    
    console.log('Loading Enhanced Features...');
    
    
    loadUserPreferences();
    
   
    initializeSearchFeatures();
    
   
    if (enhancedState.currentView === 'calendar') {
        initializeCalendar();
    }
    
   
    setupKeyboardShortcuts();
    
   
    initializeMobileFeatures();
    
    console.log('Enhanced Features Loaded Successfully!');
});



function initializeSearchFeatures() {
    const filterSection = document.querySelector('.filter-section .container');
    if (!filterSection) return;
    
    
    const searchHTML = `
        <div class="search-container" style="position: relative; max-width: 600px; margin: 0 auto 2rem;">
            <input type="text" class="search-input" placeholder="Search events by name, location, organizer..." 
                   id="enhancedEventSearch" 
                   style="width: 100%; padding: 15px 50px 15px 20px; border: 2px solid #e0e0e0; border-radius: 30px; 
                          font-size: 1.1rem; background: white; box-shadow: 0 5px 20px rgba(0,0,0,0.1);">
            <button class="search-btn" onclick="performEnhancedSearch()" 
                    style="position: absolute; right: 10px; top: 50%; transform: translateY(-50%); 
                           background: #1e3c72; color: white; border: none; padding: 10px 15px; 
                           border-radius: 50%; cursor: pointer;">
                <i class="fas fa-search"></i>
            </button>
            <div id="searchSuggestions" class="search-suggestions" 
                 style="position: absolute; top: 100%; left: 0; right: 0; background: white; 
                        border-radius: 10px; box-shadow: 0 5px 20px rgba(0,0,0,0.1); z-index: 100; 
                        display: none; max-height: 300px; overflow-y: auto;"></div>
        </div>
        <div class="filters-toggle" style="text-align: center; margin-bottom: 1rem;">
            <button class="toggle-btn" onclick="toggleAdvancedFilters()" id="advancedFilterToggle"
                    style="background: none; border: 2px solid #1e3c72; color: #1e3c72; padding: 8px 20px; 
                           border-radius: 25px; cursor: pointer; font-weight: 600; margin-right: 10px;">
                <i class="fas fa-filter"></i> Advanced Filters
            </button>
            <button class="toggle-btn" onclick="toggleViewMode()" id="viewToggle"
                    style="background: none; border: 2px solid #1e3c72; color: #1e3c72; padding: 8px 20px; 
                           border-radius: 25px; cursor: pointer; font-weight: 600;">
                <i class="fas fa-calendar"></i> Calendar View
            </button>
        </div>
        <div class="advanced-filters" id="enhancedAdvancedFilters" 
             style="display: none; margin-top: 1rem;">
            <div class="filter-container">
                <div class="filter-group">
                    <label>Date Range</label>
                    <input type="date" id="startDateFilter" onchange="filterEvents()" style="width: 100%; padding: 0.5rem; margin-bottom: 5px;">
                    <input type="date" id="endDateFilter" onchange="filterEvents()" style="width: 100%; padding: 0.5rem;">
                </div>
                <div class="filter-group">
                    <label>Event Type</label>
                    <select id="eventTypeFilter" onchange="filterEvents()" style="width: 100%; padding: 0.8rem;">
                        <option value="">All Events</option>
                        <option value="free">Free Events</option>
                        <option value="paid">Paid Events</option>
                        <option value="vip">VIP Events</option>
                    </select>
                </div>
                <div class="filter-group">
                    <label>Attendance</label>
                    <select id="attendanceFilter" onchange="filterEvents()" style="width: 100%; padding: 0.8rem;">
                        <option value="">Any Size</option>
                        <option value="small">Small (1-50)</option>
                        <option value="medium">Medium (51-200)</option>
                        <option value="large">Large (200+)</option>
                    </select>
                </div>
                <div class="filter-group">
                    <label>Sort By</label>
                    <select id="sortByFilter" onchange="filterEvents()" style="width: 100%; padding: 0.8rem;">
                        <option value="date">Date</option>
                        <option value="price">Price</option>
                        <option value="attendees">Popularity</option>
                        <option value="title">Name</option>
                    </select>
                </div>
            </div>
        </div>
    `;
    
    
    const titleElement = filterSection.querySelector('h2');
    if (titleElement) {
        titleElement.insertAdjacentHTML('afterend', searchHTML);
    }
    
  
    const searchInput = document.getElementById('enhancedEventSearch');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(handleSearchInput, 300));
        searchInput.addEventListener('keydown', handleSearchKeydown);
        searchInput.addEventListener('focus', showSearchSuggestions);
        searchInput.addEventListener('blur', hideSearchSuggestions);
    }
    
    // Set minimum dates
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('startDateFilter').value = today;
    document.getElementById('startDateFilter').min = today;
    document.getElementById('endDateFilter').min = today;
}

function handleSearchInput() {
    const query = document.getElementById('enhancedEventSearch').value.trim();
    if (query.length >= 2) {
        updateSearchSuggestions(query);
        performEnhancedSearch();
    } else {
        hideSearchSuggestions();
        if (query.length === 0) {
            loadEvents(); // Reset to all events
        }
    }
}

function handleSearchKeydown(e) {
    if (e.key === 'Enter') {
        e.preventDefault();
        performEnhancedSearch();
        hideSearchSuggestions();
    }
}

async function performEnhancedSearch() {
    const query = document.getElementById('enhancedEventSearch').value.trim();
    if (!query) {
        await loadEvents();
        return;
    }
    
   
    if (query && !enhancedState.searchHistory.includes(query)) {
        enhancedState.searchHistory.unshift(query);
        enhancedState.searchHistory = enhancedState.searchHistory.slice(0, 10); 
        saveUserPreferences();
    }
    
    try {
        const response = await fetch(`/api/events/search?q=${encodeURIComponent(query)}`);
        if (!response.ok) throw new Error('Search failed');
        
        const events = await response.json();
        filteredEvents = events;
        applyAdditionalFilters();
        displayEvents(filteredEvents);
        
        showNotification(`Found ${events.length} events matching "${query}"`, 'info', 3000);
    } catch (err) {
        console.error('Search error:', err);
        showNotification('Search error. Please try again.', 'error');
    }
}

function updateSearchSuggestions(query) {
    const suggestions = [];
    
    
    enhancedState.searchHistory.forEach(term => {
        if (term.toLowerCase().includes(query.toLowerCase()) && term !== query) {
            suggestions.push({ text: term, type: 'history' });
        }
    });
    
    
    const categories = ['sports', 'social', 'business', 'education', 'culture', 'outdoor', 'food', 'music', 'volunteer', 'tech'];
    categories.forEach(cat => {
        if (cat.toLowerCase().includes(query.toLowerCase())) {
            suggestions.push({ text: getCategoryName(cat), type: 'category', value: cat });
        }
    });
    
    
    Object.keys(kenyaData).forEach(county => {
        if (county.toLowerCase().includes(query.toLowerCase())) {
            suggestions.push({ text: county, type: 'location' });
        }
    });
    
    displaySearchSuggestions(suggestions.slice(0, 8));
}

function displaySearchSuggestions(suggestions) {
    const container = document.getElementById('searchSuggestions');
    if (!container) return;
    
    if (suggestions.length === 0) {
        hideSearchSuggestions();
        return;
    }
    
    container.innerHTML = suggestions.map(suggestion => `
        <div class="suggestion-item" onclick="selectSuggestion('${suggestion.text}', '${suggestion.type}', '${suggestion.value || ''}')"
             style="padding: 10px 15px; cursor: pointer; border-bottom: 1px solid #f0f0f0; display: flex; align-items: center; gap: 10px;">
            <i class="fas ${getSuggestionIcon(suggestion.type)}" style="color: #666;"></i>
            <span>${suggestion.text}</span>
            <small style="margin-left: auto; color: #999;">${suggestion.type}</small>
        </div>
    `).join('');
    
    container.style.display = 'block';
}

function getSuggestionIcon(type) {
    const icons = {
        'history': 'fa-history',
        'category': 'fa-tag',
        'location': 'fa-map-marker-alt'
    };
    return icons[type] || 'fa-search';
}

function selectSuggestion(text, type, value) {
    const searchInput = document.getElementById('enhancedEventSearch');
    searchInput.value = text;
    
    if (type === 'category' && value) {
        document.getElementById('category').value = value;
    }
    
    performEnhancedSearch();
    hideSearchSuggestions();
}

function showSearchSuggestions() {
    const container = document.getElementById('searchSuggestions');
    const query = document.getElementById('enhancedEventSearch').value.trim();
    if (container && query.length >= 2) {
        container.style.display = 'block';
    }
}

function hideSearchSuggestions() {
    setTimeout(() => {
        const container = document.getElementById('searchSuggestions');
        if (container) container.style.display = 'none';
    }, 200);
}

function toggleAdvancedFilters() {
    const filters = document.getElementById('enhancedAdvancedFilters');
    const btn = document.getElementById('advancedFilterToggle');
    
    if (filters.style.display === 'none' || !filters.style.display) {
        filters.style.display = 'block';
        btn.innerHTML = '<i class="fas fa-times"></i> Hide Filters';
        btn.style.background = '#1e3c72';
        btn.style.color = 'white';
    } else {
        filters.style.display = 'none';
        btn.innerHTML = '<i class="fas fa-filter"></i> Advanced Filters';
        btn.style.background = 'none';
        btn.style.color = '#1e3c72';
    }
}

function applyAdditionalFilters() {
    let events = [...filteredEvents];
    
 
    const startDate = document.getElementById('startDateFilter')?.value;
    const endDate = document.getElementById('endDateFilter')?.value;
    
    if (startDate) {
        events = events.filter(event => new Date(event.date) >= new Date(startDate));
    }
    if (endDate) {
        events = events.filter(event => new Date(event.date) <= new Date(endDate));
    }
    
   
    const eventType = document.getElementById('eventTypeFilter')?.value;
    if (eventType) {
        switch (eventType) {
            case 'free':
                events = events.filter(event => event.price === 0);
                break;
            case 'paid':
                events = events.filter(event => event.price > 0);
                break;
            case 'vip':
                events = events.filter(event => event.is_vip);
                break;
        }
    }
    
    
    const attendance = document.getElementById('attendanceFilter')?.value;
    if (attendance) {
        switch (attendance) {
            case 'small':
                events = events.filter(event => (event.max_attendees || event.attendees) <= 50);
                break;
            case 'medium':
                events = events.filter(event => (event.max_attendees || event.attendees) > 50 && (event.max_attendees || event.attendees) <= 200);
                break;
            case 'large':
                events = events.filter(event => (event.max_attendees || event.attendees) > 200);
                break;
        }
    }
    
    
    const sortBy = document.getElementById('sortByFilter')?.value || 'date';
    switch (sortBy) {
        case 'price':
            events.sort((a, b) => a.price - b.price);
            break;
        case 'attendees':
            events.sort((a, b) => b.attendees - a.attendees);
            break;
        case 'title':
            events.sort((a, b) => a.title.localeCompare(b.title));
            break;
        default:
            events.sort((a, b) => new Date(a.date) - new Date(b.date));
    }
    
    filteredEvents = events;
}



function toggleViewMode() {
    const btn = document.getElementById('viewToggle');
    const container = document.getElementById('eventsContainer');
    
    if (enhancedState.currentView === 'grid') {
        enhancedState.currentView = 'calendar';
        btn.innerHTML = '<i class="fas fa-th"></i> Grid View';
        btn.style.background = '#1e3c72';
        btn.style.color = 'white';
        showCalendarView();
    } else {
        enhancedState.currentView = 'grid';
        btn.innerHTML = '<i class="fas fa-calendar"></i> Calendar View';
        btn.style.background = 'none';
        btn.style.color = '#1e3c72';
        displayEvents(filteredEvents);
    }
    
    saveUserPreferences();
}

function showCalendarView() {
    const container = document.getElementById('eventsContainer');
    container.innerHTML = `
        <div class="calendar-container" style="background: white; border-radius: 15px; box-shadow: 0 5px 20px rgba(0,0,0,0.1); overflow: hidden;">
            <div class="calendar-header" style="background: #1e3c72; color: white; padding: 1rem; display: flex; justify-content: space-between; align-items: center;">
                <button class="calendar-nav" onclick="previousMonth()" style="background: none; border: none; color: white; font-size: 1.5rem; cursor: pointer; padding: 5px 10px; border-radius: 5px;">
                    <i class="fas fa-chevron-left"></i>
                </button>
                <h3 id="calendarTitle" style="margin: 0;"></h3>
                <button class="calendar-nav" onclick="nextMonth()" style="background: none; border: none; color: white; font-size: 1.5rem; cursor: pointer; padding: 5px 10px; border-radius: 5px;">
                    <i class="fas fa-chevron-right"></i>
                </button>
            </div>
            <div class="calendar-grid" style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 1px; background: #f0f0f0;">
                <div class="calendar-day-header" style="background: #f8f9fa; padding: 10px; text-align: center; font-weight: 600; font-size: 0.9rem; color: #666;">Sun</div>
                <div class="calendar-day-header" style="background: #f8f9fa; padding: 10px; text-align: center; font-weight: 600; font-size: 0.9rem; color: #666;">Mon</div>
                <div class="calendar-day-header" style="background: #f8f9fa; padding: 10px; text-align: center; font-weight: 600; font-size: 0.9rem; color: #666;">Tue</div>
                <div class="calendar-day-header" style="background: #f8f9fa; padding: 10px; text-align: center; font-weight: 600; font-size: 0.9rem; color: #666;">Wed</div>
                <div class="calendar-day-header" style="background: #f8f9fa; padding: 10px; text-align: center; font-weight: 600; font-size: 0.9rem; color: #666;">Thu</div>
                <div class="calendar-day-header" style="background: #f8f9fa; padding: 10px; text-align: center; font-weight: 600; font-size: 0.9rem; color: #666;">Fri</div>
                <div class="calendar-day-header" style="background: #f8f9fa; padding: 10px; text-align: center; font-weight: 600; font-size: 0.9rem; color: #666;">Sat</div>
                <div id="calendarDays"></div>
            </div>
        </div>
    `;
    
    initializeCalendar();
}

function initializeCalendar() {
    renderCalendar();
}

function renderCalendar() {
    const year = enhancedState.currentCalendarDate.getFullYear();
    const month = enhancedState.currentCalendarDate.getMonth();
    
    
    const title = document.getElementById('calendarTitle');
    if (title) {
        title.textContent = enhancedState.currentCalendarDate.toLocaleDateString('en-US', { 
            month: 'long', 
            year: 'numeric' 
        });
    }
    
   
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const daysContainer = document.getElementById('calendarDays');
    if (!daysContainer) return;
    
    daysContainer.innerHTML = '';
    
    
    for (let i = 0; i < 42; i++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);
        
        const dayEvents = filteredEvents.filter(event => {
            const eventDate = new Date(event.date);
            return eventDate.toDateString() === date.toDateString();
        });
        
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';
        dayElement.style.cssText = `
            background: ${date.getMonth() !== month ? '#fafafa' : 'white'};
            min-height: 80px;
            padding: 5px;
            cursor: pointer;
            position: relative;
            border: 1px solid #f0f0f0;
            ${date.toDateString() === new Date().toDateString() ? 'background: #e3f2fd;' : ''}
            ${dayEvents.length > 0 ? 'background: #fff3e0;' : ''}
        `;
        
        dayElement.innerHTML = `
            <div class="day-number" style="font-weight: 600; margin-bottom: 2px; color: ${date.getMonth() !== month ? '#ccc' : '#333'};">
                ${date.getDate()}
            </div>
            <div class="day-events" style="font-size: 0.7rem;">
                ${dayEvents.slice(0, 3).map(event => 
                    `<div class="day-event" onclick="showEventDetails(${event.id})" style="background: #1e3c72; color: white; padding: 1px 4px; border-radius: 3px; margin-bottom: 1px; cursor: pointer; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${event.title}</div>`
                ).join('')}
                ${dayEvents.length > 3 ? `<div class="day-event" style="background: #e74c3c; color: white; padding: 1px 4px; border-radius: 3px; font-size: 0.6rem;">+${dayEvents.length - 3} more</div>` : ''}
            </div>
        `;
        
        dayElement.onclick = (e) => {
            if (e.target.classList.contains('day-event')) return; // Let event clicks handle themselves
            showDayEvents(date, dayEvents);
        };
        
        daysContainer.appendChild(dayElement);
    }
}

function previousMonth() {
    enhancedState.currentCalendarDate.setMonth(enhancedState.currentCalendarDate.getMonth() - 1);
    renderCalendar();
}

function nextMonth() {
    enhancedState.currentCalendarDate.setMonth(enhancedState.currentCalendarDate.getMonth() + 1);
    renderCalendar();
}

function showDayEvents(date, events) {
    if (events.length === 0) {
        showNotification(`No events on ${date.toDateString()}`, 'info', 2000);
        return;
    }
    
    createModal(`Events on ${date.toDateString()}`, `
        <div class="events-grid" style="display: grid; grid-template-columns: 1fr; gap: 1rem; max-height: 400px; overflow-y: auto;">
            ${events.map(event => `
                <div class="event-card" onclick="showEventDetails(${event.id})" style="cursor: pointer; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); background: white;">
                    <div style="padding: 1rem;">
                        <h4 style="margin: 0 0 0.5rem 0; color: #1e3c72;">${event.title}</h4>
                        <p style="margin: 0 0 0.5rem 0; color: #666; font-size: 0.9rem;">
                            <i class="fas fa-map-marker-alt"></i> ${event.area}, ${event.county}
                        </p>
                        <p style="margin: 0 0 0.5rem 0; color: #666; font-size: 0.9rem;">
                            <i class="fas fa-clock"></i> ${event.time || 'All day'}
                        </p>
                        <p style="margin: 0; font-weight: 600; color: #e74c3c;">
                            ${event.price === 0 ? 'FREE' : `KSH ${event.price.toLocaleString()}`}
                        </p>
                    </div>
                </div>
            `).join('')}
        </div>
    `);
}



function loadUserPreferences() {
    const stored = localStorage.getItem('connectKenya_enhancedPreferences');
    if (stored) {
        try {
            const prefs = JSON.parse(stored);
            enhancedState.userPhone = prefs.phone || null;
            enhancedState.userName = prefs.name || null;
            enhancedState.currentView = prefs.view || 'grid';
            enhancedState.searchHistory = prefs.searchHistory || [];
            enhancedState.userPreferences = prefs.preferences || {};
            
            if (prefs.favorites) {
                enhancedState.userFavorites = prefs.favorites;
            }
        } catch (err) {
            console.error('Error loading preferences:', err);
        }
    }
}

function saveUserPreferences() {
    const prefs = {
        phone: enhancedState.userPhone,
        name: enhancedState.userName,
        view: enhancedState.currentView,
        searchHistory: enhancedState.searchHistory,
        favorites: enhancedState.userFavorites.map(f => ({ id: f.id, title: f.title })),
        preferences: enhancedState.userPreferences
    };
    
    localStorage.setItem('connectKenya_enhancedPreferences', JSON.stringify(prefs));
}

async function loadUserFavorites() {
    if (!enhancedState.userPhone) return;
    
    try {
        const response = await fetch(`/api/favorites/${enhancedState.userPhone}`);
        if (response.ok) {
            enhancedState.userFavorites = await response.json();
            updateFavoritesUI();
        }
    } catch (err) {
        console.error('Error loading favorites:', err);
    }
}

function updateFavoritesUI() {
   
    const badge = document.getElementById('favoritesCount');
    if (badge) {
        const count = enhancedState.userFavorites.length;
        badge.textContent = count;
        badge.style.display = count > 0 ? 'inline-block' : 'none';
    }
    
  
    document.querySelectorAll('.favorite-btn').forEach(btn => {
        const eventId = parseInt(btn.dataset.eventId);
        const isFavorited = enhancedState.userFavorites.some(fav => fav.id === eventId);
        btn.classList.toggle('favorited', isFavorited);
        btn.innerHTML = isFavorited ? '<i class="fas fa-heart"></i>' : '<i class="far fa-heart"></i>';
    });
}


const originalJoinEvent = window.joinEvent;
window.joinEvent = async function(eventId, clickEvent) {
    if (clickEvent) clickEvent.stopPropagation();
    
    const event = allEvents.find(e => e.id === eventId);
    if (!event) return;

    
    if (event.max_attendees && event.attendees >= event.max_attendees) {
        showWaitlistModal(event);
        return;
    }

    showJoinEventModal(event);
};

function showJoinEventModal(event) {
    const isWaitlist = event.max_attendees && event.attendees >= event.max_attendees;
    
    createModal(`Join "${event.title}"`, `
        ${isWaitlist ? `
            <div style="background: #fff3cd; border: 2px solid #ffc107; border-radius: 10px; padding: 1rem; margin: 1rem 0;">
                <h4 style="color: #856404; margin-bottom: 0.5rem;">Event is Full!</h4>
                <p>This event has reached its maximum capacity. You can join the waitlist and we'll notify you if a spot becomes available.</p>
            </div>
        ` : ''}
        
        <form id="enhancedJoinForm">
            <div style="margin-bottom: 1rem;">
                <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">Full Name *</label>
                <input type="text" id="joinNameEnhanced" required style="width: 100%; padding: 0.8rem; border: 2px solid #e0e0e0; border-radius: 8px;" value="${enhancedState.userName || ''}">
            </div>
            <div style="margin-bottom: 1rem;">
                <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">Phone Number *</label>
                <input type="tel" id="joinPhoneEnhanced" required placeholder="+254..." style="width: 100%; padding: 0.8rem; border: 2px solid #e0e0e0; border-radius: 8px;" value="${enhancedState.userPhone || ''}">
            </div>
            <div style="margin-bottom: 1rem;">
                <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">Email (Optional)</label>
                <input type="email" id="joinEmailEnhanced" style="width: 100%; padding: 0.8rem; border: 2px solid #e0e0e0; border-radius: 8px;">
            </div>
            
            <div style="background: #f8f9fa; padding: 1rem; border-radius: 8px; margin: 1rem 0;">
                <h4>Event Details:</h4>
                <p><strong>Date:</strong> ${formatDate(event.date)} ${event.time ? 'at ' + event.time : ''}</p>
                <p><strong>Location:</strong> ${event.location || event.area + ', ' + event.county}</p>
                <p><strong>Price:</strong> ${event.price === 0 ? 'FREE' : `KSH ${event.price.toLocaleString()}`}</p>
                ${event.contact ? `<p><strong>Contact:</strong> ${event.contact}</p>` : ''}
            </div>
            
            <div style="text-align: center; margin-top: 1.5rem;">
                <button type="submit" class="btn-primary" style="padding: 12px 30px; background: #28a745; border: none; border-radius: 25px; color: white; font-weight: 600; cursor: pointer;">
                    <i class="fas fa-check"></i> ${isWaitlist ? 'Join Waitlist' : 'Confirm Registration'}
                </button>
            </div>
        </form>
    `, () => {
        document.getElementById('enhancedJoinForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            await handleEnhancedJoinSubmit(event.id, isWaitlist);
        });
    });
}

async function handleEnhancedJoinSubmit(eventId, isWaitlist) {
    const name = document.getElementById('joinNameEnhanced').value.trim();
    const phone = document.getElementById('joinPhoneEnhanced').value.trim();
    const email = document.getElementById('joinEmailEnhanced').value.trim();

    if (!name || !phone) {
        showNotification('Please fill in all required fields', 'error');
        return;
    }

   
    enhancedState.userPhone = phone;
    enhancedState.userName = name;
    saveUserPreferences();

    try {
        const response = await fetch(`/api/events/${eventId}/join`, { 
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, phone, email })
        });
        const data = await response.json();
        
        if (data.success) {
            if (data.waitlisted) {
                showNotification('Added to waitlist! You\'ll be notified if a spot opens up.', 'success');
            } else {
                showNotification('Successfully registered for the event!', 'success');
                // Update the event in our local data
                const event = allEvents.find(e => e.id === eventId);
                if (event) event.attendees++;
            }
            closeModal();
            displayEvents(filteredEvents);
        } else {
            showNotification(data.message || 'Failed to join event', 'error');
        }
    } catch (err) {
        console.error('Join event error:', err);
        showNotification('Server error. Please try again.', 'error');
    }
}

function showWaitlistModal(event) {
    createModal(`Join Waitlist - "${event.title}"`, `
        <div style="background: #fff3cd; border: 2px solid #ffc107; border-radius: 10px; padding: 1rem; margin: 1rem 0;">
            <h4 style="color: #856404; margin-bottom: 0.5rem;">Event is Full!</h4>
            <p>This event has reached its maximum capacity of ${event.max_attendees} attendees. 
            You can join the waitlist and we'll notify you if a spot becomes available.</p>
        </div>
        
        <form id="waitlistForm">
            <div style="margin-bottom: 1rem;">
                <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">Full Name *</label>
                <input type="text" id="waitlistName" required style="width: 100%; padding: 0.8rem; border: 2px solid #e0e0e0; border-radius: 8px;" value="${enhancedState.userName || ''}">
            </div>
            <div style="margin-bottom: 1rem;">
                <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">Phone Number *</label>
                <input type="tel" id="waitlistPhone" required placeholder="+254..." style="width: 100%; padding: 0.8rem; border: 2px solid #e0e0e0; border-radius: 8px;" value="${enhancedState.userPhone || ''}">
            </div>
            <div style="margin-bottom: 1rem;">
                <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">Email (Optional)</label>
                <input type="email" id="waitlistEmail" style="width: 100%; padding: 0.8rem; border: 2px solid #e0e0e0; border-radius: 8px;">
            </div>
            
            <div style="text-align: center; margin-top: 1.5rem;">
                <button type="submit" class="btn-primary" style="padding: 12px 30px; background: #ffc107; border: none; border-radius: 25px; color: #000; font-weight: 600; cursor: pointer;">
                    <i class="fas fa-list"></i> Join Waitlist
                </button>
            </div>
        </form>
    `);
}



function addFavoriteButtons() {
    
    document.querySelectorAll('.event-card').forEach(card => {
        if (card.querySelector('.favorite-btn')) return; 
        
        const eventId = extractEventIdFromCard(card);
        if (!eventId) return;
        
        const isFavorited = enhancedState.userFavorites.some(fav => fav.id === eventId);
        
        const favoriteBtn = document.createElement('button');
        favoriteBtn.className = 'favorite-btn';
        favoriteBtn.dataset.eventId = eventId;
        favoriteBtn.style.cssText = `
            position: absolute;
            top: 10px;
            right: 50px;
            background: rgba(255,255,255,0.9);
            border: none;
            width: 35px;
            height: 35px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            z-index: 5;
        `;
        
        favoriteBtn.innerHTML = isFavorited ? '<i class="fas fa-heart" style="color: #e74c3c;"></i>' : '<i class="far fa-heart" style="color: #666;"></i>';
        favoriteBtn.onclick = (e) => {
            e.stopPropagation();
            toggleFavorite(eventId);
        };
        
        card.appendChild(favoriteBtn);
    });
}

function extractEventIdFromCard(card) {
    const onclickAttr = card.getAttribute('onclick');
    if (onclickAttr) {
        const match = onclickAttr.match(/showEventDetails\((\d+)\)/);
        return match ? parseInt(match[1]) : null;
    }
    return null;
}

async function toggleFavorite(eventId) {
    if (!enhancedState.userPhone || !enhancedState.userName) {
        promptUserDetails((phone, name) => {
            enhancedState.userPhone = phone;
            enhancedState.userName = name;
            saveUserPreferences();
            toggleFavorite(eventId);
        });
        return;
    }
    
    const isFavorited = enhancedState.userFavorites.some(fav => fav.id === eventId);
    const action = isFavorited ? 'remove' : 'add';
    
    try {
        const response = await fetch(`/api/events/${eventId}/favorite`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                phone: enhancedState.userPhone, 
                name: enhancedState.userName, 
                action 
            })
        });
        
        const data = await response.json();
        if (data.success) {
            const event = allEvents.find(e => e.id === eventId);
            if (action === 'add') {
                enhancedState.userFavorites.push(event);
                showNotification('Added to favorites!', 'success', 2000);
            } else {
                enhancedState.userFavorites = enhancedState.userFavorites.filter(fav => fav.id !== eventId);
                showNotification('Removed from favorites', 'info', 2000);
            }
            
            saveUserPreferences();
            updateFavoritesUI();
        }
    } catch (err) {
        console.error('Favorite error:', err);
        showNotification('Error updating favorites', 'error');
    }
}

function promptUserDetails(callback) {
    createModal('Your Details', `
        <p>Please provide your contact information:</p>
        <form id="userDetailsForm">
            <div style="margin-bottom: 1rem;">
                <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">Full Name *</label>
                <input type="text" id="userNameInput" required style="width: 100%; padding: 0.8rem; border: 2px solid #e0e0e0; border-radius: 8px;">
            </div>
            <div style="margin-bottom: 1rem;">
                <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">Phone Number *</label>
                <input type="tel" id="userPhoneInput" required placeholder="+254..." style="width: 100%; padding: 0.8rem; border: 2px solid #e0e0e0; border-radius: 8px;">
            </div>
            <div style="text-align: center; margin-top: 1.5rem;">
                <button type="submit" class="btn-primary" style="padding: 12px 30px;">Continue</button>
            </div>
        </form>
    `, () => {
        document.getElementById('userDetailsForm').addEventListener('submit', function(e) {
            e.preventDefault();
            const name = document.getElementById('userNameInput').value.trim();
            const phone = document.getElementById('userPhoneInput').value.trim();
            
            if (name && phone) {
                closeModal();
                callback(phone, name);
            }
        });
    });
}


const originalShowEventDetails = window.showEventDetails;
window.showEventDetails = function(eventId) {
    const event = allEvents.find(e => e.id === eventId);
    if (!event) return;
    
    const isFavorited = enhancedState.userFavorites.some(fav => fav.id === eventId);
    
    createModal(event.title + (event.is_vip ? ' <span style="color: #e74c3c;">VIP</span>' : ''), `
        <div class="event-tabs" style="display: flex; border-bottom: 2px solid #f0f0f0; margin: 1rem 0;">
            <button class="tab-button active" onclick="showEventTab('details')" style="background: none; border: none; padding: 10px 20px; cursor: pointer; font-weight: 600; color: #1e3c72; border-bottom: 2px solid #1e3c72;">Details</button>
            <button class="tab-button" onclick="showEventTab('comments')" style="background: none; border: none; padding: 10px 20px; cursor: pointer; font-weight: 600; color: #666; border-bottom: 2px solid transparent;">Comments</button>
            <button class="tab-button" onclick="showEventTab('reviews')" style="background: none; border: none; padding: 10px 20px; cursor: pointer; font-weight: 600; color: #666; border-bottom: 2px solid transparent;">Reviews</button>
        </div>
        
        <div id="detailsTab" class="tab-content active" style="display: block;">
            <div style="display: flex; align-items: center; gap: 10px; margin: 1rem 0; color: #666;">
                <i class="fas fa-map-marker-alt"></i>
                <span>${event.location || event.area + ', ' + event.county}</span>
            </div>
            <div style="display: flex; align-items: center; gap: 10px; margin: 1rem 0; color: #666;">
                <i class="fas fa-calendar"></i>
                <span>${formatDate(event.date)} ${event.time ? 'at ' + event.time : ''}</span>
            </div>
            <div style="display: flex; align-items: center; gap: 10px; margin: 1rem 0; color: #e74c3c; font-weight: 700; font-size: 1.2rem;">
                <i class="fas fa-tag"></i>
                <span>${event.price === 0 ? 'FREE' : `KSH ${event.price.toLocaleString()}`}</span>
            </div>
            <p style="margin: 1.5rem 0; line-height: 1.6;">${event.description}</p>
            
            <div style="background: #f8f9fa; padding: 1rem; border-radius: 10px; margin: 1rem 0;">
                <h4>Event Details:</h4>
                <ul style="margin-left: 1rem; margin-top: 0.5rem;">
                    <li>Category: ${getCategoryName(event.category)}</li>
                    <li>Organizer: ${event.organizer}</li>
                    <li>Current Attendees: ${event.attendees}</li>
                    ${event.max_attendees ? `<li>Maximum Capacity: ${event.max_attendees}</li>` : ''}
                    <li>Location: ${event.location || event.area + ', ' + event.county}</li>
                    ${event.contact ? `<li>Contact: ${event.contact}</li>` : ''}
                </ul>
            </div>
        </div>
        
        <div id="commentsTab" class="tab-content" style="display: none;">
            <div id="commentsSection" style="max-height: 300px; overflow-y: auto; background: #f8f9fa; border-radius: 10px; padding: 1rem; margin-bottom: 1rem;">
                <div id="commentsList">Loading comments...</div>
            </div>
            <div style="display: flex; gap: 10px;">
                <input type="text" id="commentInput" placeholder="Add a comment..." style="flex: 1; padding: 10px; border: 2px solid #e0e0e0; border-radius: 20px;">
                <button onclick="addEventComment(${event.id})" style="background: #1e3c72; color: white; border: none; padding: 10px 20px; border-radius: 20px; cursor: pointer;">
                    <i class="fas fa-paper-plane"></i>
                </button>
            </div>
        </div>
        
        <div id="reviewsTab" class="tab-content" style="display: none;">
            <div id="reviewsSection">Loading reviews...</div>
            <div style="background: #f8f9fa; padding: 1.5rem; border-radius: 10px; margin: 1rem 0;">
                <h4>Leave a Review</h4>
                <div id="starRating" style="display: flex; gap: 5px; margin: 10px 0;">
                    ${[1,2,3,4,5].map(i => `<span class="star-input" onclick="selectRating(${i})" data-rating="${i}" style="font-size: 2rem; color: #ddd; cursor: pointer;">★</span>`).join('')}
                </div>
                <textarea id="reviewText" placeholder="Write your review..." style="width: 100%; padding: 10px; border: 2px solid #e0e0e0; border-radius: 8px; margin: 10px 0; min-height: 80px;"></textarea>
                <button onclick="submitEventReview(${event.id})" class="btn-primary" style="padding: 10px 20px;">Submit Review</button>
            </div>
        </div>
        
        <div style="text-align: center; margin-top: 2rem; padding-top: 1rem; border-top: 1px solid #f0f0f0;">
            <button onclick="window.joinEvent(${event.id})" class="btn-primary" style="padding: 15px 30px; font-size: 1.1rem; margin-right: 10px;">
                <i class="fas fa-user-plus"></i> Join Event
            </button>
            <button onclick="toggleFavorite(${event.id})" style="background: ${isFavorited ? '#e74c3c' : '#28a745'}; color: white; padding: 15px 30px; border: none; border-radius: 25px; cursor: pointer; margin-right: 10px;">
                <i class="fas fa-heart"></i> ${isFavorited ? 'Unfavorite' : 'Favorite'}
            </button>
            <button onclick="shareEvent(${event.id})" style="background: #17a2b8; color: white; padding: 15px 30px; border: none; border-radius: 25px; cursor: pointer;">
                <i class="fas fa-share"></i> Share
            </button>
        </div>
    `, () => {
       
        loadEventComments(eventId);
        loadEventReviews(eventId);
    });
};

function showEventTab(tabName) {
    
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.style.display = 'none';
    });
    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.style.color = '#666';
        btn.style.borderBottomColor = 'transparent';
        btn.classList.remove('active');
    });
    
  
    document.getElementById(tabName + 'Tab').style.display = 'block';
    event.target.style.color = '#1e3c72';
    event.target.style.borderBottomColor = '#1e3c72';
    event.target.classList.add('active');
}



async function loadEventComments(eventId) {
    try {
        const response = await fetch(`/api/events/${eventId}/comments`);
        const comments = await response.json();
        
        const commentsList = document.getElementById('commentsList');
        if (comments.length === 0) {
            commentsList.innerHTML = '<p style="text-align: center; color: #666;">No comments yet. Be the first to comment!</p>';
        } else {
            commentsList.innerHTML = comments.map(comment => `
                <div style="background: white; padding: 10px 15px; border-radius: 8px; margin-bottom: 10px; border-left: 3px solid #1e3c72;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
                        <span style="font-weight: 600; color: #1e3c72; font-size: 0.9rem;">${comment.commenter_name}</span>
                        <span style="font-size: 0.8rem; color: #666;">${formatDateTime(comment.created_at)}</span>
                    </div>
                    <div style="color: #333;">${comment.comment_text}</div>
                </div>
            `).join('');
        }
    } catch (err) {
        console.error('Error loading comments:', err);
        document.getElementById('commentsList').innerHTML = '<p style="color: #e74c3c;">Error loading comments</p>';
    }
}

async function addEventComment(eventId) {
    const commentInput = document.getElementById('commentInput');
    const comment = commentInput.value.trim();
    
    if (!comment) return;
    
    if (!enhancedState.userPhone || !enhancedState.userName) {
        promptUserDetails((phone, name) => {
            enhancedState.userPhone = phone;
            enhancedState.userName = name;
            saveUserPreferences();
            addEventComment(eventId);
        });
        return;
    }
    
    try {
        const response = await fetch(`/api/events/${eventId}/comments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: enhancedState.userName,
                phone: enhancedState.userPhone,
                comment: comment
            })
        });
        
        const data = await response.json();
        if (data.success) {
            commentInput.value = '';
            loadEventComments(eventId);
            showNotification('Comment added!', 'success', 2000);
        } else {
            showNotification(data.message || 'Error adding comment', 'error');
        }
    } catch (err) {
        console.error('Error adding comment:', err);
        showNotification('Error adding comment', 'error');
    }
}



function selectRating(rating) {
    enhancedState.selectedRating = rating;
    const stars = document.querySelectorAll('.star-input');
    stars.forEach((star, index) => {
        if (index < rating) {
            star.style.color = '#ffc107';
        } else {
            star.style.color = '#ddd';
        }
    });
}

async function loadEventReviews(eventId) {
    try {
        const response = await fetch(`/api/events/${eventId}/reviews`);
        const reviews = await response.json();
        
        const reviewsSection = document.getElementById('reviewsSection');
        
        if (reviews.length === 0) {
            reviewsSection.innerHTML = '<p style="text-align: center; color: #666;">No reviews yet. Be the first to review this event!</p>';
            return;
        }
        
        const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
        
        reviewsSection.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px; margin: 1rem 0; padding: 1rem; background: #f8f9fa; border-radius: 10px;">
                <div style="display: flex; gap: 2px;">
                    ${[1,2,3,4,5].map(i => 
                        `<span style="color: ${i <= Math.round(avgRating) ? '#ffc107' : '#ddd'}; font-size: 1.5rem;">★</span>`
                    ).join('')}
                </div>
                <span style="font-size: 1.2rem; font-weight: 600;">${avgRating.toFixed(1)}</span>
                <span style="color: #666;">out of 5 (${reviews.length} reviews)</span>
            </div>
            <div style="max-height: 300px; overflow-y: auto;">
                ${reviews.map(review => `
                    <div style="background: white; padding: 1rem; border-radius: 8px; margin-bottom: 1rem; border-left: 3px solid #28a745;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                            <span style="font-weight: 600; color: #1e3c72;">${review.attendee_name}</span>
                            <div style="display: flex; align-items: center; gap: 5px;">
                                <div style="display: flex; gap: 1px;">
                                    ${[1,2,3,4,5].map(i => 
                                        `<span style="color: ${i <= review.rating ? '#ffc107' : '#ddd'}; font-size: 1rem;">★</span>`
                                    ).join('')}
                                </div>
                                <span style="font-size: 0.8rem; color: #666; margin-left: 5px;">${formatDateTime(review.created_at)}</span>
                            </div>
                        </div>
                        ${review.review_text ? `<p style="margin: 0; color: #555;">${review.review_text}</p>` : ''}
                    </div>
                `).join('')}
            </div>
        `;
    } catch (err) {
        console.error('Error loading reviews:', err);
        document.getElementById('reviewsSection').innerHTML = '<p style="color: #e74c3c;">Error loading reviews</p>';
    }
}

async function submitEventReview(eventId) {
    if (!enhancedState.selectedRating) {
        showNotification('Please select a rating', 'error');
        return;
    }
    
    const reviewText = document.getElementById('reviewText').value.trim();
    
    if (!enhancedState.userPhone || !enhancedState.userName) {
        promptUserDetails((phone, name) => {
            enhancedState.userPhone = phone;
            enhancedState.userName = name;
            saveUserPreferences();
            submitEventReview(eventId);
        });
        return;
    }
    
    try {
        const response = await fetch(`/api/events/${eventId}/review`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: enhancedState.userName,
                phone: enhancedState.userPhone,
                rating: enhancedState.selectedRating,
                review: reviewText
            })
        });
        
        const data = await response.json();
        if (data.success) {
            enhancedState.selectedRating = 0;
            document.getElementById('reviewText').value = '';
            document.querySelectorAll('.star-input').forEach(star => {
                star.style.color = '#ddd';
            });
            loadEventReviews(eventId);
            showNotification('Review submitted!', 'success');
        } else {
            showNotification(data.message || 'Error submitting review', 'error');
        }
    } catch (err) {
        console.error('Error submitting review:', err);
        showNotification('Error submitting review', 'error');
    }
}



function createModal(title, content, onShow) {
    
    const existingModal = document.getElementById('enhancedModal');
    if (existingModal) existingModal.remove();
    
    const modal = document.createElement('div');
    modal.id = 'enhancedModal';
    modal.style.cssText = `
        display: block;
        position: fixed;
        z-index: 2000;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0,0,0,0.5);
    `;
    
    modal.innerHTML = `
        <div style="background-color: white; margin: 2% auto; padding: 2rem; border-radius: 20px; width: 90%; max-width: 700px; max-height: 90vh; overflow-y: auto; position: relative;">
            <span onclick="closeModal()" style="color: #aaa; float: right; font-size: 28px; font-weight: bold; cursor: pointer; position: absolute; right: 20px; top: 15px;">&times;</span>
            <h2 style="margin: 0 0 1rem 0; color: #1e3c72;">${title}</h2>
            ${content}
        </div>
    `;
    
    document.body.appendChild(modal);
    
   
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });
    
    if (onShow) onShow();
}

function closeModal() {
    const modal = document.getElementById('enhancedModal');
    if (modal) modal.remove();
}

function formatDateTime(dateTimeString) {
    const date = new Date(dateTimeString);
    return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        hour: '2-digit',
        minute: '2-digit'
    });
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}



function initializeMobileFeatures() {
    if (window.innerWidth <= 768) {
      
        const fab = document.createElement('div');
        fab.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            z-index: 1000;
            background: #e74c3c;
            color: white;
            width: 60px;
            height: 60px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            box-shadow: 0 4px 20px rgba(231,76,60,0.4);
            font-size: 1.5rem;
            transition: all 0.3s ease;
        `;
        fab.innerHTML = '<i class="fas fa-plus"></i>';
        fab.onclick = showQuickActions;
        
        
        let lastScrollTop = 0;
        window.addEventListener('scroll', () => {
            const currentScroll = window.pageYOffset;
            if (currentScroll > lastScrollTop && currentScroll > 100) {
               
                fab.style.transform = 'translateY(100px)';
            } else {
                fab.style.transform = 'translateY(0)';
            }
            lastScrollTop = currentScroll;
        });
        
        document.body.appendChild(fab);
    }
}

function showQuickActions() {
    createModal('Quick Actions', `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin: 2rem 0;">
            <button onclick="document.getElementById('enhancedEventSearch').focus(); closeModal();" 
                    style="padding: 20px; border: 2px solid #1e3c72; border-radius: 10px; background: none; color: #1e3c72; cursor: pointer; font-weight: 600;">
                <i class="fas fa-search" style="display: block; font-size: 2rem; margin-bottom: 10px;"></i>
                Search Events
            </button>
            <button onclick="toggleViewMode(); closeModal();" 
                    style="padding: 20px; border: 2px solid #1e3c72; border-radius: 10px; background: none; color: #1e3c72; cursor: pointer; font-weight: 600;">
                <i class="fas fa-calendar" style="display: block; font-size: 2rem; margin-bottom: 10px;"></i>
                ${enhancedState.currentView === 'grid' ? 'Calendar View' : 'Grid View'}
            </button>
            <button onclick="showMyFavorites(); closeModal();" 
                    style="padding: 20px; border: 2px solid #e74c3c; border-radius: 10px; background: none; color: #e74c3c; cursor: pointer; font-weight: 600;">
                <i class="fas fa-heart" style="display: block; font-size: 2rem; margin-bottom: 10px;"></i>
                My Favorites
            </button>
            <button onclick="showEventForm(); closeModal();" 
                    style="padding: 20px; border: 2px solid #28a745; border-radius: 10px; background: none; color: #28a745; cursor: pointer; font-weight: 600;">
                <i class="fas fa-plus-circle" style="display: block; font-size: 2rem; margin-bottom: 10px;"></i>
                Create Event
            </button>
        </div>
    `);
}

function showEventForm() {
    if (window.showCreateEventModal) {
        window.showCreateEventModal();
    } else {
        showNotification('Please login to create an event', 'warning');
    }
}

function showMyFavorites() {
    if (enhancedState.userFavorites.length === 0) {
        showNotification('No favorite events yet. Start exploring and add some!', 'info');
        return;
    }
    
    createModal(`My Favorites (${enhancedState.userFavorites.length})`, `
        <div style="display: grid; grid-template-columns: 1fr; gap: 1rem; max-height: 400px; overflow-y: auto;">
            ${enhancedState.userFavorites.map(event => `
                <div style="background: #f8f9fa; border-radius: 10px; padding: 1rem; cursor: pointer; border: 2px solid transparent; transition: all 0.3s ease;" 
                     onmouseover="this.style.borderColor='#1e3c72'" 
                     onmouseout="this.style.borderColor='transparent'"
                     onclick="window.showEventDetails(${event.id}); closeModal();">
                    <div style="display: flex; justify-content: space-between; align-items: start;">
                        <div style="flex: 1;">
                            <h4 style="margin: 0 0 0.5rem 0; color: #1e3c72;">${event.title}</h4>
                            <p style="margin: 0 0 0.5rem 0; color: #666; font-size: 0.9rem;">
                                <i class="fas fa-map-marker-alt"></i> ${event.area}, ${event.county}
                            </p>
                            <p style="margin: 0 0 0.5rem 0; color: #666; font-size: 0.9rem;">
                                <i class="fas fa-calendar"></i> ${formatDate(event.date)}
                            </p>
                            <p style="margin: 0; font-weight: 600; color: #e74c3c;">
                                ${event.price === 0 ? 'FREE' : `KSH ${event.price.toLocaleString()}`}
                            </p>
                        </div>
                        <button onclick="event.stopPropagation(); toggleFavorite(${event.id})" 
                                style="background: none; border: none; color: #e74c3c; font-size: 1.5rem; cursor: pointer;">
                            <i class="fas fa-heart"></i>
                        </button>
                    </div>
                </div>
            `).join('')}
        </div>
        <div style="text-align: center; margin-top: 1rem; padding-top: 1rem; border-top: 1px solid #f0f0f0;">
            <button onclick="clearAllFavorites()" style="background: #dc3545; color: white; border: none; padding: 10px 20px; border-radius: 20px; cursor: pointer;">
                Clear All Favorites
            </button>
        </div>
    `);
}

function clearAllFavorites() {
    if (confirm('Are you sure you want to clear all favorites?')) {
        enhancedState.userFavorites = [];
        saveUserPreferences();
        updateFavoritesUI();
        closeModal();
        showNotification('All favorites cleared', 'info');
    }
}



function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            const searchInput = document.getElementById('enhancedEventSearch');
            if (searchInput) {
                searchInput.focus();
                searchInput.select();
            }
        }
        
    
        if (e.key === 'Escape') {
            closeModal();
        }
        
        
        if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
            e.preventDefault();
            showMyFavorites();
        }
        
        
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'C') {
            e.preventDefault();
            toggleViewMode();
        }
    });
}


const originalFilterEvents = window.filterEvents;
window.filterEvents = async function() {
    
    if (originalFilterEvents) {
        await originalFilterEvents();
    } else {
        
        const filters = {
            county: document.getElementById('county')?.value || '',
            area: document.getElementById('area')?.value || '',
            category: document.getElementById('category')?.value || '',
            priceRange: document.getElementById('priceRange')?.value || ''
        };
        await loadEvents(filters);
    }
    

    applyAdditionalFilters();
    
    
    if (enhancedState.currentView === 'calendar') {
        renderCalendar();
    } else {
        displayEvents(filteredEvents);
    }
};


const originalDisplayEvents = window.displayEvents;
window.displayEvents = function(events) {
    
    if (originalDisplayEvents) {
        originalDisplayEvents(events);
    }
    
    
    setTimeout(() => {
        addFavoriteButtons();
        addEventEnhancements();
    }, 100);
};

function addEventEnhancements() {
    
    document.querySelectorAll('.event-card').forEach(card => {
        if (card.dataset.enhanced) return; 
        card.dataset.enhanced = 'true';
        
        // Add smooth hover animations
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-10px) scale(1.02)';
            this.style.transition = 'all 0.3s ease';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
        });
    });
}

// ==================== DATA SYNCHRONIZATION ====================

// Sync with localStorage periodically
setInterval(() => {
    if (enhancedState.userPhone) {
        saveUserPreferences();
    }
}, 30000); // Every 30 seconds

// Listen for storage changes from other tabs
window.addEventListener('storage', (e) => {
    if (e.key === 'connectKenya_enhancedPreferences') {
        loadUserPreferences();
        updateFavoritesUI();
    }
});

// ==================== ANALYTICS & TRACKING ====================

function trackUserAction(action, details = {}) {
    // Simple analytics tracking - you can extend this to send to analytics service
    const event = {
        action,
        details,
        timestamp: new Date().toISOString(),
        userPhone: enhancedState.userPhone || 'anonymous',
        view: enhancedState.currentView
    };
    
    console.log('User Action:', event);
    
    // Store in session for debugging
    if (!window.userActions) window.userActions = [];
    window.userActions.push(event);
    
    // Keep only last 50 actions
    if (window.userActions.length > 50) {
        window.userActions = window.userActions.slice(-50);
    }
}

// Track common actions
const originalToggleFavorite = toggleFavorite;
toggleFavorite = function(eventId) {
    trackUserAction('favorite_toggle', { eventId });
    return originalToggleFavorite(eventId);
};

const originalPerformEnhancedSearch = performEnhancedSearch;
performEnhancedSearch = function() {
    const query = document.getElementById('enhancedEventSearch')?.value;
    trackUserAction('search', { query });
    return originalPerformEnhancedSearch();
};

// ==================== INITIALIZATION CHECK ====================

// Ensure we don't conflict with existing functionality
window.addEventListener('load', () => {
    // Wait a bit for the main app to fully load
    setTimeout(() => {
        // Check if main functions exist and enhance them
        if (typeof window.showEventDetails === 'function' && !window.showEventDetails.enhanced) {
            window.showEventDetails.enhanced = true;
        }
        
        if (typeof window.joinEvent === 'function' && !window.joinEvent.enhanced) {
            window.joinEvent.enhanced = true;
        }
        
        // Initialize features that depend on DOM being ready
        if (document.getElementById('eventsContainer')) {
            addFavoriteButtons();
        }
        
        console.log('Enhanced Features fully integrated!');
    }, 1000);
});


window.EnhancedFeatures = {
    state: enhancedState,
    toggleFavorite,
    showMyFavorites,
    performSearch: performEnhancedSearch,
    toggleView: toggleViewMode,
    trackAction: trackUserAction,
    clearFavorites: clearAllFavorites,
    version: '1.0.0'
};

console.log('🚀 Enhanced Features Module Loaded - v1.0.0');
console.log('Available commands: window.EnhancedFeatures');
console.log('Keyboard shortcuts: Ctrl+K (search), Ctrl+F (favorites), Ctrl+Shift+C (calendar), Esc (close modal)');

if (typeof module !== 'undefined' && module.exports) {
    module.exports = window.EnhancedFeatures;
}