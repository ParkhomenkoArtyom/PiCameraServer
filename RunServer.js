const express = require('express')
const app = express()
const port = 7777
const controller = require('./Controller.js');

app.use(express.urlencoded({ extended: false }))

app.use(express.json())

app.post('/takePhoto', async (req, res) => {
    controller.decodeInstructions(req.body.config);
    res.send(await controller.executeCommand(1));
});

app.post('/deletePhoto', async (req, res) => {
    controller.decodeInstructions(req.body);
    res.send(await controller.executeCommand(4));
});

app.get('/getAllImagesFromCameraStorage', async (req, res) => {
    res.send(await controller.executeCommand(2));
})

app.get('/getAllImagesFromDatabase', async (req, res) => {
    res.send(await controller.executeCommand(3));
})

app.get('/', (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html>
        <head>
            <title>SERVER</title>
        </head>
        <body>
            <h1>RASPBERRY PI SERVER STARTED</h1>
        </body>
    </html>
    `);
})
app.listen(port, () => {
    console.log("Server started")
})