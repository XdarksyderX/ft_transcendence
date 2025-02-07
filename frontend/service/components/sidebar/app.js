// import { navigateTo } from "../../app/router.js";
import { logout } from "../../app/auth.js";
import { getUsername } from "../../app/auth.js";

export function initializeSidebarEvents() {
    const sidebar = document.getElementById('sidebar');
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const mainContent = document.getElementById('app');
	const logoutBtn = document.getElementById('logout-btn');
	const username = document.getElementById('sidebar-username');

	// Render the username in the sidebar and the navbar
	username.textContent = `${getUsername()}`;

    // Function to toggle the sidebar
    function toggleSidebar(event) {
        event.stopPropagation(); // Prevent event from bubbling up
        sidebar.classList.toggle('show'); // Toggle the 'show' class on the sidebar
    }

    // Add event listener to the toggle button
    sidebarToggle.addEventListener('click', toggleSidebar);

    // function to hide the sidebar if you click outside or navigate to a link
    function handleHideOnClick(event) {
        const isSmallScreen = window.innerWidth < 992;
        const clickedOutsideSidebar = !sidebar.contains(event.target) && event.target !== sidebarToggle;
        if (isSmallScreen && sidebar.classList.contains('show')) {
            if (event.target.tagName === 'A' || clickedOutsideSidebar) {
                sidebar.classList.remove('show');
            }
        }

    }
    document.addEventListener('click', handleHideOnClick);

    // Function to handle window resize to show/hide sidebar
    function handleResize() {
        const sidebarContainer = document.getElementById('sidebar-container');
        if (sidebarContainer.innerHTML === '') {
            return ;
        }
        if (window.innerWidth >= 992) {
            sidebar.classList.add('show');
            mainContent.style.marginLeft = '250px';
        } else {
            sidebar.classList.remove('show');
            mainContent.style.marginLeft = '0';
        }
    }

    // Add event listener for window resize
    window.addEventListener('resize', handleResize);

    // Trigger initial resize event to set correct state
    handleResize();

	logoutBtn.addEventListener('click', logout);
	//I'll have to uncoment it when oauth implemented
}