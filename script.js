document.addEventListener('DOMContentLoaded', function() {
    const canvas = document.getElementById('paintCanvas');
    const ctx = canvas.getContext('2d');
    const history = []; //Array to hold the history of canvas states
    let index = -1; //Index to keep track of the current state
    let selectedStamp = null;
    let currentStamp = null; //Object to hold the currently dragged stamp
    let lastPlacedStamp = null; //Object to hold the last placed stamp
    let draggingStamp = false; //Flag to track if a stamp is being dragged
    let placedStamps = []; //Array to hold placed stamps
    let selectedStampIndex = -1; //Index of the selected stamp in placedStamps
    let isDragging = false;
    let activeStamp = null;

    //Define the sources for each stamp type and third of the canvas
    const stampSources = {
        bird: [('assets/picture/Bird 3.png'), ('assets/picture/Bird 2.png'), ('assets/picture/Bird 1.png')],
        bridge: [('assets/picture/Bridge_2.png'),('assets/picture/Bridge_1.png'),('assets/picture/Bridge_1.png')],
        cloud: [('assets/picture/Cloud.png'),('assets/picture/Cloud.png'),('assets/picture/Cloud.png')],
        flower: [('assets/picture/Flower1.png'), ('assets/picture/Flower1.png'), ('assets/picture/Flower2.png')],
        house: [('assets/picture/House_1.png'),('assets/picture/House_2.png'),('assets/picture/House_2.png')],
        moon: [('assets/picture/Moon.png'),('assets/picture/Moon.png'),('assets/picture/Moon.png')],
        mountain: [('assets/picture/Mountain 2.png'),('assets/picture/Mountain 1.png'),('assets/picture/Mountain 1.png')],
        person: [('assets/picture/Traveller.png'),('assets/picture/Traveller.png'),('assets/picture/Traveller.png')],
        river: [('assets/picture/Waterfall.png'),('assets/picture/River.png'),('assets/picture/River_2.png')],
        stone:[('assets/picture/Rock_Other_Perspective_.png'),('assets/picture/Rock_2.png'),('assets/picture/Rock_1.png')],
        tree: [('assets/picture/Tree_2 Background.png'),('assets/picture/Tree_1.png'),('assets/picture/Tree_1.png')],
        tree_bg: [('assets/picture/Tree_2 Background.png'),('assets/picture/Tree_2 Background.png'),('assets/picture/Tree_2 Background.png')],
        wiseman: [('assets/picture/wise man 1.png'),('assets/picture/wise man 1.png'),('assets/picture/wise man 2.png')]
    };

    //Movement logic 
    const navbar = document.getElementById('navbar');
    let isMoving = false;

    document.getElementById('navbarContainer').addEventListener('mousemove', function(e) {
        const containerWidth = this.offsetWidth;
        const mouseX = e.clientX;

        if (mouseX < containerWidth * 0.1) { //10% area from the left
            moveNavbar('right');
        } else if (mouseX > containerWidth * 0.9) { //10% area from the right
            moveNavbar('left');
        } else {
            stopMovingNavbar();
        }
    });

    function moveNavbar(direction) {
        if (isMoving) return;
        isMoving = true;

        let moveStep = 5; //Adjust step size for movement speed
        if (direction === 'left') moveStep = -moveStep;

        function step() {
            let currentLeft = parseInt(navbar.style.left || 0);
            currentLeft += moveStep;

            //Stop moving if the edge of the navbar reaches the edge of the container
            if ((moveStep < 0 && currentLeft < -navbar.scrollWidth + window.innerWidth) || 
                (moveStep > 0 && currentLeft > 0)) {
                stopMovingNavbar();
                return;
            }

            navbar.style.left = `${currentLeft}px`;
            if (isMoving) window.requestAnimationFrame(step);
        }

        step();
    }

    function stopMovingNavbar() {
        isMoving = false;
    }

    document.querySelectorAll('.stamp').forEach(item => {
        item.draggable = true;
        item.addEventListener('dragstart', function(e) {
            selectedStamp = this.id;
            currentStamp = {
                src: stampSources[selectedStamp][0], 
                width: 0, 
                height: 0, 
                scaleFactor: 0
            };
            draggingStamp = true;
        });
    });

    //Allow dropping on canvas
    canvas.addEventListener('dragover', function(e) {
        e.preventDefault();
    });

    canvas.addEventListener('drop', function(e) {
        e.preventDefault();
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        if (currentStamp) {
            drawStamp(x, y, true);
            draggingStamp = false;
        }
    });

    //Function to draw stamp
    function drawStamp(stamp, save = false) {
        const img = new Image();
        img.src = stamp.src;
        img.onload = function() {
            const scaledWidth = img.width * stamp.scaleFactor;
            const scaledHeight = img.height * stamp.scaleFactor;
            ctx.drawImage(img, stamp.x - scaledWidth / 2, stamp.y - scaledHeight / 2, scaledWidth, scaledHeight);
            if (save) {
                placedStamps.push({...stamp, width: scaledWidth, height: scaledHeight, img: img});
                saveState();
            }
        };
    }

    function calculateScaleFactor(x, y) {
        const distanceFactor = y / canvas.height;
        return parseFloat(sizeSlider.value) * distanceFactor;
    }

    //Click event to select a stamp for moving
    canvas.addEventListener('mousedown', function(e) {
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        //Check if any stamp is clicked
        const clickedStampIndex = placedStamps.findIndex(s => 
            mouseX >= s.x - s.width / 2 && mouseX <= s.x + s.width / 2 &&
            mouseY >= s.y - s.height / 2 && mouseY <= s.y + s.height / 2
        );

        if (clickedStampIndex !== -1) {
            activeStamp = placedStamps[clickedStampIndex];
            isDragging = true;
            placedStamps.splice(clickedStampIndex, 1); //Remove the stamp from the array
        }
    });

    //Mouse move event to drag a stamp
    canvas.addEventListener('mousemove', function(e) {
        if (!isDragging || !activeStamp) return;

        const rect = this.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        //Update the position of the active stamp
        activeStamp.x = mouseX;
        activeStamp.y = mouseY;

        //Redraw canvas with the updated stamp position
        redrawCanvas();
        drawStamp(activeStamp); //Draw the active stamp on top
    });

    //Mouse up event to drop the stamp
    canvas.addEventListener('mouseup', function() {
        if (isDragging && activeStamp) {
            isDragging = false;
            placedStamps.push(activeStamp); //Add the stamp back to the array
            activeStamp = null;
            saveState();
        }
    });

    //Initialize the canvas
    function initCanvas() {
        canvas.width = 800; 
        canvas.height = 600; 
        ctx.fillStyle = 'rgba(0, 0, 0, 0)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        saveState(); //Save the initial state of the canvas
    }

    //Save the current state of the canvas
    function saveState() {
        index++;
        //Remove any future states if we've gone back in history and then draw again
        history.length = index;
        //Save the current state
        history.push(canvas.toDataURL());
    }

    //Undo to the previous state
    function undo() {
        if (index <= 0) {
            return; //No more states to undo
        }
        index--;
        let previousState = new Image();
        previousState.onload = function() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(previousState, 0, 0);
        };
        previousState.src = history[index];
    }

    //Redo to the next state
    function redo() {
        if (index >= history.length - 1) {
            return; //No more states to redo
        }
        index++;
        let nextState = new Image();
        nextState.onload = function() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(nextState, 0, 0);
        };
        nextState.src = history[index];
    }

    //Event listeners for undo and redo
    document.addEventListener('keydown', function(event) {
        if (event.ctrlKey && event.key === 'z') {
            undo();
            event.preventDefault();
        } else if (event.ctrlKey && event.key === 'y') {
            redo();
            event.preventDefault();
        }
    });

    //Function to handle stamp selection
    document.querySelectorAll('.stamp').forEach(item => {
        item.addEventListener('click', function() {
            //Deselect all stamps
            document.querySelectorAll('.stamp').forEach(stamp => stamp.classList.remove('selected'));
            //Select the clicked stamp and store its type
            this.classList.add('selected');
            selectedStamp = this.id; //Assuming each stamp has a unique ID corresponding to its type
        });
    });

