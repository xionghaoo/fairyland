class Updater {
    constructor() {
        const { autoUpdater } = require("electron-updater");
        const log = require('electron-log');
        const path = require('path')
        const fs = require("fs");

        this.updater = autoUpdater
        this.log = log

        // TODO 重新安装启动时这里会有bug
        let cacheDirName = "fairyland-updater"
        const updatePendingPath = path.join(autoUpdater.app.baseCachePath, cacheDirName, 'pending')
        log.log('clean cache path: ' + updatePendingPath)
        if (fs.existsSync(updatePendingPath)) {
            this.emptyDir(updatePendingPath)
        }

        const msg = {
            error: '检查更新出错',
            checking: '正在检查更新……',
            updateAva: '检测到新版本，正在下载……',
            updateNotAva: '现在使用的就是最新版本，不用更新'
        }

        const updateUrl = "https://roboland-deliv.ubtrobot.com/vision/fairyland/update/"
        autoUpdater.logger = log;
        autoUpdater.logger.transports.file.level = 'info';
        log.info('App starting...');
        autoUpdater.setFeedURL(updateUrl)

        autoUpdater.on('error', function () {
            // mainWindow.webContents.send(message.error)
            log.error(msg.error)
        })
        autoUpdater.on('checking-for-update', function () {
            // mainWindow.webContents.send(message.checking)
            log.info(msg.checking)
        })
        autoUpdater.on('update-available', function () {
            // mainWindow.webContents.send(message.updateAva)
            log.info(msg.updateAva)
        })
        autoUpdater.on('update-not-available', function () {
            // mainWindow.webContents.send(message.updateNotAva)
            log.info(msg.updateNotAva)
        })


    }
    emptyDir(path) {
        const fs = require("fs");
        const files = fs.readdirSync(path);
        files.forEach(file => {
            const filePath = `${path}/${file}`;
            const stats = fs.statSync(filePath);
            if (stats.isDirectory()) {
                this.emptyDir(filePath);
            } else {
                fs.unlinkSync(filePath);
                this.log.info(`删除${file}文件成功`);
            }
        });
    }
    checkUpdate(win) {
        this.win = win
        // 执行自动更新检查
        this.log.warn('执行自动更新检查')
        this.log.warn(__dirname)
        this.updater.checkForUpdates()
    }
    setStartCallback(callback) {
        let _this = this
        this.updater.on('update-available', function () {
            _this.log.info('检测到新版本，正在下载……')
            callback()
        })
    }
    setUpdateCallback(callback) {
        let _this = this
        // 更新下载进度事件
        this.updater.on('download-progress', function (progressObj) {
            _this.log.warn('触发下载。。。')
            _this.log.info('downloadProgress: ' + progressObj)
            callback(progressObj)
        })
    }
    setFinishCallback(callback) {
        let _this = this
        this.updater.on('update-downloaded', function () {
            _this.log.info('isUpdateNow')
            callback()
        })
    }
    installUpdate() {
        this.log.warn('安装更新')
        this.updater.quitAndInstall(true, false)
    }
}

const updater = new Updater()

module.exports = updater