const user = {
	username: 'erivero-',
	registration: '3/11/24',
	totalFriends: 3,
	totalMatches: 42,
	profilePicture: 'https://avatars.githubusercontent.com/u/131959167?v=4'
};

/* const elements = {
	username: document.getElementById('username'),
	registration: document.getElementById('registration'),
	totalFriends: document.getElementById('total-friends'),
	totalMatches: document.getElementById('total-matches'),
	editProfile: document.getElementById('edit-profile'),
	saveChanges: document.getElementById('save-changes'),
	profileCard: document.getElementById('profile-section'),
	profilePicture: document.getElementById('profile-picture'),
	fileInput: document.getElementById('file-input'),
	changePictureBtn: document.getElementById('change-picture-btn'),
	profileSection: document.getElementById('profile-section'),
	customizeSection: document.getElementById('customize-section'),
	uploadImage: document.getElementById('upload-image'),
	saveCustomPhoto: document.getElementById('save-custom-photo'),
	cancelCustomPhoto: document.getElementById('cancel-custom-photo'),
	avatarColorButton: document.getElementById('change-avatar-color'),
	avatarColorPicker: document.getElementById('avatar-color-picker'),
	backgroundColorButton: document.getElementById('change-background-color'),
	backgroundColorPicker: document.getElementById('background-color-picker'),
	uploadedImage: document.getElementById('uploadedImage')
}; */

const elements = {
    username: document.getElementById('username'),
    registration: document.getElementById('registration'),
    totalFriends: document.getElementById('total-friends'),
    totalMatches: document.getElementById('total-matches'),
    editProfile: document.getElementById('edit-profile'),
    saveChanges: document.getElementById('save-changes'),
    profilePicture: document.getElementById('profile-picture'),
    changePictureBtn: document.getElementById('change-picture-btn'),
    profileSection: document.getElementById('profile-section'),
    customizeSection: document.getElementById('customize-section'),
    uploadImage: document.getElementById('upload-image'),
    fileInput: document.getElementById('file-input'),
    saveCustomPhoto: document.getElementById('save-custom-photo'),
    avatarColorButton: document.getElementById('change-avatar-color'),
    avatarColorPicker: document.getElementById('avatar-color-picker'),
    backgroundColorButton: document.getElementById('change-background-color'),
    backgroundColorPicker: document.getElementById('background-color-picker'),
};

const avatarImages = [
	'./resources/avatar/avatar_1.png',
	'./resources/avatar/avatar_2.png',
	'./resources/avatar/avatar_3.png',
];

function renderUserData() {
	elements.username.textContent = user.username;
	elements.registration.textContent = `Registered on: ${user.registration}`;
	elements.totalFriends.textContent = `Friends: ${user.totalFriends}`;
	elements.totalMatches.textContent = `Total matches: ${user.totalMatches}`;
	elements.profilePicture.src = user.profilePicture;
}

function toggleEditMode(isEditing) {
    elements.editProfile.style.display = isEditing ? 'none' : 'inline-block';
    elements.saveChanges.style.display = isEditing ? 'inline-block' : 'none';
    elements.changePictureBtn.style.display = isEditing ? 'inline-block' : 'none';
    
    if (isEditing) {
        elements.username.innerHTML = `
            <div class="d-flex justify-content-center">New username:</div>
            <input type="text" class="form-control ctm-text-dark text-center" value="${user.username}">
        `;
        renderCancelBtn(document.querySelector('.ctm-card'), () => toggleEditMode(false));
    } else {
        renderUserData();
        removeCancelBtn(document.querySelector('.ctm-card'));
    }
}

function renderCancelBtn(container, onClick) {
	const cancelBtn = document.createElement('button');
	cancelBtn.textContent = 'x';
	cancelBtn.className = 'btn ctm-text-title position-absolute top-0 end-0 m-2';
	cancelBtn.id = 'cancel-edit';
	cancelBtn.addEventListener('click', onClick);
	container.appendChild(cancelBtn);
	console.log("rendering cancelBtn on container: ", container);
}

function removeCancelBtn(container) {
	const cancelBtn = document.getElementById('cancel-edit');
	console.log("removing or whatever");
	if (cancelBtn) cancelBtn.remove();
}

function showCustomizeSection() {
    elements.profileSection.style.display = 'none';
    console.log("profile style: ", elements.profileSection.style.display);
    elements.customizeSection.style.display = 'flex';

    renderCancelBtn(document.querySelector('.ctm-card'), () => {
        elements.profileSection.style.display = 'flex';
        elements.customizeSection.style.display = 'none';
        // removeCancelBtn(document.querySelector('.ctm-card'));
    });
}

if (elements.changePictureBtn) {
    elements.changePictureBtn.addEventListener('click', showCustomizeSection);
}

