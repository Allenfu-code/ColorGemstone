document.addEventListener("DOMContentLoaded", async () => {
    const albumSelect = document.getElementById("albumSelect");
    const uploadForm = document.getElementById("uploadForm");
    const uploadMessage = document.getElementById("uploadMessage");

    // Load album options from gallery.json
    try {
        const response = await fetch("gallery.json");
        if (!response.ok) throw new Error("無法加載相簿數據");
        const albums = await response.json();
        // Populate albumSelect with album names from gallery.json
        for (const album in albums) {
            const option = document.createElement("option");
            option.value = album;
            option.textContent = album;
            albumSelect.appendChild(option);
        }
    } catch (error) {
        console.error("加載相簿數據失敗:", error);
        // If failed, provide a default option
        const option = document.createElement("option");
        option.value = "其他";
        option.textContent = "其他";
        albumSelect.appendChild(option);
    }

    uploadForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const album = albumSelect.value;
        const title = document.getElementById("photoTitle").value;
        const fileInput = document.getElementById("photoFile");
        const file = fileInput.files[0];

        if (!file) {
            uploadMessage.textContent = "請選擇一個檔案。";
            return;
        }

        const reader = new FileReader();
        reader.onload = function(event) {
            const dataUrl = event.target.result;
            // Get existing uploaded photos from localStorage
            let uploadedPhotos = localStorage.getItem("uploadedPhotos");
            if (uploadedPhotos) {
                uploadedPhotos = JSON.parse(uploadedPhotos);
            } else {
                uploadedPhotos = [];
            }
            // Add new photo
            uploadedPhotos.push({
                album: album,
                title: title,
                url: dataUrl
            });
            // Save back to localStorage
            localStorage.setItem("uploadedPhotos", JSON.stringify(uploadedPhotos));
            uploadMessage.textContent = "上傳成功！";
            // Clear form fields
            uploadForm.reset();
        };
        reader.readAsDataURL(file);
    });
});
