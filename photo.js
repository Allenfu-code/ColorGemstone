document.addEventListener("DOMContentLoaded", () => {
    // 解析 URL 參數
    const params = new URLSearchParams(window.location.search);
    const photoUrl = params.get("url");
    const album = params.get("album") || "";
    if (!photoUrl) {
        document.body.innerHTML = "<p>找不到相片資料。</p>";
        return;
    }

    // 設定相片顯示
    const photoImage = document.getElementById("photoImage");
    photoImage.src = photoUrl;

    // 設定隱藏的 photoUrl 欄位
    const photoUrlField = document.getElementById("photoUrl");
    photoUrlField.value = photoUrl;

    // 預設相冊欄位
    const photoAlbumField = document.getElementById("photoAlbum");
    photoAlbumField.value = album;

    // 從 localStorage 讀取現有的相片詳細資料
    let photoDetails = localStorage.getItem("photoDetails");
    if (photoDetails) {
        photoDetails = JSON.parse(photoDetails);
    } else {
        photoDetails = {};
    }

    // 如果已有該相片的詳細資料，則填入表單欄位
    if (photoDetails[photoUrl]) {
        const details = photoDetails[photoUrl];
        if (details.album) photoAlbumField.value = details.album;
        if (details.time) {
            document.getElementById("photoTime").value = details.time;
        }
        if (details.location) {
            document.getElementById("photoLocation").value = details.location;
        }
        if (details.description) {
            document.getElementById("photoDescription").value = details.description;
        }
    }

    // 表單提交事件，更新相片詳細資料
    const form = document.getElementById("photoDetailForm");
    form.addEventListener("submit", (e) => {
        e.preventDefault();
        const updatedAlbum = photoAlbumField.value;
        const updatedTime = document.getElementById("photoTime").value;
        const updatedLocation = document.getElementById("photoLocation").value;
        const updatedDescription = document.getElementById("photoDescription").value;

        // 更新相片詳細資料並儲存回 localStorage
        photoDetails[photoUrl] = {
            album: updatedAlbum,
            time: updatedTime,
            location: updatedLocation,
            description: updatedDescription
        };
        localStorage.setItem("photoDetails", JSON.stringify(photoDetails));

        // 更新 uploadedPhotos 中該相片的相冊類別
        let uploadedPhotos = localStorage.getItem("uploadedPhotos");
        if (uploadedPhotos) {
            uploadedPhotos = JSON.parse(uploadedPhotos);
            let updated = false;
            for (let i = 0; i < uploadedPhotos.length; i++) {
                if (uploadedPhotos[i].url === photoUrl) {
                    uploadedPhotos[i].album = updatedAlbum;
                    updated = true;
                    break;
                }
            }
            if (updated) {
                localStorage.setItem("uploadedPhotos", JSON.stringify(uploadedPhotos));
                // 觸發更新事件，gallery.html 會根據 storage 事件自動更新其相冊類別
                localStorage.setItem("albumUpdate", Date.now());
            }
        }

        // 顯示更新成功訊息
        const updateMessage = document.getElementById("updateMessage");
        updateMessage.textContent = "更新成功！";
    });
});
