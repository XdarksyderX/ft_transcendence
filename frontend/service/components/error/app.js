export function initialize404() {

	const canvas = document.getElementById("neon-canvas");
	const ctx = canvas.getContext("2d");

	const robotImage = new Image();
	const questionImages = [ // we initially define the 3 image paths
			"../resources/404/question1.png",
			"../resources/404/question2.png",
			"../resources/404/question3.png",
		].map(src => { // map creates a new array of Image objects with the paths set as their src
			const img = new Image();
			img.src = src;
			return img;
		});
		
		let questionIndex = 0;
		let shadowSize = 0;
		let increment = true;
		
		robotImage.src = "../resources/404/bot.png";
		robotImage.onload = () => {
			resizeCanvas();
			startNeonEffect();
			startQuestionAnimation();
		};
		
		// resizes canvas ensuring the aspect ratio of the image
		function resizeCanvas() {
			const width = canvas.clientWidth;
			const height = width * (robotImage.height / robotImage.width);
			canvas.width = width;
			canvas.height = height;
		}
		// applies blueish green to all pixels of the canvas
		function applyInitialGreenColor(imageData) {
			const pixels = imageData.data;
			for (let i = 0; i < pixels.length; i += 4) {
				const alpha = pixels[i + 3];
				if (alpha > 0) {
					pixels[i] = 0;     // Red
					pixels[i + 1] = 245; // Green
					pixels[i + 2] = 106; // Blue
				}
			}
			return imageData;
		}
		
		function startNeonEffect() {
			let lastTime = 0;
			let glowOpacity = 0;
			const maxGlowOpacity = 0.8;
	
			function animate(currentTime) {
				if (currentTime - lastTime >= 50) {
					// clears the canvas before starting
					ctx.clearRect(0, 0, canvas.width, canvas.height);
	
					// Draw the robot image on the canvas
					ctx.drawImage(robotImage, 0, 0, canvas.width, canvas.height);
					let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
					imageData = applyInitialGreenColor(imageData);
					ctx.putImageData(imageData, 0, 0);
	
					// Draw the question marks
					if (questionIndex > 0) {
						const questionImage = questionImages[questionIndex - 1];
						ctx.drawImage(questionImage, 0, 0, canvas.width, canvas.height);
						imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
						imageData = applyInitialGreenColor(imageData);
						ctx.putImageData(imageData, 0, 0);
					}
	
					// Apply glow effect
					ctx.save();
					ctx.globalCompositeOperation = "lighter";
					ctx.filter = `blur(${shadowSize}px)`;
					ctx.globalAlpha = glowOpacity;
					ctx.drawImage(canvas, 0, 0);
					ctx.restore();
	
					// Update shadow size and glow opacity
					shadowSize = increment ? shadowSize + 1 : shadowSize - 1;
					glowOpacity = increment ? glowOpacity + 0.05 : glowOpacity - 0.05;
	
					if (shadowSize > 15 || glowOpacity > maxGlowOpacity) {
						increment = false;
					}
					if (shadowSize <= 0 || glowOpacity <= 0) {
						increment = true;
					}
	
					shadowSize = Math.max(0, Math.min(15, shadowSize));
					glowOpacity = Math.max(0, Math.min(maxGlowOpacity, glowOpacity));
	
					lastTime = currentTime;
				}
				requestAnimationFrame(animate);
			}
			requestAnimationFrame(animate);
		}
	
		function startQuestionAnimation() {
			setInterval(() => {
				questionIndex = (questionIndex + 1) % (questionImages.length + 1);
			}, 1000);
		}
		window.addEventListener("resize", () => {
			resizeCanvas();
		});
}