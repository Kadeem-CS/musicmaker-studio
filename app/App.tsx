import { useState, useRef, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './components/ui/dialog';
import { Save, Music2, Library, Upload, Timer, Volume2 } from 'lucide-react'; // Added Volume2 icon
import { AudioEngine } from './components/audio-engine';
import { BeatMaker } from './components/beat-maker';
import { PianoKeyboard } from './components/piano-keyboard';
import { MusicLibrary, SavedComposition } from './components/music-library';
import SongUpload from './components/SongUpload';

export default function App() {
  const audioEngineRef = useRef<AudioEngine>(new AudioEngine());
  const [activeTab, setActiveTab] = useState('create');
  
  // State for the studio data
  const [beatPattern, setBeatPattern] = useState<boolean[][]>([]);
  const [pianoRecording, setPianoRecording] = useState<Array<{ note: string; time: number }>>([]);
  const [tempo, setTempo] = useState(120);
  const [masterVolume, setMasterVolume] = useState(0.8); // Default 80%
  
  // State for the save functionality
  const [compositionName, setCompositionName] = useState('');
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [refreshLibrary, setRefreshLibrary] = useState(0);

  // Sync volume with engine on mount or change
  const handleVolumeChange = (value: number) => {
    setMasterVolume(value);
    audioEngineRef.current.setMasterVolume(value);
  };

  // Logic to save a new composition to localStorage
  const saveComposition = () => {
    if (!compositionName.trim()) return;

    const composition: SavedComposition = {
      id: Date.now().toString(),
      name: compositionName,
      beatPattern: beatPattern.length > 0 ? beatPattern : undefined,
      pianoRecording: pianoRecording.length > 0 ? pianoRecording : undefined,
      tempo,
      createdAt: Date.now(),
    };

    const saved = localStorage.getItem('musicCompositions');
    const compositions = saved ? JSON.parse(saved) : [];
    compositions.unshift(composition);
    localStorage.setItem('musicCompositions', JSON.stringify(compositions));

    setCompositionName('');
    setSaveDialogOpen(false);
    setRefreshLibrary(prev => prev + 1);
    setActiveTab('library');
  };

  const loadComposition = (composition: SavedComposition) => {
    if (composition.beatPattern) setBeatPattern(composition.beatPattern);
    if (composition.pianoRecording) setPianoRecording(composition.pianoRecording);
    setTempo(composition.tempo);
    setActiveTab('create');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 text-white">
      <div className="container mx-auto px-4 py-8">
        
        {/* Header Section */}
        <header className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-purple-500 to-pink-500 p-3 rounded-xl">
              <Music2 className="size-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold">MusicMaker Studio</h1>
              <p className="text-slate-400">Design your sound</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* MASTER VOLUME CONTROL */}
            <div className="flex items-center gap-3 bg-slate-900/50 px-4 py-2 rounded-lg border border-slate-800">
              <Volume2 className="size-4 text-purple-400" />
              <input 
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={masterVolume}
                onChange={(e) => handleVolumeChange(Number(e.target.value))}
                className="w-24 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
              />
            </div>

            {/* Global Tempo Display */}
            <div className="flex items-center gap-2 bg-slate-900/50 px-3 py-2 rounded-lg border border-slate-800">
              <Timer className="size-4 text-purple-400" />
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">BPM</span>
              <input 
                type="number" 
                value={tempo} 
                onChange={(e) => setTempo(Number(e.target.value))}
                className="w-12 bg-transparent text-white font-mono text-sm focus:outline-none"
              />
            </div>

            {/* Save Dialog */}
            <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
              <DialogTrigger asChild>
                <Button size="lg" className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                  <Save className="size-5 mr-2" />
                  Save Project
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-slate-900 border-slate-800 text-white">
                <DialogHeader>
                  <DialogTitle>Name Your Composition</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <Input
                    placeholder="E.g., Moonlight Beat..."
                    value={compositionName}
                    className="bg-slate-950 border-slate-800 text-white"
                    onChange={(e) => setCompositionName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && saveComposition()}
                  />
                  <Button 
                    onClick={saveComposition} 
                    className="w-full bg-purple-600 hover:bg-purple-700"
                    disabled={!compositionName.trim()}
                  >
                    Confirm Save
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </header>

        {/* Main Interface */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full max-w-lg grid-cols-4 bg-slate-900/50 p-1 border border-slate-800 rounded-xl">
  <TabsTrigger 
    value="create" 
    className="rounded-lg text-slate-400 data-[state=active]:bg-purple-600 data-[state=active]:text-white"
  >
    <Music2 className="size-4 mr-2" /> Create
  </TabsTrigger>
  
  <TabsTrigger 
    value="piano" 
    className="rounded-lg text-slate-400 data-[state=active]:bg-purple-600 data-[state=active]:text-white"
  >
    <Music2 className="size-4 mr-2" /> Piano
  </TabsTrigger>
  
  <TabsTrigger 
    value="library" 
    className="rounded-lg text-slate-400 data-[state=active]:bg-purple-600 data-[state=active]:text-white"
  >
    <Library className="size-4 mr-2" /> Library
  </TabsTrigger>
  
  <TabsTrigger 
    value="upload" 
    className="rounded-lg text-slate-400 data-[state=active]:bg-purple-600 data-[state=active]:text-white"
  >
    <Upload className="size-4 mr-2" /> Upload
  </TabsTrigger>
</TabsList>

          {/* Beat Maker Tab */}
          <TabsContent value="create" className="space-y-6">
            <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-6">
              <h2 className="text-2xl font-bold mb-4">Beat Maker</h2>
              <BeatMaker 
                audioEngine={audioEngineRef.current}
                onPatternChange={(pattern) => setBeatPattern(pattern)}
                initialPattern={beatPattern}
                initialTempo={tempo}
              />
            </div>
          </TabsContent>

          {/* Piano Tab */}
          <TabsContent value="piano" className="space-y-6">
            <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-6">
              <h2 className="text-2xl font-bold mb-4">Piano Keyboard</h2>
              <PianoKeyboard 
                audioEngine={audioEngineRef.current}
                tempo={tempo}
                onRecordingChange={(recording) => setPianoRecording(recording)}
                onSaveRequest={() => setSaveDialogOpen(true)}
              />
            </div>
          </TabsContent>

          {/* Library Tab */}
          <TabsContent value="library" className="space-y-6">
            <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-6">
              <h2 className="text-2xl font-bold mb-4">Music Library</h2>
              <MusicLibrary 
                key={refreshLibrary}
                audioEngine={audioEngineRef.current}
                onLoad={loadComposition}
              />
            </div>
          </TabsContent>

          {/* Upload Tab */}
          <TabsContent value="upload" className="space-y-6">
            <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-6">
              <h2 className="text-2xl font-bold mb-4">Upload Audio</h2>
              <SongUpload />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}