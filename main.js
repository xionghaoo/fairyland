const {app, BrowserWindow, screen, globalShortcut, dialog} = require('electron')
const path = require('path')
const StreamZip = require("node-stream-zip");

// const url = require("url");

require('@electron/remote/main').initialize()

const ipc = require('electron').ipcMain

let windowList = [];
// let currentType = '';

ipc.on('show-message-dialog', function (e, msg) {
    dialog.showMessageBox({message: msg})
})
ipc.on('show-open-dialog', function () {
    dialog.showOpenDialog({properties: ['openFile', 'openDirectory', 'multiSelections']})
})
ipc.on('showContent', function (e, args) {
    // let index = args.display;
    // if (windowList[index]) {
    //     windowList[index].webContents.postMessage('onShowContent', args, [])
    // }
    // if (currentType !== args.type) {
    //     // 给渲染窗口发送消息
    //     for (let i = 0; i < windowList.length; i++) {
    //         if (index !== i) {
    //             windowList[i].webContents.postMessage('onShowContent', {
    //                 display: i,
    //                 type: args.type,
    //                 content: 2
    //             }, [])
    //         }
    //     }
    //     currentType = args.type;
    // }

    for (let i = 0; i < windowList.length; i++) {
        windowList[i].webContents.postMessage('onShowContent', args, [])
    }
})
ipc.on('stopContent', function (e, args) {
    // 给渲染窗口发送消息
    for (let i = 0; i < windowList.length; i++) {
        windowList[i].webContents.postMessage('onStopContent', args, [])
    }
})

ipc.on('downloadResource', function (e, url) {
    let win = windowList[0]
    win.webContents.session.on('will-download', (e, item) => {
        // const filePath = path.join('assets', item.getFilename());
        const filePath = "assets\\" + item.getFilename();
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
            // 下载成功后打开文件所在文件夹
            if (state === 'completed') {
                console.log('资源下载成功')

                // 解压资源文件
                const zip = new StreamZip({
                    file: filePath,
                    storeEntries: true
                });
                zip.on('ready', () => {
                    zip.extract(null, 'src\\assets', (err, count) => {
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

const createMultiWindow = () => {
    let displays = screen.getAllDisplays()
    displays.find((display) => {
        console.log(`find display id: ${display.id}, ${display.bounds.width} x ${display.bounds.height}`)
    })
    windowList = []
    let screenIndexes = [];
    for (let i = 0; i < displays.length; i++) {
        let display = displays[i];

        let x = display.bounds.x;
        let y = display.bounds.y;

        let w = 1910;
        let h = 1070
        let threshold = 20;
        let start = -10;
        if (x >= start && x <= threshold && y >= start && y <= threshold) {
            // 第一块屏幕
            screenIndexes.push({
                x: x,
                y: y,
                index: 0
            });
        }
        if (x >= w && x <= w + threshold && y >= start && y <= threshold) {
            // 第二块屏幕
            screenIndexes.push({
                x: x,
                y: y,
                index: 1
            });
        }
        if (x >= start && x <= threshold && y >= h && y <= h + threshold) {
            // 第三块屏幕
            screenIndexes.push({
                x: x,
                y: y,
                index: 2
            });
        }
        if (x >= w && x <= w + threshold && y >= h && y <= h + threshold) {
            // 第四块屏幕
            screenIndexes.push({
                x: x,
                y: y,
                index: 3
            });
        }
    }

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
                nodeIntegration: true,
                contextIsolation: false,
                preload: path.join(__dirname, `preload/page${i}.js`)
            }
        })
        windowList.push(win);
        win.setFullScreen(true)
        win.loadFile('./dist/index.html')
    }
}

app.whenReady().then(() => {
    // createWindow()
    createMultiWindow()
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
})


