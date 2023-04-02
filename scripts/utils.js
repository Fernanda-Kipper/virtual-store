function closeModal() {
    let modal = document.getElementById("modal");
    modal.style.display = "none";
}

function goHome(){
    window.location.pathname = "index.html"
}

function openCart(){
    window.location.pathname = "cart.html"
}

function degToRad(deg) {
    return deg * Math.PI / 180;
}

document.addEventListener("click", function(event) {
    if(event.target == document.getElementById("modal")){
        closeModal();
    }
})
