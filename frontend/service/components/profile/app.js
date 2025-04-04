import { getUsername, refreshAccessToken } from "../../app/auth.js";
import { handleGetFriendList } from "../friends/app.js";
import { getAvatar, changeAvatar, getProfile, changeAlias } from "../../app/social.js";
import { handleUsernameChange } from "../settings/app.js";
import { throwAlert, throwToast } from "../../app/render.js";
import { parseUsername, parseAlias } from "../signup/signup.js";
import { handleGetResumeStats } from "../stats/app.js";

const avatarImages = [
    './resources/avatar/avatar_1.png',
    './resources/avatar/avatar_2.png',
    './resources/avatar/avatar_3.png',
];

async function handleAliasChange(newAlias) {
    try {
        const response = await changeAlias(newAlias);
        if (response.status === 'success') {
            throwToast('Alias updated successfully!');
            document.getElementById('alias').textContent = response.alias;
        } else {
            throwAlert(`Error: ${response.message}`);
        }
    } catch (error) {
        console.error('Error updating alias:', error);
        throwAlert('An error occurred while updating the alias.');
    }
}

export async function initializeProfileEvents(toggle = false) {
    const elements = getElements();
    const user = await getUserData();
    await fillUserData(elements, user);
    loadCanvases();
    // handleAliasChange();
    if (!toggle) {
        btnHandler(elements);
    }
    if (toggle) {
        toggleEditMode(false, elements);
    }
    const stats = await handleGetResumeStats(getUsername());
}
let chosenAvatarColor = null;
let chosenBgColor = null;


function getElements() { 
    return (
        {
            // user data:
            profilePicture: document.getElementById('profile-picture'),
            username: document.getElementById('username'),
            alias: document.getElementById('alias'),
            totalFriends: document.getElementById('total-friends'),
            // stats
            totalPongMatches: document.getElementById('total-pong-matches'), // New element
            totalChessMatches: document.getElementById('total-chess-matches'), // New element
            tournamentFirst: document.getElementById('tournament-first'), // New element
            chessElo: document.getElementById('chess-elo'), // New element
            // edit section
            editProfile: document.getElementById('edit-profile'),
            saveChanges: document.getElementById('save-changes'),
            cancelChanges: document.querySelectorAll('.cancel-btn'),
            profileCard: document.querySelector('#profile-section .card'),
            fileInput: document.getElementById('file-input'),
            changePicture: document.getElementById('change-picture'),
            profileSection: document.getElementById('profile-section'),
            customizeSection: document.getElementById('customize-section'),
            uploadImage: document.getElementById('upload-image'),
            saveCustomPhoto: document.getElementById('save-custom-photo'),
            avatarColorButton: document.getElementById('choose-avatar-color'),
            avatarColorPicker: document.getElementById('avatar-color-picker'),
            backgroundColorButton: document.getElementById('choose-background-color'),
            backgroundColorPicker: document.getElementById('background-color-picker'),
            applyColor: document.getElementById('apply-color'),
        }
    );
}

async function getUserData() {
    const response = await getProfile();
    if (response.status !== 'success') {
        return throwAlert("Error while fetching profile data");
    }
    const profileData = response.data;
    const name = getUsername();
    return {
        username: name,
        alias: profileData.alias,
        totalFriends: profileData.total_friends,
        resumeStats: await handleGetResumeStats(name),
        profilePicture: await getAvatar(null, null, profileData.avatar)
    };
}



async function fillUserData(elements, user = null) {
    if (!user) {
        user = await getUserData();
    }
    elements.username.textContent = `${user.username}`;
    elements.alias.textContent = user.alias || user.username;
    elements.totalFriends.textContent = `${user.totalFriends}`;
    elements.totalPongMatches.textContent = `${user.resumeStats.totalPong}`;
    elements.tournamentFirst.textContent = `${user.resumeStats.firstPlace}`;
    elements.totalChessMatches.textContent = `${user.resumeStats.totalChess}`;
    elements.chessElo.textContent = `${user.resumeStats.chessElo}`;
    if (!user.profilePicture)
        user.profilePicture = avatarImages[0];
    elements.profilePicture.src = user.profilePicture;
}

