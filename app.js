//Global selections and variables
const colorDivs = document.querySelectorAll(".color");
const generateBtn = document.querySelector(".generate");
const sliders = document.querySelectorAll('input[type="range"]');
const currentHexes = document.querySelectorAll(".color h2");
const popup = document.querySelector(".copy-container");
const adjustButton = document.querySelectorAll(".adjust");
const lockButton = document.querySelectorAll(".lock");
const closeAdjustments = document.querySelectorAll(".close-adjustment");
const sliderContainers = document.querySelectorAll(".sliders");
let initialColors;
//This is for local storage
let savedPalettes = [];

//Events listeners
generateBtn.addEventListener("click", randomColors);
sliders.forEach((slider) => {
  slider.addEventListener("input", hslControls);
});
colorDivs.forEach((div, index) => {
  div.addEventListener("change", () => {
    updateTextUI(index);
  });
});
currentHexes.forEach((hex) => {
  hex.addEventListener("click", () => {
    copyToClipboard(hex);
  });
});
popup.addEventListener("transitionend", () => {
  const popupBox = popup.children[0];
  popup.classList.remove("active");
  popupBox.classList.remove("active");
});
adjustButton.forEach((button, index) => {
  button.addEventListener("click", () => {
    openAdjustmentPanel(index);
  });
});
closeAdjustments.forEach((button, index) => {
  button.addEventListener("click", () => {
    closeAdjustmentPanel(index);
  });
});
lockButton.forEach((button, index) => {
  button.addEventListener("click", () => {
    colorDivs[index].classList.toggle("locked");
    if (colorDivs[index].classList.contains("locked")) {
      button.innerHTML = '<i class="fas fa-lock"></i>';
    } else {
      button.innerHTML = '<i class="fas fa-lock-open"></i>';
    }
  });
});

//Functions
//color generator - pick random color
function generateHex() {
  const hexColor = chroma.random();
  return hexColor;
}

//color generator - generate color
function randomColors() {
  // create an array to store the intials values
  initialColors = [];
  //generate the color
  colorDivs.forEach((div, index) => {
    const hexText = div.children[0];
    const randomColor = generateHex();
    // add the color to the initial value array
    //if console log the colors here : it's gonna be the last ones
    if (div.classList.contains("locked")) {
      initialColors.push(hexText.innerText); //push the previous one
      return;
    } else {
      initialColors.push(chroma(randomColor).hex()); //push the new values
    }

    //add the color to the bg
    div.style.backgroundColor = randomColor;
    hexText.innerText = randomColor;

    //Check for contrast
    checkTextContrast(randomColor, hexText);

    //initial colorize sliders
    const color = chroma(randomColor);
    const sliders = div.querySelectorAll(".sliders input");
    const hue = sliders[0];
    const brightness = sliders[1];
    const saturation = sliders[2];

    colorizeSliders(color, hue, brightness, saturation);
  });
  //Reset our inputs (sliders) and put them to the corresponding ones
  resetInputs();
  //Check for contrast on the buttons : loop and apply check contrast for all of them
  adjustButton.forEach((button, index) => {
    checkTextContrast(initialColors[index], button);
    checkTextContrast(initialColors[index], lockButton[index]);
  });
}

//check text contrast
function checkTextContrast(color, text) {
  const luminance = chroma(color).luminance();
  if (luminance > 0.5) {
    text.style.color = "black";
  } else {
    text.style.color = "white";
  }
}

//colorize the sliders
function colorizeSliders(color, hue, brightness, saturation) {
  //scale saturation
  const noSat = color.set("hsl.s", 0);
  const fullSat = color.set("hsl.s", 1);
  const scaleSat = chroma.scale([noSat, color, fullSat]);
  //scale brightness
  const midBright = color.set("hsl.l", 0.5); //so it's no only black and white but also have the color
  const scaleBright = chroma.scale(["black", midBright, "white"]);

  //Update input colors
  saturation.style.backgroundImage = `linear-gradient(to right, ${scaleSat(
    0
  )}, ${scaleSat(1)})`;
  brightness.style.backgroundImage = `linear-gradient(to right, ${scaleBright(
    0
  )}, ${scaleBright(0.5)}, ${scaleBright(1)})`; //need the 0.5 to make it colored
  hue.style.backgroundImage = `linear-gradient(to right, rgb(204,75,75),rgb(204,204,75), rgb(75,204,75), rgb(75,204,204), rgb(75,75,204), rgb(204,75,204), rgb(204,75,7))`;
}

