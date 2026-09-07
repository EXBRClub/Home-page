import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js';
import { auth } from './firebase-client.js';

const sessionLink = document.querySelector('[data-session-link]');
const sessionLabel = document.querySelector('[data-session-label]');
const sessionDock = document.querySelector('[data-session-dock]');
const sessionDockLabel = document.querySelector('[data-session-dock-label]');

onAuthStateChanged(auth, user => {
  const authenticated = Boolean(user);
  const prefix = window.location.pathname.includes('/pages/') ? '' : 'pages/';
  if (sessionLink) sessionLink.href = authenticated ? `${prefix}perfil.html` : `${prefix}login.html`;
  if (sessionLabel) sessionLabel.textContent = authenticated ? 'Perfil' : 'Login';
  if (sessionDock) sessionDock.href = authenticated ? `${prefix}perfil.html` : `${prefix}login.html`;
  if (sessionDockLabel) sessionDockLabel.textContent = authenticated ? 'Perfil do membro' : 'Login';
});
