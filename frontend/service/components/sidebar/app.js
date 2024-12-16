import { navigateTo } from "../../app/router.js";

export function initializeSidebarEvents() {
    const sidebar = document.getElementById('sidebar');
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const mainContent = document.querySelector('main');
	const logoutBtn = document.getElementById('logout-btn');
	const userNames = document.querySelectorAll('.username');

	const loggedInUser = 'erivero-';

	// Render the username in the sidebar and the navbar
	userNames.forEach(userName => {
		userName.textContent += `${loggedInUser}`;
	});
    // Function to toggle the sidebar
    function toggleSidebar(event) {
        event.stopPropagation(); // Prevent event from bubbling up
        sidebar.classList.toggle('show'); // Toggle the 'show' class on the sidebar
    }

    // Add event listener to the toggle button
    sidebarToggle.addEventListener('click', toggleSidebar);

    // Function to handle clicks outside the sidebar
    function handleOutsideClick(event) {
        const isSmallScreen = window.innerWidth < 992;
        const clickedOutsideSidebar = !sidebar.contains(event.target) && event.target !== sidebarToggle;

        if (isSmallScreen && sidebar.classList.contains('show') && clickedOutsideSidebar) {
            sidebar.classList.remove('show');
        }
    }

    // Listen for clicks on the document to apply the previous function
    document.addEventListener('click', handleOutsideClick);

    // Function to handle window resize to show/hide sidebar
    function handleResize() {
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


	//logoutBtn.addEventListener('click', logout());
	//I'll have to uncoment it when oauth implemented
}