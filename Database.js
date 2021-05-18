const mongoose = require('mongoose');
const mongoURI = 'mongodb+srv://Camera:Camera@cluster0-gzioo.mongodb.net/mongouploads';

let connection, collection;

exports.createConnection = function () {
    connection = mongoose.createConnection(mongoURI,{useNewUrlParser: true, useUnifiedTopology: true});
    collection = connection.collection('PiCameraPhotos');
}

exports.addFileToDatabase = function (data,filename) {
    var imageData = {filename: filename, data: data,source: 2};
    collection.insertOne(imageData);
}

exports.deleteFileFormDatabase = function (filename) {
    var imageToDelete = {filename: filename}
    return collection.deleteOne(imageToDelete);
}


exports.getFilesFromDatabase = async function () {
    let collection = connection.collection('PiCameraPhotos');
    return await collection.find().toArray();
}



