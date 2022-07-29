const {app, BrowserWindow, screen, globalShortcut, dialog, Notification } = require('electron')
const path = require('path')
const StreamZip = require("node-stream-zip");
const fs = require("fs");
require('@electron/remote/main').initialize()
const ipc = require('electron').ipcMain

let windowList = [];

ipc.on('getAppPath', function (e) {
    e.returnValue = app.getAppPath()
})
ipc.on('getScreenNum', function (e) {
    e.returnValue = windowList.length
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
let contentIndex = 0
let sliceTotal = 0
// 显示屏幕内容
ipc.on('showContent', function (e, screens, interval) {
    let div = Math.floor(screens.length / windowList.length)
    let re = screens.length % windowList.length
    let num = re > 0 ? div + 1 : div
    console.log(`div = ${div}, re: ${re}, num = ${num}, screens: ${screens.length}`)
    sliceTotal = num
    let sliceScreens = []
    for (let i = 0; i < num; i++) {
        sliceScreens.push(screens.slice(i, i * windowList.length))
    }

    // 分片
    let single_screens = sliceScreens[contentIndex]
    console.log('分片', single_screens)

    for (let i = 0; i < windowList.length; i++) {
        // 给每块屏幕发送消息
        if (interval && interval > 0) {
            // 延迟显示
            let tId = null;
            if (single_screens.length > 0) {
                tId = setTimeout(() => {
                    windowList[i].webContents.postMessage('onShowContent', single_screens, [])
                    console.log('延迟显示内容-----', single_screens.length)
                }, interval * i)
                tIds.push(Number(tId))
            } else {
                for (let j = 0; j < tIds.length; j++) {
                    clearTimeout(tIds[j])
                }
                console.log('清空内容-----', tIds)
                tIds = []
                windowList[i].webContents.postMessage('onShowContent', [], [])
            }
        } else {
            // 同步显示
            // console.log('同步显示')
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

ipc.on('deleteFiles', function (e, sections) {
    console.log('delete files: ' + sections)
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
    console.log('screens', screens)
    for(let i = 0; i < files.length; i++){
        console.log(files[i])
        let f = files[i]
        let realFile = path.join(assets_dir, f)
        let stat = fs.lstatSync(realFile)
        // 删除多余的文件夹
        if (stat.isDirectory()) {
            if (!screens.has(f)) {
                console.log('delete file: ' + f)
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

ipc.on('downloadResource', function (e, url) {
    let win = windowList[0]
    win.webContents.session.on('will-download', (e, item) => {
        const filePath = path.join(app.getAppPath(), 'assets', item.getFilename());
        // const filePath = "assets\\" + item.getFilename();
        console.log('download file path: ' + filePath)
        item.setSavePath(filePath)
        let value = 0
        item.on('updated', (evt, state) => {
            console.log('update state: ' + state)
            if ('progressing' === state) {
                if (item.isPaused()) {
                    console.log('Download is paused')
                } else {
                    //此处  用接收到的字节数和总字节数求一个比例  就是进度百分比
                    if (item.getReceivedBytes() && item.getTotalBytes()) {
                        value = parseInt(100 * (item.getReceivedBytes() / item.getTotalBytes()))
                    }
                    // 把百分比发给渲染进程进行展示
                    win.webContents.send('onDownloadProgress', value);
                    // mac 程序坞、windows 任务栏显示进度
                    win.setProgressBar(value);
                }
            }
            if (state === 'interrupted') {
                console.log('Download is interrupted but can be resumed')
            }
        })

        //监听下载结束事件
        item.on('done', (e, state) => {
            console.log('done: ' + state)
            //如果窗口还在的话，去掉进度条
            if (!win.isDestroyed()) {
                win.setProgressBar(-1);
            }
            //下载被取消或中断了
            if (state === 'interrupted') {
                dialog.showErrorBox('下载失败', `文件 ${item.getFilename()} 因为某些原因被中断下载`);
            }
            if (state === 'completed') {
                console.log('资源下载成功')
                win.webContents.send('onDownloadCompleted');
                // 解压资源文件
                const zip = new StreamZip({
                    file: filePath,
                    storeEntries: true
                });
                let outPath = path.join(app.getAppPath(), 'assets')
                zip.on('ready', () => {
                    zip.extract(null, outPath, (err, count) => {
                        console.log(err ? 'Extract error' : `Extracted ${count} entries`);
                        if (!err) {
                            win.webContents.send('onResourceUpdated');
                        }
                        zip.close();
                    });
                });
            }
        });
    })
    win.webContents.downloadURL(url)
})
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
            const folder = path.join(app.getAppPath(), 'assets', 'contents')
            if (!fs.existsSync(folder)) {
                fs.mkdirSync(folder)
            }
            const filePath = path.join(folder, item.getFilename());
            console.log('download file path: ' + filePath)
            item.setSavePath(filePath)
            let value = 0
            item.on('updated', (evt, state) => {
                console.log('update state: ' + state)
                if ('progressing' === state) {
                    if (item.isPaused()) {
                        console.log('Download is paused')
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
                    console.log('Download is interrupted but can be resumed')
                }
            })

            //监听下载结束事件
            item.on('done', (e, state) => {
                console.log('done: ' + state)
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
                    console.log('资源下载成功: ' + index + ', urls length: ' + urls.length)
                    if (index < urls.length - 1) {
                        downloadSingleFile(win, urls, ++index)
                    } else {
                        win.webContents.send('onDownloadMultiFileCompleted');
                    }
                }
            });
        })
    }
    console.log(`下载资源: ${urls[index]}`)
    win.webContents.downloadURL(urls[index])
}


const createMultiWindow = () => {
    let displays = screen.getAllDisplays()
    displays.find((display) => {
        console.log(`find display id: ${display.id}, ${display.bounds.width} x ${display.bounds.height}`)
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

    console.log('xArr', xArr)
    console.log('yArr', yArr)

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
                    console.log(`x = ${x}, y = ${y}`)
                    console.log(`xArr[${i}] = ${xArr[i]}, yArr[${j}] = ${yArr[j]}`)
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

    console.log('找到屏幕：', screenIndexes)

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
    // createWindow()
    createMultiWindow()

    // 文件路径测试
    console.log('app path: ' + app.getAppPath())
    const filePath = path.join(app.getAppPath(), 'assets', "test.file");
    console.log('filePath: ' + filePath)
    const outPath = path.join('src', 'assets')
    console.log('out path: ' + outPath)
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

    // 注册一个'CommandOrControl+X' 快捷键监听器
    const ret = globalShortcut.register('CommandOrControl+X', () => {
        app.exit()
    })
    if (!ret) {
        console.log('registration failed')
    }

    globalShortcut.register('CommandOrControl+N', () => {
        contentIndex ++;
        if (contentIndex >= sliceTotal) {
            contentIndex = 0
        }
    })

    // 清除本地缓存
    globalShortcut.register('CommandOrCtrl+Shift+Delete', () => {
        const clearObj = {
            storages: ['appcache', 'filesystem', 'indexdb', 'localstorage', 'shadercache', 'websql', 'serviceworkers', 'cachestorage'],
        };
        for (let i = 0; i < windowList.length; i++) {
            windowList[i].webContents.session.clearStorageData(clearObj)
        }
    })
})


