import { useState, useRef, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './components/ui/dialog';
import { Save, Music2, Library, Upload, Timer, Volume2 } from 'lucide-react';
import { AudioEngine } from './components/audio-engine';
import { BeatMaker } from './components/beat-maker';
import { PianoKeyboard } from './components/piano-keyboard';
import { MusicLibrary, SavedComposition } from './components/music-library';
import SongUpload from './components/SongUpload';

// --- DATA FROM KADEEM'S VERSION ---
const featuredTracks = [
  { title: 'Neon Nights', artist: 'DJ Pulse', genre: 'Electronic', color: 'from-purple-600 to-pink-600' },
  { title: 'Midnight Groove', artist: 'Luna Beats', genre: 'Lo-Fi', color: 'from-blue-600 to-purple-600' },
  { title: 'Solar Drift', artist: 'Wavecraft', genre: 'Ambient', color: 'from-pink-600 to-orange-500' },
];

const trendingTracks = [
  { rank: 1, title: 'Cosmic Rain', artist: 'Starfield', genre: 'Electronic', duration: '3:42' },
  { rank: 2, title: 'Deep Blue', artist: 'OceanWave', genre: 'Ambient', duration: '4:15' },
  { rank: 3, title: 'Fire Walk', artist: 'Ember Fox', genre: 'Hip-Hop', duration: '2:58' },
  { rank: 4, title: 'Crystal Skies', artist: 'Aura', genre: 'Lo-Fi', duration: '5:01' },
  { rank: 5, title: 'Rhythm Storm', artist: 'DJ Pulse', genre: 'Electronic', duration: '3:27' },
];

const playlists = [
  { name: 'Chill Vibes', tracks: 24, genre: 'Lo-Fi', color: 'from-blue-500 to-cyan-500' },
  { name: 'Late Night', tracks: 18, genre: 'Ambient', color: 'from-purple-500 to-indigo-500' },
  { name: 'Energy Boost', tracks: 31, genre: 'Electronic', color: 'from-pink-500 to-rose-500' },
  { name: 'Focus Flow', tracks: 15, genre: 'Lo-Fi', color: 'from-orange-500 to-yellow-500' },
];

export default function App() {
  const audioEngineRef = useRef<AudioEngine>(new AudioEngine());
  const [activeTab, setActiveTab] = useState('create');
  
  // Studio State
  const [beatPattern, setBeatPattern] = useState<boolean[][]>([]);
  const [pianoRecording, setPianoRecording] = useState<Array<{ note: string; time: number }>>([]);
  const [tempo, setTempo] = useState(120);
  const [masterVolume, setMasterVolume] = useState(0.8);
  
  // UI & Save State
  const [compositionName, setCompositionName] = useState('');
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [refreshLibrary, setRefreshLibrary] = useState(0);
  const [visibility, setVisibility] = useState<'private' | 'public'>('private');

  // Handle Volume
  const handleVolumeChange = (value: number) => {
    setMasterVolume(value);
    audioEngineRef.current.setMasterVolume(value);
  };

  // --- THE FIXED SAVE LOGIC ---
  const saveComposition = async () => {
    if (!compositionName.trim()) return;

    try {
      const composition = {
        title: compositionName,
        visibility,
        beatPattern,
        pianoRecording,
        tempo,
        createdAt: Date.now(),
      };

      // Hit your working 5001 backend
      const response = await fetch('http://localhost:5001/api/playlists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(composition),
      });

      // Also save locally for the Library tab
      const saved = localStorage.getItem('musicCompositions');
      const compositions = saved ? JSON.parse(saved) : [];
      compositions.unshift({ ...composition, id: Date.now().toString() });
      localStorage.setItem('musicCompositions', JSON.stringify(compositions));

      setCompositionName('');
      setSaveDialogOpen(false);
      setRefreshLibrary((prev) => prev + 1);
      setActiveTab('library');
      
      console.log("✅ Composition saved to DB and LocalStorage");
    } catch (error) {
      console.error('Error saving:', error);
      alert('Save failed. Backend might be down.');
    }
  };

  const loadComposition = (composition: SavedComposition) => {
    if (composition.beatPattern) setBeatPattern(composition.beatPattern);
    if (composition.pianoRecording) setPianoRecording(composition.pianoRecording);
    setTempo(composition.tempo);
    setActiveTab('create');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 text-white font-sans">
      <div className="container mx-auto px-4 py-8">
        
        {/* Header Section */}
        <header className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-purple-500 to-pink-500 p-3 rounded-xl shadow-lg">
              <Music2 className="size-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold tracking-tight">MusicMaker Studio</h1>
              <p className="text-slate-400 text-sm font-medium">Design your sound • SUNY Oneonta Edition</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* VOLUME CONTROL */}
            <div className="flex items-center gap-3 bg-slate-900/50 px-4 py-2 rounded-lg border border-slate-800">
              <Volume2 className="size-4 text-purple-400" />
              <input 
                type="range" min="0" max="1" step="0.01" value={masterVolume}
                onChange={(e) => handleVolumeChange(Number(e.target.value))}
                className="w-24 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
              />
            </div>

            {/* TEMPO CONTROL */}
            <div className="flex items-center gap-2 bg-slate-900/50 px-3 py-2 rounded-lg border border-slate-800">
              <Timer className="size-4 text-purple-400" />
              <input 
                type="number" value={tempo} 
                onChange={(e) => setTempo(Number(e.target.value))}
                className="w-12 bg-transparent text-white font-mono text-sm focus:outline-none"
              />
            </div>

            <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
              <DialogTrigger asChild>
                <Button size="lg" className="bg-gradient-to-r from-purple-600 to-pink-600 hover:scale-105 transition-transform">
                  <Save className="size-5 mr-2" /> Save Project
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-slate-900 border-slate-800 text-white">
                <DialogHeader><DialogTitle>Name Your Composition</DialogTitle></DialogHeader>
                <div className="space-y-4 pt-4">
                  <Input
                    placeholder="Project Name..." value={compositionName}
                    className="bg-slate-950 border-slate-800"
                    onChange={(e) => setCompositionName(e.target.value)}
                  />
                  <Button onClick={saveComposition} className="w-full bg-purple-600 hover:bg-purple-700" disabled={!compositionName.trim()}>
                    Confirm Save
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </header>

        {/* Navigation Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full max-w-lg grid-cols-4 bg-slate-900/50 p-1 border border-slate-800 rounded-xl">
            <TabsTrigger value="create" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white">
              <Music2 className="size-4 mr-2" /> Create
            </TabsTrigger>
            <TabsTrigger value="piano" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white">
              <Music2 className="size-4 mr-2" /> Piano
            </TabsTrigger>
            <TabsTrigger value="library" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white">
              <Library className="size-4 mr-2" /> Library
            </TabsTrigger>
            <TabsTrigger value="upload" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white">
              <Upload className="size-4 mr-2" /> Upload
            </TabsTrigger>
          </TabsList>

          <TabsContent value="create">
            <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-6">
              <BeatMaker 
                audioEngine={audioEngineRef.current}
                onPatternChange={setBeatPattern}
                initialPattern={beatPattern}
                initialTempo={tempo}
              />
            </div>
          </TabsContent>

          <TabsContent value="piano">
            <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-6">
              <PianoKeyboard 
                audioEngine={audioEngineRef.current}
                tempo={tempo}
                onRecordingChange={setPianoRecording}
                onSaveRequest={() => setSaveDialogOpen(true)}
              />
            </div>
          </TabsContent>

          <TabsContent value="library">
            <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-6">
              <MusicLibrary 
                key={refreshLibrary}
                audioEngine={audioEngineRef.current}
                onLoad={loadComposition}
              />
            </div>
          </TabsContent>

          <TabsContent value="upload">
            <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-6">
              <SongUpload />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}