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
    onShowContent(callback) {
        const ipc = window.require('electron').ipcRenderer
        ipc.on('onShowContent', (e, args) => {
           callback(args)
        })
    }
}

export default IPC