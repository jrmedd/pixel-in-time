const changeText = (elementId, newText) => {
    let element = document.getElementById(elementId);
    element.innerHTML = newText;
}

const fadeText = (elementId, newText) => {
    let element = document.getElementById(elementId);
    element.classList.add('fadeOut');
    element.addEventListener('webkitAnimationEnd', ()=> {
        element.classList.remove('fadeOut')
        element.innerHTML = newText;
    });
}

const appendText = (elementId, newText) => {
    let element = document.getElementById(elementId);
    element.innerHTML += newText;
}