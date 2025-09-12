# TLOG - Transient Log Extension

<p align="center">
  <strong>Quick console.log with [TLOG] prefix for easy identification and removal</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/VS%20Code-Extension-blue?style=for-the-badge&logo=visual-studio-code" alt="VS Code Extension">
  <img src="https://img.shields.io/badge/TypeScript-Powered-blue?style=for-the-badge&logo=typescript" alt="TypeScript">
  <img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" alt="MIT License">
</p>

---

A powerful VS Code extension that helps you manage temporary logging statements efficiently. Perfect for debugging sessions where you need to quickly add logs and clean them up later without leaving traces in your codebase.

## Features

### Quick TLOG Insertion

- **Instant logging**: Press `Ctrl+Shift+T` (Mac: `Cmd+Shift+T`) to insert a `console.log('[TLOG] message');`
- **Smart snippets**: Tab through the message placeholder for quick editing
- **[TLOG] prefix**: Easy identification among other console logs

### Powerful Cleanup

- **Bulk removal**: Press `Ctrl+Shift+R` (Mac: `Cmd+Shift+R`) to remove all TLOGs
- **Scope selection**: Choose between current file or entire workspace
- **Safety confirmation**: Prevents accidental deletions with confirmation dialogs

### Tree View Explorer

- **Visual overview**: See all TLOGs organized by directory structure
- **Hierarchical display**: Navigate through folders and files intuitively
- **TLOG count indicators**: Each folder and file shows the number of TLOGs
- **One-click navigation**: Jump directly to any TLOG location

### Granular Control

- **Individual removal**: Remove single TLOGs directly from the tree view
- **File-level cleanup**: Remove all TLOGs from a specific file
- **Directory cleanup**: Remove all TLOGs from a folder and its subdirectories
- **Inline actions**: Trash icons for quick removal actions

## Getting Started

1. **Install the extension** from VS Code Marketplace or Open VSX Registry
2. **Insert a TLOG**: Press `Ctrl+Shift+T` and type your debug message
3. **View TLOGs**: Open the "TLOG Explorer" in the sidebar
4. **Clean up**: Use `Ctrl+Shift+R` or click trash icons in the tree view

## Commands

| Command           | Shortcut       | Description                          |
| ----------------- | -------------- | ------------------------------------ |
| Insert TLOG       | `Ctrl+Shift+T` | Insert a new TLOG at cursor position |
| Remove All TLOGs  | `Ctrl+Shift+R` | Remove TLOGs from file or workspace  |
| Refresh TLOG Tree | -              | Refresh the TLOG Explorer view       |

## Tree View Actions

- **Folder icons**: Click to expand/collapse directories
- **Trash icons**: Remove all TLOGs from files or directories
- **Close icons**: Remove individual TLOG statements
- **File click**: Navigate to TLOG location in the editor

## Use Cases

**Perfect for:**

- **Debugging sessions**: Quick temporary logs that you can easily clean up
- **Development workflow**: Add debug statements without cluttering your code permanently
- **Code reviews**: Ensure no temporary logs make it into production
- **Code hygiene**: Keep your codebase clean and professional

## Screenshots

### Tree View Explorer

The hierarchical tree view shows all your TLOGs organized by directory structure with inline removal actions.

### Quick Insertion

Insert TLOGs instantly with keyboard shortcuts and smart snippets.

### Bulk Removal

Choose scope and remove all TLOGs with confirmation dialogs.

## Technical Details

- **Search powered by Ripgrep**: Fast and efficient TLOG detection across large codebases
- **Pattern matching**: Identifies `console.log` statements containing `[TLOG]`
- **Workspace integration**: Works seamlessly with VS Code's file system APIs
- **Memory efficient**: Lightweight extension with minimal performance impact

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

If you encounter any issues or have feature requests:

- **Bug reports**: [GitHub Issues](https://github.com/KubrickCode/tlog/issues)
- **Feature requests**: [GitHub Discussions](https://github.com/KubrickCode/tlog/discussions)
- **Rate the extension**: Help others discover TLOG by rating it on the marketplace

---

**Made with ❤️ by KubrickCode**

_Keep your logs organized, keep your code clean!_
