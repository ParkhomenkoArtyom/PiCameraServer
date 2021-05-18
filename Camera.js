const PiCamera = require('pi-camera');

exports.decodePhotoParameters = function (photoParameters) {
    let resolution = photoParameters.resolution;
    let width = resolution.substring(0, resolution.indexOf('x'));
    let height = resolution.substring(resolution.indexOf('x') + 1);
    return {filename: photoParameters.filename, width: width, height: height}
}

exports.takeAPhoto = async function (photoParameters) {
    
    const myCamera = new PiCamera({
        mode: 'photo',
        output: `${__dirname}/images/${photoParameters.filename}.jpg`,
        width: photoParameters.width,
        height: photoParameters.height,
        nopreview: true,
    });
    await myCamera.snap();
}