if (elements.saveCustomPhoto) {
    elements.saveCustomPhoto.addEventListener('click', () => {
        const selectedCanvas = document.querySelector('.carousel-item.active canvas, .carousel-item.active img');
        if (selectedCanvas.tagName === 'CANVAS') {
            user.profilePicture = selectedCanvas.toDataURL();
        } else {
            user.profilePicture = selectedCanvas.src;
        }
        elements.profilePicture.src = user.profilePicture;
        elements.profileSection.style.display = 'flex';
        elements.customizeSection.style.display = 'none';
        removeCancelBtn(document.querySelector('.ctm-card'));
    });
}

/* if (elements.cancelCustomPhoto) {
	elements.cancelCustomPhoto.addEventListener('click', () => {
		elements.profileSection.style.display = 'block';
		elements.customizeSection.style.display = 'none';
		removeCancelBtn(elements.customizeSection);
	});
} */

if (elements.avatarColorButton) {
	elements.avatarColorButton.addEventListener('click', () => {
		elements.avatarColorPicker.click();
	});
}

if (elements.avatarColorPicker) {
	elements.avatarColorPicker.addEventListener('change', (event) => {
		const selectedColor = event.target.value;
		document.querySelectorAll('.carousel-item canvas').forEach(canvas => {
			changeAvatarColor(canvas, selectedColor);
		});
	});
}

if (elements.backgroundColorButton) {
	elements.backgroundColorButton.addEventListener('click', () => {
		elements.backgroundColorPicker.click();
	});
}

if (elements.backgroundColorPicker) {
	elements.backgroundColorPicker.addEventListener('change', (event) => {
		const selectedColor = event.target.value;
		document.querySelectorAll('.profile-picture').forEach(img => {
			img.style.backgroundColor = selectedColor;
		});
	});
}

if (elements.editProfile) {
	elements.editProfile.addEventListener('click', () => toggleEditMode(true));
}

if (elements.saveChanges) {
	elements.saveChanges.addEventListener('click', () => {
		user.username = elements.username.querySelector('input').value;
		toggleEditMode(false);
	});
}

if (elements.uploadImage) {
	elements.uploadImage.addEventListener('click', () => {
		elements.fileInput.click();
	});
}

function handlePhotoUpload(event) {
	const file = event.target.files[0];
	if (file) {
		const reader = new FileReader();
		reader.onload = (e) => {
			let uploadedImageItem = document.getElementById('uploaded-image-item');
			if (!uploadedImageItem) {
				const carouselInner = document.querySelector('.carousel-inner');
				const newCarouselItem = document.createElement('div');
				newCarouselItem.className = 'carousel-item';
				newCarouselItem.id = 'uploaded-image-item';
				uploadedImage = document.createElement('img');
				uploadedImage.id = 'uploadedImage';
				uploadedImage.className = 'd-block profile-picture';
				uploadedImage.alt = 'Uploaded Image';
				newCarouselItem.appendChild(uploadedImage);
				carouselInner.appendChild(newCarouselItem);
				
			}
			scrollToNewPhoto();
			uploadedImage.src = e.target.result;
			// const carousel = new bootstrap.Carousel(document.querySelector('#carousel-container'));
			// carousel.to(Array.from(carouselInner.children).indexOf(uploadedImage.parentElement));
		};
		reader.readAsDataURL(file);
	}
}

function scrollToNewPhoto() {
	const activeItem = document.querySelector('.carousel-item.active');
	const item = document.getElementById('uploaded-image-item');
	if (activeItem && item !== activeItem) {
		activeItem.classList.remove('active');
		item.classList.add('active');
	}
}

if (elements.fileInput) {
	elements.fileInput.addEventListener('change', handlePhotoUpload);
}

function loadImageToCanvas(canvas, src) {
	return new Promise((resolve) => {
		const context = canvas.getContext('2d');
		const img = new Image();
		img.crossOrigin = "anonymous";
		img.src = src;
		img.onload = function() {
			canvas.width = 500;
			canvas.height = 500;
			context.clearRect(0, 0, canvas.width, canvas.height);
			context.drawImage(img, 0, 0, 500, 500);
			resolve();
		};
	});
}

function changeAvatarColor(canvas, color) {
	const context = canvas.getContext('2d');
	const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
	const data = imageData.data;

	for (let i = 0; i < data.length; i += 4) {
		// Check if the pixel is not transparent
		if (data[i + 3] !== 0) {
			data[i] = parseInt(color.slice(1, 3), 16);     // Red
			data[i + 1] = parseInt(color.slice(3, 5), 16); // Green
			data[i + 2] = parseInt(color.slice(5, 7), 16); // Blue
		}
	}

	context.putImageData(imageData, 0, 0);
}

window.onload = function() {
	const canvases = [
		document.getElementById('avatarCanvas1'),
		document.getElementById('avatarCanvas2'),
		document.getElementById('avatarCanvas3')
	];

	Promise.all(canvases.map((canvas, index) => loadImageToCanvas(canvas, avatarImages[index])))
		.then(() => {
			console.log('All avatars loaded');
		});

	renderUserData();
};
