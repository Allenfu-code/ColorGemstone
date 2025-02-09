document.addEventListener("DOMContentLoaded", () => {
    // 1. 初始化 Supabase 客戶端
    // 請將 YOUR_SUPABASE_URL 與 YOUR_SUPABASE_ANON_KEY 替換為您的專案資訊
    const { createClient } = window.supabase;
    const supabaseUrl = "https://jclwcnbsqpwtrgagalsr.supabase.co";
    const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpjbHdjbmJzcXB3dHJnYWdhbHNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzg0MDEzNDAsImV4cCI6MjA1Mzk3NzM0MH0.13xuYlYCS9uE5R_lopvJZuJD7BY85lEvY7G8xp204CY";
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // 2. 解析 URL 參數，取得 photoUrl 與 album
    const params = new URLSearchParams(window.location.search);
    const photoUrl = params.get("url");
    const album = params.get("album") || "";

    if (!photoUrl) {
        document.body.innerHTML = "<p>找不到相片資料。</p>";
        return;
    }

    // 3. 設定相片顯示
    const photoImage = document.getElementById("photoImage");
    photoImage.src = photoUrl;

    // 4. 設定隱藏的 photoUrl 欄位
    const photoUrlField = document.getElementById("photoUrl");
    photoUrlField.value = photoUrl;

    // 5. 預設相冊欄位
    const photoAlbumField = document.getElementById("photoAlbum");
    photoAlbumField.value = album;

    // 6. 從 localStorage 讀取現有的相片詳細資料
    let photoDetails = localStorage.getItem("photoDetails");
    if (photoDetails) {
        photoDetails = JSON.parse(photoDetails);
    } else {
        photoDetails = {};
    }

    // 7. 如果已有該相片的詳細資料，則填入表單欄位
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

    // 8. 監聽表單提交事件
    const form = document.getElementById("photoDetailForm");
    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const updatedAlbum = photoAlbumField.value;
        const updatedTime = document.getElementById("photoTime").value;
        const updatedLocation = document.getElementById("photoLocation").value;
        const updatedDescription = document.getElementById("photoDescription").value;

        // (a) 更新 localStorage 中的相片詳細資料
        photoDetails[photoUrl] = {
            album: updatedAlbum,
            time: updatedTime,
            location: updatedLocation,
            description: updatedDescription
        };
        localStorage.setItem("photoDetails", JSON.stringify(photoDetails));

        // (b) 更新 uploadedPhotos 中該相片的相冊類別
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
                // 觸發更新事件，以便 gallery.html 重新載入相簿
                localStorage.setItem("albumUpdate", Date.now());
            }
        }

        // (c) 新增：將更新後的資料寫入 Supabase
        try {
            const { data, error } = await supabase
                .from("ColorGemstone") // 目標資料表
                .insert([
                    {
                        // 對應資料表欄位：id (自動生成)、created_at (自動生成)
                        category: updatedAlbum,      // album → category
                        captime: updatedTime,        // time → captime
                        location: updatedLocation,   // location
                        statement: updatedDescription // description → statement
                    }
                ]);

            if (error) {
                console.error("插入資料到 Supabase 時發生錯誤:", error);
            } else {
                console.log("成功插入資料到 Supabase:", data);
            }
        } catch (err) {
            console.error("無法連線到 Supabase:", err);
        }

        // (d) 顯示更新成功訊息
        const updateMessage = document.getElementById("updateMessage");
        updateMessage.textContent = "更新成功！";
    });
});
