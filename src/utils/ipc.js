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
    downloadResource() {
        let url = 'https://dl-tc.coolapkmarket.com/down/apk_upload/2020/1101/IDM_-v12.3_signed-162932-o_1em0thqn3jhj1akloa0qnd1lrgr-uid-456271.apk?t=1656220581&sign=0c7f339d43cdde9174550401e39838a0'
        const ipc = window.require('electron').ipcRenderer
        ipc.send('downloadResource', url)
    }
    onDownloadProgress(callback) {
        const ipc = window.require('electron').ipcRenderer
        ipc.on('onDownloadProgress', (e, progress) => {
            callback(progress)
        })
    }
}

export default IPC