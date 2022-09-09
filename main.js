const {app, BrowserWindow, screen, globalShortcut, dialog, Notification, systemPreferences } = require('electron')
const path = require('path')
const fs = require("fs");
require('@electron/remote/main').initialize()
const ipc = require('electron').ipcMain
const log = require('electron-log');
const isDev = require('electron-is-dev');
const { autoUpdater } = require("electron-updater");
if (isDev) {
    log.info('Running in development');
} else {
    log.info('Running in production');
}

const updateUrl = "https://roboland-deliv.ubtrobot.com/vision/fairyland/update/"
autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = 'info';
log.info('App starting...');

// const server = 'https://update.electronjs.org'
// const feed = `${server}/xionghaoo/fairyland/${app.getVersion()}`
autoUpdater.setFeedURL(updateUrl)

// require('update-electron-app')({
//     repo: 'xionghaoo/fairyland',
//     updateInterval: '1 hour',
//     logger: require('electron-log')
// })

// Default Squirrel.Windows event handler for your Electron apps
// if(require('electron-squirrel-startup')) app.quit();

let windowList = [];

ipc.on('getPath', function (e, name) {
    e.returnValue = app.getPath(name)
})
ipc.on('getScreenNum', function (e) {
    e.returnValue = windowList.length
})
ipc.on('getContentSliceNum', function (e) {
    e.returnValue = sliceTotal
})
ipc.on('show-message-dialog', function (e, msg) {
    dialog.showMessageBox({message: msg})
})
ipc.on('show-open-dialog', function () {
    dialog.showOpenDialog({properties: ['openFile', 'openDirectory', 'multiSelections']})
})
ipc.on('setInitStatus', function (e, args) {
    for (let i = 0; i < windowList.length; i++) {
        windowList[i].webContents.postMessage('onInitChange', args, [])
    }
})
ipc.on('setUpdateStatus', function (e, args) {
    for (let i = 0; i < windowList.length; i++) {
        windowList[i].webContents.postMessage('onUpdateChange', args, [])
    }
})

// 定时器id
let tIds = []
let contentIndex = null
let sliceTotal = 0
// 卡片切换时的记录
let lastSectionId = null
let lastContentIndex = null
// 显示屏幕内容
ipc.on('showContent', async function (e, screens, sectionId, interval) {
    if (sectionId === null && screens === null) {
        for (let i = 0; i < windowList.length; i++) {
            windowList[i].webContents.postMessage('onShowContent', "showNoCard", [])
        }
        return
    }
    if (lastSectionId !== sectionId) {
        contentIndex = 0
        lastContentIndex = null
    }

    let div = Math.floor(screens.length / windowList.length)
    let re = screens.length % windowList.length
    let num = re > 0 ? div + 1 : div
    // 屏幕组数
    sliceTotal = num
    let sliceScreens = []
    let sliceIndex = 0
    for (let i = 0; i < num; i++) {
        // log.info(`分片: ${sliceIndex}`)
        let end = sliceIndex + windowList.length
        if (end >= screens.length) end = screens.length
        sliceScreens.push(screens.slice(sliceIndex, end))
        sliceIndex += windowList.length
    }

    // 分片
    let single_screens = sliceScreens[contentIndex]
    if (!single_screens) single_screens = []

    // 切换卡片
    if (lastSectionId !== sectionId || lastContentIndex !== contentIndex) {
        for (let j = 0; j < tIds.length; j++) {
            clearTimeout(tIds[j])
        }
        tIds = []
    }
    // TODO 切换卡片时白屏
    if (lastContentIndex !== contentIndex) {
        // log.info("翻页时白屏", single_screens)
        for (let i = 0; i < windowList.length; i++) {
            windowList[i].webContents.postMessage('onShowContent', null, [])
        }
        await new Promise((resolve)=>setTimeout(() => {
            log.info("等待白屏");
            resolve();
        }, 200));
    }
    lastSectionId = sectionId
    lastContentIndex = contentIndex

    for (let i = 0; i < windowList.length; i++) {
        // 给每块屏幕发送消息
        if (interval && interval > 0) {
            // 延迟显示
            let tId = null;
            if (single_screens.length > 0) {
                tId = setTimeout(() => {
                    windowList[i].webContents.postMessage('onShowContent', single_screens, [])
                    log.info('延迟显示内容-----', single_screens.length)
                }, interval * i)
                tIds.push(Number(tId))
            } else {
                for (let j = 0; j < tIds.length; j++) {
                    clearTimeout(tIds[j])
                }
                tIds = []
                windowList[i].webContents.postMessage('onShowContent', [], [])
            }
        } else {
            // 同步显示
            windowList[i].webContents.postMessage('onShowContent', single_screens, [])
        }
    }
})
ipc.on('stopContent', function (e, args) {
    // 给渲染窗口发送消息
    for (let i = 0; i < windowList.length; i++) {
        windowList[i].webContents.postMessage('onStopContent', args, [])
    }
})
ipc.on('showNotify', function (e, args) {
    new Notification({ title: args.title, body: args.message }).show()
})

