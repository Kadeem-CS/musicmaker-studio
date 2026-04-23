import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Play, Trash2, Music, Edit } from 'lucide-react';
import { AudioEngine } from './audio-engine';
import { MusicPlayer } from './music-player';

export interface SavedComposition {
  id: string | number;
  title: string;
  visibility?: 'private' | 'public';
  beatPattern?: boolean[][];
  pianoRecording?: Array<{ note: string; time: number }>;
  tempo: number;
  createdAt?: number;
}

interface MusicLibraryProps {
  audioEngine: AudioEngine;
  onLoad?: (composition: SavedComposition) => void;
  searchQuery?: string;
}

export function MusicLibrary({ audioEngine, onLoad, searchQuery = '' }: MusicLibraryProps) {
  const [compositions, setCompositions] = useState<SavedComposition[]>([]);
  const [playingComposition, setPlayingComposition] = useState<SavedComposition | null>(null);

  useEffect(() => {
    loadCompositions();
  }, []);

  const loadCompositions = () => {
    const saved = localStorage.getItem('musicCompositions');
    if (saved) {
      setCompositions(JSON.parse(saved));
    }
  };

  const deleteComposition = (id: string | number) => {
    const updated = compositions.filter((c) => c.id !== id);
    setCompositions(updated);
    localStorage.setItem('musicCompositions', JSON.stringify(updated));
  };

  const playComposition = (composition: SavedComposition) => {
    audioEngine.resume();

    if (composition.beatPattern && composition.beatPattern.length > 0 && composition.beatPattern[0]) {
      const stepDuration = (60 / composition.tempo / 4) * 1000;
      const steps = composition.beatPattern[0].length;

      for (let step = 0; step < steps; step++) {
        composition.beatPattern.forEach((row, instrumentIndex) => {
          if (row[step]) {
            const instruments = ['kick', 'snare', 'hihat', 'clap'];
            setTimeout(() => {
              audioEngine.playDrum(instruments[instrumentIndex]);
            }, step * stepDuration);
          }
        });
      }
    }

    if (composition.pianoRecording) {
      const NOTE_FREQUENCIES: { [key: string]: number } = {
        'C4': 261.63, 'C#4': 277.18, 'D4': 293.66, 'D#4': 311.13,
        'E4': 329.63, 'F4': 349.23, 'F#4': 369.99, 'G4': 392.0,
        'G#4': 415.3, 'A4': 440.0, 'A#4': 466.16, 'B4': 493.88,
        'C5': 523.25, 'C#5': 554.37, 'D5': 587.33, 'D#5': 622.25,
        'E5': 659.25, 'F5': 698.46, 'F#5': 739.99, 'G5': 783.99,
        'G#5': 830.61, 'A5': 880.0, 'A#5': 932.33, 'B5': 987.77,
        'C6': 1046.5,
      };

      composition.pianoRecording.forEach((note) => {
        setTimeout(() => {
          const frequency = NOTE_FREQUENCIES[note.note];
          if (frequency) audioEngine.playNote(frequency);
        }, note.time);
      });
    }
  };

  const formatDate = (timestamp?: number) => {
    if (!timestamp) return 'No date';
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const filteredCompositions = compositions.filter((c) =>
    (c.title || '').toLowerCase().includes((searchQuery || '').toLowerCase())
  );

  return (
    <div className="space-y-6">
      {playingComposition && (
        <div>
          <h3 className="text-xl font-semibold text-white mb-4">Now Playing</h3>
          <MusicPlayer
            composition={playingComposition}
            audioEngine={audioEngine}
            onClose={() => setPlayingComposition(null)}
          />
        </div>
      )}

      <div>
        <h3 className="text-xl font-semibold text-white mb-4">
          {playingComposition ? 'Your Compositions' : 'Music Library'}
        </h3>

        {compositions.length === 0 ? (
          <Card className="p-12 text-center">
            <Music className="size-16 mx-auto mb-4 text-slate-400" />
            <h3 className="text-xl mb-2">No saved compositions yet</h3>
            <p className="text-slate-500">Create and save your first composition to see it here</p>
          </Card>
        ) : filteredCompositions.length === 0 ? (
          <Card className="p-12 text-center">
            <Music className="size-16 mx-auto mb-4 text-slate-400" />
            <h3 className="text-xl mb-2">No results for "{searchQuery}"</h3>
            <p className="text-slate-500">Try searching for a different composition name</p>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredCompositions.map((composition) => (
              <Card key={composition.id} className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-1">{composition.title}</h3>
                    <div className="flex gap-4 text-sm text-slate-500">
                      <span>Tempo: {composition.tempo} BPM</span>
                      {composition.visibility && <span>• {composition.visibility}</span>}
                      {composition.beatPattern && <span>• Beat Pattern</span>}
                      {composition.pianoRecording && (
                        <span>• Piano Recording ({composition.pianoRecording.length} notes)</span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{formatDate(composition.createdAt)}</p>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={() => {
                        setPlayingComposition(composition);
                        playComposition(composition);
                      }}
                      size="lg"
                      className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                    >
                      <Play className="size-5 mr-2" />
                      Listen
                    </Button>

                    {onLoad && (
                      <Button onClick={() => onLoad(composition)} variant="outline" size="lg">
                        <Edit className="size-5 mr-2" />
                        Edit
                      </Button>
                    )}

                    <Button onClick={() => deleteComposition(composition.id)} variant="outline" size="lg">
                      <Trash2 className="size-5 text-red-500" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}