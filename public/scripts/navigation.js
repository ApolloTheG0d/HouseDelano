/**
 * Dynamic Navigation Manager
 * Handles login/logout state across all pages
 */
(function() {
  // Check if user is logged in
  function isLoggedIn() {
    return sessionStorage.getItem('userLoggedIn') === 'true';
  }
  
  // Get user info
  function getUserInfo() {
    return {
      id: sessionStorage.getItem('userId'),
      email: sessionStorage.getItem('userEmail'),
      name: sessionStorage.getItem('userName') || 'User',
      role: sessionStorage.getItem('userRole')
    };
  }
  
  // Update header navigation
  function updateNavigation() {
    const authLink = document.getElementById('auth-link-text');
    if (!authLink) return; // Header not present on this page
    
    if (isLoggedIn()) {
      const user = getUserInfo();
      authLink.href = '/account.html';
      authLink.innerHTML = `<i class="fa-solid fa-user-circle"></i> ${user.name}`;
      
      // Add logout button
      const authLi = document.getElementById('auth-link');
      if (!document.getElementById('logout-link')) {
        const logoutLi = document.createElement('li');
        logoutLi.id = 'logout-link';
        logoutLi.innerHTML = '<a href="#" id="logout-btn"><i class="fa-solid fa-sign-out-alt"></i> Log Out</a>';
        authLi.parentNode.insertBefore(logoutLi, authLi.nextSibling);
        
        document.getElementById('logout-btn').addEventListener('click', logout);
      }
    } else {
      authLink.href = '/signIn.html';
      authLink.textContent = 'Sign In';
      
      const logoutLink = document.getElementById('logout-link');
      if (logoutLink) logoutLink.remove();
    }
  }
  
  // Logout function
  function logout(e) {
    if (e) e.preventDefault();
    
    // Clear session
    sessionStorage.clear();
    
    // Call server logout
    fetch('/auth/logout', { method: 'GET' })
      .finally(() => {
        window.dispatchEvent(new Event('user-logout'));
        window.location.href = '/index.html';
      });
  }
  
  // Listen for login/logout events
  window.addEventListener('user-login', updateNavigation);
  window.addEventListener('user-logout', updateNavigation);
  
  // Initialize on page load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', updateNavigation);
  } else {
    updateNavigation();
  }
  
  // Expose functions globally
  window.authManager = {
    isLoggedIn,
    getUserInfo,
    logout,
    updateNavigation
  };
})();