//Randomly generate and draw background with only trees and rivers
    function generateBackground() {
        const numberOfStamps = 3; //Adjust the number of random stamps as needed

        //Define the stamp keys for trees and rivers
        const allowedStampKeys = ['stone', 'tree_bg', 'cloud', 'river'];

        for (let i = 0; i < numberOfStamps; i++) {
            const randomStampKey = allowedStampKeys[Math.floor(Math.random() * allowedStampKeys.length)];
            const randomStampIndex = Math.floor(Math.random() * 3);
            const imgSrc = stampSources[randomStampKey][randomStampIndex];
            const img = new Image();
            img.src = imgSrc;

            img.onload = function() {
                const randomX = Math.random() * canvas.width;
                const randomY = Math.random() * canvas.height;

                //Calculate scale factor based on y position
                const distanceFactor = randomY / canvas.height;
                const baseScaleFactor = 0.1 + Math.random() * 0.3; //Base scale range (adjust as needed)
                const scaleFactor = baseScaleFactor * distanceFactor;

                const scaledWidth = img.width * scaleFactor;
                const scaledHeight = img.height * scaleFactor;

                ctx.drawImage(img, randomX - scaledWidth / 2, randomY - scaledHeight / 2, scaledWidth, scaledHeight);
            };
        }
        saveState(); //Save the state after generating background
    }


