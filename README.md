# New Note in Folder

An Obsidian plugin: click (or create) a folder in the file explorer, then create a new note. The note goes inside that folder.

It works with both **Ctrl/Cmd+N** and the **New note** button in the file explorer.

## Why

Obsidian's own setting, *Settings → Files and links → Default location for new notes → Same folder as current file*, only follows the note you have open. If you've just created or clicked a folder, a new note still goes wherever your open note is, not into that folder.

This plugin adds to that setting rather than replacing it:

- **Folder clicked or just created** → the new note goes into that folder.
- **Otherwise** → Obsidian's default location setting applies as usual.

Opening a note, clicking a file, or clicking empty space in the file explorer resets it to the default. Once the first note is created, "Same folder as current file" keeps the next notes in the same folder.

## Install

1. Create the folder `<vault>/.obsidian/plugins/new-note-in-folder/`.
2. Copy `main.js` and `manifest.json` into it.
3. Reload Obsidian and enable **New Note in Folder** under *Settings → Community plugins*.

## Build from source

```sh
npm install
npm run build
```

This creates `main.js` from `src/main.ts`.

## Credits

Based on [select-folder](https://github.com/frogtempest/select-folder) by frogtempest, released under the MIT License. This plugin is also MIT; see [LICENSE](LICENSE).