//make the sliders control the bg color
function hslControls(e) {
  const index =
    e.target.getAttribute("data-bright") ||
    e.target.getAttribute("data-sat") ||
    e.target.getAttribute("data-hue");

  let sliders = e.target.parentElement.querySelectorAll('input[type="range"]');
  const hue = sliders[0];
  const brightness = sliders[1];
  const saturation = sliders[2];

  const bgColor = initialColors[index]; //with initial colors, enables to change the color always from the initial and not from the text > otherwise break when dark, white or unsaturated

  let color = chroma(bgColor)
    .set("hsl.s", saturation.value)
    .set("hsl.l", brightness.value)
    .set("hsl.h", hue.value);

  colorDivs[index].style.backgroundColor = color;

  //colorize sliders/inputs
  colorizeSliders(color, hue, brightness, saturation);
}

//update the UI TEXT
function updateTextUI(index) {
  const activeDiv = colorDivs[index]; //select bg color
  const color = chroma(activeDiv.style.backgroundColor); //add it to chroma
  const textHex = activeDiv.querySelector("h2");
  const icons = activeDiv.querySelectorAll(".controls button");
  textHex.innerText = color.hex(); //convert from rgb to the hex

  //check contrast
  checkTextContrast(color, textHex);
  for (icon of icons) {
    checkTextContrast(color, icon);
  }
}

//adjust the slider position depending on the bg color
function resetInputs() {
  const sliders = document.querySelectorAll(".sliders input");
  sliders.forEach((slider) => {
    if (slider.name === "hue") {
      const hueColor = initialColors[slider.getAttribute("data-hue")]; //returns nb on which color we are affecting
      const hueValue = chroma(hueColor).hsl()[0]; //just get the hue (0)
      slider.value = Math.floor(hueValue);
    }
    if (slider.name === "saturation") {
      const satColor = initialColors[slider.getAttribute("data-sat")]; //returns nb on which color we are affecting
      const satValue = chroma(satColor).hsl()[1]; //just get the saturation (1)
      slider.value = Math.floor(satValue * 100) / 100;
    }
    if (slider.name === "brightness") {
      const brightColor = initialColors[slider.getAttribute("data-bright")]; //returns nb on which color we are affecting
      const brightValue = chroma(brightColor).hsl()[2]; //just get the brightness (3)
      slider.value = Math.floor(brightValue * 100) / 100; //need this cuz between 0 and 1
    }
  });
}

//COPY TO CLIPBOARD - little hack lol
function copyToClipboard(hex) {
  const el = document.createElement("textarea"); //creat text area out of nowhere to store the text
  el.value = hex.innerText; //select the text from hex
  document.body.appendChild(el); //store the text to the textarea
  el.select(); //select the text from textarea
  document.execCommand("copy"); //execute the command of copy
  document.body.removeChild(el); //kill the textarea
  // Popup animation
  const popupBox = popup.children[0];
  popup.classList.add("active");
  popupBox.classList.add("active");
}

//OPEN ADJUSTEMENT PANEL
function openAdjustmentPanel(index) {
  sliderContainers[index].classList.toggle("active");
  console.log(closeAdjustments);
}
function closeAdjustmentPanel(index) {
  sliderContainers[index].classList.remove("active");
}

//---
//IMPLEMENT SAVE TO PALETTE AND LOCAL STORAGE STUFF
//---

const saveBtn = document.querySelector(".save");
const submitSave = document.querySelector(".submit-save");
const closeSave = document.querySelector(".close-save");
const saveContainer = document.querySelector(".save-container");
const saveInput = document.querySelector(".save-container input");
const libraryContainer = document.querySelector(".library-container");
const libraryBtn = document.querySelector(".library");
const closeLibraryBtn = document.querySelector(".close-library");

//Event Listeners
saveBtn.addEventListener("click", openPalette);
closeSave.addEventListener("click", closePalette);
submitSave.addEventListener("click", savePalette);
libraryBtn.addEventListener("click", openLibrary);
closeLibraryBtn.addEventListener("click", closeLibrary);

function openPalette(e) {
  const popup = saveContainer.children[0];
  saveContainer.classList.add("active");
  popup.classList.add("active");
}

function closePalette(e) {
  const popup = saveContainer.children[0];
  saveContainer.classList.remove("active");
  popup.classList.remove("active");
}