let oldAlias = null;
//toggles from profile to edit mode
export function toggleEditMode(isEditing, elements) {
    if (!elements) {
        elements = getElements();
        //console.log("elements getted", elements);
    }
    elements.editProfile.style.display = isEditing ? 'none' : 'inline-block';
    elements.saveChanges.style.display = isEditing ? 'inline-block' : 'none';
    elements.changePicture.style.display = isEditing ? 'inline-block' : 'none';
    
    if (isEditing) {
        oldAlias = elements.alias.innerText;
        elements.username.innerHTML = `
            <input type="text" class="form-control ctm-form mb-2 text-end" value="${getUsername()}">
        `;
        elements.alias.innerHTML = `
            <input type="text" class="form-control ctm-form mb-2 text-end" value="${oldAlias}">
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

async function updateProfilePhoto(formData) {
    const response = await changeAvatar(formData);
    if (response.status === "success") {
        throwToast('Photo changes saved successfully.');
    } else {
        alert('Failed to save photo changes.');
    }
}

// update the profile picture and go back to profile section
async function savePhotoChanges(elements) {
    const selectedCanvas = document.querySelector('.carousel-item.active canvas');
    const formData = new FormData();

    if (selectedCanvas) {
        selectedCanvas.toBlob(async (blob) => {
            formData.append('avatar', blob, 'avatar.png');
            await updateProfilePhoto(formData);
        });
    } else {
        const selectedImage = document.querySelector('.carousel-item.active img');
        if (selectedImage) {
            const response = await fetch(selectedImage.src);
            const blob = await response.blob();
            formData.append('avatar', blob, 'avatar.png');
            await updateProfilePhoto(formData);
        }
    }

    saveNameChanges(elements);
}

async function updateChanges() {
    await refreshAccessToken();
    console.log("[AUTH] Updating access token after changes")
    document.getElementById('sidebar-username').innerText = getUsername();
    await initializeProfileEvents(true);
}

async function updateUsername(username) {
    const modalElement = document.getElementById('save-changes-modal');
	const modal = new bootstrap.Modal(modalElement);
    modal.show();
    const confirmSaveBtn = document.getElementById('confirm-save-changes');
    const newBtn = confirmSaveBtn.cloneNode(true);
    confirmSaveBtn.parentNode.replaceChild(newBtn, confirmSaveBtn);
    newBtn.addEventListener('click', async () => {
		
		const password = document.getElementById("confirm-changes-password").value;
		if (!password) {
			throwAlert("Password required");
			return;
		}
        modal.hide();
        await handleUsernameChange(username, password);
        await updateChanges();
    })
}


async function saveNameChanges(elements) {
    const nameInput = elements.username.querySelector('input')
    const newName = nameInput.value;
    const newAlias = elements.alias.querySelector('input').value;

    if (newName == '' || newAlias == '') {
        return throwAlert("None field can't be empty");
    } else if (!parseUsername(newName) || !parseAlias(newAlias)) {
        return ;
    }
    if (newAlias !== oldAlias) {
        await handleAliasChange(newAlias);
    }
    if (newName !== getUsername()) {
        await updateUsername(newName);
        nameInput.value = getUsername();
        return ;
    }
    await initializeProfileEvents(true);
 
}

function handlePhotoUpload(event) {
    const file = event.target.files[0];
    if (file) {
        const img = new Image();
        img.src = URL.createObjectURL(file);
        img.onload = () => {
            if (img.width > 1024 || img.height > 1024) {
                throwAlert('Image too large. Max dimensions: 1024x1024.');
                // Reset the file input to allow re-uploading the same file
                event.target.value = '';
            } else {
                const reader = new FileReader();
                reader.onload = (e) => {
                    let uploadedImageItem = document.getElementById('uploaded-image-item');
                    if (!uploadedImageItem) {
                        createUploadedImageItem();
                    }
                    const uploadedImg = document.getElementById('uploaded-img');
                    uploadedImg.src = e.target.result;
                    scrollToNewPhoto();
                }
                reader.readAsDataURL(file);
            }
        }
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


let originalImageData = {};

function loadImageToCanvas(canvas, src) {
    return new Promise((resolve) => {
        const context = canvas.getContext('2d', { willReadFrequently: true });
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = src;
        img.onload = function() {
            canvas.width = 300;
            canvas.height = 300;
            context.clearRect(0, 0, canvas.width, canvas.height);
            context.drawImage(img, 0, 0, 300, 300);
            // Store the original pixels for future color changes
            originalImageData[canvas.id] = context.getImageData(0, 0, canvas.width, canvas.height);
            resolve();
        }
    });
}

function changeAvatarColor(color) {
    const canvases = document.querySelectorAll('.carousel-item canvas');
    canvases.forEach(canvas => {
        const context = canvas.getContext('2d');
        // Use the saved original data instead of current canvas data
        const imageData = new ImageData(
            new Uint8ClampedArray(originalImageData[canvas.id].data),
            canvas.width,
            canvas.height
        );
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
            if (data[i + 3] !== 0) {
                data[i] = parseInt(color.slice(1, 3), 16);
                data[i + 1] = parseInt(color.slice(3, 5), 16);
                data[i + 2] = parseInt(color.slice(5, 7), 16);
            }
        }
        context.putImageData(imageData, 0, 0);
    });
}

function changeAvatarBackgroundColor(color) {
    const canvases = document.querySelectorAll('.carousel-item canvas');
    canvases.forEach(canvas => {
        const ctx = canvas.getContext('2d');
        // Capture the current image
        const oldDataUrl = canvas.toDataURL();
        const oldImg = new Image();
        oldImg.src = oldDataUrl;
        oldImg.onload = () => {
            // Clear and fill the background
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = color;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            // Redraw the old content on top
            ctx.drawImage(oldImg, 0, 0);
        };
    });
}

function chooseAvatarColor(color) {
    const square =  document.getElementById('avatar-color-square');
    square.style.backgroundColor = color;
    chosenAvatarColor = color;
}

function chooseBgColor(color) {
    const square =  document.getElementById('background-color-square');
    square.style.backgroundColor = color;
    chosenBgColor = color;
}

function applyColorChanges() {
    if (chosenAvatarColor) {
        changeAvatarColor(chosenAvatarColor);
    } if (chosenBgColor) {
        changeAvatarBackgroundColor(chosenBgColor);
    }
}

function btnHandler(elements) {
    elements.editProfile.addEventListener('click', () => toggleEditMode(true, elements));
 //   console.log("adding event listeners")
    elements.cancelChanges.forEach(button => {
        button.addEventListener('click', () => toggleEditMode(false, elements));
    });	
    elements.changePicture.addEventListener('click', () => showCustomizeSection(elements));
    elements.saveCustomPhoto.addEventListener('click', () => savePhotoChanges(elements));
    elements.saveChanges.addEventListener('click', () => saveNameChanges(elements));
    elements.avatarColorButton.addEventListener('click', () => {elements.avatarColorPicker.click()})
    elements.avatarColorPicker.addEventListener('change', (event) => chooseAvatarColor(event.target.value));	
    elements.backgroundColorButton.addEventListener('click', () => {elements.backgroundColorPicker.click()})
    elements.backgroundColorPicker.addEventListener('change', (event) => chooseBgColor(event.target.value));	
    elements.backgroundColorButton.addEventListener('click', () => {elements.backgroundColorPicker.click()});
    elements.applyColor.addEventListener('click', applyColorChanges);
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
            console.log('[SOCIAL] All avatars loaded');
        });
}

