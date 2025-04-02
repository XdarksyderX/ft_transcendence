const color1 = "#00F56A";
const color2 = "#00F56Acc";
const colorT1 = "rgba(0, 245, 106, 0.4)"; // 40% opacity
const colorT2 = "rgba(0, 245, 106, 0.3)"; // 30% opacity

function animateNeon(element, animationFeatures) {
    const { maxShadow, interval, blinkTimes, isTextShadow, stopOnComplete } = animationFeatures;

    let shadowSize = 0;
    let decrement = true;
    let blinkCount = 0;

    const animationInterval = setInterval(() => {
        setShadow(element, shadowSize, isTextShadow);

        if (decrement) {
            shadowSize--;
            if (shadowSize <= 0) decrement = false;
        } else {
            shadowSize++;
            if (shadowSize >= maxShadow) {
                decrement = true;
                blinkCount++;

                if (stopOnComplete && blinkCount >= blinkTimes) {
                    clearInterval(animationInterval);
                    setShadow(element, maxShadow, isTextShadow);
                }
            }
        }
    }, interval);

    return animationInterval;
}

function setShadow(element, shadowSize, isTextShadow) {
    const shadowStyle = isTextShadow
        ? `
            0 0 ${shadowSize}px ${colorT2}, 
            0 0 ${shadowSize * 2}px ${colorT1}, 
            0 0 ${shadowSize * 3}px ${colorT1}, 
            0 0 ${shadowSize * 4}px ${colorT1}`
        : `
            0 0 ${shadowSize}px ${color2}, 
            0 0 ${shadowSize * 2}px ${color1}, 
            0 0 ${shadowSize * 3}px ${color1}`;

    if (isTextShadow) {
        element.style.textShadow = shadowStyle;
    } else {
        element.style.boxShadow = shadowStyle;
    }
}

function animateNeonCardHover(element, maxShadow, interval, blinkTimes) {
    let animationInterval;

    function startAnimation() {
        animationInterval = animateNeon(element, {
            maxShadow,
            interval,
            blinkTimes,
            isTextShadow: false,
            stopOnComplete: true,
        });
    }

    function stopAnimation() {
        clearInterval(animationInterval);
        element.style.boxShadow = 'none';
    }

    element.addEventListener('mouseenter', startAnimation);
    element.addEventListener('mouseleave', stopAnimation);
}


function initializeNeonFrames() {
    const neonText = document.getElementById("neon-text");
    const neonFrames = document.querySelectorAll(".blinking-neon-frame");
    
    if (neonText) {
        animateNeon(neonText, { maxShadow: 10, interval: 100, isTextShadow: true, stopOnComplete: false });
    }
    if (neonFrames) {
        neonFrames.forEach(neonFrame => {
            animateNeon(neonFrame, { maxShadow: 10, interval: 50, blinkTimes: 2, isTextShadow: false, stopOnComplete: false });
        });
    }
    initializeNeonCardHover();
}

function initializeNeonChat() {
    const notification = document.getElementById("notification-indicator");

    if (notification) {
        animateNeon(notification, { maxShadow: 10, interval: 35, blinkTimes: 2, isTextShadow: false, stopOnComplete: false });
    }
}

function initializeNeonCardHover() {
    const cards = document.querySelectorAll('.card-hover');
    if (cards) {
        cards.forEach(card => {
            animateNeonCardHover(card, 10, 35, 2);
        });
    }
}

export { initializeNeonFrames, initializeNeonChat, animateNeon, initializeNeonCardHover };