ipc.on('getDownloadedFiles', function (e) {
    let contents_dir = path.join(app.getPath('documents'), 'Fairyland')
    if (!fs.existsSync(contents_dir)) {
        fs.mkdirSync(contents_dir)
    }
    e.returnValue = fs.readdirSync(contents_dir)
})

ipc.on('deleteFiles', function (e, sections) {
    log.info('delete files: ' + sections)
    let assets_dir = path.join(app.getAppPath(), 'assets')
    let files = fs.readdirSync(assets_dir)
    let screens = new Set()
    for (let i = 0; i < sections.length; i++) {
        let section = sections[i];
        for (let j = 0; j < section.screens.length; j++) {
            let screen = section.screens[j];
            let name = screen.item_uri.replace("/static/resources/", '')
            let folder = name.split('/')[0]
            screens.add(folder)
        }
    }
    log.info('screens', screens)
    for(let i = 0; i < files.length; i++){
        log.info(files[i])
        let f = files[i]
        let realFile = path.join(assets_dir, f)
        let stat = fs.lstatSync(realFile)
        // 删除多余的文件夹
        if (stat.isDirectory()) {
            if (!screens.has(f)) {
                log.info('delete file: ' + f)
                removeDir(realFile)
            }
        }
        // 删除资源压缩包
        if (f === 'resource.zip') {
            fs.unlinkSync(realFile)
        }
    }
})

function removeDir(dir) {
    let files = fs.readdirSync(dir)
    for(let i = 0;i < files.length; i++){
        let newPath = path.join(dir, files[i]);
        let stat = fs.statSync(newPath)
        if(stat.isDirectory()){
            //如果是文件夹就递归下去
            removeDir(newPath);
        }else {
            //删除文件
            fs.unlinkSync(newPath);
        }
    }
    fs.rmdirSync(dir)//如果文件夹是空的，就将自己删除掉
}

// ipc.on('downloadResource', function (e, url) {
//     let win = windowList[0]
//     win.webContents.session.on('will-download', (e, item) => {
//         const filePath = path.join(app.getAppPath(), 'assets', item.getFilename());
//         // const filePath = "assets\\" + item.getFilename();
//         log.info('download file path: ' + filePath)
//         item.setSavePath(filePath)
//         let value = 0
//         item.on('updated', (evt, state) => {
//             log.info('update state: ' + state)
//             if ('progressing' === state) {
//                 if (item.isPaused()) {
//                     log.info('Download is paused')
//                 } else {
//                     //此处  用接收到的字节数和总字节数求一个比例  就是进度百分比
//                     if (item.getReceivedBytes() && item.getTotalBytes()) {
//                         value = parseInt(100 * (item.getReceivedBytes() / item.getTotalBytes()))
//                     }
//                     // 把百分比发给渲染进程进行展示
//                     win.webContents.send('onDownloadProgress', value);
//                     // mac 程序坞、windows 任务栏显示进度
//                     win.setProgressBar(value);
//                 }
//             }
//             if (state === 'interrupted') {
//                 log.info('Download is interrupted but can be resumed')
//             }
//         })
//
//         //监听下载结束事件
//         item.on('done', (e, state) => {
//             log.info('done: ' + state)
//             //如果窗口还在的话，去掉进度条
//             if (!win.isDestroyed()) {
//                 win.setProgressBar(-1);
//             }
//             //下载被取消或中断了
//             if (state === 'interrupted') {
//                 dialog.showErrorBox('下载失败', `文件 ${item.getFilename()} 因为某些原因被中断下载`);
//             }
//             if (state === 'completed') {
//                 log.info('资源下载成功')
//                 win.webContents.send('onDownloadCompleted');
//                 // 解压资源文件
//                 const zip = new StreamZip({
//                     file: filePath,
//                     storeEntries: true
//                 });
//                 let outPath = path.join(app.getAppPath(), 'assets')
//                 zip.on('ready', () => {
//                     zip.extract(null, outPath, (err, count) => {
//                         log.info(err ? 'Extract error' : `Extracted ${count} entries`);
//                         if (!err) {
//                             win.webContents.send('onResourceUpdated');
//                         }
//                         zip.close();
//                     });
//                 });
//             }
//         });
//     })
//     win.webContents.downloadURL(url)
// })
/**
 * 按顺序下载多文件
 */
