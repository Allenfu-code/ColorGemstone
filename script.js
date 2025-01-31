document.addEventListener("DOMContentLoaded", () => {
    if (document.getElementById("gallery")) {
        fetch("gallery.json")
            .then(response => response.json())
            .then(albums => {
                let gallery = document.getElementById("gallery");
                gallery.innerHTML = "";
                
                Object.keys(albums).forEach(albumName => {
                    let albumSection = document.createElement("section");
                    let albumTitle = document.createElement("h2");
                    albumTitle.textContent = albumName;
                    albumSection.appendChild(albumTitle);
                    
                    let albumContainer = document.createElement("div");
                    albumContainer.classList.add("album-container");
                    
                    albums[albumName].forEach(img => {
                        let imgWrapper = document.createElement("div");
                        imgWrapper.classList.add("image-wrapper");
                        
                        let imgElement = document.createElement("img");
                        imgElement.src = img.url;
                        imgElement.alt = img.title;
                        imgElement.style.width = "200px";
                        imgElement.style.margin = "10px";
                        imgElement.classList.add("lightbox-trigger");
                        imgElement.dataset.src = img.url;
                        
                        imgWrapper.appendChild(imgElement);
                        albumContainer.appendChild(imgWrapper);
                    });
                    
                    albumSection.appendChild(albumContainer);
                    gallery.appendChild(albumSection);
                });
                
                document.querySelectorAll(".lightbox-trigger").forEach(img => {
                    img.addEventListener("click", function() {
                        let lightbox = document.createElement("div");
                        lightbox.classList.add("lightbox");
                        
                        let lightboxImg = document.createElement("img");
                        lightboxImg.src = this.dataset.src;
                        
                        lightbox.appendChild(lightboxImg);
                        document.body.appendChild(lightbox);
                        
                        lightbox.addEventListener("click", function() {
                            document.body.removeChild(lightbox);
                        });
                    });
                });
            })
            .catch(error => console.error("相簿加载失败", error));
    }
});
