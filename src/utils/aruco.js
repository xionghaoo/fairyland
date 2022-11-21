class Aruco {
    constructor() {
        document.getElementById("test").onload = function () {
            const testa = new Function(`return TestA`)();
            console.log('Aruco test', testa);
        };

        // document.getElementById("opencvjs").onload = function () {
        //     const cv = new Function(`return cv`)();
        //     console.log('cv', cv);
        // }
    }
}

export default Aruco;