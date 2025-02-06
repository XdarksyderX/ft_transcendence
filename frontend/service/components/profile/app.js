import { getUsername } from "../../app/auth.js";

const avatarImages = [
    './resources/avatar/avatar_1.png',
    './resources/avatar/avatar_2.png',
    './resources/avatar/avatar_3.png',
];

function getElements() { 
    return (
        {
		//	test: document.getElementById('settings-container'),
            username: document.getElementById('username'),
            registration: document.getElementById('registration'),
            totalFriends: document.getElementById('total-friends'),
            totalMatches: document.getElementById('total-matches'),
            editProfile: document.getElementById('edit-profile'),
            saveChanges: document.getElementById('save-changes'),
            cancelChanges: document.querySelectorAll('.cancel-btn'),
            profileCard: document.querySelector('#profile-section .card'),
            profilePicture: document.getElementById('profile-picture'),
            fileInput: document.getElementById('file-input'),
            changePicture: document.getElementById('change-picture'),
            profileSection: document.getElementById('profile-section'),
            customizeSection: document.getElementById('customize-section'),
            uploadImage: document.getElementById('upload-image'),
            saveCustomPhoto: document.getElementById('save-custom-photo'),
            avatarColorButton: document.getElementById('change-avatar-color'),
            avatarColorPicker: document.getElementById('avatar-color-picker'),
            backgroundColorButton: document.getElementById('change-background-color'),
            backgroundColorPicker: document.getElementById('background-color-picker'),
        }
    );
}

const user = getUserData();

function getUserData() {
  //  alert("no amiga esto no está implementado");
    return ({ // provisional obvsly
        username: getUsername(),
        registration: '3/11/24',
        totalFriends: 3,
        totalMatches: 42,
        profilePicture: 'https://avatars.githubusercontent.com/u/131959167?v=4'
    });
}

function fillUserData(elements) {
    const user = getUserData();
	//console.log(user);
    elements.username.textContent = user.username;
    elements.registration.textContent = `Registered on: ${user.registration}`;
    elements.totalFriends.textContent = `Friends: ${user.totalFriends}`;
    elements.totalMatches.textContent = `Total matches: ${user.totalMatches}`;
    if (!user.profilePicture)
        user.profilePicture = avatarImages[0];
    elements.profilePicture.src = user.profilePicture;
}

//toggles from profile to edit mode
export function toggleEditMode(isEditing, elements) {
    if (!elements) {
        const elements = getElements();
		console.log("elements getted", elements);
    }
    elements.editProfile.style.display = isEditing ? 'none' : 'inline-block';
    elements.saveChanges.style.display = isEditing ? 'inline-block' : 'none';
    elements.changePicture.style.display = isEditing ? 'inline-block' : 'none';
    
    if (isEditing) {
        elements.username.innerHTML = `
            <div class="mb-2">New username:</div>
            <input type="text" class="form-control mb-2" value="${elements.username.textContent}">
        `;
        elements.cancelChanges.forEach(button => button.style.display = 'block');
    } else {
        fillUserData(elements);
        elements.cancelChanges.forEach(button => button.style.display = 'none');
        if (elements.customizeSection.style.display === 'block') {
            elements.customizeSection.style.display = 'none';
            elements.profileSection.style.display = 'block';
        }
    }
}
// show customize section hiding profile section
function showCustomizeSection(elements) {
    elements.profileSection.style.display = 'none';
    elements.customizeSection.style.display = 'block';
}

function updateProfilePhoto() {
    alert('photo changes must be stored on back');
}
// update the profile picture and go back to profile section
function savePhotoChanges(elements) {
    const selectedCanvas = document.querySelector('.carousel-item.active canvas');
    if (selectedCanvas) {
        user.profilePicture = selectedCanvas.toDataURL();
        elements.profilePicture.style.backgroundColor = selectedCanvas.style.backgroundColor;
    } else {
        const selectedImage = document.querySelector('.carousel-item.active img');
        if (selectedImage)
            user.profilePicture = selectedImage.src;
    }
    elements.profilePicture.src = user.profilePicture;
   updateProfilePhoto();
   saveNameChanges(elements);
}

function updateUsername() {
    alert('usernameChanges must be stored on the back');
}

function saveNameChanges(elements) {
    //user.username = elements.username.querySelector('input').value;
    updateUsername();
    toggleEditMode(false, elements);
}

    // handle photo upload adding it to the carousel
