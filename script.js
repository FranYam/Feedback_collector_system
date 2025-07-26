// Wait for the DOM to be fully loaded before executing the script
document.addEventListener('DOMContentLoaded', function() {
    // ==================== THEME TOGGLE ====================
    // Get theme toggle button and check user's preferred color scheme
    const themeToggle = document.getElementById('themeToggle');
    const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');

    // Check for saved theme preference or use system preference
    if (localStorage.getItem('theme') === 'dark' || (!localStorage.getItem('theme') && prefersDarkScheme.matches)) {
        document.body.classList.add('dark-mode');
        themeToggle.innerHTML = '<i class="fas fa-sun"></i>'; // Sun icon for dark mode
    }

    // Toggle theme on button click
    themeToggle.addEventListener('click', function() {
        document.body.classList.toggle('dark-mode');
        
        // Update localStorage and toggle icon based on current mode
        if (document.body.classList.contains('dark-mode')) {
            localStorage.setItem('theme', 'dark');
            themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
        } else {
            localStorage.setItem('theme', 'light');
            themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
        }
    });

    // Update theme if system preference changes (only if no manual preference set)
    prefersDarkScheme.addEventListener('change', e => {
        if (!localStorage.getItem('theme')) {
            if (e.matches) {
                document.body.classList.add('dark-mode');
                themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
            } else {
                document.body.classList.remove('dark-mode');
                themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
            }
        }
    });

    // ==================== WELCOME MESSAGE ====================
    const welcomeMessage = document.getElementById('welcomeMessage');
    const closeWelcome = document.getElementById('closeWelcome');
    
    // Show welcome message only once (using localStorage)
    if (!localStorage.getItem('welcomeShown')) {
        welcomeMessage.style.display = 'flex';
        localStorage.setItem('welcomeShown', 'true');
    }
    
    // Close welcome message with animation
    closeWelcome.addEventListener('click', function() {
        welcomeMessage.classList.add('hidden');
        setTimeout(() => welcomeMessage.style.display = 'none', 500); // Wait for fade-out
    });

    // ==================== DOM ELEMENTS ====================
    const feedbackForm = document.getElementById('feedbackForm');
    const feedbackList = document.getElementById('feedbackList');
    const ratingFilter = document.getElementById('ratingFilter');
    const tagFilter = document.getElementById('tagFilter');
    const resetFilters = document.getElementById('resetFilters');
    const commenterModal = document.getElementById('commenterNameModal');
    const commenterNameInput = document.getElementById('commenterNameInput');
    const saveCommenterNameBtn = document.getElementById('saveCommenterName');
    
    // ==================== DATA MANAGEMENT ====================
    // Load feedback data from localStorage or initialize empty array
    let feedbackData = JSON.parse(localStorage.getItem('feedbackData')) || [];
    
    // Initialize UI with existing data
    displayFeedback(feedbackData);
    updateTagFilterOptions(feedbackData);
    
    // ==================== EVENT LISTENERS ====================
    feedbackForm.addEventListener('submit', handleFormSubmit);
    ratingFilter.addEventListener('change', filterFeedback);
    tagFilter.addEventListener('change', filterFeedback);
    resetFilters.addEventListener('click', resetAllFilters);
    
    // ==================== CORE FUNCTIONS ====================

    /**
     * Handles form submission for new feedback
     * @param {Event} e - The submit event
     */
    function handleFormSubmit(e) {
        e.preventDefault();
        
        // Create new feedback object
        const newFeedback = {
            id: Date.now(), // Unique ID using timestamp
            name: document.getElementById('name').value,
            email: document.getElementById('email').value,
            rating: parseInt(document.getElementById('rating').value),
            feedback: document.getElementById('feedback').value,
            tags: document.getElementById('tags').value
                .split(',')
                .map(tag => tag.trim())
                .filter(tag => tag), // Convert comma-separated tags to array
            date: new Date().toISOString(),
            comments: []
        };
        
        // Add to beginning of array (newest first)
        feedbackData.unshift(newFeedback);
        saveFeedbackData();
        displayFeedback(feedbackData);
        updateTagFilterOptions(feedbackData);
        
        // Form reset with success animation
        feedbackForm.reset();
        const submitBtn = feedbackForm.querySelector('button[type="submit"]');
        submitBtn.innerHTML = '<i class="fas fa-check"></i> Sent!';
        submitBtn.classList.add('success');
        setTimeout(() => {
            submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Submit';
            submitBtn.classList.remove('success');
        }, 2000);
        
        // Scroll to feedback list on mobile
        if (window.innerWidth < 992) {
            document.querySelector('.feedback-display').scrollIntoView({ 
                behavior: 'smooth' 
            });
        }
    }
    
    /**
     * Displays all feedback items in the UI
     * @param {Array} feedbackArray - Array of feedback objects to display
     */
    function displayFeedback(feedbackArray) {
        // Show empty state if no feedback
        feedbackList.innerHTML = feedbackArray.length ? '' : `
            <div class="empty-state">
                <i class="fas fa-comment-slash"></i>
                <h3>No feedback yet</h3>
                <p>Be the first to share your experience</p>
            </div>
        `;
        
        // Create HTML for each feedback item
        feedbackArray.forEach(feedback => {
            const feedbackItem = document.createElement('div');
            feedbackItem.className = 'feedback-card';
            feedbackItem.setAttribute('data-rating', feedback.rating);
            feedbackItem.setAttribute('data-id', feedback.id);
            
            // Format date for display
            const formattedDate = new Date(feedback.date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
            
            // Create star rating display
            const stars = '★'.repeat(feedback.rating) + '☆'.repeat(5 - feedback.rating);
            
            // Build feedback card HTML
            feedbackItem.innerHTML = `
                <div class="feedback-header">
                    <div class="user-info">
                        <div class="user-avatar">${feedback.name.charAt(0).toUpperCase()}</div>
                        <div>
                            <div class="user-name">${feedback.name}</div>
                            <div class="feedback-date">Posted on ${formattedDate}</div>
                        </div>
                    </div>
                    <button class="delete-btn" data-id="${feedback.id}">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
                
                <div class="feedback-rating">
                    <div class="stars">${stars}</div>
                    <span>${feedback.rating}/5</span>
                </div>
                
                <div class="feedback-content">
                    ${feedback.feedback}
                </div>
                
                ${feedback.tags?.length ? `
                    <div class="tag-list">
                        ${feedback.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                    </div>
                ` : ''}
                
                ${feedback.comments?.length ? `
                <div class="comments-section">
                    <h4><i class="fas fa-comments"></i> ${feedback.comments.length} comment${feedback.comments.length > 1 ? 's' : ''}</h4>
                    <div class="comment-list">
                        ${feedback.comments.map((comment, index) => `
                            <div class="comment-card" data-comment-id="${index}">
                                <div class="comment-avatar">${comment.name.charAt(0).toUpperCase()}</div>
                                <div class="comment-content">
                                    <div class="comment-header">
                                        <span class="comment-author">${comment.name}</span>
                                        <span class="comment-date">${formatCommentDate(comment.date)}</span>
                                    </div>
                                    <div class="comment-text">${comment.text}</div>
                                    <div class="comment-actions">
                                        <span class="comment-action like-btn ${comment.liked ? 'liked' : ''}" 
                                              data-feedback-id="${feedback.id}" 
                                              data-comment-id="${index}">
                                            <i class="fas fa-thumbs-up"></i> ${comment.likes || 0} Like${comment.likes !== 1 ? 's' : ''}
                                        </span>
                                        <span class="comment-action reply-btn">
                                            <i class="fas fa-reply"></i> Reply
                                        </span>
                                    </div>
                                </div>
                                ${comment.replies?.length ? `
                                <div class="replies-list" style="margin-left:0; margin-top: 0.5rem;padding-left: 1rem;">
                                    ${comment.replies.map(reply => `
                                        <div class="comment-card" style="margin-top: 0.5rem;">
                                            <div class="comment-avatar">${reply.name.charAt(0).toUpperCase()}</div>
                                            <div class="comment-content">
                                                <div class="comment-header">
                                                    <span class="comment-author">${reply.name}</span>
                                                    <span class="comment-date">${formatCommentDate(reply.date)}</span>
                                                </div>
                                                <div class="comment-text">${reply.text}</div>
                                            </div>
                                        </div>
                                    `).join('')}
                                </div>
                                ` : ''}
                            </div>
                        `).join('')}
                    </div>
                </div>
                ` : ''}
                
                <div class="add-comment">
                    <input type="text" class="comment-input" placeholder="Write a comment...">
                    <button class="comment-submit btn btn-primary" style="padding: 0.5rem 1rem;">
                        <i class="fas fa-paper-plane"></i> Post
                    </button>
                </div>
            `;
            
            feedbackList.appendChild(feedbackItem);
        });

        // Add event listeners to dynamically created elements
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const feedbackId = parseInt(this.dataset.id);
                deleteFeedback(feedbackId);
            });
        });
        
        // Handle comment submission (both Enter key and button click)
        document.querySelectorAll('.comment-input').forEach(input => {
            input.addEventListener('keypress', function(e) {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    submitComment(this);
                }
            });
            
            const postBtn = input.nextElementSibling;
            postBtn.addEventListener('click', function() {
                submitComment(input);
            });
        });
        
        // Handle comment likes
        document.querySelectorAll('.like-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const feedbackId = parseInt(this.dataset.feedbackId);
                const commentId = parseInt(this.dataset.commentId);
                likeComment(feedbackId, commentId);
            });
        });
        
        // Handle reply functionality
        document.querySelectorAll('.reply-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const comment = this.closest('.comment-card');
                const feedbackId = parseInt(comment.closest('.feedback-card').dataset.id);
                const commentId = parseInt(comment.dataset.commentId);
                
                // Remove existing reply form if any
                const existingForm = comment.querySelector('.reply-form');
                if (existingForm) existingForm.remove();
                
                // Create and append new reply form
                const replyForm = document.createElement('div');
                replyForm.className = 'reply-form';
                replyForm.innerHTML = `
                    <div class="add-comment" style="margin-top: 0.5rem;margin-left:2.5rem;">
                        <input type="text" class="reply-input" placeholder="Write a reply...">
                        <button class="comment-submit btn btn-primary" style="padding: 0.5rem 1rem;">
                            <i class="fas fa-paper-plane"></i> Post
                        </button>
                    </div>
                `;
                
                comment.querySelector('.comment-actions').after(replyForm);
                replyForm.querySelector('input').focus();
                
                // Handle reply submission
                replyForm.querySelector('button').addEventListener('click', function() {
                    const text = replyForm.querySelector('input').value.trim();
                    if (text) {
                        const commenterName = localStorage.getItem('commenterName');
                        if (commenterName) {
                            addReply(feedbackId, commentId, text);
                            replyForm.querySelector('input').value = '';
                        } else {
                            showCommenterNameModal((name) => {
                                addReply(feedbackId, commentId, text);
                                replyForm.querySelector('input').value = '';
                            });
                        }
                    }
                });
            });
        });
    }
    
    /**
     * Shows modal to collect commenter's name
     * @param {Function} callback - Function to call with the entered name
     */
    function showCommenterNameModal(callback) {
        commenterModal.style.display = 'flex';
        commenterNameInput.focus();
        
        const handleSubmit = () => {
            const name = commenterNameInput.value.trim();
            if (name) {
                localStorage.setItem('commenterName', name);
                commenterModal.style.display = 'none';
                commenterNameInput.value = '';
                callback(name);
            }
        };
        
        saveCommenterNameBtn.onclick = handleSubmit;
        commenterNameInput.onkeydown = (e) => {
            if (e.key === 'Enter') handleSubmit();
        };
    }
    
    /**
     * Submits a new comment to a feedback item
     * @param {HTMLInputElement} input - The comment input element
     */
    function submitComment(input) {
        const text = input.value.trim();
        if (!text) return;
        
        const storedName = localStorage.getItem('commenterName');
        if (storedName) {
            actuallySubmitComment(input, text, storedName);
        } else {
            showCommenterNameModal((name) => {
                actuallySubmitComment(input, text, name);
            });
        }
    }
    
    /**
     * Helper function to submit comment after name is confirmed
     */
    function actuallySubmitComment(input, text, name) {
        const feedbackId = parseInt(input.closest('.feedback-card').dataset.id);
        const feedback = feedbackData.find(f => f.id === feedbackId);
        
        if (feedback) {
            feedback.comments = feedback.comments || [];
            feedback.comments.push({
                id: Date.now(),
                name: name,
                text: text,
                date: new Date().toISOString(),
                likes: 0,
                liked: false,
                replies: []
            });
            
            saveFeedbackData();
            displayFeedback(feedbackData);
            input.value = '';
        }
    }
    
    /**
     * Adds a reply to a comment
     * @param {number} feedbackId - ID of the parent feedback
     * @param {number} commentId - Index of the comment being replied to
     * @param {string} text - The reply text
     */
    function addReply(feedbackId, commentId, text) {
        const feedback = feedbackData.find(f => f.id === feedbackId);
        if (!feedback || !feedback.comments[commentId]) return;
        
        feedback.comments[commentId].replies = feedback.comments[commentId].replies || [];
        feedback.comments[commentId].replies.push({
            id: Date.now(),
            name: localStorage.getItem('commenterName') || 'User',
            text: text,
            date: new Date().toISOString(),
            likes: 0,
            liked: false
        });
        
        saveFeedbackData();
        displayFeedback(feedbackData);
    }
    
    /**
     * Toggles like status on a comment
     * @param {number} feedbackId - ID of the parent feedback
     * @param {number} commentId - Index of the comment in the array
     */
    function likeComment(feedbackId, commentId) {
        const feedback = feedbackData.find(f => f.id === feedbackId);
        if (!feedback || !feedback.comments[commentId]) return;
        
        const comment = feedback.comments[commentId];
        comment.liked = !comment.liked;
        comment.likes = comment.liked ? (comment.likes || 0) + 1 : Math.max(0, (comment.likes || 0) - 1);
        
        saveFeedbackData();
        displayFeedback(feedbackData);
    }
    
    /**
     * Deletes a feedback item after confirmation
     * @param {number} feedbackId - ID of the feedback to delete
     */
    function deleteFeedback(feedbackId) {
        if (confirm('Delete this feedback?')) {
            feedbackData = feedbackData.filter(f => f.id !== feedbackId);
            saveFeedbackData();
            displayFeedback(feedbackData);
            updateTagFilterOptions(feedbackData);
        }
    }
    
    /**
     * Filters feedback based on selected rating and tag
     */
    function filterFeedback() {
        const selectedRating = ratingFilter.value;
        const selectedTag = tagFilter.value;
        
        let filtered = feedbackData.filter(feedback => {
            const ratingMatch = selectedRating === 'all' || feedback.rating === parseInt(selectedRating);
            const tagMatch = selectedTag === 'all' || (feedback.tags && feedback.tags.includes(selectedTag));
            return ratingMatch && tagMatch;
        });
        
        displayFeedback(filtered);
    }
    
    /**
     * Resets all filters to show all feedback
     */
    function resetAllFilters() {
        ratingFilter.value = 'all';
        tagFilter.value = 'all';
        displayFeedback(feedbackData);
    }
    
    /**
     * Updates the tag filter dropdown with all unique tags from feedback
     * @param {Array} feedbackArray - Array of feedback items to scan for tags
     */
    function updateTagFilterOptions(feedbackArray) {
        const allTags = new Set();
        feedbackArray.forEach(feedback => {
            if (feedback.tags) feedback.tags.forEach(tag => allTags.add(tag));
        });
        
        tagFilter.innerHTML = '<option value="all">All</option>';
        allTags.forEach(tag => {
            const option = document.createElement('option');
            option.value = tag;
            option.textContent = tag;
            tagFilter.appendChild(option);
        });
    }
    
    /**
     * Formats a date string into a relative time string (e.g., "2 days ago")
     * @param {string} dateString - ISO date string
     * @returns {string} Formatted relative time
     */
    function formatCommentDate(dateString) {
        const now = new Date();
        const date = new Date(dateString);
        const diffInSeconds = Math.floor((now - date) / 1000);
        
        if (diffInSeconds < 60) return 'Just now';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} min ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hr ago`;
        if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
        
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
    
    /**
     * Saves the current feedback data to localStorage
     */
    function saveFeedbackData() {
        localStorage.setItem('feedbackData', JSON.stringify(feedbackData));
    }
});
