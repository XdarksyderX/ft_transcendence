//import { navigateTo } from "../../app/router.js";
// import jwtDecode from 'https://cdn.jsdelivr.net/npm/jwt-decode@3.1.2/build/jwt-decode.esm.js';
//import { getCookie } from '../../app/auth.js'
//import { toggleEditMode } from "../profile/app.js";
import { isTwoFAEnabled, toggleTwoFA, changeUsername, changeEmail, changePassword, deleteAccount, refreshAccessToken, getUsername,  } from '../../app/auth.js';
import { throwAlert } from '../../app/render.js';
import { parseNewPasswords } from '../signup/signup.js';
//import { loadLogin } from '../login/login.js';
  
  let changes = {
    enable2FA: null,
    username: null,
    email: null,
  }
  
  export function initializeSettingsEvents() {
    init2FAEvents()
    initEmailChangeEvents()
    initUsernameChangeEvents()
    initSaveChangesEvents()
    document.getElementById("change-password-form").addEventListener("submit", handlePasswordChange)
    document.getElementById("confirm-delete-account").addEventListener("click", handleDeleteAccount)
  }
  
  function toggle2FASwitch(event) {
    const status = document.getElementById("2fa-status")
    const isChecked = event ? event.target.checked : isTwoFAEnabled()
  
    if (!event) {
      document.getElementById("2fa-toggle").checked = isChecked
    }
  
    status.innerText = isChecked ? "Disable 2FA" : "Enable 2FA"
    changes.enable2FA = isChecked
  }
  
  function init2FAEvents() {
    toggle2FASwitch()
    document.getElementById("2fa-toggle").addEventListener("change", toggle2FASwitch)
  }
  
  async function handle2FAChange(enable, password) {
    const data = await toggleTwoFA(enable, password)
    if (data) {
      throwAlert(`2FA ${enable ? "activated" : "deactivated"} successfully`)
      handle2FAmodal(enable, data.secret);
      toggle2FASwitch()
    } else {
      throwAlert("Failed to update 2FA")
    }
  }
  

  async function handlePasswordChange(event) {
    event.preventDefault();
    const currentPassword = document.getElementById("current-password").value
    const newPassword = document.getElementById("new-password").value
    const confirmPassword = document.getElementById("confirm-new-password").value
  
    if (!currentPassword || !newPassword || !confirmPassword) {
      throwAlert("Please fill in all fields.")
      return
    }
    if (!parseNewPasswords(newPassword, confirmPassword)) {
      return
    }
  
    const success = await changePassword(newPassword, currentPassword);
    throwAlert(success ? "Password changed successfully" : "Failed to change password.")
  }
  
  function initUsernameChangeEvents() {
    const usernameForm = document.getElementById("new-username-form")
    usernameForm.addEventListener("submit", (event) => {
      event.preventDefault()
      const newUsername = document.getElementById("new-username").value
      if (!newUsername) {
        throwAlert("Please, fill in username field")
        return
      }
      changes.username = newUsername
    })
  }
  
  async function handleUsernameChange(newUsername, password) {
    const success = await changeUsername(newUsername, password)
    throwAlert(success ? "Username changed successfully" : "Failed to change username.")
  }
  
  function initEmailChangeEvents() {
    const emailForm = document.getElementById("new-email-form")
    emailForm.addEventListener("submit", (event) => {
      event.preventDefault()
      const newEmail = document.getElementById("new-email").value
      if (!newEmail) {
        throwAlert("Please, fill in email field")
        return
      }
      changes.email = newEmail
    })
  }
  
  async function handleEmailChange(newEmail, password) {
    const success = await changeEmail(newEmail, password)
    throwAlert(success ? "Email changed successfully" : "Failed to change email.")
  }
  
  async function handleDeleteAccount() {
    const password = document.getElementById("delete-password").value
    if (!password) {
      throwAlert("Password is required.")
      return
    }
  
    const success = await deleteAccount(password)
    if (success) {
      throwAlert("Account deleted successfully")
      // Redirect to login page or perform any necessary cleanup
    } else {
      throwAlert("Failed to delete account.")
    }
  }
  
  async function handleSaveChanges(password) {
    let changesMade = false;

    if (changes.enable2FA !== null) {
        await handle2FAChange(changes.enable2FA, password);
        changesMade = true;
    }
    if (changes.username) {
        await handleUsernameChange(changes.username, password);
        changesMade = true;
    }
    if (changes.email) {
        await handleEmailChange(changes.email, password);
        changesMade = true;
    }

    changes = { enable2FA: null, username: null, email: null };

    if (changesMade) {
        refreshAccessToken();
    }
  }
  
  function handle2FAmodal(status, secret = null) {
    const modalElement = document.getElementById('2fa-qr-modal');
    const modal = new bootstrap.Modal(modalElement, {
        backdrop: 'static', // Evita cerrar la modal al hacer clic fuera
        keyboard: false     // Evita cerrar la modal con la tecla escape
    });

    console.log('status: ', status);
    
    if (!status) {
        throwAlert(`2FA is now disabled`);
        return;
    }

    if (!secret) {
        throwAlert(`Error: No secret key provided for 2FA.`);
        return;
    }

    modal.show();

    // Generar el QR en el contenedor de la modal
    generate2FAQrCode("qr-place", "ft_transcendence", getUsername(), secret);

    // Deshabilitar los botones de cierre por 5 segundos
    const closeButtons = modalElement.querySelectorAll('.close-qr-modal');
    closeButtons.forEach(button => {
        button.disabled = true;
    });

    setTimeout(() => {
        closeButtons.forEach(button => {
            button.disabled = false;
        });
    }, 5000); // 5 segundos
    refreshAccessToken();
  }

  function generate2FAQrCode(containerId, service, user, secret) {
    if (!containerId || !service || !user || !secret) {
        console.error("Missing parameters: containerId, service, user, or secret.");
        return;
    }

    // Construir la URL en formato otpauth
    const otpUrl = `otpauth://totp/${encodeURIComponent(service)}:${encodeURIComponent(user)}?secret=${secret}&issuer=${encodeURIComponent(service)}`;

    // Obtener el contenedor donde se insertará el QR
    const qrContainer = document.getElementById(containerId);
    if (!qrContainer) {
        console.error(`Container with ID '${containerId}' not found.`);
        return;
    }

    qrContainer.innerHTML = ''; // Limpiar contenido previo

    // Generar el código QR usando qrcode.js
    new QRCode(qrContainer, {
        text: otpUrl,
        width: 300,
        height: 300
    });

    console.log(`QR Code generated in container: #${containerId}`);
}


  function initSaveChangesEvents() {
    const saveBtn = document.getElementById("confirm-save-changes")
    saveBtn.addEventListener("click", async () => {
      const password = document.getElementById("confirm-changes-password").value
      if (!password) {
        throwAlert("Password required")
        return
      }
      await handleSaveChanges(password)
    })
  }
  
  