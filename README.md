# New Note in Folder

An Obsidian plugin: click (or create) a folder in the file explorer, then create a new note or folder. It goes inside that folder.

It works with **Ctrl/Cmd+N** and with the **New note** and **New folder** buttons in the file explorer.

## Why

Obsidian's own setting, *Settings → Files and links → Default location for new notes → Same folder as current file*, only follows the note you have open. If you've just created or clicked a folder, a new note still goes wherever your open note is, not into that folder.

This plugin adds to that setting rather than replacing it:

- **Folder clicked or just created** → the new note goes into that folder.
- **Otherwise** → Obsidian's default location setting applies as usual.

Opening a note, clicking a file, or clicking empty space in the file explorer resets it to the default. Once the first note is created, "Same folder as current file" keeps the next notes in the same folder.

## New folders too

The **New folder** button in the file explorer normally creates the folder at the vault root. With a folder clicked or just created, it creates the new folder inside it, so you can build nested folders without dragging them around.

## Settings

In *Settings → New Note in Folder* (both on by default):

- **New folders go into the selected folder**: the New folder behaviour above.
- **Highlight the selected folder**: Obsidian doesn't show which folder you've selected, so the plugin highlights it in the file explorer right after you click or create it. Your next click anywhere else hides the highlight, but the folder stays selected.

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
