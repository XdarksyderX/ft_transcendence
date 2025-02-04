//import { navigateTo } from "../../app/router.js";
// import jwtDecode from 'https://cdn.jsdelivr.net/npm/jwt-decode@3.1.2/build/jwt-decode.esm.js';
//import { getCookie } from '../../app/auth.js'
//import { toggleEditMode } from "../profile/app.js";
import { isTwoFAEnabled, toggleTwoFA, changeUsername, changeEmail, changePassword, deleteAccount, refreshAccessToken,  } from '../../app/auth.js';
import { throwAlert } from '../../app/render.js';
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
    const success = await toggleTwoFA(enable, password)
    if (success) {
      throwAlert(`2FA ${enable ? "activated" : "deactivated"} successfully`)
      await refreshAccessToken()
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
    if (newPassword !== confirmPassword) {
      throwAlert("Passwords do not match.")
      return
    }
  
    const success = await changePassword(newPassword, currentPassword)
    await refreshAccessToken()
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
    await refreshAccessToken()
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
    await refreshAccessToken()
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
    if (changes.enable2FA !== null) {
      await handle2FAChange(changes.enable2FA, password)
    }
    if (changes.username) {
      await handleUsernameChange(changes.username, password)
    }
    if (changes.email) {
      await handleEmailChange(changes.email, password)
    }
    changes = { enable2FA: null, username: null, email: null }
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
  
  