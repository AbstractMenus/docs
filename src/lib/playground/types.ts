export type PlaygroundMode = 'editor' | 'tutorial';
export type TabId = 'errors' | 'warnings' | 'json' | 'tutorial';

export interface PlaygroundState {
  mode: PlaygroundMode;
  activeTab: TabId;
}

export interface BootOptions {
  initialContent?: string;
  initialMode?: PlaygroundMode;
}
