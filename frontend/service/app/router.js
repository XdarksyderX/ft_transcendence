//import { initializeLoginEvents, initializeSignupEvents, initializeChatEvents } from './events.js';
import { initializeNeonFrames, initializeNeonChat } from './neon.js';
import { initializeLoginEvents } from '../components/login/login.js';
import { initializeSignupEvents, initializeVerifyEmailEvents } from '../components/signup/signup.js';
import { initializeHomeEvents } from '../components/home/app.js';
import { initializeProfileEvents } from '../components/profile/app.js';
import { initialize404 } from '../components/error/app.js';
import { initializeFriendsEvents } from '../components/friends/app.js';
import { initializeStatsEvents } from '../components/stats/app.js';
import { initializeOngoingTournaments } from '../components/tournament/ongoing.js';
import { initializeNewTournament } from '../components/tournament/new.js';
import { initializeChessEvents } from '../components/chess/index.js';
import { loadChat, loadSidebar } from './render.js';
import { initializeIndexEvents } from '../components/index/app.js';
import { isLoggedIn } from './auth.js';
import { initializeSettingsEvents } from '../components/settings/app.js';
import { getUsername } from './auth.js';
import { initializeResetPasswordEvents } from '../components/login/reset-pw.js';
import { initializePongEvents } from '../components/pong/app.js';
import { initializeNotificationEvents } from '../components/notifications/app.js';
import { stopBackgroundMusic, toggleBackgroundMusic } from '../components/chess/index.js';
import { updateNotificationBell } from '../components/notifications/app.js';

const routes = [
    { url: "/404", file: "./components/error/404.html", allowed: true },
    { url: "/", file: "./components/index/index.html", allowed: true },
    { url: "/login", file: "./components/login/login.html", allowed: true },
    { url: "/signup", file: "./components/signup/signup.html", allowed: true },
    { url: "/home", file: "./components/home/home.html", allowed: false },
    { url: "/profile", file: "./components/profile/profile.html", allowed: false },
    { url: "/friends", file: "./components/friends/friends.html", allowed: false },
    { url: "/game-stats", file: "./components/stats/stats.html", allowed: false },
    { url: "/settings", file: "./components/settings/settings.html", allowed: false },
    { url: "/ongoing-tournaments", file: "./components/tournament/tournament.html", allowed: false },
    { url: "/new-tournament", file: "./components/tournament/new-tournament.html", allowed: false },
    { url: "/chess", file: "./components/chess/chess.html", allowed: false },
    { url: "/pong", file: "./components/pong/pong.html", allowed: false },
    { url: "/reset-password", file: "./components/login/reset-password.html", allowed: true },
    { url: "/verify-email", file: "./components/signup/verify-email.html", allowed: true },
];

async function router(key = null) {
    const path = location.pathname;
    const match = routes.find(route => route.url === path) || routes[0];

    // Carga el contenido dinámico en el contenedor principal
    const html = await fetch(match.file).then(res => res.text());
    document.getElementById('app').innerHTML = html;

    initializeNeonFrames(); // Inicializa estilos o frames
    stopBackgroundMusic();

    // Inicializa eventos específicos de cada vista
    switch (path) {
        case "/":
            initializeIndexEvents();
            break;
        case "/login":
            initializeLoginEvents();
            break;
        case "/signup":
            initializeSignupEvents();
            break;
        case "/home":
            initializeHomeEvents();

            break;
        case "/ongoing-tournaments":
            initializeOngoingTournaments();
            break;
        case "/new-tournament":
            initializeNewTournament();
            break;
        case "/profile":
            initializeProfileEvents();
            break;
        case "/friends":
            initializeFriendsEvents();
            break;
        case "/game-stats":
            initializeStatsEvents();
            break;
        case "/chess":
            initializeChessEvents(key);
            break;
        case "/pong":
            initializePongEvents(key);
            break;
        case "/settings":
            initializeSettingsEvents();
            break;
        case "/reset-password":
            initializeResetPasswordEvents();
            break;
        case "/verify-email":
            initializeVerifyEmailEvents();
            break;
        default:
            initialize404();
    }
}

