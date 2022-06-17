class IPC {
    playContent(display, type, content) {
        const ipc = window.require('electron').ipcRenderer
        ipc.send('showContent', {
            display: display,
            type: type,
            content: content
        });
    }
    stopContent(content) {
        const ipc = window.require('electron').ipcRenderer
        ipc.send('stopContent', {
            content: content
        });
    }
}

export default IPC