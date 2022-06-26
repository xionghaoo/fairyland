function replay(videoElement, url) {
    let video = videoElement;
    console.log("replay video: " + url)
    let source = document.createElement('source');
    video.pause();
    source.setAttribute('src', url);
    source.setAttribute('type', 'video/mp4');
    video.load();
    video.play();
}

export { replay }