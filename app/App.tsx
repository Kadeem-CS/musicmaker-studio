import { useState, useRef } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './components/ui/dialog';
import { Save, Music2, Library } from 'lucide-react';
import { AudioEngine } from './components/audio-engine';
import { BeatMaker } from './components/beat-maker';
import { PianoKeyboard } from './components/piano-keyboard';
import { MusicLibrary, SavedComposition } from './components/music-library';

export default function App() {
  const audioEngineRef = useRef<AudioEngine>(new AudioEngine());
  const [activeTab, setActiveTab] = useState('create');
  const [beatPattern, setBeatPattern] = useState<boolean[][]>([]);
  const [pianoRecording, setPianoRecording] = useState<Array<{ note: string; time: number }>>([]);
  const [tempo, setTempo] = useState(120);
  const [compositionName, setCompositionName] = useState('');
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [refreshLibrary, setRefreshLibrary] = useState(0);

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
    if (composition.beatPattern) {
      setBeatPattern(composition.beatPattern);
    }
    if (composition.pianoRecording) {
      setPianoRecording(composition.pianoRecording);
    }
    setTempo(composition.tempo);
    setActiveTab('create');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-purple-500 to-pink-500 p-3 rounded-xl">
                <Music2 className="size-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-white">MusicMaker Studio</h1>
                <p className="text-slate-400">Create and compose your music</p>
              </div>
            </div>

            <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
              <DialogTrigger asChild>
                <div>
                  <Button size="lg" className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                    <Save className="size-5 mr-2" />
                    Save Composition
                  </Button>
                </div>
              </DialogTrigger>
              <DialogContent aria-describedby={undefined}>
                <DialogHeader>
                  <DialogTitle>Save Your Composition</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <Input
                    placeholder="Enter composition name..."
                    value={compositionName}
                    onChange={(e) => setCompositionName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && saveComposition()}
                  />
                  <Button 
                    onClick={saveComposition} 
                    className="w-full"
                    disabled={!compositionName.trim()}
                  >
                    Save
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-3 bg-slate-900/50">
            <TabsTrigger value="create" className="data-[state=active]:bg-purple-600">
              <Music2 className="size-4 mr-2" />
              Create
            </TabsTrigger>
            <TabsTrigger value="piano" className="data-[state=active]:bg-purple-600">
              <Music2 className="size-4 mr-2" />
              Piano
            </TabsTrigger>
            <TabsTrigger value="library" className="data-[state=active]:bg-purple-600">
              <Library className="size-4 mr-2" />
              Library
            </TabsTrigger>
          </TabsList>

          <TabsContent value="create" className="space-y-6">
            <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-6">
              <h2 className="text-2xl font-bold text-white mb-4">Beat Maker</h2>
              <p className="text-slate-400 mb-6">
                Create rhythmic patterns by clicking on the grid. Each row represents a different drum sound.
              </p>
              <BeatMaker 
                audioEngine={audioEngineRef.current}
                onPatternChange={(pattern) => {
                  setBeatPattern(pattern);
                }}
                initialPattern={beatPattern}
                initialTempo={tempo}
              />
            </div>
          </TabsContent>

          <TabsContent value="piano" className="space-y-6">
            <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-6">
              <h2 className="text-2xl font-bold text-white mb-4">Piano Keyboard</h2>
              <p className="text-slate-400 mb-6">
                Click the keys to play notes. Record your melodies and play them back.
              </p>
              <PianoKeyboard 
                audioEngine={audioEngineRef.current}
                onRecordingChange={(recording) => {
                  setPianoRecording(recording);
                }}
                initialRecording={pianoRecording}
              />
            </div>
          </TabsContent>

          <TabsContent value="library" className="space-y-6">
            <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-6">
              <h2 className="text-2xl font-bold text-white mb-4">Music Library</h2>
              <p className="text-slate-400 mb-6">
                Browse and play your saved compositions.
              </p>
              <MusicLibrary 
                key={refreshLibrary}
                audioEngine={audioEngineRef.current}
                onLoad={loadComposition}
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}