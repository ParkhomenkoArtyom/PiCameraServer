var Jimp = require('jimp');


module.exports = class ImageProcessor extends Jimp {

    constructor(buffer, width, height, resultFileName) {
        super(width, height);

        this.buffer = buffer;
        this.width = width;
        this.height = height;

        this.pixels = [];
        this.filteredPixels = [];
        this.resultFileName = resultFileName;
    }

    getPixels() {
        var classObg = this;
        this.buffer.scan(0, 0, this.width, this.height, function (x, y, idx) {
            var pixel = {
                red: this.bitmap.data[idx + 0],
                green: this.bitmap.data[idx + 1],
                blue: this.bitmap.data[idx + 2],
                alpha: this.bitmap.data[idx + 3]
            }
            classObg.pixels.push(pixel);
        });
    }

    createPictureFrameBeforeProcessing() {
        this.getPixels();
        var width = this.width, height = this.height
        var framedPexels = new Array((width + 2) * (height + 2));
        for (var y = 0; y < height; y++) {
            for (var x = 0; x < width; x++)
                framedPexels[(y + 1) * (width + 2) + x + 1] = this.pixels[y * width + x];
        }
        framedPexels[0] = this.pixels[0]; framedPexels[(width + 2) - 1] = this.pixels[width - 1];
        framedPexels[(width + 2) * ((height + 2) - 1)] = this.pixels[width * (height - 1)];
        framedPexels[(width + 2) * (height + 2) - 1] = this.pixels[width * height - 1];
        for (var x = 0; x < width; x++) {
            framedPexels[x + 1] = this.pixels[x];
            framedPexels[((height + 2) - 1) * (width + 2) + x + 1] = this.pixels[width * (height - 1) + x];
        }
        for (var y = 0; y < height; y++) {
            framedPexels[(y + 1) * (width + 2)] = this.pixels[y * width];
            framedPexels[(y + 1) * (width + 2) + (width + 2) - 1] = this.pixels[y * width + width - 1];
        }
        return framedPexels;
    }

    setBrightness(val) {
        this.buffer.brightness(val);
    }

    setContrast(val) {
        this.buffer.contrast(val);
    }

    setSaturation(val) {
        this.getPixels();
        for (var y = 0; y < this.height; y++) {
            for (var x = 0; x < this.width; x++) {
                var RED = this.pixels[y * this.width + x].red;
                var GREEN = this.pixels[y * this.width + x].green;
                var BLUE = this.pixels[y * this.width + x].blue;

                var GRAYPIXEL = 0.2126 * RED + 0.7152 * GREEN + 0.0722 * BLUE;

                RED += (RED - GRAYPIXEL) * val / 255;
                GREEN += (GREEN - GRAYPIXEL) * val / 255;
                BLUE += (BLUE - GRAYPIXEL) * val / 255;

                RED = (RED > 255) ? 255 : (RED < 0) ? 0 : RED;
                GREEN = (GREEN > 255) ? 255 : (GREEN < 0) ? 0 : GREEN;
                BLUE = (BLUE > 255) ? 255 : (BLUE < 0) ? 0 : BLUE;

                this.filteredPixels.push({ red: RED, green: GREEN, blue: BLUE, alpha: 255 });
            }
        }
    }

    async setColour(saturationValue, contrastValue, brightnessValue) {
        this.setBrightness(Number.parseInt(brightnessValue) / 255);
        this.setContrast(Number.parseInt(contrastValue) / 255);
        this.setSaturation(saturationValue);
        await this.convertToImage('images/' + this.resultFileName + '.jpg');
    }

    async negativeFilter() {
        this.getPixels();
        for (var y = 0; y < this.height; y++) {
            for (var x = 0; x < this.width; x++) {
                this.filteredPixels.push({
                    red: (255 - this.pixels[y * this.width + x].red),
                    green: (255 - this.pixels[y * this.width + x].green),
                    blue: (255 - this.pixels[y * this.width + x].blue),
                    alpha: 255
                });
            }
        }
        await this.convertToImage('images/' + this.resultFileName + '.jpg');
    }

    getPixelByCoefficientsMultiplication(inputMatrix, coefficientsMatrix, divideCoefficient) {

        var resultPixel = { red: 0, green: 0, blue: 0, alpha: 255 };
        for (var y = 0; y < 3; y++) {
            for (var x = 0; x < 3; x++) {
                resultPixel.red += inputMatrix.red[y * 3 + x] * coefficientsMatrix[y * 3 + x];
                resultPixel.green += inputMatrix.green[y * 3 + x] * coefficientsMatrix[y * 3 + x];
                resultPixel.blue += inputMatrix.blue[y * 3 + x] * coefficientsMatrix[y * 3 + x];
            }
        }

        resultPixel = {
            red: (resultPixel.red / divideCoefficient > 255) ? 255 : (resultPixel.red / divideCoefficient < 0) ? 0 :
                resultPixel.red / divideCoefficient,

            green: (resultPixel.green / divideCoefficient > 255) ? 255 : (resultPixel.green / divideCoefficient < 0) ? 0 :
                resultPixel.green / divideCoefficient,

            blue: (resultPixel.blue / divideCoefficient > 255) ? 255 : (resultPixel.blue / divideCoefficient < 0) ? 0 :
                resultPixel.blue / divideCoefficient,
            alpha: 255
        };

        return resultPixel;
    }

    getRoundPixels(width, xPos, yPos, pixels) {

        var RED = [pixels[yPos * (width + 2) + xPos].red, pixels[yPos * (width + 2) + xPos + 1].red, pixels[yPos * (width + 2) + xPos + 2].red,
        pixels[(yPos + 1) * (width + 2) + xPos].red, pixels[(yPos + 1) * (width + 2) + xPos + 1].red, pixels[(yPos + 1) * (width + 2) + xPos + 2].red,
        pixels[(yPos + 2) * (width + 2) + xPos].red, pixels[(yPos + 2) * (width + 2) + xPos + 1].red, pixels[(yPos + 2) * (width + 2) + xPos + 2].red];

        var GREEN = [pixels[yPos * (width + 2) + xPos].green, pixels[yPos * (width + 2) + xPos + 1].green, pixels[yPos * (width + 2) + xPos + 2].green,
        pixels[(yPos + 1) * (width + 2) + xPos].green, pixels[(yPos + 1) * (width + 2) + xPos + 1].green, pixels[(yPos + 1) * (width + 2) + xPos + 2].green,
        pixels[(yPos + 2) * (width + 2) + xPos].green, pixels[(yPos + 2) * (width + 2) + xPos + 1].green, pixels[(yPos + 2) * (width + 2) + xPos + 2].green]

        var BLUE = [pixels[yPos * (width + 2) + xPos].blue, pixels[yPos * (width + 2) + xPos + 1].blue, pixels[yPos * (width + 2) + xPos + 2].blue,
        pixels[(yPos + 1) * (width + 2) + xPos].blue, pixels[(yPos + 1) * (width + 2) + xPos + 1].blue, pixels[(yPos + 1) * (width + 2) + xPos + 2].blue,
        pixels[(yPos + 2) * (width + 2) + xPos].blue, pixels[(yPos + 2) * (width + 2) + xPos + 1].blue, pixels[(yPos + 2) * (width + 2) + xPos + 2].blue]

        return { red: RED, green: GREEN, blue: BLUE }
    }

    async medianFilter() {
        var height = this.height, width = this.width, pixels = this.createPictureFrameBeforeProcessing();
        for (var y = 0; y < height; y++) {
            for (var x = 0; x < width; x++) {

                var RGB = this.getRoundPixels(width, x, y, pixels);
                RGB.red.sort(function (a, b) { return a - b; });
                RGB.green.sort(function (a, b) { return a - b; });
                RGB.blue.sort(function (a, b) { return a - b; });

                this.filteredPixels.push({
                    red: RGB.red[4], green: RGB.green[4], blue: RGB.blue[4], alpha: 255
                });
            }
        }
        await this.convertToImage('images/' + this.resultFileName + '.jpg');
    }

    async sharpenFilter() {
        var sharpenCoefficients = [-1, -2, -1, -2, 22, -2, -1, -2, -1];
        var height = this.height, width = this.width, pixels = this.createPictureFrameBeforeProcessing();

        for (var y = 0; y < height; y++) {
            for (var x = 0; x < width; x++) {
                var RGB = this.getRoundPixels(width, x, y, pixels);
                this.filteredPixels.push(this.getPixelByCoefficientsMultiplication(RGB, sharpenCoefficients, 10));
            }
        }
        await this.convertToImage('images/' + this.resultFileName + '.jpg');
    }


    async blackAndWhiteFilter() {
        var height = this.height, width = this.width; this.getPixels();

        for (var y = 0; y < height; y++) {
            for (var x = 0; x < width; x++) {

                var pixel = (this.pixels[y * width + x].red + this.pixels[y * width + x].green
                    + this.pixels[y * width + x].blue) > 255 ? 255 : 0

                this.filteredPixels.push({ red: pixel, green: pixel, blue: pixel, alpha: 255 });
            }
        }
        await this.convertToImage('images/' + this.resultFileName + '.jpg');
    }

    async grayScaleFilter() {
        var height = this.height, width = this.width; this.getPixels();

        for (var y = 0; y < height; y++) {
            for (var x = 0; x < width; x++) {
                var grayPixel = 0.2126 * this.pixels[y * width + x].red + 0.7152 * this.pixels[y * width + x].green
                    + 0.0722 * this.pixels[y * width + x].blue;
                this.filteredPixels.push({ red: grayPixel, green: grayPixel, blue: grayPixel, alpha: 255 });
            }
        }

        await this.convertToImage('images/' + this.resultFileName + '.jpg');
    }

    async convertToImage(path) {
        var classObg = this;

        var image = new Jimp(this.width, this.height);
         image.scan(0, 0, this.width, this.height, function (x, y, idx) {
            var coordinate = classObg.width * y + x
            image.bitmap.data[idx + 0] = classObg.filteredPixels[coordinate].red;
            image.bitmap.data[idx + 1] = classObg.filteredPixels[coordinate].green;
            image.bitmap.data[idx + 2] = classObg.filteredPixels[coordinate].blue;
            image.bitmap.data[idx + 3] = classObg.filteredPixels[coordinate].alpha;
        })
        
        await  image.writeAsync(path);
    }
};
