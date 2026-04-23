import { useState, useRef, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './components/ui/dialog';
import { Save, Music2, Library, Compass, Search } from 'lucide-react';
import { AudioEngine } from './components/audio-engine';
import { BeatMaker } from './components/beat-maker';
import { PianoKeyboard } from './components/piano-keyboard';
import { MusicLibrary, SavedComposition } from './components/music-library';

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
  const [beatPattern, setBeatPattern] = useState<boolean[][]>([]);
  const [pianoRecording, setPianoRecording] = useState<Array<{ note: string; time: number }>>([]);
  const [tempo, setTempo] = useState(120);
  const [compositionName, setCompositionName] = useState('');
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [refreshLibrary, setRefreshLibrary] = useState(0);
  const [discoverSearch, setDiscoverSearch] = useState('');
  const [librarySearch, setLibrarySearch] = useState('');
  const [visibility, setVisibility] = useState<'private' | 'public'>('private');
  const [publicCompositions, setPublicCompositions] = useState<any[]>([]);

  useEffect(() => {
  const fetchPublic = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/compositions/public");
      const data = await res.json();
      setPublicCompositions(data);
    } catch (err) {
      console.error("Error fetching public compositions:", err);
    }
  };

  fetchPublic();
}, []);

const saveComposition = async () => {
  try {
    const composition = {
      id: Date.now(),
      title: compositionName,
      visibility,
      beatPattern,
      pianoRecording,
      tempo,
    };

    const response = await fetch('http://localhost:5000/api/compositions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(composition),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Save failed: ${errorText}`);
    }

    await response.json();

    const saved = localStorage.getItem('musicCompositions');
    const compositions = saved ? JSON.parse(saved) : [];
    compositions.unshift(composition);
    localStorage.setItem('musicCompositions', JSON.stringify(compositions));

    setCompositionName('');
    setSaveDialogOpen(false);
    setRefreshLibrary((prev) => prev + 1);
    setActiveTab('library');
  } catch (error) {
    console.error('Error saving composition:', error);
    alert('Saving failed. Check console for details.');
  }
};

  const loadComposition = (composition: SavedComposition) => {
    if (composition.beatPattern) setBeatPattern(composition.beatPattern);
    if (composition.pianoRecording) setPianoRecording(composition.pianoRecording);
    setTempo(composition.tempo);
    setActiveTab('create');
  };

  const q = discoverSearch.toLowerCase();
  const filteredFeatured = featuredTracks.filter(
    (t) =>
      t.title.toLowerCase().includes(q) ||
      t.artist.toLowerCase().includes(q) ||
      t.genre.toLowerCase().includes(q)
  );

  const filteredTrending = trendingTracks.filter(
    (t) =>
      t.title.toLowerCase().includes(q) ||
      t.artist.toLowerCase().includes(q) ||
      t.genre.toLowerCase().includes(q)
  );

  const filteredPlaylists = playlists.filter(
    (p) =>
      p.name.toLowerCase().includes(q) ||
      p.genre.toLowerCase().includes(q)
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950">
      <div className="container mx-auto px-4 py-8">
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
<Button
  size="lg"
  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
>
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
      onKeyDown={(e) => e.key === "Enter" && saveComposition()}
    />

<select
  value={visibility}
  onChange={(e) => setVisibility(e.target.value as 'private' | 'public')}
  className="w-full rounded-md border p-2"
>
      <option value="private">Private</option>
      <option value="public">Public</option>
    </select>

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

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-4 bg-slate-900/50">
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
            <TabsTrigger value="discover" className="data-[state=active]:bg-purple-600">
              <Compass className="size-4 mr-2" />
              Discover
            </TabsTrigger>
          </TabsList>

          <TabsContent value="create" className="space-y-6">
            <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-6">
              <h2 className="text-2xl font-bold text-white mb-4">Beat Maker</h2>
              <p className="text-slate-400 mb-6">Create rhythmic patterns by clicking on the grid.</p>
              <BeatMaker
                audioEngine={audioEngineRef.current}
                onPatternChange={(pattern) => setBeatPattern(pattern)}
                initialPattern={beatPattern}
                initialTempo={tempo}
              />
            </div>
          </TabsContent>

          <TabsContent value="piano" className="space-y-6">
            <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-6">
              <h2 className="text-2xl font-bold text-white mb-4">Piano Keyboard</h2>
              <p className="text-slate-400 mb-6">Click the keys to play notes and record melodies.</p>
              <PianoKeyboard
                audioEngine={audioEngineRef.current}
                onRecordingChange={(recording) => setPianoRecording(recording)}
                initialRecording={pianoRecording}
              />
            </div>
          </TabsContent>

          <TabsContent value="library" className="space-y-6">
            <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-6">
              <h2 className="text-2xl font-bold text-white mb-4">Music Library</h2>
              <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search your compositions..."
                  value={librarySearch}
                  onChange={(e) => setLibrarySearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                />
              </div>
              <MusicLibrary
                key={refreshLibrary}
                audioEngine={audioEngineRef.current}
                onLoad={loadComposition}
                searchQuery={librarySearch}
              />
            </div>
          </TabsContent>

          <TabsContent value="discover" className="space-y-6">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search tracks, artists, genres, playlists..."
                value={discoverSearch}
                onChange={(e) => setDiscoverSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-4 rounded-xl bg-slate-900/80 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 text-lg"
              />
            </div>
            {/* 🔥 Community compositions */}
<div className="space-y-4">
  <h2 className="text-xl font-semibold text-white">
    Community Compositions
  </h2>

  {publicCompositions.length === 0 ? (
    <p className="text-slate-400">No public compositions yet</p>
  ) : (
    <div className="grid gap-4">
      {publicCompositions.map((comp) => (
        <div key={comp._id} className="bg-slate-800 p-4 rounded-xl">
          <h3 className="text-white font-semibold">{comp.title}</h3>

          <div className="text-sm text-slate-400 mt-1">
            Tempo: {comp.tempo} BPM
          </div>

          <div className="text-xs text-purple-400 mt-1">
            {comp.visibility}
          </div>

          {comp.pianoRecording?.length > 0 && (
            <div className="text-xs text-purple-400">
              Piano ({comp.pianoRecording.length} notes)
            </div>
          )}
        </div>
      ))}
    </div>
  )}
</div>

            {filteredFeatured.length > 0 && (
              <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-6">
                <h2 className="text-2xl font-bold text-white mb-4">Featured Today</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {filteredFeatured.map((track) => (
                    <div key={track.title} className="bg-slate-800/60 rounded-xl overflow-hidden hover:bg-slate-800 transition-all cursor-pointer group">
                      <div className={`h-32 bg-gradient-to-br ${track.color} flex items-center justify-center`}>
                        <Music2 className="size-12 text-white/70 group-hover:scale-110 transition-transform" />
                      </div>
                      <div className="p-4">
                        <p className="text-white font-semibold">{track.title}</p>
                        <p className="text-slate-400 text-sm">{track.artist}</p>
                        <span className="text-xs text-purple-400 bg-purple-400/10 px-2 py-1 rounded-full mt-2 inline-block">{track.genre}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {filteredTrending.length > 0 && (
              <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-6">
                <h2 className="text-2xl font-bold text-white mb-4">Trending Tracks</h2>
                <div className="flex flex-col gap-3">
                  {filteredTrending.map((track) => (
                    <div key={track.rank} className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-800/60 transition-all cursor-pointer group">
                      <span className="text-slate-500 font-bold w-6 text-center">{track.rank}</span>
                      <div className="bg-gradient-to-br from-purple-500 to-pink-500 p-2 rounded-lg">
                        <Music2 className="size-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="text-white font-medium">{track.title}</p>
                        <p className="text-slate-400 text-sm">{track.artist}</p>
                      </div>
                      <span className="text-xs text-purple-400 bg-purple-400/10 px-2 py-1 rounded-full">{track.genre}</span>
                      <span className="text-slate-500 text-sm">{track.duration}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {filteredPlaylists.length > 0 && (
              <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-6">
                <h2 className="text-2xl font-bold text-white mb-4">Popular Playlists</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {filteredPlaylists.map((playlist) => (
                    <div key={playlist.name} className="bg-slate-800/60 rounded-xl overflow-hidden hover:bg-slate-800 transition-all cursor-pointer group">
                      <div className={`h-24 bg-gradient-to-br ${playlist.color} flex items-center justify-center`}>
                        <Library className="size-8 text-white/70 group-hover:scale-110 transition-transform" />
                      </div>
                      <div className="p-3">
                        <p className="text-white font-medium text-sm">{playlist.name}</p>
                        <p className="text-slate-400 text-xs">{playlist.tracks} tracks</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {filteredFeatured.length === 0 && filteredTrending.length === 0 && filteredPlaylists.length === 0 && (
              <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-12 text-center">
                <Search className="size-12 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400 text-lg">No results found for "{discoverSearch}"</p>
                <p className="text-slate-600 text-sm mt-2">Try searching for a different track, artist, or genre</p>
              </div>
            )}
          </TabsContent>

        </Tabs>
      </div>
    </div>
  );
}
