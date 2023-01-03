class IPC {
    constructor() {
        this.ipc = window.require('electron').ipcRenderer
    }
    getPath(name) {
        const ipc = window.require('electron').ipcRenderer
        return ipc.sendSync('getPath', name);
    }
    getScreenNum() {
        return this.ipc.sendSync('getScreenNum');
    }
    getContentSliceNum() {
        const ipc = window.require('electron').ipcRenderer
        return ipc.sendSync('getContentSliceNum');
    }
    getDownloadedFiles() {
        const ipc = window.require('electron').ipcRenderer
        return ipc.sendSync('getDownloadedFiles');
    }
    playContent(data, sectionId, interval) {
        const ipc = window.require('electron').ipcRenderer
        ipc.send('showContent', data, sectionId, interval);
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
    // downloadResource(url) {
    //     // let url = 'https://dl-tc.coolapkmarket.com/down/apk_upload/2020/1101/IDM_-v12.3_signed-162932-o_1em0thqn3jhj1akloa0qnd1lrgr-uid-456271.apk?t=1656220581&sign=0c7f339d43cdde9174550401e39838a0'
    //     const ipc = window.require('electron').ipcRenderer
    //     ipc.send('downloadResource', url)
    // }
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
    setCompanyId(id) {
        this.ipc.send('setCompanyId', id)
    }
    onCompanyIdUpdate(callback) {
        this.ipc.on('onCompanyIdUpdate', (e, args) => {
            callback(args)
        })
    }
    muteVideo(callback) {
        this.ipc.on('muteVideo', () => {
            callback()
        })
    }
    toggleVideo(callback) {
        const ipc = window.require('electron').ipcRenderer
        ipc.on('toggleVideo', () => {
            callback()
        })
    }
    toggleAllVideo(callback) {
        const ipc = window.require('electron').ipcRenderer
        ipc.on('toggleAllVideo', () => {
            callback()
        })
    }
    sendPlayControl(cmd) {
        this.ipc.send('sendPlayControl', cmd)
    }
    onPlayControl(callback) {
        this.ipc.on('onPlayControl', (cmd) => {
            callback(cmd)
        })
    }
    onUpdaterDownloadStart(callback) {
        this.ipc.on('onUpdaterDownloadStart', () => {
            callback()
        })
    }
    onUpdaterDownloadProgress(callback) {
        this.ipc.on('onUpdaterDownloadProgress', (e, args) => {
            callback(args)
        })
    }
    onUpdaterDownloadCompleted(callback) {
        this.ipc.on('onUpdaterDownloadCompleted', (e, args) => {
            callback(args)
        })
    }
    registerShortcutKey() {
        this.ipc.send('registerShortcutKey')
    }
    onShowMessage(callback) {
        this.ipc.on('showMessage', (e, args) => {
            callback(args)
        })
    }
    onLogout(callback) {
        this.ipc.on('logout', (e, args) => {
            callback(args)
        })
    }
}

export default IPC