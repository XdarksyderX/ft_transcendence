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
import { initializeGreetingBot } from '../components/index/app.js';

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
    const path = location.pathname;
    const match = routes.find(route => route.url === path) || routes[0];

    const html = await fetch(match.file).then(res => res.text());
    document.getElementById('app').innerHTML = html;

    //initializes the proper events depending on the view
    switch (path) {
        case "/":
            initializeNeonFrames();
            initializeGreetingBot();
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
            loadChat();
            loadSidebar();
            initializeNeonFrames();
            initializeFriendsEvents();
            break;
        case "/game-stats":
            loadChat();
            loadSidebar();
            initializeNeonFrames();
            initializeStatsEvents();
            break;
        case "/chess":
            initializeChessEvents();
          //  initializeNeonFrames();
            break;
        default:
            initialize404();
        }
}

function navigateTo(url) {
     if (url !== window.location.pathname) {
            //  if (window.location.pathname === '/profile') {
            //         const modal = new bootstrap.Modal(document.getElementById('exit-game-modal'));
            //         modal.show();
            //         return ;
            // }  
        history.pushState(null, null, url);
        router();
        updateNavbar(window.location.pathname);
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
document.addEventListener("DOMContentLoaded", () => {
    router();
    document.body.addEventListener("click", (e) => {
        if (e.target.matches("[data-link]")) {
            e.preventDefault();
            navigateTo(e.target.href);
        }
    });
});

// ensures preventing default link behaviour so it doesn't reload
document.body.addEventListener('click', (event) => {
    const target = event.target;

    if (target.tagName === 'A' /* && target.classList.contains('ctm-link') */) {
        event.preventDefault();
        const url = target.getAttribute('href');
        navigateTo(url);
    }
});

export { navigateTo };
