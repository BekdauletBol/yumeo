import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';

export interface GhostTextOptions {
  ghostText: string | null;
  onAccept: (text: string) => void;
}

export const GhostText = Extension.create<GhostTextOptions>({
  name: 'ghostText',

  addOptions() {
    return {
      ghostText: null,
      onAccept: () => {},
    };
  },

  addStorage() {
    return {
      ghostText: null,
    };
  },

  addProseMirrorPlugins() {
    const { onAccept } = this.options;
    const storage = this.storage;

    return [
      new Plugin({
        key: new PluginKey('ghostText'),
        state: {
          init() {
            return DecorationSet.empty;
          },
          apply(tr) {
            // Check storage for updated ghost text
            const text = storage.ghostText;
            if (!text) return DecorationSet.empty;

            const { selection } = tr;
            if (!selection.empty) return DecorationSet.empty;

            const pos = selection.from;
            const widget = document.createElement('span');
            widget.classList.add('ghost-text');
            widget.textContent = text;
            widget.style.color = 'var(--text-tertiary)';
            widget.style.opacity = '0.5';
            widget.style.pointerEvents = 'none';
            widget.style.userSelect = 'none';

            return DecorationSet.create(tr.doc, [
              Decoration.widget(pos, widget, { side: 1 }),
            ]);
          },
        },
        props: {
          handleKeyDown(view, event) {
            if (event.key === 'Tab' && storage.ghostText) {
              event.preventDefault();
              onAccept(storage.ghostText);
              return true;
            }
            return false;
          },
          decorations(state) {
            return this.getState(state);
          },
        },
      }),
    ];
  },
});
