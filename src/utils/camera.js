import IPC from "@/utils/ipc";

class Camera {
    constructor(element) {
        this.ipc = new IPC()
        // 照片的大小
        this.width = 640
        this.camera = element
        this.isHide = true
    }
    open(complete, error) {
        let _this = this;
        let constraints = {
            audio: false,
            video: true,
            width: 640,
            height: 480
        };
        navigator.mediaDevices
            .getUserMedia(constraints)
            .then(function(stream) {
                _this.camera.srcObject = stream;
                _this.camera.onloadedmetadata = function() {
                    _this.camera.play();
                    console.log("open camera")
                    complete()
                };
            })
            .catch(err => {
                console.log(err);
                error(err)
            });

        let width = this.width;
        this.camera.addEventListener('canplay', () => {
            if (!_this.streaming) {
                _this.height = _this.camera.videoHeight / (_this.camera.videoWidth / width);

                console.log(`camera width: ${_this.camera.videoWidth}， height: ${_this.camera.videoHeight}`)
                // 不显示摄像头
                if (this.isHide) {
                    _this.camera.setAttribute('width', '0');
                    _this.camera.setAttribute('height', '0');
                } else {
                    _this.camera.setAttribute('width', '50');
                    _this.camera.setAttribute('height', `${Math.round(50 * 480 / 640)}`);
                }
                _this.streaming = true;
            }
        }, false)
    }
    capture() {
        let canvas = document.createElement('canvas');
        let { width, height } = this;
        if (width && height) {
            let ctx = canvas.getContext('2d');
            canvas.width = width;
            canvas.height = height;
            console.log(`拍照: width: ${width} x ${height}`)
            ctx.drawImage(this.camera, 0, 0, width, height);
            return canvas.toDataURL("image/jpeg").replace('data:image/jpeg;base64,', '')
        }
        return null
    }
    image() {
        let canvas = document.createElement('canvas');
        let { width, height } = this;
        if (width && height) {
            let ctx = canvas.getContext('2d');
            canvas.width = width;
            canvas.height = height;
            console.log(`拍照: width: ${width} x ${height}`)
            ctx.drawImage(this.camera, 0, 0, width, height);
            return canvas.toDataURL("image/jpeg")
        }
        return null
    }
}

export default Camera