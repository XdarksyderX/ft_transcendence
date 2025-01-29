const frames = [
    "/resources/greetings/frame_1.png",
    "/resources/greetings/frame_2.png",
    "/resources/greetings/frame_3.png"
];
const processedCanvases = [];
const targetColor = [132, 204, 163];
let processedLightCanvas;

function changeCanvasColor(data) {
    for (let i = 0; i < data.length; i += 4) {
        let r = data[i], g = data[i + 1], b = data[i + 2];
        if (r > 200 && g > 200 && b > 200) { // Detect white or almost white
            data[i] = targetColor[0]; 
            data[i + 1] = targetColor[1]; 
            data[i + 2] = targetColor[2]; 
        }
    }
}

function processFrame(imageSrc, callback) {
    const img = new Image();
    img.src = imageSrc;
    img.crossOrigin = "Anonymous";
    img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        changeCanvasColor(imageData.data);
        ctx.putImageData(imageData, 0, 0);

        callback(canvas);
    };
}

function initializeGreetingBot() {
    let processedCount = 0
  
    frames.forEach((frame, index) => {
      processFrame(frame, (processedCanvas) => {
        processedCanvases[index] = processedCanvas
        processedCount++
        if (processedCount === frames.length) {
          startAnimation()
        }
      })
    })
  
    // Process the light image with the same color change
    processFrame("/resources/greetings/light.png", (processedCanvas) => {
      processedLightCanvas = processedCanvas
      const lightCanvas = document.getElementById("greeting-light")
      const ctx = lightCanvas.getContext("2d")
  
      lightCanvas.width = processedCanvas.width
      lightCanvas.height = processedCanvas.height
      ctx.drawImage(processedCanvas, 0, 0)
  
      animateLightEffect(lightCanvas)
    })
  

}

function initializeScrollTransition() {
    // Use Intersection Observer for scroll animation
    const resumeCards = document.querySelectorAll(".resume-card")
    const options = {
        root: null,
        rootMargin: "-20% 0px -20% 0px", // Trigger when 20% of the element is visible
        threshold: 0.3, // Trigger when 30% of the element is visible
    }

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
        if (entry.isIntersecting) {
            entry.target.classList.add("scrolled")
        } else {
            entry.target.classList.remove("scrolled")
        }
        })
    }, options)

    resumeCards.forEach((card) => {
        observer.observe(card)
    })
}
  
export function initializeIndexEvents() {

    initializeGreetingBot();

    document.getElementById("scroll-arrow").addEventListener('click', () => {
        document.getElementById("resume-section").scrollIntoView({ behavior : "smooth"})
    });

    initializeScrollTransition()

}

function startAnimation() {
    const canvas = document.getElementById("greeting-bot");
    const ctx = canvas.getContext("2d");
    let sequence = [0, 1, 2, 1, 0];
    let frameIndex = 0;

    function renderFrame() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        let frameCanvas = processedCanvases[sequence[frameIndex]];
        canvas.width = frameCanvas.width;
        canvas.height = frameCanvas.height;
        ctx.drawImage(frameCanvas, 0, 0);

        frameIndex = (frameIndex + 1) % sequence.length;
        setTimeout(renderFrame, 200);
    }

    renderFrame();
}

function animateLightEffect(canvas) {
    const ctx = canvas.getContext("2d");
    let glow = 10; // Start with a higher initial glow
    let growing = true;

    function updateGlow() {
        glow = growing ? glow + 1 : glow - 1; // Decrease the step size for slower changes
        if (glow > 40) growing = false; // Increase the maximum glow value
        if (glow < 10) growing = true; // Increase the minimum glow value

        // Clear the canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw the processed light canvas
        ctx.drawImage(processedLightCanvas, 0, 0);

        // Apply glow effect
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        ctx.filter = `blur(${glow}px)`;
        ctx.drawImage(processedLightCanvas, 0, 0);
        ctx.restore();

        requestAnimationFrame(updateGlow);
    }

    updateGlow();
}

//this is the old version 
/* function animateLightEffect(canvas) {
    let glow = 10; // Start with a higher initial glow
    let growing = true;

    function updateGlow() {
        glow = growing ? glow + 1 : glow - 1; // Decrease the step size for slower changes
        if (glow > 15) growing = false; // Increase the maximum glow value
        if (glow <= 0) growing = true; // Increase the minimum glow value

        // Combine box-shadow and blur filters for a more noticeable glow
        canvas.style.filter = `blur(${glow}px)`;
        requestAnimationFrame(updateGlow);
    }

    updateGlow();
} */