// import { initializeLoginEvents, initializeSignupEvents, initializeChatEvents } from './events.js';
import { initializeNeonFrames, initializeNeonChat } from './neon.js';
import { initializeLoginEvents } from '../components/login/login.js';
import { initializeSignupEvents } from '../components/signup/signup.js';
import { initializeStartGameEvents } from '../components/start-game/app.js';

const routes = [
    { url: "/non-existing", file: "./components/error/404.html" },
    { url: "/", file: "./components/index.html" },
    { url: "/login", file: "./components/login/login.html" },
    { url: "/signup", file: "./components/signup/signup.html" },
    { url: "/chat", file: "./components/chat/chat.html" }, //I guess i'll render chat once im logged in another .js
    { url: "/start-game", file: "./components/start-game/start-game.html" },
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
            break;
        case "/login":
            initializeLoginEvents();
            initializeNeonFrames();
            break;
        case "/signup":
            initializeSignupEvents();
            initializeNeonFrames();
            break;
/*         case "/chat":
            initializeChatEvents();
            initializeNeonChat();
            break; */
        case "/start-game":
            initializeStartGameEvents(); // i guess
            initializeNeonFrames();
            break;
    }
}

function navigateTo(url) {
    if (url !== window.location.pathname) {
        history.pushState(null, null, url);
        router();
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

export { navigateTo };
