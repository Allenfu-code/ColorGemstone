document.addEventListener("DOMContentLoaded", async () => {
    // 1) 初始化 Supabase 客戶端
    const { createClient } = window.supabase;
    const supabaseUrl = "https://jclwcnbsqpwtrgagalsr.supabase.co";  // <-- 請換成您的 Supabase URL
    const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpjbHdjbmJzcXB3dHJnYWdhbHNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzg0MDEzNDAsImV4cCI6MjA1Mzk3NzM0MH0.13xuYlYCS9uE5R_lopvJZuJD7BY85lEvY7G8xp204CY"; // <-- 請換成您的 anon key
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
  
    // 2) DOM 參考
    const albumSelect = document.getElementById("albumSelect");
    const uploadForm = document.getElementById("uploadForm");
    const uploadMessage = document.getElementById("uploadMessage");
  
    // (A) 您可以動態載入相簿清單，或直接硬碼選項
    const defaultAlbums = ["旅行", "家庭", "城市"];
    defaultAlbums.forEach(album => {
      const option = document.createElement("option");
      option.value = album;
      option.textContent = album;
      albumSelect.appendChild(option);
    });
  
    // 3) 綁定表單「上傳」事件
    uploadForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      uploadMessage.textContent = "上傳中...";
  
      // (B) 取得使用者輸入
      const album = albumSelect.value;
      const photoTitle = document.getElementById("photoTitle").value;
      const fileInput = document.getElementById("photoFile");
      const file = fileInput.files[0];
  
      // 以下三個為「新增」欄位
      const photoTime = document.getElementById("photoTime").value;         // 對應 captime
      const photoLocation = document.getElementById("photoLocation").value; // 對應 location
      const photoDescription = document.getElementById("photoDescription").value; // 對應 statement
  
      if (!file) {
        uploadMessage.textContent = "請選擇一個檔案。";
        return;
      }
  
      // (C) 上傳檔案到 Supabase Storage
      try {
        // 產生獨特檔名
        const uniqueFilename = Date.now() + "_" + file.name;
  
        // 假設您的 Bucket 名稱為 "ColorGemstonePhoto"
        const { data: storageData, error: storageError } = await supabase
          .storage
          .from("ColorGemstonePhoto")  // <-- 修改成您的 bucket 名稱
          .upload(uniqueFilename, file, {
            upsert: false // 若檔名重複則上傳失敗，可視需求改 true
          });
  
        if (storageError) {
          console.error("上傳到 Supabase Storage 失敗:", storageError);
          uploadMessage.textContent = "上傳失敗，請稍後重試。";
          return;
        }
  
        // 取得公開 URL (若 bucket 設為 public)
        const { data: publicUrlData } = supabase
          .storage
          .from("ColorGemstonePhoto")
          .getPublicUrl(storageData.path);
  
        const photoUrl = publicUrlData.publicUrl;
        console.log("檔案可供讀取之 URL：", photoUrl);
  
        // (D) 寫入資料表 (ColorGemstone)
        // 將 album 存到 category, photoTitle 可視需求，
        // photoTime => captime, photoLocation => location, photoDescription => statement
        const { data: insertData, error: insertError } = await supabase
          .from("ColorGemstone")
          .insert([
            {
              category: album,
              captime: photoTime,
              location: photoLocation,
              statement: photoDescription,
              photourl: photoUrl
              // 如果想另外儲存 photoTitle，需先在資料表加欄位 (如 "title")，然後補上:
              // title: photoTitle
            }
          ]);
  
        if (insertError) {
          console.error("插入資料到 ColorGemstone 失敗:", insertError);
          uploadMessage.textContent = "資料記錄失敗 (Database Insert Error)。";
          return;
        }
  
        // (E) 顯示成功訊息
        console.log("已成功插入資料:", insertData);
        uploadMessage.textContent = "上傳成功！";
  
        // (F) 清空表單
        uploadForm.reset();
  
      } catch (err) {
        console.error("無法連線到 Supabase:", err);
        uploadMessage.textContent = "上傳過程發生錯誤，請檢查網路或稍後再試。";
      }
    });
  });
  