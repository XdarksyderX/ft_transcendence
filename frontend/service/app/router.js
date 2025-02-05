// import { initializeLoginEvents, initializeSignupEvents, initializeChatEvents } from './events.js';
import { initializeNeonFrames, initializeNeonChat } from './neon.js';
import { initializeLoginEvents } from '../components/login/login.js';
import { initializeSignupEvents } from '../components/signup/signup.js';
import { initializeStartGameEvents } from '../components/start-game/app.js';
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

const routes = [
    { url: "/404", file: "./components/error/404.html" },
    { url: "/", file: "./components/index/index.html" },
    { url: "/login", file: "./components/login/login.html" },
    { url: "/signup", file: "./components/signup/signup.html" },
    { url: "/start-game", file: "./components/start-game/start-game.html" },
    { url: "/profile", file: "./components/profile/profile.html" },
    { url: "/friends", file: "./components/friends/friends.html" },
    { url: "/game-stats", file: "./components/stats/stats.html" },
    { url: "/settings", file: "./components/settings/settings.html" },
    { url: "/ongoing-tournaments", file: "./components/tournament/tournament.html" },
    { url: "/chess", file: "./components/chess/chess.html" },

];

async function router() {
//    console.log('Router function called');
    const path = location.pathname;
//    console.log('Current path:', path);
    const match = routes.find(route => route.url === path) || routes[0];

    const html = await fetch(match.file).then(res => res.text());
    document.getElementById('app').innerHTML = html;

    //initializes the proper events depending on the view
    switch (path) {
        case "/":
            initializeNeonFrames();
            initializeIndexEvents();
            break;
        case "/login":
            initializeLoginEvents();
            initializeNeonFrames();
            break;
        case "/signup":
            initializeSignupEvents();
            initializeNeonFrames();
            break;
        case "/start-game":
            initializeStartGameEvents();
            initializeNeonFrames();
            break;
        case "/ongoing-tournaments":
            initializeOngoingTournaments();
            break;
        case "/profile":
            initializeNeonFrames();
            initializeProfileEvents();
            break;
        case "/friends":
 /*            loadChat();
            loadSidebar(); */
            initializeNeonFrames();
            initializeFriendsEvents();
            break;
        case "/game-stats":
/*             loadChat();
            loadSidebar(); */
            initializeNeonFrames();
            initializeStatsEvents();
            break;
        case "/chess":
        //    console.log('Initializing chess events');
            initializeChessEvents();
            //startBackgroundMusic()
            break;
        case "/settings":
            initializeNeonFrames();
            initializeSettingsEvents();
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
//    console.log("is logged?", isLogged)
    if (url === "/login" || url === "/signup" || url === "/") {
        if (isLogged) {
            return ("/start-game");
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

function loadLoggedContent(isLogged) {
    if (isLogged) {
        loadChat();
        loadSidebar();
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
    const navbarContent = document.getElementById('navbar-content');
    if (url !== "/" && url !== "/start-game" && url !== "/login" && url !== "/signup") {
    //    console.log('url: ', url);
    //    console.log('pathname: ', window.location.pathname);
        navbarContent.innerHTML = `<a href="/start-game" class="nav-link ctm-link" data-link>Home</a>`
    } if (url === "/start-game") {
        navbarContent.innerHTML = `<div>Welcome ${getUsername()}</div>`;
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
