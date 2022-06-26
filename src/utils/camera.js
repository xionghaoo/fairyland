class Camera {
    constructor(element) {
        this.width = 320
        this.camera = element
    }
    open(complete) {
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
            });

        let width = this.width;
        this.camera.addEventListener('canplay', () => {
            if (!_this.streaming) {
                let height = _this.camera.videoHeight / (_this.camera.videoWidth / width);
                _this.height = height;

                console.log(`camera width: ${_this.camera.videoWidth}， height: ${_this.camera.videoHeight}`)
                _this.camera.setAttribute('width', '100');
                _this.camera.setAttribute('height', '100');
                // let canvas = document.getElementById('canvas');
                // canvas.setAttribute('width', width.toString());
                // canvas.setAttribute('height', height.toString());
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
            return canvas.toDataURL("image/jpeg")
        }
        return null
    }
}

export default Camera