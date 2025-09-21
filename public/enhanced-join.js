let joinSystemState = {
    userDetails: {
        name: '',
        phone: '',
        email: ''
    },
    isInitialized: false
};


document.addEventListener('DOMContentLoaded', function() {
    if (window.joinSystemLoaded) return;
    window.joinSystemLoaded = true;
    
    console.log('Loading Enhanced Join System...');
    
    
    loadSavedUserDetails();
    
    
    enhanceJoinEventFunction();
    
   
    addJoinModalStyles();
    
    joinSystemState.isInitialized = true;
    console.log('Enhanced Join System Loaded Successfully!');
});


function loadSavedUserDetails() {
    const saved = localStorage.getItem('connectKenya_userDetails');
    if (saved) {
        try {
            const details = JSON.parse(saved);
            joinSystemState.userDetails = {
                name: details.name || '',
                phone: details.phone || '',
                email: details.email || ''
            };
        } catch (err) {
            console.error('Error loading saved user details:', err);
        }
    }
}


function saveUserDetails(name, phone, email) {
    joinSystemState.userDetails = { name, phone, email };
    localStorage.setItem('connectKenya_userDetails', JSON.stringify(joinSystemState.userDetails));
}


function addJoinModalStyles() {
    if (document.getElementById('joinSystemStyles')) return; 
    
    const styles = document.createElement('style');
    styles.id = 'joinSystemStyles';
    styles.textContent = `
        .join-modal {
            display: none;
            position: fixed;
            z-index: 2500;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0,0,0,0.6);
            animation: fadeIn 0.3s ease;
        }
        
        .join-modal-content {
            background-color: white;
            margin: 5% auto;
            padding: 0;
            border-radius: 15px;
            width: 90%;
            max-width: 500px;
            box-shadow: 0 15px 40px rgba(0,0,0,0.3);
            animation: slideUp 0.3s ease;
            max-height: 90vh; 
            overflow-y: auto;
            
        }
        
        .join-modal-header {
            background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
            color: white;
            padding: 1.5rem;
            position: relative;
        }
        
        .join-modal-header h2 {
            margin: 0;
            font-size: 1.4rem;
            font-weight: 600;
        }
        
        .join-modal-close {
            position: absolute;
            top: 15px;
            right: 20px;
            color: white;
            font-size: 28px;
            font-weight: bold;
            cursor: pointer;
            transition: opacity 0.3s ease;
        }
        
        .join-modal-close:hover {
            opacity: 0.7;
        }
        
        .join-modal-body {
            padding: 2rem;
        }
        
        .join-form-group {
            margin-bottom: 1.5rem;
        }
        
        .join-form-group label {
            display: block;
            margin-bottom: 0.5rem;
            font-weight: 600;
            color: #333;
        }
        
        .join-form-group input {
            width: 100%;
            padding: 12px 16px;
            border: 2px solid #e0e0e0;
            border-radius: 10px;
            font-size: 1rem;
            transition: all 0.3s ease;
            box-sizing: border-box;
        }
        
        .join-form-group input:focus {
            outline: none;
            border-color: #1e3c72;
            box-shadow: 0 0 0 3px rgba(30, 60, 114, 0.1);
        }
        
        .join-form-group input.error {
            border-color: #dc3545;
            box-shadow: 0 0 0 3px rgba(220, 53, 69, 0.1);
        }
        
        .join-event-details {
            background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
            padding: 1.5rem;
            border-radius: 10px;
            margin: 1rem 0;
            border-left: 4px solid #1e3c72;
        }
        
        .join-event-details h4 {
            margin: 0 0 1rem 0;
            color: #1e3c72;
            font-size: 1.1rem;
        }
        
        .join-event-info {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 8px;
            color: #555;
            font-size: 0.95rem;
        }
        
        .join-event-info i {
            color: #1e3c72;
            width: 16px;
        }
        
        .join-buttons {
            display: flex;
            gap: 12px;
            margin-top: 2rem;
        }
        
        .join-btn-primary {
            flex: 1;
            background: linear-gradient(45deg, #28a745, #20c997);
            color: white;
            border: none;
            padding: 15px 20px;
            border-radius: 10px;
            font-size: 1.1rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
        }
        
        .join-btn-primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(40, 167, 69, 0.3);
        }
        
        .join-btn-primary:disabled {
            background: #6c757d;
            cursor: not-allowed;
            transform: none;
            box-shadow: none;
        }
        
        .join-btn-secondary {
            flex: 0 0 auto;
            background: #6c757d;
            color: white;
            border: none;
            padding: 15px 20px;
            border-radius: 10px;
            font-size: 1rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        
        .join-btn-secondary:hover {
            background: #5a6268;
        }
        
        .join-waitlist-info {
            background: #fff3cd;
            border: 2px solid #ffc107;
            border-radius: 10px;
            padding: 1rem;
            margin: 1rem 0;
        }
        
        .join-waitlist-info h4 {
            color: #856404;
            margin: 0 0 0.5rem 0;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .join-waitlist-info p {
            color: #856404;
            margin: 0;
            font-size: 0.95rem;
        }
        
        .join-error-message {
            background: #f8d7da;
            color: #721c24;
            padding: 10px 15px;
            border-radius: 8px;
            margin-bottom: 1rem;
            font-size: 0.9rem;
            display: none;
        }
        
        .join-success-message {
            background: #d4edda;
            color: #155724;
            padding: 10px 15px;
            border-radius: 8px;
            margin-bottom: 1rem;
            font-size: 0.9rem;
            display: none;
        }
        
        .join-loading {
            display: none;
            text-align: center;
            padding: 1rem;
        }
        
        .join-spinner {
            display: inline-block;
            width: 24px;
            height: 24px;
            border: 3px solid rgba(30,60,114,.3);
            border-radius: 50%;
            border-top-color: #1e3c72;
            animation: spin 1s ease-in-out infinite;
        }
        
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        
        @keyframes slideUp {
            from {
                opacity: 0;
                transform: translateY(50px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
        
        @media (max-width: 768px) {
            .join-modal-content {
                margin: 10% auto;
                width: 95%;
            }
            
            .join-modal-body {
                padding: 1.5rem;
            }
            
            .join-buttons {
                flex-direction: column;
            }
        }
    `;
    
    document.head.appendChild(styles);
}


