import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Play, Trash2, Disc } from 'lucide-react';
import { AudioEngine } from './audio-engine';
import { MusicPlayer } from './music-player';

export interface SavedComposition {
  id: string;
  _id?: string;
  title: string;
  visibility?: 'private' | 'public';
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
}

interface MusicLibraryProps {
  audioEngine: AudioEngine;
  onLoad?: (composition: SavedComposition) => void;
}

export function MusicLibrary({ audioEngine }: MusicLibraryProps) {
  const [compositions, setCompositions] = useState<SavedComposition[]>([]);
  const [uploadedTracks, setUploadedTracks] = useState<UploadedTrack[]>([]);
  const [playingComposition, setPlayingComposition] = useState<SavedComposition | null>(null);

  useEffect(() => {
    loadCompositions();
    fetchUploadedTracks();
  }, []);

  const loadCompositions = async () => {
    try {
      const response = await fetch('http://127.0.0.1:5001/api/compositions');

      if (response.ok) {
        const data = await response.json();

        const fixedData = data.map((comp: any) => ({
          ...comp,
          id: comp._id,
        }));

        setCompositions(fixedData);
      }
    } catch (err) {
      console.error("Could not load compositions from backend:", err);
    }
  };

  const fetchUploadedTracks = async () => {
    try {
      const response = await fetch('http://127.0.0.1:5001/api/tracks');
      if (response.ok) {
        const data = await response.json();
        setUploadedTracks(data);
      }
    } catch (err) {
      console.error("Library sync failed: Backend might be offline.", err);
    }
  };

  const deleteUploadedTrack = async (id: string) => {
    if (!window.confirm("Permanently delete this track from the studio?")) return;

    try {
      const response = await fetch(`http://127.0.0.1:5001/api/tracks/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setUploadedTracks(prev => prev.filter(t => t._id !== id));
      }
    } catch (err) {
      alert("Connection error: Could not reach the backend to delete.");
    }
  };

  const privateCompositions = compositions.filter(comp => comp.visibility !== 'public');
  const publicCompositions = compositions.filter(comp => comp.visibility === 'public');

  const renderCompositionList = (
    list: SavedComposition[],
    emptyText: string,
    label: 'Private' | 'Public'
  ) => {
    if (list.length === 0) {
      return <p className="text-center text-slate-600 italic py-10">{emptyText}</p>;
    }

    return list.map((comp) => (
      <Card
        key={comp.id}
        className="p-4 bg-slate-900 border-slate-800 hover:border-purple-500/40 transition-colors"
      >
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-white font-bold">{comp.title || 'Untitled Composition'}</h4>
            <p className="text-[10px] text-slate-500 font-mono">
              {comp.tempo} BPM • {label}
            </p>
          </div>

          <Button
            size="sm"
            onClick={() => setPlayingComposition(comp)}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <Play className="size-3 mr-1" /> Listen
          </Button>
        </div>
      </Card>
    ));
  };

  return (
    <div className="flex flex-col h-[70vh] gap-6 animate-in fade-in duration-500">
      <div className="bg-slate-900/90 backdrop-blur-md p-4 rounded-xl border border-purple-500/30 shadow-2xl">
        {playingComposition ? (
          <MusicPlayer
            composition={playingComposition}
            audioEngine={audioEngine}
            onClose={() => setPlayingComposition(null)}
          />
        ) : (
          <div className="h-24 flex flex-col items-center justify-center border-2 border-dashed border-slate-800 rounded-lg group hover:border-slate-700 transition-colors">
            <Disc className="size-6 text-slate-700 mb-2 group-hover:animate-spin-slow" />
            <p className="text-xs text-slate-500 font-medium">Select a track to play</p>
          </div>
        )}
      </div>

      <Tabs defaultValue="private" className="flex-1 flex flex-col overflow-hidden">
        <TabsList className="grid w-full grid-cols-3 bg-slate-950/50 p-1 mb-4 border border-slate-800">
          <TabsTrigger value="private">Private</TabsTrigger>
          <TabsTrigger value="public">Public</TabsTrigger>
          <TabsTrigger value="uploads">Audio Uploads</TabsTrigger>
        </TabsList>

        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
          <TabsContent value="private" className="space-y-3 mt-0">
            {renderCompositionList(privateCompositions, 'No private projects found.', 'Private')}
          </TabsContent>

          <TabsContent value="public" className="space-y-3 mt-0">
            {renderCompositionList(publicCompositions, 'No public projects found.', 'Public')}
          </TabsContent>

          <TabsContent value="uploads" className="space-y-3 mt-0">
            {uploadedTracks.length === 0 ? (
              <p className="text-center text-slate-600 italic py-10">
                No audio files uploaded to server.
              </p>
            ) : (
              uploadedTracks.map((track) => (
                <Card
                  key={track._id}
                  className="p-4 bg-slate-900 border-slate-800 border-l-4 border-l-purple-500"
                >
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <div className="min-w-0">
                        <h4 className="text-white font-bold truncate">{track.title}</h4>
                        <p className="text-[10px] text-purple-400 uppercase tracking-widest font-bold">
                          {track.artist || 'Standalone Audio'}
                        </p>
                      </div>

                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-red-500 hover:bg-red-600 hover:text-white rounded-full transition-all"
                        onClick={() => deleteUploadedTrack(track._id)}
                      >
                        <Trash2 className="size-5" />
                      </Button>
                    </div>

                    <audio controls className="h-8 w-full filter invert opacity-80">
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