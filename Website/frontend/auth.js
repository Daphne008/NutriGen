document.addEventListener('DOMContentLoaded', () => {
    const signupForm = document.getElementById('signup-form');
    const loginForm = document.getElementById('login-form');

    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = signupForm.querySelector('button');
            btn.disabled = true;
            btn.innerText = 'Creating Secure Account...';

            const payload = {
                name: document.getElementById('name').value,
                institution: document.getElementById('institution').value,
                email: document.getElementById('email').value,
                password: document.getElementById('password').value
            };
            
            try {
                const response = await fetch('http://127.0.0.1:8000/api/auth/signup', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                
                if (!response.ok) {
                    const err = await response.json();
                    alert("Sign Up Error: " + err.detail);
                } else {
                    const data = await response.json();
                    // Store the JWT Token and User Model client-side
                    localStorage.setItem('nutrigen_token', data.access_token);
                    localStorage.setItem('nutrigen_user', JSON.stringify(data.user));
                    window.location.href = 'app.html';
                }
            } catch (err) {
                alert("Failed to connect to backend server. Make sure your Docker PostgreSQL and Uvicorn FastAPI are active.");
            }
            btn.disabled = false;
            btn.innerText = 'Create Account & Enter Simulation';
        });
    }

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = loginForm.querySelector('button');
            btn.disabled = true;
            btn.innerText = 'Authenticating...';

            const payload = {
                email: document.getElementById('email').value,
                password: document.getElementById('password').value
            };
            
            try {
                const response = await fetch('http://127.0.0.1:8000/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                
                if (!response.ok) {
                    const err = await response.json();
                    alert("Authentication Error: " + err.detail);
                } else {
                    const data = await response.json();
                    localStorage.setItem('nutrigen_token', data.access_token);
                    localStorage.setItem('nutrigen_user', JSON.stringify(data.user));
                    window.location.href = 'app.html';
                }
            } catch (err) {
                alert("Failed to connect to backend server. Make sure your Docker PostgreSQL and Uvicorn FastAPI are active.");
            }
            btn.disabled = false;
            btn.innerText = 'Log In';
        });
    }
});
