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
    }
    detect(img) {
        let cv = this.cv;
        let markerIds = new cv.Mat();
        let markerCorners  = new cv.MatVector();
        let RgbImage = new cv.Mat();
        let inputImage = new cv.Mat(height, width, cv.CV_8UC4);
        inputImage = cv.imread(img);
        cv.cvtColor(inputImage, RgbImage, cv.COLOR_RGBA2RGB, 0);
        cv.detectMarkers(RgbImage, this.dictionary, markerCorners, markerIds, this.parameter);
        if (markerIds.rows > 0) {
            // for (let i = 0; i < markerIds.data.length; i++) {
            //     // data是一个 n x 4 矩阵
            //     console.log('detect: ', markerCorners, markerIds.data[i]);
            // }
            let code = markerIds.data[0];
            // 取第一个值就行
            return code + ''
        }
        markerIds.delete();
        markerCorners.delete();
        RgbImage.delete();
        inputImage.delete();
        return null
    }
}

// const detector = new ArucoDetector();

export default ArucoDetector;

// module.exports = detector