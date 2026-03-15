document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const errBox = document.getElementById('error-message');

    // Firebase Auth State Observer
    firebase.auth().onAuthStateChanged((user) => {
        if (user) {
            window.location.href = 'dashboard.html';
        }
    });

    if(loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            errBox.classList.add('hidden');
            const btn = e.target.querySelector('button');
            btn.innerHTML = 'Signing in...';
            btn.disabled = true;

            const email = document.getElementById('login-email').value;
            const pass = document.getElementById('login-password').value;

            try {
                await firebase.auth().signInWithEmailAndPassword(email, pass);
                // The onAuthStateChanged observer will handle redirect
            } catch (err) {
                errBox.innerText = err.message || 'Login failed.';
                errBox.classList.remove('hidden');
                btn.innerHTML = 'Sign In';
                btn.disabled = false;
            }
        });
    }

    if(registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            errBox.classList.add('hidden');
            const btn = e.target.querySelector('button');
            btn.innerHTML = 'Creating...';
            btn.disabled = true;

            const name = document.getElementById('reg-name').value;
            const email = document.getElementById('reg-email').value;
            const pass = document.getElementById('reg-password').value;

            try {
                const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, pass);
                
                // Update profile with name natively before the cloud function provisions the `users` doc
                await userCredential.user.updateProfile({
                    displayName: name
                });
                
            } catch (err) {
                errBox.innerText = err.message || 'Registration failed.';
                errBox.style.color = 'var(--danger)';
                errBox.classList.remove('hidden');
                btn.innerHTML = 'Create Account';
                btn.disabled = false;
            }
        });
    }
});

function switchTab(tab) {
    const errorBox = document.getElementById('error-message');
    if(errorBox) errorBox.classList.add('hidden');

    document.getElementById('tab-login').classList.remove('active');
    document.getElementById('tab-register').classList.remove('active');
    document.getElementById('login-form').classList.add('hidden');
    document.getElementById('register-form').classList.add('hidden');

    if (tab === 'login') {
        document.getElementById('tab-login').classList.add('active');
        document.getElementById('login-form').classList.remove('hidden');
    } else {
        document.getElementById('tab-register').classList.add('active');
        document.getElementById('register-form').classList.remove('hidden');
    }
}

function logout() {
    firebase.auth().signOut().then(() => {
        window.location.href = 'index.html';
    });
}
