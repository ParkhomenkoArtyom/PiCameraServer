const database = require("./Database");
const camera = require("./Camera.js");
const ImageProcessor = require('./ImageProcessor.js')
let Jimp = require('jimp');
let fs = require('fs');

let instructions = {};

database.createConnection();

exports.decodeInstructions = function (codedInstructions) {
    instructions = {
        filter: codedInstructions.filter,
        chromaticity: codedInstructions.chromaticity,
        storage: codedInstructions.storage,
        filename: codedInstructions.fileName,
        resolution: codedInstructions.resolution,
        source: codedInstructions.source
    }
}

exports.executeCommand = async function (instructionCode) {

    switch (instructionCode) {
        case 1:
            return await sendPhoto();
        case 2:
            return getPicturesFromDevice();
        case 3:
            return await database.getFilesFromDatabase();
        case 4:
            if (instructions.source == 1)
                deleteFileFromCameraStorage(instructions.filename);
            else database.deleteFileFormDatabase(instructions.filename)
            break;
    }

}

let checkIfExists = async function (filename) {
    var images = [], ifConsistsFlag = true;
    if (instructions.storage == 1) {
        images = getPicturesFromDevice();
    } else images = await database.getFilesFromDatabase();

    if (images!= []) {
        while (ifConsistsFlag != false) {
            if (images.filter(obj => obj.filename === filename).length != 0)
                filename += '1';
            else 
                ifConsistsFlag = false;
        }
    }

    return filename;
}

let sendPhoto = async function () {
    let dataToSend;

    instructions.filename = await checkIfExists(instructions.filename);

    await camera.takeAPhoto(camera.decodePhotoParameters(instructions));

    if (instructions.filter !== null)
        await doFilter(instructions.filter);
    else
        await doFilter(instructions.chromaticity);

    dataToSend = fs.readFileSync(`./images/${instructions.filename}.jpg`, 'base64');

    if (instructions.storage == 2) {
        database.addFileToDatabase(dataToSend, instructions.filename);
        deleteFileFromCameraStorage(instructions.filename);
    }

    return dataToSend;
}

let deleteFileFromCameraStorage = function (filename) {
    fs.unlinkSync('./images/' + filename + '.jpg');
}

var doFilter = async function (filter) {
    filter = String(filter);

    const image = await Jimp.read('./images/' + instructions.filename + '.jpg');

    switch (filter.substring(0, 1)) {
        case '1':
            var saturationValue = filter.substring(1, filter.indexOf('C')).substring(2);
            var contrastValue = filter.substring(filter.indexOf('C'), filter.indexOf('B')).substring(2);
            var brightnessValue = filter.substring(filter.indexOf('B')).substring(2);

            if (saturationValue == '0' && contrastValue == '0' && brightnessValue == '0')
                break;

            await new ImageProcessor(image, image.getWidth(), image.getHeight(), instructions.filename)
                .setColour(saturationValue, contrastValue, brightnessValue);
            break;
        case '2':
            await new ImageProcessor(image, image.getWidth(), image.getHeight(), instructions.filename).sharpenFilter();
            break;
        case '3':
            await new ImageProcessor(image, image.getWidth(), image.getHeight(), instructions.filename).medianFilter();
            break;
        case '4':
            await new ImageProcessor(image, image.getWidth(), image.getHeight(), instructions.filename).negativeFilter();
            break;
        case '5':
            await new ImageProcessor(image, image.getWidth(), image.getHeight(), instructions.filename).grayScaleFilter();
            break;
        default:
            break;
    }
}

let _getAllFilesFromFolder = function (dir) {
    var results = [];

    fs.readdirSync(dir).forEach(function (file) {

        file = dir + '/' + file;
        var stat = fs.statSync(file);

        if (stat && stat.isDirectory()) {
            results = results.concat(_getAllFilesFromFolder(file))
        } else results.push(file);

    });

    return results;

};

let getPicturesFromDevice = function () {
    var picturesPath = _getAllFilesFromFolder("./images");

    var picturesInBase64Format = [];
    for (var pictureCount = 0; pictureCount < picturesPath.length; pictureCount++) {
        picturesInBase64Format[pictureCount] = {
            filename: picturesPath[pictureCount].substring(9, picturesPath[pictureCount].length - 4),
            data: fs.readFileSync(picturesPath[pictureCount], 'base64'),
            source: 1
        };
    }
    return picturesInBase64Format;
}