ipc.on('downloadMultiFile', function (e, urls) {
    let win = windowList[0]
    downloadSingleFile(win, urls, 0)
})
const downloadSingleFile = (win, urls, index) => {
    if (index === 0) {
        win.webContents.session.on('will-download', (e, item) => {
            const folder = path.join(app.getPath('documents'), 'Fairyland')
            log.info('download file path: ' + folder)
            if (!fs.existsSync(folder)) {
                fs.mkdirSync(folder)
            }
            const filePath = path.join(folder, item.getFilename());
            log.info('download file path: ' + filePath)
            item.setSavePath(filePath)
            let value = 0
            item.on('updated', (evt, state) => {
                log.info('update state: ' + state)
                if ('progressing' === state) {
                    if (item.isPaused()) {
                        log.info('Download is paused')
                    } else {
                        //此处  用接收到的字节数和总字节数求一个比例  就是进度百分比
                        if (item.getReceivedBytes() && item.getTotalBytes()) {
                            value = 100 * (item.getReceivedBytes() / item.getTotalBytes())
                        }
                        // 把百分比发给渲染进程进行展示
                        win.webContents.send('onDownloadSingleProgress', index, value);
                        // mac 程序坞、windows 任务栏显示进度
                        win.setProgressBar(value);
                    }
                }
                if (state === 'interrupted') {
                    log.info('Download is interrupted but can be resumed')
                }
            })

            //监听下载结束事件
            item.on('done', (e, state) => {
                log.info('done: ' + state)
                //如果窗口还在的话，去掉进度条
                if (!win.isDestroyed()) {
                    win.setProgressBar(-1);
                }
                //下载被取消或中断了
                if (state === 'interrupted') {
                    if (index < urls.length - 1) {
                        downloadSingleFile(win, urls, ++index)
                    } else {
                        win.webContents.send('onDownloadMultiFileCompleted');
                    }
                    new Notification({ title: '下载失败', body: '文件 ${item.getFilename()} 被中断下载' }).show()
                    // dialog.showErrorBox('下载失败', `文件 ${item.getFilename()} 被中断下载`);
                }
                if (state === 'completed') {
                    log.info('资源下载成功: ' + index + ', urls length: ' + urls.length)
                    if (index < urls.length - 1) {
                        downloadSingleFile(win, urls, ++index)
                    } else {
                        win.webContents.send('onDownloadMultiFileCompleted');
                    }
                }
            });
        })
    }
    // if (urls[index].startsWith("https://roboland-deliv.ubtrobot.com")) {
    //     log.info(`下载资源: ${urls[index]}`)
    //     // 只下载阿里云的资源
    //     win.webContents.downloadURL(urls[index])
    // }
    log.info(`下载资源: ${urls[index]}`)
    // 只下载阿里云的资源
    win.webContents.downloadURL(urls[index])
}


