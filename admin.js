// Admin page JavaScript

let adminPassword = '';

document.addEventListener('DOMContentLoaded', () => {
  setupLogin();
});

function setupLogin() {
  const loginForm = document.getElementById('login-form');
  const loginError = document.getElementById('login-error');

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    adminPassword = document.getElementById('password').value;
    loginError.style.display = 'none';

    try {
      const response = await fetch('/api/availability');
      const data = await response.json();

      // Test the password by trying to toggle (we'll add proper auth check)
      const testResponse = await fetch('/api/availability', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': adminPassword
        },
        body: JSON.stringify({ available: data.available }) // Keep same state, just test auth
      });

      if (testResponse.ok) {
        showAdminControls();
      } else {
        loginError.style.display = 'block';
      }
    } catch (error) {
      loginError.textContent = 'Connection error. Please try again.';
      loginError.style.display = 'block';
      console.error('Login error:', error);
    }
  });
}

async function showAdminControls() {
  document.getElementById('login-section').style.display = 'none';
  document.getElementById('admin-controls').style.display = 'block';
  document.getElementById('subscribers-section').style.display = 'block';

  await updateStatus();
  await loadSubscribers();
  setupToggle();
}

async function loadSubscribers() {
  const subscribersList = document.getElementById('subscribers-list');
  const subscriberCount = document.getElementById('subscriber-count');

  try {
    const response = await fetch('/api/subscribe', {
      headers: {
        'Authorization': adminPassword
      }
    });

    if (response.ok) {
      const data = await response.json();
      const subscribers = data.subscribers || [];

      if (subscribers.length === 0) {
        subscribersList.innerHTML = '<p style="color: #888; font-style: italic;">No subscribers yet</p>';
        subscriberCount.textContent = '';
      } else {
        subscribersList.innerHTML = subscribers
          .map(email => `<div class="subscriber-item">${email}</div>`)
          .join('');
        subscriberCount.textContent = `Total: ${subscribers.length} subscriber${subscribers.length !== 1 ? 's' : ''}`;
      }
    } else {
      subscribersList.innerHTML = '<p style="color: #ff6b6b;">Failed to load subscribers</p>';
    }
  } catch (error) {
    console.error('Error loading subscribers:', error);
    subscribersList.innerHTML = '<p style="color: #ff6b6b;">Error loading subscribers</p>';
  }
}

async function updateStatus() {
  const statusDot = document.getElementById('status-dot');
  const statusText = document.getElementById('status-text');
  const toggleBtn = document.getElementById('toggle-btn');

  try {
    const response = await fetch('/api/availability');
    const data = await response.json();

    if (data.available) {
      statusDot.className = 'status-dot available';
      statusText.textContent = 'Currently Available';
      toggleBtn.textContent = 'Mark as Sold Out';
      toggleBtn.className = 'toggle-btn make-unavailable';
    } else {
      statusDot.className = 'status-dot unavailable';
      statusText.textContent = 'Currently Unavailable';
      toggleBtn.textContent = 'Mark as Available';
      toggleBtn.className = 'toggle-btn make-available';
    }
  } catch (error) {
    statusText.textContent = 'Error loading status';
    console.error('Error fetching status:', error);
  }
}

function setupToggle() {
  const toggleBtn = document.getElementById('toggle-btn');

  toggleBtn.addEventListener('click', async () => {
    toggleBtn.disabled = true;
    toggleBtn.textContent = 'Updating...';

    try {
      // Get current status
      const statusResponse = await fetch('/api/availability');
      const statusData = await statusResponse.json();

      // Toggle it
      const response = await fetch('/api/availability', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': adminPassword
        },
        body: JSON.stringify({ available: !statusData.available })
      });

      if (response.ok) {
        await updateStatus();
      } else {
        alert('Failed to update. Please try again.');
      }
    } catch (error) {
      alert('Connection error. Please try again.');
      console.error('Toggle error:', error);
    }

    toggleBtn.disabled = false;
  });
}
