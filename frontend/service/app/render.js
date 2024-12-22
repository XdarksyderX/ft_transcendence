/* async function loadLogin() {
    const loginContainer = document.getElementById('login-container');

    try {
        const response = await fetch('./components/login/login.html');
        if (!response.ok) throw new Error('Error while loading log in form');

        const loginHTML = await response.text();
        loginContainer.innerHTML = loginHTML;

        initializeNeonFrames();
        // probably here I should inicialize events from login.js idk
    } catch (error) {
        console.error('Error while loading log in form: ', error);
    }
}
loadLogin();

async function loadSignup() {
    const signupContainer = document.getElementById('signup-container');

    try {
        const response = await fetch('./components/signup/signup.html');
        if (!response.ok) throw new Error('Error while loading sign up form');

        const signupHTML = await response.text();
        signupContainer.innerHTML = signupHTML;

        initializeNeonFrames();
        // probably here I should inicialize events from login.js idk
    } catch (error) {
        console.error('Error while loading sign up form: ', error);
    }
}
loadSignup(); */

import { initializeSidebarEvents } from "../components/sidebar/app.js";
import { initializeChatEvents } from "../components/chat/app.js";
import { initializeNeonChat } from "./neon.js";

async function loadChat() {
    const chatContainer = document.getElementById('chat-container');

    try {
        const response = await fetch('/components/chat/chat.html'); // Ensure the path is correct
        if (!response.ok) throw new Error('Error while loading chat');

        const chatHTML = await response.text();
        chatContainer.innerHTML = chatHTML;

        initializeChatEvents();
        initializeNeonChat();
        chatContainer.style.display = 'block';
    } catch (error) {
        console.error('Error while loading chat: ', error);
    }
}

async function loadSidebar() {
    const sidebarContainer = document.getElementById('sidebar-container');
    const sidebarToggle = document.getElementById('sidebar-toggle-container');

    try {
        const response = await fetch('./components/sidebar/sidebar.html'); // Ensure the path is correct
        if (!response.ok) throw new Error('Error while loading sidebar');

        const sidebarHTML = await response.text();
        sidebarContainer.innerHTML = sidebarHTML;

        initializeSidebarEvents();
        sidebarContainer.style.display = 'block';
        sidebarToggle.style.display = 'block';
    } catch (error) {
        console.error('Error while loading sidebar: ', error);
    }
}

export { loadChat, loadSidebar }