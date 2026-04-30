import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Play, Trash2, Download, AudioLines, Disc } from 'lucide-react';
import { AudioEngine } from './audio-engine';
import { MusicPlayer } from './music-player';

export interface SavedComposition {
  id: string;
  name: string;
  beatPattern?: boolean[][];
  pianoRecording?: Array<{ note: string; time: number }>;
  tempo: number;
  createdAt: number;
}

interface UploadedTrack {
  _id: string;
  title: string;
  artist: string;
  fileUrl: string;
  createdAt: string;
}

interface MusicLibraryProps {
  audioEngine: AudioEngine;
  onLoad?: (composition: SavedComposition) => void;
}

export function MusicLibrary({ audioEngine, onLoad }: MusicLibraryProps) {
  const [compositions, setCompositions] = useState<SavedComposition[]>([]);
  const [uploadedTracks, setUploadedTracks] = useState<UploadedTrack[]>([]);
  const [playingComposition, setPlayingComposition] = useState<SavedComposition | null>(null);

  useEffect(() => {
    loadCompositions();
    fetchUploadedTracks();
  }, []);

  const loadCompositions = () => {
    const saved = localStorage.getItem('musicCompositions');
    if (saved) setCompositions(JSON.parse(saved));
  };

  const fetchUploadedTracks = async () => {
    try {
      const response = await fetch('http://127.0.0.1:5001/api/tracks');
      if (!response.ok) throw new Error();
      const data = await response.json();
      setUploadedTracks(data);
    } catch (err) {
      console.error("Failed to fetch tracks:", err);
    }
  };

  const deleteComposition = (id: string) => {
    if (!window.confirm("Permanently delete this composition?")) return;
    const saved = localStorage.getItem('musicCompositions');
    const current = saved ? JSON.parse(saved) : [];
    const updated = current.filter((c: any) => c.id !== id);
    localStorage.setItem('musicCompositions', JSON.stringify(updated));
    setCompositions(updated);
    if (playingComposition?.id === id) setPlayingComposition(null);
  };

  const deleteUploadedTrack = async (id: string) => {
  if (!window.confirm("Permanently delete this track from the server?")) return;
  
  console.log("📡 Sending DELETE request for ID:", id);
  
  try {
    // We use 127.0.0.1 to avoid local DNS issues
    const response = await fetch(`http://127.0.0.1:5001/api/tracks/${id}`, { 
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' }
    });

    if (response.ok) {
      setUploadedTracks(prev => prev.filter(t => t._id !== id));
      console.log("✅ Frontend: Track removed from UI");
    } else {
      // If we get here, the server responded with 404 or 500
      const errorData = await response.json();
      console.error("❌ Server rejected delete:", errorData);
      alert(`Server Error: ${errorData.message || "Failed to delete"}`);
    }
  } catch (err) {
    console.error("❌ Connection failed:", err);
    alert("Connection failed: Is your backend terminal open and running on port 5001?");
  }
};

  return (
    <div className="flex flex-col h-[70vh] gap-6">
      {/* MASTER OUTPUT PLAYER */}
      <div className="sticky top-0 z-20 bg-slate-900/90 backdrop-blur-md p-4 rounded-xl border border-purple-500/30 shadow-2xl">
        {playingComposition ? (
          <div className="animate-in fade-in zoom-in-95 duration-300">
            <div className="flex items-center gap-2 mb-3 text-purple-400">
              <AudioLines className="size-4 animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-widest">Master Output</span>
            </div>
            <MusicPlayer 
              composition={playingComposition} 
              audioEngine={audioEngine}
              onClose={() => setPlayingComposition(null)}
            />
          </div>
        ) : (
          <div className="h-24 flex flex-col items-center justify-center border-2 border-dashed border-slate-800 rounded-lg">
            <Disc className="size-6 text-slate-700 mb-2" />
            <p className="text-xs text-slate-500 font-medium">Select a track to start playback</p>
          </div>
        )}
      </div>

      {/* TABS SECTION */}
      <Tabs defaultValue="compositions" className="flex-1 flex flex-col overflow-hidden">
        <TabsList className="grid w-full grid-cols-2 bg-slate-950/50 p-1 mb-4 border border-slate-800">
          <TabsTrigger 
            value="compositions" 
            className="text-slate-400 data-[state=active]:bg-purple-600 data-[state=active]:text-white font-bold transition-all"
          >
            Saved Projects
          </TabsTrigger>
          <TabsTrigger 
            value="uploads" 
            className="text-slate-400 data-[state=active]:bg-purple-600 data-[state=active]:text-white font-bold transition-all"
          >
            Audio Uploads
          </TabsTrigger>
        </TabsList>

        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
          {/* PROJECTS TAB */}
          <TabsContent value="compositions" className="mt-0 space-y-3">
            {compositions.length === 0 ? (
              <div className="p-12 text-center text-slate-500 italic">No saved projects.</div>
            ) : (
              compositions.map((comp) => (
                <Card key={comp.id} className="p-4 bg-slate-900 border-slate-800 hover:border-purple-500/50 transition-all">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-white font-bold truncate">{comp.name}</h4>
                      <p className="text-[10px] text-slate-500 uppercase font-mono">{comp.tempo} BPM</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" onClick={() => setPlayingComposition(comp)} className="bg-purple-600">
                        <Play className="size-3 mr-1" /> Listen
                      </Button>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="text-slate-400 hover:text-red-500 hover:bg-red-500/10"
                        onClick={() => deleteComposition(comp.id)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </TabsContent>

          {/* UPLOADS TAB */}
          <TabsContent value="uploads" className="mt-0 space-y-3">
            {uploadedTracks.length === 0 ? (
              <div className="p-12 text-center text-slate-500 italic">No server uploads found.</div>
            ) : (
              uploadedTracks.map((track) => (
                <Card key={track._id} className="p-4 bg-slate-900 border-slate-800 border-l-4 border-l-purple-500">
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <div className="min-w-0">
                        <h4 className="text-white font-bold truncate text-lg">{track.title}</h4>
                        <p className="text-[10px] text-purple-400 uppercase tracking-widest">{track.artist || 'Standalone'}</p>
                      </div>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-10 w-10 text-red-500 hover:text-white hover:bg-red-600 transition-all rounded-full" 
                        onClick={() => deleteUploadedTrack(track._id)}
                      >
                        <Trash2 className="size-5" />
                      </Button>
                    </div>
                    <audio controls className="h-8 w-full filter invert opacity-90 brightness-125">
                      <source src={track.fileUrl} type="audio/mpeg" />
                    </audio>
                  </div>
                </Card>
              ))
            )}
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}