const createMultiWindow = () => {
    let displays = screen.getAllDisplays()
    displays.find((display) => {
        log.info(`find display id: ${display.id}, ${display.bounds.width} x ${display.bounds.height}`)
    })
    windowList = []
    let screenIndexes = [];

    let xSet = new Set();
    let ySet = new Set();
    for (let i = 0; i < displays.length; i++) {
        let display = displays[i];
        let x = display.bounds.x;
        let y = display.bounds.y;
        xSet.add(x)
        ySet.add(y)
    }

    // 0, 1920
    let xArr = Array.from(xSet)
    xArr.sort((a, b) => {
        return a - b;
    })
    // 0, 1080
    let yArr = Array.from(ySet)
    yArr.sort((a, b) => {
        return a - b;
    })

    log.info('xArr', xArr)
    log.info('yArr', yArr)

    let s_index = 0

    // (0, 0) (0, 1) (1, 0) (1, 1)
    // (0, 0) (0, 1) (0, 2) (1, ) (1, 0)
    // 先遍历行
    for (let i = 0; i < yArr.length; i++) {
        // 再遍历列
        for (let j = 0; j < xArr.length; j++) {
            for (let si = 0; si < displays.length; si++) {
                let display = displays[si];
                let x = display.bounds.x;
                let y = display.bounds.y;
                if (x === xArr[j] && y === yArr[i]) {
                    log.info(`x = ${x}, y = ${y}`)
                    log.info(`xArr[${i}] = ${xArr[i]}, yArr[${j}] = ${yArr[j]}`)
                    // 找到对应的原点坐标
                    screenIndexes.push({
                        x: x,
                        y: y,
                        index: s_index
                    });
                    s_index++;
                }
            }
        }
    }

    log.info('找到屏幕：', screenIndexes)

    // 对屏幕进行排序
    screenIndexes.sort((a, b) => {
        return a.index - b.index;
    })

    for (let i = 0; i < screenIndexes.length; i++) {
        let screen = screenIndexes[i];

        const win = new BrowserWindow({
            width: 800,
            height: 600,
            x: screen.x,
            y: screen.y,
            frame: false,
            titleBarStyle: 'hidden',
            webPreferences: {
                // 设置安全参数
                webSecurity: false, // false 之后就可以访问 本地资源文件了
                nodeIntegration: true,
                contextIsolation: false,
                preload: path.join(__dirname, `preload/page${i}.js`)
            },
        })
        windowList.push(win);
        win.setFullScreen(true)
        win.loadFile('./dist/index.html')
    }
}

app.whenReady().then(() => {
    autoUpdater.checkForUpdates();

    if (process.platform === 'darwin') {
        systemPreferences.askForMediaAccess('camera').then((permit) => {
            if (permit) {
                createMultiWindow()
            }
        })
        systemPreferences.askForMediaAccess('microphone').then((permit) => {
            log.info('microphone permission: ' + permit)
        })
    } else {
        createMultiWindow()
    }

    // 文件路径测试
    // log.info('app path: ' + app.getAppPath())
    // const filePath = path.join(app.getAppPath(), 'assets', "test.file");
    // log.info('filePath: ' + filePath)
    // const outPath = path.join('src', 'assets')
    // log.info('out path: ' + outPath)
    // createOtherWindow()

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createMultiWindow()
    })

    app.on('window-all-closed', () => {
        if (process.platform !== 'darwin') {
            app.quit()
        }
    })

    app.on('will-quit', () => {
        // 注销快捷键
        globalShortcut.unregister('CommandOrControl+X')

        // 注销所有快捷键
        globalShortcut.unregisterAll()
    })

    // 退出应用
    const ret = globalShortcut.register('CommandOrControl+Q', () => {
        // 退出应用时清除定时器
        for (let j = 0; j < tIds.length; j++) {
            clearTimeout(tIds[j])
        }
        app.exit()
    })
    if (!ret) {
        log.info('registration failed')
    }

    // 向上和向下翻页
    globalShortcut.register('UP', () => {
        contentIndex --;
        if (contentIndex < 0) {
            contentIndex = sliceTotal - 1
        }
    })
    globalShortcut.register('DOWN', () => {
        contentIndex ++;
        if (contentIndex >= sliceTotal) {
            contentIndex = 0
        }
    })

    for (let i = 0; i < windowList.length; i++) {
        globalShortcut.register(`${i+1}`, () => {
            // 视频控制
            windowList[i].webContents.postMessage('toggleVideo', null, [])
        })
    }

    globalShortcut.register('Space', () => {
        for (let i = 0; i < windowList.length; i++) {
            // 视频控制
            windowList[i].webContents.postMessage('toggleAllVideo', null, [])
        }
    })

    // 清除本地缓存
    globalShortcut.register('CommandOrCtrl+SHIFT+DELETE', () => {
        const clearObj = {
            storages: ['appcache', 'filesystem', 'indexdb', 'localstorage', 'shadercache', 'websql', 'serviceworkers', 'cachestorage'],
        };
        for (let i = 0; i < windowList.length; i++) {
            windowList[i].webContents.session.clearStorageData(clearObj)
        }
    })
})