function handlePhotoUpload(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            let uploadedImageItem = document.getElementById('uploaded-image-item');
            if (!uploadedImageItem) {
                createUploadedImageItem();
            }
            const uploadedImg = document.getElementById('uploaded-img');
            uploadedImg.src = e.target.result;
/*                 uploadedImg.classList.add('ctm-img');
            uploadedImg.style.width = '100%';
            uploadedImg.style.aspectRatio = '1 / 1'; */
            
            
            scrollToNewPhoto();
        }
        reader.readAsDataURL(file);
    }
}

// create the carousel item to the new img
function createUploadedImageItem() {
    const carouselInner = document.querySelector('.carousel-inner');
    const newCarouselItem = document.createElement('div');
    newCarouselItem.className = 'carousel-item';
    newCarouselItem.id = 'uploaded-image-item';
    const uploadedImg = document.createElement('img');
    uploadedImg.classList.add('d-block','ctm-img', 'h-100');
    uploadedImg.id = 'uploaded-img';
    newCarouselItem.appendChild(uploadedImg);
    carouselInner.appendChild(newCarouselItem);
}
// scroll to the just uploaded photo
function scrollToNewPhoto() {
    const activeItem = document.querySelector('.carousel-item.active');
    const item = document.getElementById('uploaded-image-item');
    if (activeItem && item !== activeItem) {
        activeItem.classList.remove('active');
        item.classList.add('active');
    }
}

function changeAvatarColor(color) {
    const canvases = document.querySelectorAll('.carousel-item canvas');
    canvases.forEach(canvas => {
        const context = canvas.getContext('2d', { willReadFrequently: true });
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
            // RGBA if Alfa is 0 is transparent
            if (data[i + 3] !== 0) {                           // Alfa
                data[i] = parseInt(color.slice(1, 3), 16);     // Red
                data[i + 1] = parseInt(color.slice(3, 5), 16); // Green
                data[i + 2] = parseInt(color.slice(5, 7), 16); // Blue
            }
        }
        context.putImageData(imageData, 0, 0);
    });
}

function changeAvatarBackgroundColor(color) {
    const canvases = document.querySelectorAll('.carousel-item canvas');
    canvases.forEach(canvas => {
        canvas.style.backgroundColor = color;
    });
}

// load the src of a given img URL and draw it to a canvas
function loadImageToCanvas(canvas, src) {
    return new Promise((resolve) => {
        const context = canvas.getContext('2d', { willReadFrequently: true });
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = src;
        img.onload = function() { // this ensure the function executes once the image is fully charged
            canvas.width = 300;
            canvas.height = 300;
            context.clearRect(0, 0, canvas.width, canvas.height);
            context.drawImage(img, 0, 0, 300, 300);
            resolve();
        }
    });
}

function btnHandler(elements) {
    elements.editProfile.addEventListener('click', () => toggleEditMode(true, elements));
    elements.cancelChanges.forEach(button => {
        button.addEventListener('click', () => toggleEditMode(false, elements));
    });	
    elements.changePicture.addEventListener('click', () => showCustomizeSection(elements));
    elements.saveCustomPhoto.addEventListener('click', () => savePhotoChanges(elements));
    elements.saveChanges.addEventListener('click', () => saveNameChanges(elements));
    elements.avatarColorButton.addEventListener('click', () => {elements.avatarColorPicker.click()})
    elements.avatarColorPicker.addEventListener('change', (event) => changeAvatarColor(event.target.value));	
    elements.backgroundColorButton.addEventListener('click', () => {elements.backgroundColorPicker.click()})
    elements.backgroundColorPicker.addEventListener('change', (event) => changeAvatarBackgroundColor(event.target.value));	
    elements.backgroundColorButton.addEventListener('click', () => {elements.backgroundColorPicker.click()})
    elements.uploadImage.addEventListener('click', () => {elements.fileInput.click();});
    elements.fileInput.addEventListener('change', handlePhotoUpload);
}

function loadCanvases() {
    const canvases = [
        document.getElementById('avatarCanvas1'),
        document.getElementById('avatarCanvas2'),
        document.getElementById('avatarCanvas3')
    ];

    Promise.all(canvases.map((canvas, index) => loadImageToCanvas(canvas, avatarImages[index])))
        .then(() => {
            console.log('All avatars loaded');
        });
}

export function initializeProfileEvents() {
    const elements = getElements();
 //   console.log(elements);
    fillUserData(elements);
    loadCanvases();
    btnHandler(elements);
    //if the "editMode" from settings flag is active,
	//it'll wait to the profile page to ve fully charged
    if (sessionStorage.getItem("editMode") === "true") {
        sessionStorage.removeItem("editMode"); 
        setTimeout(() => {
            toggleEditMode(true, elements);
        }, 0);
    }
}
