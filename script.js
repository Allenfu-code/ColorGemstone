document.addEventListener("DOMContentLoaded", () => {
    if (document.getElementById("gallery")) {
        fetch("gallery.json")
            .then(response => response.json())
            .then(images => {
                let gallery = document.getElementById("gallery");
                gallery.innerHTML = "";
                images.forEach(img => {
                    let imgElement = document.createElement("img");
                    imgElement.src = img.url;
                    imgElement.alt = img.title;
                    imgElement.style.width = "200px";
                    imgElement.style.margin = "10px";
                    gallery.appendChild(imgElement);
                });
            })
            .catch(error => console.error("相簿加载失败", error));
    }
});