//BIG ASS SAVE FUNCTION
function savePalette(e) {
  saveContainer.classList.remove("active");
  popup.classList.remove("active");
  const name = saveInput.value;
  const colors = [];
  currentHexes.forEach((hex) => {
    colors.push(hex.innerText);
  });

  //generate object
  let paletteNr;
  const paletteObjects = JSON.parse(localStorage.getItem("palettes"));
  if (paletteObjects) {
    paletteNr = paletteObjects.length;
  } else {
    paletteNr = savedPalettes.length;
  }
  const paletteObj = { name, colors, nr: paletteNr };
  savedPalettes.push(paletteObj);

  //save to local storage
  savetoLocal(paletteObj);
  saveInput.value = "";

  //Generate the palette for the library
  const palette = document.createElement("div");
  palette.classList.add("custom-palette");
  const title = document.createElement("h4");
  title.innerText = paletteObj.name;
  const preview = document.createElement("div");
  preview.classList.add("small-preview");
  paletteObj.colors.forEach((smallColor) => {
    const smallDiv = document.createElement("div");
    smallDiv.style.backgroundColor = smallColor;
    preview.appendChild(smallDiv);
  });
  const paletteBtn = document.createElement("button");
  paletteBtn.classList.add("pick-palette-btn");
  paletteBtn.classList.add(paletteObj.nr);
  paletteBtn.innerText = "Select";

  //Attach event to the button
  paletteBtn.addEventListener("click", (e) => {
    closeLibrary();
    const paletteIndex = e.target.classList[1];
    initialColors = []; //so the initial colors take the selected ones
    savedPalettes[paletteIndex].colors.forEach((color, index) => {
      initialColors.push(color);
      colorDivs[index].style.backgroundColor = color;
      const text = colorDivs[index].children[0];
      checkTextContrast(color, text);
      updateTextUI(index);
    });
    resetInputs;
  });

  //Append to library
  palette.appendChild(title);
  palette.appendChild(preview);
  palette.appendChild(paletteBtn);
  libraryContainer.children[0].appendChild(palette); //append the palettes to the library container
}

function savetoLocal(paletteObj) {
  let localPalettes;
  if (localStorage.getItem("palettes") === null) {
    localPalettes = [];
  } else {
    localPalettes = JSON.parse(localStorage.getItem("palettes"));
  }
  localPalettes.push(paletteObj);
  localStorage.setItem("palettes", JSON.stringify(localPalettes));
}

function openLibrary() {
  const popup = libraryContainer.children[0];
  libraryContainer.classList.add("active");
  popup.classList.add("active");
}
function closeLibrary() {
  const popup = libraryContainer.children[0];
  libraryContainer.classList.remove("active");
  popup.classList.remove("active");
}

function getLocal() {
  if (localStorage.getItem("palettes") === null) {
    localPalettes = [];
  } else {
    const paletteObjects = JSON.parse(localStorage.getItem("palettes"));
    savedPalettes = [...paletteObjects];

    paletteObjects.forEach((paletteObj) => {
      //Generate the palette for the library
      const palette = document.createElement("div");
      palette.classList.add("custom-palette");
      const title = document.createElement("h4");
      title.innerText = paletteObj.name;
      const preview = document.createElement("div");
      preview.classList.add("small-preview");
      paletteObj.colors.forEach((smallColor) => {
        const smallDiv = document.createElement("div");
        smallDiv.style.backgroundColor = smallColor;
        preview.appendChild(smallDiv);
      });
      const paletteBtn = document.createElement("button");
      paletteBtn.classList.add("pick-palette-btn");
      paletteBtn.classList.add(paletteObj.nr);
      paletteBtn.innerText = "Select";

      //Attach event to the button
      paletteBtn.addEventListener("click", (e) => {
        closeLibrary();
        const paletteIndex = e.target.classList[1];
        initialColors = []; //so the initial colors take the selected ones
        paletteObjects[paletteIndex].colors.forEach((color, index) => {
          initialColors.push(color);
          colorDivs[index].style.backgroundColor = color;
          const text = colorDivs[index].children[0];
          checkTextContrast(color, text);
          updateTextUI(index);
        });
        resetInputs;
      });

      //Append to library
      palette.appendChild(title);
      palette.appendChild(preview);
      palette.appendChild(paletteBtn);
      libraryContainer.children[0].appendChild(palette); //append the palettes to the library container
    });
  }
}

getLocal();
randomColors();