function enhanceJoinEventFunction() {
    
    const originalJoinEvent = window.joinEvent;
    
    
    window.joinEvent = async function(eventId, clickEvent) {
        if (clickEvent) {
            clickEvent.preventDefault();
            clickEvent.stopPropagation();
        }
        
        console.log('Enhanced join event triggered for:', eventId);
        
       
        const event = allEvents ? allEvents.find(e => e.id === eventId) : null;
        if (!event) {
            showJoinNotification('Event not found. Please refresh the page.', 'error');
            return;
        }
        
        
        const isWaitlist = event.max_attendees && event.attendees >= event.max_attendees;
        
        
        showEnhancedJoinModal(event, isWaitlist);
    };
    
    console.log('joinEvent function enhanced successfully');
}


function showEnhancedJoinModal(event, isWaitlist = false) {
   
    const existingModal = document.getElementById('enhancedJoinModal');
    if (existingModal) {
        existingModal.remove();
    }
    
   
    const modalHTML = `
        <div id="enhancedJoinModal" class="join-modal">
            <div class="join-modal-content">
                <div class="join-modal-header">
                    <h2>${isWaitlist ? 'Join Waitlist' : 'Join Event'}</h2>
                    <span class="join-modal-close" onclick="closeEnhancedJoinModal()">&times;</span>
                </div>
                <div class="join-modal-body">
                    ${isWaitlist ? `
                        <div class="join-waitlist-info">
                            <h4><i class="fas fa-exclamation-triangle"></i> Event is Full!</h4>
                            <p>This event has reached its maximum capacity of ${event.max_attendees} attendees. 
                            Join the waitlist and we'll notify you if a spot becomes available.</p>
                        </div>
                    ` : ''}
                    
                    <div class="join-error-message" id="joinErrorMessage"></div>
                    <div class="join-success-message" id="joinSuccessMessage"></div>
                    
                    <form id="enhancedJoinForm">
                        <div class="join-form-group">
                            <label for="joinUserName">Full Name *</label>
                            <input type="text" 
                                   id="joinUserName" 
                                   required 
                                   placeholder="Enter your full name"
                                   value="${joinSystemState.userDetails.name}"
                                   maxlength="100">
                        </div>
                        
                        <div class="join-form-group">
                            <label for="joinUserPhone">Phone Number *</label>
                            <input type="tel" 
                                   id="joinUserPhone" 
                                   required 
                                   placeholder="+254 700 000 000"
                                   value="${joinSystemState.userDetails.phone}"
                                   pattern="^\\+254[0-9]{9}$">
                        </div>
                        
                        <div class="join-form-group">
                            <label for="joinUserEmail">Email Address (Optional)</label>
                            <input type="email" 
                                   id="joinUserEmail" 
                                   placeholder="your@email.com"
                                   value="${joinSystemState.userDetails.email}"
                                   maxlength="100">
                        </div>
                        
                        <div class="join-event-details">
                            <h4>Event Details</h4>
                            <div class="join-event-info">
                                <i class="fas fa-calendar"></i>
                                <span>${formatEventDate(event.date)} ${event.time ? 'at ' + event.time : ''}</span>
                            </div>
                            <div class="join-event-info">
                                <i class="fas fa-map-marker-alt"></i>
                                <span>${event.location || event.area + ', ' + event.county}</span>
                            </div>
                            <div class="join-event-info">
                                <i class="fas fa-tag"></i>
                                <span>${event.price === 0 ? 'FREE' : `KSH ${event.price.toLocaleString()}`}</span>
                            </div>
                            <div class="join-event-info">
                                <i class="fas fa-users"></i>
                                <span>${event.attendees} registered${event.max_attendees ? ` of ${event.max_attendees}` : ''}</span>
                            </div>
                            ${event.contact ? `
                                <div class="join-event-info">
                                    <i class="fas fa-phone"></i>
                                    <span>Contact: ${event.contact}</span>
                                </div>
                            ` : ''}
                        </div>
                        
                        <div class="join-loading" id="joinLoading">
                            <div class="join-spinner"></div>
                            <p style="margin-top: 10px; color: #666;">Processing your request...</p>
                        </div>
                        
                        <div class="join-buttons">
                            <button type="submit" class="join-btn-primary" id="joinSubmitBtn">
                                <i class="fas fa-${isWaitlist ? 'list' : 'check'}"></i>
                                ${isWaitlist ? 'Join Waitlist' : 'Confirm Registration'}
                            </button>
                            <button type="button" class="join-btn-secondary" onclick="closeEnhancedJoinModal()">
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;
    
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
   
    const modal = document.getElementById('enhancedJoinModal');
    modal.style.display = 'block';
    
    
    setTimeout(() => {
        document.getElementById('joinUserName').focus();
    }, 100);
    
    
    setupJoinFormHandlers(event, isWaitlist);
    
    
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeEnhancedJoinModal();
        }
    });
}


function setupJoinFormHandlers(event, isWaitlist) {
    const form = document.getElementById('enhancedJoinForm');
    const nameInput = document.getElementById('joinUserName');
    const phoneInput = document.getElementById('joinUserPhone');
    const emailInput = document.getElementById('joinUserEmail');
    
   
    phoneInput.addEventListener('input', function() {
        formatPhoneNumber(this);
    });
    
    nameInput.addEventListener('input', function() {
        clearFieldError(this);
    });
    
    phoneInput.addEventListener('input', function() {
        clearFieldError(this);
    });
    
   
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        await handleJoinFormSubmit(event, isWaitlist);
    });
}


function formatPhoneNumber(input) {
    let value = input.value.replace(/\D/g, '');
    
    
    if (value.length > 0 && !value.startsWith('254')) {
        if (value.startsWith('0')) {
            value = '254' + value.substring(1);
        } else if (value.startsWith('7') || value.startsWith('1')) {
            value = '254' + value;
        }
    }
    
    // Limit to 12 digits (254 + 9 digits)
    if (value.length > 12) {
        value = value.substring(0, 12);
    }
    
    
    if (value.length > 0) {
        input.value = '+' + value;
    }
}


async function handleJoinFormSubmit(event, isWaitlist) {
    const name = document.getElementById('joinUserName').value.trim();
    const phone = document.getElementById('joinUserPhone').value.trim();
    const email = document.getElementById('joinUserEmail').value.trim();
    
    
    clearAllErrors();
    
   
    if (!validateJoinForm(name, phone, email)) {
        return;
    }
    
   
    setJoinLoadingState(true);
    
    try {
       
        const response = await fetch(`/api/events/${event.id}/join`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name: name,
                phone: phone,
                email: email || null
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
           
            saveUserDetails(name, phone, email);
            
            
            if (data.waitlisted) {
                showJoinMessage('Successfully added to waitlist! You\'ll be notified if a spot opens up.', 'success');
            } else {
                showJoinMessage('Successfully registered for the event! The organizer will contact you with details.', 'success');
                
                if (window.allEvents) {
                    const eventToUpdate = window.allEvents.find(e => e.id === event.id);
                    if (eventToUpdate) {
                        eventToUpdate.attendees++;
                    }
                }
            }
            
           
            setTimeout(() => {
                closeEnhancedJoinModal();
               
                if (window.displayEvents && window.filteredEvents) {
                    window.displayEvents(window.filteredEvents);
                }
                
                showJoinNotification(
                    data.waitlisted ? 'Added to waitlist successfully!' : 'Registration successful!', 
                    'success'
                );
            }, 2000);
            
        } else {
            showJoinMessage(data.message || 'Failed to register for event. Please try again.', 'error');
        }
        
    } catch (error) {
        console.error('Join event error:', error);
        showJoinMessage('Network error. Please check your connection and try again.', 'error');
    } finally {
        setJoinLoadingState(false);
    }
}


function validateJoinForm(name, phone, email) {
    let isValid = true;
    
    
    if (!name || name.length < 2) {
        showFieldError('joinUserName', 'Please enter your full name (at least 2 characters)');
        isValid = false;
    }
    
   
    const phoneRegex = /^\+254[0-9]{9}$/;
    if (!phone || !phoneRegex.test(phone)) {
        showFieldError('joinUserPhone', 'Please enter a valid Kenyan phone number (+254XXXXXXXXX)');
        isValid = false;
    }
    
   
    if (email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            showFieldError('joinUserEmail', 'Please enter a valid email address');
            isValid = false;
        }
    }
    
    return isValid;
}


function showFieldError(fieldId, message) {
    const field = document.getElementById(fieldId);
    field.classList.add('error');
    
    
    const existingError = field.parentNode.querySelector('.field-error');
    if (existingError) {
        existingError.remove();
    }
    
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'field-error';
    errorDiv.style.cssText = 'color: #dc3545; font-size: 0.8rem; margin-top: 5px;';
    errorDiv.textContent = message;
    field.parentNode.appendChild(errorDiv);
}


function clearFieldError(field) {
    field.classList.remove('error');
    const errorDiv = field.parentNode.querySelector('.field-error');
    if (errorDiv) {
        errorDiv.remove();
    }
}


function clearAllErrors() {
    document.querySelectorAll('.join-form-group input').forEach(input => {
        clearFieldError(input);
    });
    hideJoinMessage();
}


function showJoinMessage(message, type) {
    const errorMsg = document.getElementById('joinErrorMessage');
    const successMsg = document.getElementById('joinSuccessMessage');
    
    hideJoinMessage();
    
    if (type === 'success') {
        successMsg.textContent = message;
        successMsg.style.display = 'block';
    } else {
        errorMsg.textContent = message;
        errorMsg.style.display = 'block';
    }
}


function hideJoinMessage() {
    const errorMsg = document.getElementById('joinErrorMessage');
    const successMsg = document.getElementById('joinSuccessMessage');
    if (errorMsg) errorMsg.style.display = 'none';
    if (successMsg) successMsg.style.display = 'none';
}


function setJoinLoadingState(loading) {
    const loadingDiv = document.getElementById('joinLoading');
    const submitBtn = document.getElementById('joinSubmitBtn');
    const form = document.getElementById('enhancedJoinForm');
    
    if (loading) {
        loadingDiv.style.display = 'block';
        submitBtn.disabled = true;
        form.style.opacity = '0.6';
    } else {
        loadingDiv.style.display = 'none';
        submitBtn.disabled = false;
        form.style.opacity = '1';
    }
}


function closeEnhancedJoinModal() {
    const modal = document.getElementById('enhancedJoinModal');
    if (modal) {
        modal.style.display = 'none';
        setTimeout(() => {
            modal.remove();
        }, 300);
    }
}


function showJoinNotification(message, type = 'info', duration = 5000) {
    
    const existingNotification = document.getElementById('joinNotification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    const notification = document.createElement('div');
    notification.id = 'joinNotification';
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#007bff'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 10px;
        box-shadow: 0 5px 20px rgba(0,0,0,0.2);
        z-index: 3000;
        transform: translateX(100%);
        transition: transform 0.3s ease;
        max-width: 300px;
        font-weight: 500;
    `;
    
    notification.textContent = message;
    document.body.appendChild(notification);
    
 
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, duration);
}


function formatEventDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
        weekday: 'long',
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
}


window.closeEnhancedJoinModal = closeEnhancedJoinModal;
window.showEnhancedJoinModal = showEnhancedJoinModal;


document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        const modal = document.getElementById('enhancedJoinModal');
        if (modal && modal.style.display === 'block') {
            closeEnhancedJoinModal();
        }
    }
});


window.JoinSystem = {
    state: joinSystemState,
    showModal: showEnhancedJoinModal,
    closeModal: closeEnhancedJoinModal,
    clearData: () => {
        localStorage.removeItem('connectKenya_userDetails');
        joinSystemState.userDetails = { name: '', phone: '', email: '' };
    }
};

console.log('🚀 Enhanced Join System Loaded - Ready for event registrations');
console.log('Debug: window.JoinSystem available for testing');