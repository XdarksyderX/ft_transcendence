import { throwAlert, throwToast } from "../../app/render.js";
import { getUsername } from "../../app/auth.js";
import { refreshAccessToken } from "../../app/auth.js";

export function handle2FAmodal(status, secret = null) {
    const modalElement = document.getElementById('2fa-qr-modal');
    const modal = new bootstrap.Modal(modalElement, {
        backdrop: 'static', // Evita cerrar la modal al hacer clic fuera
        keyboard: false     // Evita cerrar la modal con la tecla escape
    });

    console.log('status: ', status);
    
    if (!status) {
        throwToast(`2FA disabled succesfully`);
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
    }, 5090); // 5 segundos
    refreshAccessToken();
  }

function generate2FAQrCode(containerId, service, user, secret) {
    if (!containerId || !service || !user || !secret) {
        console.error("Missing parameters: containerId, service, user, or secret.");
        return;
    }

    const otpUrl = `otpauth://totp/${encodeURIComponent(service)}:${encodeURIComponent(user)}?secret=${secret}&issuer=${encodeURIComponent(service)}&algorithm=SHA1&digits=6`;

    console.log("Generated OTP URL:", otpUrl);

    const qrContainer = document.getElementById(containerId);
    if (!qrContainer) {
        console.error(`Container with ID '${containerId}' not found.`);
        return;
    }

    qrContainer.innerHTML = ''; // Clear previous content

    // Generate the QR code with increased size and error correction
    new QRCode(qrContainer, {
        text: otpUrl,
        width: 300, // Increased size
        height: 300, // Increased size
        correctLevel: QRCode.CorrectLevel.H // High error correction
    });

    console.log(`QR Code generated in container: #${containerId}`);
}