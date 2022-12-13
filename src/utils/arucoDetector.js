import Config from "@/utils/config";

let width = Config.imageWidth;
let height = Config.imageHeight;

class ArucoDetector {
    constructor(cv) {
        this.cv = cv
        let dictionary = new cv.aruco_Dictionary(cv.DICT_5X5_250);
        let parameter = new cv.aruco_DetectorParameters();
// parameter.adaptiveThreshWinSizeMin = 3,
        parameter.adaptiveThreshWinSizeMin = 23;
// parameter.adaptiveThreshWinSizeMax = 23,
        parameter.adaptiveThreshWinSizeMax = 23;
        parameter.adaptiveThreshWinSizeStep = 10,
            parameter.adaptiveThreshConstant = 7;
// parameter.minMarkerPerimeterRate = 0.03;
        parameter.minMarkerPerimeterRate = 0.1;
        parameter.maxMarkerPerimeterRate = 4;
        parameter.polygonalApproxAccuracyRate = 0.03;
        parameter.minCornerDistanceRate = 0.05;
        parameter.minDistanceToBorder = 3;
        parameter.minMarkerDistanceRate = 0.05;
        parameter.cornerRefinementMethod = cv.CORNER_REFINE_NONE;
        parameter.cornerRefinementWinSize = 5;
        parameter.cornerRefinementMaxIterations = 30;
        parameter.cornerRefinementMinAccuracy = 0.1;
        parameter.markerBorderBits = 1;
// parameter.perspectiveRemovePixelPerCell = 4;
        parameter.perspectiveRemovePixelPerCell = 2;
        parameter.perspectiveRemoveIgnoredMarginPerCell = 0.13;
        parameter.maxErroneousBitsInBorderRate = 0.35;
        parameter.minOtsuStdDev = 5.0;
        parameter.errorCorrectionRate = 0.6;

        this.dictionary = dictionary;
        this.parameter = parameter;

        this.markerIds = new cv.Mat();
        this.markerCorners  = new cv.MatVector();
        this.RgbImage = new cv.Mat();
        this.inputImage = new cv.Mat(height, width, cv.CV_8UC4);
    }
    detect(img) {
        let cv = this.cv;
        this.inputImage = cv.imread(img);
        cv.cvtColor(this.inputImage, this.RgbImage, cv.COLOR_RGBA2RGB, 0);
        cv.detectMarkers(this.RgbImage, this.dictionary, this.markerCorners, this.markerIds, this.parameter);
        let r = null;
        if (this.markerIds.rows > 0) {
            // for (let i = 0; i < markerIds.data.length; i++) {
            //     // data是一个 n x 4 矩阵
            //     console.log('detect: ', markerCorners, markerIds.data[i]);
            // }
            let code = this.markerIds.data[0];
            // 取第一个值就行
            r = code + ''
        }
        this.inputImage.delete();
        return r
    }
}

// const detector = new ArucoDetector();

export default ArucoDetector;

// module.exports = detector