document.addEventListener("DOMContentLoaded", () => {
    const gallery = document.getElementById("gallery");
    if (gallery) {
        fetch("gallery.json")
            .then(response => {
                if (!response.ok) {
                    throw new Error("Network response was not ok");
                }
                return response.json();
            })
            .then(albums => {
                gallery.innerHTML = "";
                
                Object.entries(albums).forEach(([albumName, images]) => {
                    const albumSection = document.createElement("section");
                    const albumTitle = document.createElement("h2");
                    albumTitle.textContent = albumName;
                    albumSection.appendChild(albumTitle);
                    
                    const albumContainer = document.createElement("div");
                    albumContainer.classList.add("album-container");
                    
                    images.forEach(img => {
                        if (img.url && img.title) {
                            const imgWrapper = document.createElement("div");
                            imgWrapper.classList.add("image-wrapper");
                            
                            const imgElement = document.createElement("img");
                            imgElement.src = img.url;
                            imgElement.alt = img.title;
                            imgElement.style.width = "200px";
                            imgElement.style.margin = "10px";
                            imgElement.classList.add("lightbox-trigger");
                            imgElement.dataset.src = img.url;
                            
                            imgWrapper.appendChild(imgElement);
                            albumContainer.appendChild(imgWrapper);
                        }
                    });
                    
                    albumSection.appendChild(albumContainer);
                    gallery.appendChild(albumSection);
                });
                
                document.querySelectorAll(".lightbox-trigger").forEach(img => {
                    img.addEventListener("click", function() {
                        const lightbox = document.createElement("div");
                        lightbox.classList.add("lightbox");
                        
                        const lightboxImg = document.createElement("img");
                        lightboxImg.src = this.dataset.src;
                        
                        lightbox.appendChild(lightboxImg);
                        document.body.appendChild(lightbox);
                        
                        lightbox.addEventListener("click", () => {
                            lightbox.remove();
                        });
                    });
                });
            })
            .catch(error => console.error("相簿加载失败: ", error));
    }
});