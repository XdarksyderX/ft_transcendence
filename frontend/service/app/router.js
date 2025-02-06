//import { initializeLoginEvents, initializeSignupEvents, initializeChatEvents } from './events.js';
import { initializeNeonFrames, initializeNeonChat } from './neon.js';
import { initializeLoginEvents } from '../components/login/login.js';
import { initializeSignupEvents, initializeVerifyEmailEvents } from '../components/signup/signup.js';
import { initializeHomeEvents } from '../components/home/app.js';
import { initializeProfileEvents } from '../components/profile/app.js';
import { initialize404 } from '../components/error/app.js';
import { initializeFriendsEvents } from '../components/friends/app.js';
import { initializeStatsEvents } from '../components/stats/app.js';
import { initializeOngoingTournaments } from '../components/tournament/app.js';
import { initializeChessEvents } from '../components/chess/index.js';
import { loadChat, loadSidebar } from './render.js';
import { initializeIndexEvents } from '../components/index/app.js';
import { isLoggedIn } from './auth.js';
import { initializeSettingsEvents } from '../components/settings/app.js';
import { startBackgroundMusic } from '../components/chess/Render/main.js';
import { getUsername } from './auth.js';
import { initializeResetPasswordEvents } from '../components/login/reset-pw.js';

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
    { url: "/chess", file: "./components/chess/chess.html", allowed: false },
    { url: "/reset-password", file: "./components/login/reset-password.html", allowed: true },
    { url: "/verify-email", file: "./components/signup/verify-email.html", allowed: true },
];

async function router() {
//    console.log('Router function called');
    const path = location.pathname;
//    console.log('Current path:', path);
    const match = routes.find(route => route.url === path) || routes[0];

    const html = await fetch(match.file).then(res => res.text());
    document.getElementById('app').innerHTML = html;

    initializeNeonFrames();


    //initializes the proper events depending on the view
    switch (path) {
        case "/":
            initializeIndexEvents();
            break;
        case "/login":
            initializeLoginEvents();
            //initializeNeonFrames();
            break;
        case "/signup":
            initializeSignupEvents();
            //initializeNeonFrames();
            break;
        case "/home":
            initializeHomeEvents();
            //initializeNeonFrames();
            break;
        case "/ongoing-tournaments":
            initializeOngoingTournaments();
            break;
        case "/profile":
            //initializeNeonFrames();
            initializeProfileEvents();
            break;
        case "/friends":
 /*            loadChat();
            loadSidebar(); */
            //initializeNeonFrames();
            initializeFriendsEvents();
            break;
        case "/game-stats":
/*             loadChat();
            loadSidebar(); */
            //initializeNeonFrames();
            initializeStatsEvents();
            break;
        case "/chess":
        //    console.log('Initializing chess events');
            initializeChessEvents();
            //startBackgroundMusic()
            break;
        case "/settings":
            initializeSettingsEvents();
            break ;
        case "/reset-password":
            initializeResetPasswordEvents();
            break ;
        case "/verify-email":
            initializeVerifyEmailEvents();
            break ;
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

async function navigateTo(fullUrl) {
     console.log('navigate function called, url: ', fullUrl);
    
    try {
        const verify = await isLoggedIn();
        const url = redirectURL(verify, fullUrl);
    //    console.log("verify:", verify);
        
       // if (!(url !== "/login" && url !== "/signup" && !verify)) 
        if (url !== window.location.pathname) {
            history.pushState(null, null, url);
            router();
           
        }
        loadLoggedContent(verify);
    } catch (error) {
        console.error('Error during verification:', error);
    }
}

function updateNavbar(url) {
    const navbarContent = document.getElementById('navbar-content');;
    const allowed = routes.find(route => route.url === url).allowed;

    if (url === "/home") {
     navbarContent.innerHTML = `<div>Welcome ${getUsername()}</div>`;
    } else if (!allowed) {
    //    console.log('url: ', url);
    //    console.log('pathname: ', window.location.pathname);
        navbarContent.innerHTML = `<a href="/home" class="nav-link ctm-link" data-link>Home</a>`
    } else {
        navbarContent.innerHTML = `                <a href="/login" class="nav-link ctm-link" data-link="true">Log in</a>
                <span class="divider mx-2 ctm-text-light">|</span>
                <a href="/signup" class="nav-link ctm-link" data-link>Sign up</a>`
    }
}

// Handle browser back/forward buttons
window.addEventListener("popstate", initRouteEvents);

function initRouteEvents() {
    console.log("initRouteEvents function called");
    navigateTo(window.location.pathname);
    router();
    document.body.addEventListener("click", (e) => {
        if (e.target.matches("[data-link]") || e.target.tagName === 'A') {
            e.preventDefault();
            navigateTo(e.target.href);
        }
    });
}

// Initialize the application
document.addEventListener("DOMContentLoaded", initRouteEvents);


export { navigateTo };
