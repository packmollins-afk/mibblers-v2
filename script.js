// Main site JavaScript

document.addEventListener('DOMContentLoaded', () => {
  checkAvailability();
  setupOrderForm();
  setupSubscribeForm();
});

async function checkAvailability() {
  const loading = document.getElementById('loading');
  const available = document.getElementById('available');
  const unavailable = document.getElementById('unavailable');
  const orderForm = document.getElementById('order-form');

  try {
    const response = await fetch('/api/availability');
    const data = await response.json();

    loading.style.display = 'none';

    if (data.available) {
      available.style.display = 'block';
      orderForm.style.display = 'block';
    } else {
      unavailable.style.display = 'block';
    }
  } catch (error) {
    loading.textContent = 'Unable to check availability. Please refresh.';
    console.error('Error checking availability:', error);
  }
}

function setupOrderForm() {
  const form = document.getElementById('order-form');
  const submitBtn = document.getElementById('submit-btn');
  const successMessage = document.getElementById('success-message');
  const errorMessage = document.getElementById('error-message');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting...';
    errorMessage.style.display = 'none';

    const orderData = {
      name: document.getElementById('name').value,
      phone: document.getElementById('phone').value,
      email: document.getElementById('email').value,
      quantity: document.getElementById('quantity').value,
      address: document.getElementById('address').value,
      notes: document.getElementById('notes').value
    };

    try {
      const response = await fetch('/api/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });

      if (response.ok) {
        form.style.display = 'none';
        document.getElementById('available').style.display = 'none';
        successMessage.style.display = 'block';
      } else {
        throw new Error('Order failed');
      }
    } catch (error) {
      errorMessage.style.display = 'block';
      submitBtn.disabled = false;
      submitBtn.textContent = 'Submit Order';
      console.error('Error submitting order:', error);
    }
  });
}

function setupSubscribeForm() {
  const form = document.getElementById('subscribe-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const emailInput = document.getElementById('subscribe-email');
    const successMsg = document.getElementById('subscribe-success');
    const btn = form.querySelector('.subscribe-btn');

    btn.disabled = true;
    btn.textContent = '...';

    try {
      const response = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailInput.value })
      });

      if (response.ok) {
        form.style.display = 'none';
        successMsg.style.display = 'block';
      } else {
        throw new Error('Subscribe failed');
      }
    } catch (error) {
      btn.disabled = false;
      btn.textContent = 'Notify Me';
      console.error('Error subscribing:', error);
    }
  });
}
