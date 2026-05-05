import { useState } from 'react';


export default function SongUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return alert("Please select a file first!");

    const formData = new FormData();
    formData.append('audio', file);
    formData.append('title', title);
    formData.append('artist', 'Your Name'); 

    try {
      const res = await fetch('https://musicmaker-studio.onrender.com', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      alert("Song uploaded successfully!");
    } catch (err) {
      console.error("Upload failed", err);
    }
  };

  return (
  <div className="space-y-4">
    <div className="grid gap-2">
      <label className="text-sm font-medium text-slate-200">Song Title</label>
      <input 
        type="text" 
        placeholder="Enter track name..." 
        className="w-full p-2 rounded-md bg-slate-800 border border-slate-700 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
        onChange={(e) => setTitle(e.target.value)} 
        required 
      />
    </div>

    <div className="grid gap-2">
      <label className="text-sm font-medium text-slate-200">Audio File</label>
      <input 
        type="file" 
        accept="audio/*" 
        className="text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-600 file:text-white hover:file:bg-purple-700 cursor:pointer"
        onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)} 
        required 
      />
    </div>

    <button 
      onClick={handleUpload}
      className="w-full py-2 px-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold rounded-lg transition-all"
    >
      Upload Track
    </button>
  </div>
);
}