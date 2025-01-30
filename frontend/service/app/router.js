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
import { loadChat, loadSidebar } from './render.js'; // temporal
import { loadLogin } from '../components/login/login.js';
import { initializeIndexEvents } from '../components/index/app.js';
import { verifyAndRedirect } from './auth.js';

const routes = [
    { url: "/404", file: "./components/error/404.html" },
    { url: "/", file: "./components/index/index.html" },
    { url: "/login", file: "./components/login/login.html" },
    { url: "/signup", file: "./components/signup/signup.html" },
    { url: "/start-game", file: "./components/start-game/start-game.html" },
    { url: "/profile", file: "./components/profile/profile.html" },
    { url: "/friends", file: "./components/friends/friends.html" },
    { url: "/game-stats", file: "./components/stats/stats.html" },
    { url: "/ongoing-tournaments", file: "./components/tournament/tournament.html" },
    { url: "/chess", file: "./components/chess/chess.html" },

];

async function router() {
    console.log('Router function called');
    const path = location.pathname;
    console.log('Current path:', path);
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
            initializeStartGameEvents(); // i guess
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

async function navigateTo(fullUrl) {
    const url = parseUrl(fullUrl);
    // console.log('navigating: ', url);
    
    try {
        const verify = await verifyAndRedirect();
        console.log("verify:", verify);
        
        if (!(url !== "/login" && url !== "/signup" && !verify)) {
            history.pushState(null, null, url);
            router();
            updateNavbar(window.location.pathname);
        }
    } catch (error) {
        console.error('Error during verification:', error);
    }
}

function updateNavbar(url) {
    if (url !== "/start-game" && url !== "/login" && url !== "/signup") {
        console.log('url: ', url);
        console.log('pathname: ', window.location.pathname);
        const navbarContent = document.getElementById('navbar-content');
        navbarContent.innerHTML = `<a href="/start-game" class="nav-link ctm-link" data-link>Home</a>`
    }
}

// Handle browser back/forward buttons
window.addEventListener("popstate", router);

// Initialize the application
document.addEventListener("DOMContentLoaded", async () => {
    const verify = await verifyAndRedirect();
    if (verify) {
        loadLogin("paca", false);
    } 
    router();
    // replaces links default behavior for our routing system
    document.body.addEventListener("click", (e) => {
        if (e.target.matches("[data-link]") || e.target.tagName === 'A') {
            e.preventDefault();
            navigateTo(e.target.href);
        }
    });
});



export { navigateTo };