//Modify the event listener for the 'changeBackground' button
document.getElementById('changeBackground').addEventListener('click', function() {
    ctx.clearRect(0, 0, canvas.width, canvas.height); //Clear the canvas first
    generateBackground();
});


    //Add a reference to the size slider element
    const sizeSlider = document.getElementById('sizeSlider'); 
    
    function drawStamp(x, y) {
        if (!selectedStamp) {
            console.log("No stamp selected.");
            return; //Exit if no stamp is selected
        }
    
        const thirdHeight = canvas.height / 3;
        const thirdIndex = (y < thirdHeight) ? 0 : (y < thirdHeight * 2) ? 1 : 2;
    
        const imgSrc = stampSources[selectedStamp][thirdIndex]; //Get the source based on the selected stamp and third
        const img = new Image();
        img.src = imgSrc;
    
        img.onload = function() {
            //Calculate scale factor based on y position
            //Closer to the top (small y value) means smaller scale, and vice versa
            const baseScaleFactor = parseFloat(sizeSlider.value); //Base scale from the slider
            const distanceFactor = y / canvas.height; //Adjust scale based on height
            const scaleFactor = baseScaleFactor * distanceFactor;
    
            const scaledWidth = img.width * scaleFactor;
            const scaledHeight = img.height * scaleFactor;
    
            //Draw the image centered on the click position, scaled to the new size
            ctx.drawImage(img, x - scaledWidth / 2, y - scaledHeight / 2, scaledWidth, scaledHeight);
            saveState(); //Save the state after stamping
        };
    }
    
    //Click event to select a stamp
    canvas.addEventListener('mousedown', function(e) {
        const rect = this.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        //Find and select the stamp
        selectedStampIndex = placedStamps.findIndex(s => 
            mouseX >= s.x - s.width / 2 && mouseX <= s.x + s.width / 2 &&
            mouseY >= s.y - s.height / 2 && mouseY <= s.y + s.height / 2
        );

        if (selectedStampIndex !== -1) {
            isDragging = true;
        }
    });

    //Mouse move event to drag a stamp
    canvas.addEventListener('mousemove', function(e) {
        if (!isDragging || selectedStampIndex === -1) return;
        
        const rect = this.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        //Update the position of the selected stamp
        const stamp = placedStamps[selectedStampIndex];
        stamp.x = mouseX;
        stamp.y = mouseY;

        //Redraw canvas with the updated stamp position
        redrawCanvas();
    });

    //Mouse up event to drop the stamp
    canvas.addEventListener('mouseup', function() {
        if (isDragging) {
            isDragging = false;
            saveState();
        }
    });

    //Function to redraw the canvas
    function redrawCanvas() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        placedStamps.forEach(stamp => {
            const img = new Image();
            img.src = stamp.src;
            img.onload = function() {
                ctx.drawImage(img, stamp.x - stamp.width / 2, stamp.y - stamp.height / 2, stamp.width, stamp.height);
            };
        });
    }


    //Clear the canvas
    document.getElementById('delete').addEventListener('click', function() {
        if (confirm('Are you sure you want to clear the canvas?')) {
            initCanvas();
        }
    });

    //Placeholder function for translation
    document.getElementById('translate').addEventListener('click', function() {
        console.log('Translation feature would be implemented here.');
    });

    //Modify the event listener for the 'changeBackground' button
    document.getElementById('changeBackground').addEventListener('click', function() {
        ctx.clearRect(0, 0, canvas.width, canvas.height); //Clear the canvas first
        generateBackground();
    });

    document.getElementById('saveCanvas').addEventListener('click', function() {
        const canvas = document.getElementById('paintCanvas');
        //Create a data URL for the canvas
        const dataURL = canvas.toDataURL('image/jpeg', 1.0); //1.0 is for quality (0.0 to 1.0)

        //Create a temporary link element
        const link = document.createElement('a');
        link.href = dataURL;
        link.download = 'my_painting.jpg'; //This is the file name for the download

        //This will trigger the file download
        link.click();
    });

    initCanvas();
});