function parseUrl(fullUrl) {
    const parts = fullUrl.split('/');
    const url = parts[parts.length - 1];
    return ("/" + url);
}

function redirectURL(isLogged, fullUrl) {
    const url = parseUrl(fullUrl);
    const allowed = routes.find(route => route.url === url).allowed;
    //    console.log("is logged?", isLogged)
    if (allowed) {
        if (isLogged) {
            return ("/home");
        } else {
            return (url);
        }
    } else {
        if (isLogged) {
            return (url);
        } else {
            return ("/");
        }
    }

}

function unloadChatAndSidebar() {
    const chatContainer = document.getElementById('chat-container');
    const sidebarContainer = document.getElementById('sidebar-container');
    const sidebarToggle = document.getElementById('sidebar-toggle-container');

    chatContainer.innerHTML = '';
    sidebarContainer.innerHTML = '';
    sidebarContainer.style.display = 'none';
    sidebarToggle.style.display = 'none';
    document.getElementById('app').style.marginLeft = 'auto';
}

function loadLoggedContent(isLogged) {
    if (isLogged) {
        loadChat();
        loadSidebar();
    } else {
        unloadChatAndSidebar();
    }
    updateNavbar(window.location.pathname);
}

async function navigateTo(fullUrl, key = null) {
    console.log("navigating to: ", fullUrl);    
    try {
        const verify = await isLoggedIn();
        const url = redirectURL(verify, fullUrl);
        console.log("verify:", verify);
        
       // if (!(url !== "/login" && url !== "/signup" && !verify)) 
        if (url !== window.location.pathname) {
            history.pushState(null, null, url);
            router(key);
            
        }
        loadLoggedContent(verify);
    } catch (error) {
        console.error('Error during verification:', error);
    }
}

function toggleNavbarContent(show, hide) {
    show.classList.add('d-flex');
    show.classList.remove('hidden');
    hide.classList.add('hidden');
    hide.classList.remove('d-flex');
}

function updateNavbar(url) {
 //   const navbarContent = document.getElementById('navbar-content');;
    const allowed = routes.find(route => route.url === url).allowed;

    const loggedContent = document.getElementById('logged-content');
    const unloggedContent = document.getElementById('unlogged-content');
   // const bellDropdown = document.getElementById('bell-dropdown');
    const lcText = document.getElementById('lc-text');

    if (!allowed) {
        toggleNavbarContent(loggedContent, unloggedContent);
        initializeNotificationEvents(); // this should be called only once, when you log in I guess or not bc I have to habdle refreshes
        if (url === "/home") {
            lcText.innerHTML = `<div>Welcome ${getUsername()}</div>`;
        } else {
            lcText.innerHTML = `<a href="/home" class="nav-link ctm-link ms-5" data-link>Home</a>`
        }
        if (url === '/chess' || url === '/pong') {
            const button4 = document.getElementById('button4');
            button4.style.display = 'block';
        }
        else {
            const button4 = document.getElementById('button4');
            button4.style.display = 'none';
        }
    } else {
        toggleNavbarContent(unloggedContent, loggedContent);
    }
}

// Handle browser back/forward buttons
window.addEventListener("popstate", initRouteEvents);

async function initRouteEvents() {
    console.log("initRouteEvents function called");
    await navigateTo(window.location.pathname);
    router();
    updateNotificationBell();
    document.body.addEventListener("click", (e) => {
        if (e.target.matches("[data-link]") || e.target.tagName === 'A') {
            e.preventDefault();
            navigateTo(e.target.href);
        }
    });
    const button4 = document.getElementById('button4');
    button4.addEventListener('click', () => {
        toggleBackgroundMusic(window.location.pathname);
    });
}

// Initialize the application
document.addEventListener("DOMContentLoaded", initRouteEvents);


export { navigateTo };
