import { useState } from "react";
import { useDBUser } from "../context/UserContext";
import { axiosInstance } from "../utils/axiosInstance";

function UploadVideoFromCDN() {
  const [cdnUrl, setCdnUrl] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const { dbUser } = useDBUser();

  const handleUpload = async () => {
    const res = await axiosInstance.post("/agent/upload-youtube", {
      userId: dbUser?.id,
      cdnUrl,
      title,
      description,
    });
    console.log("Upload result:", res.data);
  };

  return (
    <div>
      <input
        placeholder="CDN URL"
        onChange={(e) => setCdnUrl(e.target.value)}
      />
      <input placeholder="Title" onChange={(e) => setTitle(e.target.value)} />
      <textarea
        placeholder="Description"
        onChange={(e) => setDescription(e.target.value)}
      />
      <button onClick={handleUpload}>Upload from CDN</button>
    </div>
  );
}

export default UploadVideoFromCDN;
