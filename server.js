const express = require('express')
const multer = require('multer')
const jpeg = require('jpeg-js')
const path = require('path')
const fs = require('fs')

const tf = require('@tensorflow/tfjs-node')
const nsfw = require('nsfwjs')

const app = express()
const upload = multer()

let _model

const convert = async (img) => {
  // Decoded image in UInt8 Byte array
  const image = await jpeg.decode(img, true)

  const numChannels = 3
  const numPixels = image.width * image.height
  const values = new Int32Array(numPixels * numChannels)

  for (let i = 0; i < numPixels; i++)
    for (let c = 0; c < numChannels; ++c)
      values[i * numChannels + c] = image.data[i * 4 + c]

  return tf.tensor3d(values, [image.height, image.width, numChannels], 'int32')
}

app.post('/nsfw', upload.single("image"), async (req, res) => {
    console.log( "recived req", req.file, req );
  if (!req.file){
    console.log("no llego :S");
    res.status(400).send("Missing image multipart/form-data");
  } else {
      
    const image = await convert(req.file.buffer)
    const predictions = await _model.classify(image)
    image.dispose()
    res.json(predictions)
    console.log( predictions );
  }
});

app.get('/', (req, res) => {
    res.send('Hello World!')
});


const upload2 = multer({
    dest: "temp/"
    // you might also want to set some limits: https://github.com/expressjs/multer#limits
  });

  app.post(
    "/upload",
    upload2.single("file" /* name attribute of <file> element in your form */),
    (req, res) => {
        console.log("aaaaaaaaaaaaaaaa");
      const tempPath = req.file.path;
      const targetPath = path.join(__dirname, "./uploads/image.png");
  
      if (path.extname(req.file.originalname).toLowerCase() === ".png") {
        fs.rename(tempPath, targetPath, err => {
          if (err) return handleError(err, res);
  
          res
            .status(200)
            .contentType("text/plain")
            .end("File uploaded!");
        });
      } else {
        fs.unlink(tempPath, err => {
          if (err) return handleError(err, res);
  
          res
            .status(403)
            .contentType("text/plain")
            .end("Only .png files are allowed!");
        });
      }
    }
  );

const load_model = async () => {
  _model = await nsfw.load()
}

// Keep the model in memory, make sure it's loaded only once
load_model().then(() => app.listen(8080))