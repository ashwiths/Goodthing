// ─── ZenForge Ambient Sound Manifest ─────────────────────────────────────────

export interface SoundTrack {
  id:          string;
  title:       string;
  description: string;
  icon:        string;
  color:       string;
  // URI — use local asset or a remote URL
  uri:         string | null;
}

export const AMBIENT_SOUNDS: SoundTrack[] = [
  {
    id:          'rain',
    title:       'Rain Storm',
    description: 'Heavy rain on glass',
    icon:        '🌧️',
    color:       '#3B82F6',
    uri:         null, // replace with: require('../../assets/sounds/rain.mp3')
  },
  {
    id:          'forest',
    title:       'Deep Forest',
    description: 'Birds & rustling leaves',
    icon:        '🌲',
    color:       '#39FF14',
    uri:         null,
  },
  {
    id:          'ocean',
    title:       'Ocean Waves',
    description: 'Distant crashing waves',
    icon:        '🌊',
    color:       '#00F5FF',
    uri:         null,
  },
  {
    id:          'fire',
    title:       'Crackling Fire',
    description: 'Warm fireplace ambiance',
    icon:        '🔥',
    color:       '#FF6B35',
    uri:         null,
  },
  {
    id:          'space',
    title:       'Deep Space',
    description: 'Cosmic drone & static',
    icon:        '🌌',
    color:       '#8B5CF6',
    uri:         null,
  },
  {
    id:          'cafe',
    title:       'Cyber Café',
    description: 'Futuristic ambient chatter',
    icon:        '☕',
    color:       '#FFB703',
    uri:         null,
  },
  {
    id:          'thunder',
    title:       'Thunderstorm',
    description: 'Distant thunder rolls',
    icon:        '⛈️',
    color:       '#F72585',
    uri:         null,
  },
  {
    id:          'wind',
    title:       'Arctic Wind',
    description: 'Howling polar winds',
    icon:        '❄️',
    color:       '#A5F3FC',
    uri:         null,
  },
];
