const {Disposable, CompositeDisposable} = require('atom');
const {spawn} = require('child_process');
const Path = require('path');

let disposables, treeView;

function openTerminal(cwd) {
    cwd = Path.resolve(cwd);
    const [cmd,...args] = atom.config.get('open-in-terminal-sertonix.command').replace('{CWD}',cwd).split(' '); // TODO handle quotes https://github.com/mccormicka/string-argv
    console.log(args);
    spawn(cmd, args, {cwd});
}

function openFromTreeView() {
    const path = treeView?.selectedPaths()[0];
    if (!path) return;
    openTerminal(path);
}

function openFromTextEditor() {
    const textEditor = atom.workspace.getActiveTextEditor();
    if (!textEditor || textEditor.isRemote /* teletype compatible */) return;
    const path = textEditor.getPath();
    if (!path) return;
    openTerminal(Path.dirname(path));
}

function activate() {
    disposables = new CompositeDisposable();
    disposables.add(
        atom.commands.add('atom-workspace', {
            'open-in-terminal-sertonix:open-selected-folders': openFromTreeView,
        }),
        atom.commands.add('atom-workspace', {
            'open-in-terminal-sertonix:open-text-editor': openFromTextEditor,
        }),
        atom.contextMenu.add({
            '.tree-view li.directory': [{
                label: 'Open in Terminal',
                command: 'open-in-terminal-sertonix:open-selected-folders'
            }],
            '.tab.texteditor': [{
                label: 'Open in Terminal',
                command: 'open-in-terminal-sertonix:open-text-editor'
            }],
        }),
    );
}

function deactivate() {
    disposables?.dispose();
    disposables = undefined;
}

module.exports = {
    activate,
    deactivate,
    consumeTreeView: tv => treeView = tv,
    config: {
        command: {
            title: 'Start command',
            description: 'The command used to spawn the terminal',
            type: 'string',
            default: {
                linux: () => '/usr/bin/gnome-terminal --window --working-directory {CWD}',
                win32: (cmdPath) => `${cmdPath = (process.env.comspec || Path.join(process.env.SystemRoot || 'C:/windows','system32/cmd.exe'))} /c start ${cmdPath}`,
                darwin: () => 'open -b com.apple.Terminal "{CWD}"',
            }[process.platform]?.() || '',
            order: 1,
        },
    }
};
