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
    resizeSidebarUsername();

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

export function toggleSidebarDisplay(show) {
    const sidebarContainer = document.getElementById('sidebar-container');
    const sidebarToggle = document.getElementById('sidebar-toggle-container');
    const margin = (show && window.innerWidth > 991) ? '250px' : 'auto'
      sidebarContainer.style.display = show ? 'block' : 'none';
      sidebarToggle.style.display = show ? 'inline-block' : 'none';
      document.getElementById('app').style.marginLeft = margin;
  }
  
export function resizeSidebarUsername() {
    const usernameElement = document.getElementById("sidebar-username");
    const username = usernameElement.textContent; // Get the username text

    if (username) {
        // Adjust font size based on username length
        const maxFontSize = 2; // Maximum font size in rem
        const minFontSize = 0.8; // Minimum font size in rem
        const maxLength = 20; // Length at which font size reaches minimum

        const fontSize = Math.max(
            minFontSize,
            maxFontSize - (username.length / maxLength) * (maxFontSize - minFontSize)
        );

        // Adjust padding based on font size
        const maxPadding = { topBottom: 8, leftRight: 16 }; // Maximum padding in px
        const minPadding = { topBottom: 8, leftRight: 0 }; // Minimum padding in px

        const paddingTopBottom = Math.max(
            minPadding.topBottom,
            maxPadding.topBottom - (username.length / maxLength) * (maxPadding.topBottom - minPadding.topBottom)
        );

        const paddingLeftRight = Math.max(
            minPadding.leftRight,
            maxPadding.leftRight - (username.length / maxLength) * (maxPadding.leftRight - minPadding.leftRight)
        );

        // Apply styles
        usernameElement.style.fontSize = `${fontSize}rem`;
        usernameElement.style.padding = `${paddingTopBottom}px ${paddingLeftRight}px`;
    }
}