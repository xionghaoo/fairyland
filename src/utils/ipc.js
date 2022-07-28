class IPC {
    getAppPath() {
        const ipc = window.require('electron').ipcRenderer
        return ipc.sendSync('getAppPath');
    }
    getScreenNum() {
        const ipc = window.require('electron').ipcRenderer
        return ipc.sendSync('getScreenNum');
    }
    playContent(data, interval) {
        const ipc = window.require('electron').ipcRenderer
        ipc.send('showContent', data, interval);
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
    deleteFiles(sections) {
        const ipc = window.require('electron').ipcRenderer
        ipc.send('deleteFiles', sections)
    }
    showNotify(data) {
        const ipc = window.require('electron').ipcRenderer
        ipc.send('showNotify', data)
    }
    downloadResource(url) {
        // let url = 'https://dl-tc.coolapkmarket.com/down/apk_upload/2020/1101/IDM_-v12.3_signed-162932-o_1em0thqn3jhj1akloa0qnd1lrgr-uid-456271.apk?t=1656220581&sign=0c7f339d43cdde9174550401e39838a0'
        const ipc = window.require('electron').ipcRenderer
        ipc.send('downloadResource', url)
    }
    downloadMultiFile(urls) {
        const ipc = window.require('electron').ipcRenderer
        ipc.send('downloadMultiFile', urls)
    }
    onDownloadSingleProgress(callback) {
        const ipc = window.require('electron').ipcRenderer
        ipc.on('onDownloadSingleProgress', (e, index, progress) => {
            callback(index, progress)
        })
    }
    onDownloadMultiFileCompleted(callback) {
        const ipc = window.require('electron').ipcRenderer
        ipc.on('onDownloadMultiFileCompleted', () => {
            callback()
        })
    }
    onDownloadProgress(callback) {
        const ipc = window.require('electron').ipcRenderer
        ipc.on('onDownloadProgress', (e, progress) => {
            callback(progress)
        })
    }
    onResourceUpdated(callback) {
        const ipc = window.require('electron').ipcRenderer
        ipc.on('onResourceUpdated', () => {
            callback()
        })
    }
    onDownloadCompleted(callback) {
        const ipc = window.require('electron').ipcRenderer
        ipc.on('onDownloadCompleted', () => {
            callback()
        })
    }
    setInitStatus(status) {
        const ipc = window.require('electron').ipcRenderer
        ipc.send('setInitStatus', status)
    }
    onInitChange(callback) {
        const ipc = window.require('electron').ipcRenderer
        ipc.on('onInitChange', (e, args) => {
            callback(args)
        })
    }
    setUpdateStatus(status) {
        const ipc = window.require('electron').ipcRenderer
        ipc.send('setUpdateStatus', status)
    }
    onUpdateChange(callback) {
        const ipc = window.require('electron').ipcRenderer
        ipc.on('onUpdateChange', (e, args) => {
            callback(args)
        })
    }
}

export default IPC