import { App, Plugin, PluginSettingTab, Setting, TFolder } from "obsidian";

// Internal (untyped) Obsidian APIs used below.
interface PatchableFileManager {
	getNewFileParent(sourcePath: string, newFilePath?: string): TFolder;
	createNewFolder(parent?: TFolder | null): Promise<TFolder | null>;
}
interface FileExplorerView {
	startRenameFile(file: TFolder): Promise<void>;
}

const DEFAULT_SETTINGS = {
	newFoldersInSelectedFolder: true,
	highlightSelectedFolder: true,
	f2RenamesSelectedFolder: true,
};

// New notes (Ctrl/Cmd+N, the "New note" button, ...) and new folders (the
// "New folder" button) are created inside the folder you last clicked or
// created in the file explorer.
export default class NewNoteInFolderPlugin extends Plugin {
	settings = { ...DEFAULT_SETTINGS };
	private selected: TFolder | null = null;
	// Only shown right after clicking/creating the folder; the next click
	// anywhere else hides it, even though the folder stays selected.
	private highlighted = false;
	private highlightEl!: HTMLStyleElement;

	async onload() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
		this.addSettingTab(new SettingTab(this.app, this));

		// Highlight via a CSS rule on the folder's path, so it survives the
		// explorer re-rendering its rows.
		this.highlightEl = document.head.createEl("style");
		this.register(() => this.highlightEl.remove());

		const fileManager = this.app.fileManager as unknown as PatchableFileManager;
		const { getNewFileParent, createNewFolder } = fileManager;

		fileManager.getNewFileParent = (sourcePath, newFilePath) =>
			this.selectedFolder() ??
			getNewFileParent.call(fileManager, sourcePath, newFilePath);

		fileManager.createNewFolder = async (parent) => {
			// No parent means the vault root (e.g. the "New folder" button);
			// an explicit parent (right-click → New folder) is kept as is.
			if (!parent && this.settings.newFoldersInSelectedFolder) {
				parent = this.selectedFolder();
			}
			const folder = await createNewFolder.call(fileManager, parent);
			this.select(folder);
			return folder;
		};

		this.register(() => {
			fileManager.getNewFileParent = getNewFileParent;
			fileManager.createNewFolder = createNewFolder;
		});

		// Clicking a folder selects it; clicking anything else in the explorer clears it.
		this.registerDomEvent(document, "click", (evt) => {
			const target = evt.target as HTMLElement;
			this.highlighted = false;
			this.updateHighlight();

			if (!target.closest('.workspace-leaf-content[data-type="file-explorer"]')) return;
			if (target.closest(".nav-header")) return; // toolbar buttons (New note, ...)

			const path = target.closest(".nav-folder-title")?.getAttribute("data-path");
			const folder = path != null ? this.app.vault.getAbstractFileByPath(path) : null;
			this.select(folder instanceof TFolder ? folder : null);
		}, true);

		// F2 renames the folder while it's highlighted (just clicked or created);
		// otherwise F2 keeps renaming the open note. Window capture runs before
		// Obsidian's own hotkeys.
		this.registerDomEvent(window, "keydown", (evt) => {
			if (evt.key !== "F2" || evt.ctrlKey || evt.metaKey || evt.altKey || evt.shiftKey) return;
			if (!this.settings.f2RenamesSelectedFolder || !this.highlighted) return;
			const folder = this.selectedFolder();
			const view = this.app.workspace.getLeavesOfType("file-explorer")[0]?.view as unknown as FileExplorerView | undefined;
			if (!folder || !view) return;

			evt.preventDefault();
			evt.stopPropagation();
			view.startRenameFile(folder);
		}, true);

		// Opening a note (including the one just created) ends the selection.
		this.registerEvent(this.app.workspace.on("file-open", () => this.select(null)));

		// Keep the highlight on the folder when it (or a parent) is renamed or deleted.
		this.registerEvent(this.app.vault.on("rename", () => this.updateHighlight()));
		this.registerEvent(this.app.vault.on("delete", () => this.updateHighlight()));
	}

	private select(folder: TFolder | null) {
		this.selected = folder;
		this.highlighted = folder !== null;
		this.updateHighlight();
	}

	private selectedFolder(): TFolder | null {
		// Ignore a folder that has since been deleted.
		const folder = this.selected;
		return folder && this.app.vault.getAbstractFileByPath(folder.path) === folder ? folder : null;
	}

	updateHighlight() {
		const folder = this.selectedFolder();
		this.highlightEl.textContent =
			folder && this.highlighted && this.settings.highlightSelectedFolder
				? `.nav-folder-title[data-path="${CSS.escape(folder.path)}"] {
					background-color: var(--nav-item-background-active);
					color: var(--nav-item-color-active);
				}`
				: "";
	}
}

class SettingTab extends PluginSettingTab {
	constructor(app: App, private plugin: NewNoteInFolderPlugin) {
		super(app, plugin);
	}

	display() {
		const { settings } = this.plugin;
		const save = () => this.plugin.saveData(settings);
		this.containerEl.empty();

		new Setting(this.containerEl)
			.setName("New folders go into the selected folder")
			.setDesc("The \"New folder\" button creates the folder inside the folder you last clicked or created, instead of the vault root.")
			.addToggle((toggle) =>
				toggle.setValue(settings.newFoldersInSelectedFolder).onChange(async (value) => {
					settings.newFoldersInSelectedFolder = value;
					await save();
				}),
			);

		new Setting(this.containerEl)
			.setName("Highlight the selected folder")
			.setDesc("Show which folder new notes and folders will go into.")
			.addToggle((toggle) =>
				toggle.setValue(settings.highlightSelectedFolder).onChange(async (value) => {
					settings.highlightSelectedFolder = value;
					this.plugin.updateHighlight();
					await save();
				}),
			);

		new Setting(this.containerEl)
			.setName("F2 renames the selected folder")
			.setDesc("Right after you click or create a folder, F2 renames that folder instead of the open note.")
			.addToggle((toggle) =>
				toggle.setValue(settings.f2RenamesSelectedFolder).onChange(async (value) => {
					settings.f2RenamesSelectedFolder = value;
					await save();
				}),
			);
	}
}
