// import * as handTrack from 'handtrackjs';
import * as THREE from 'three';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';

let model = null;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
const loader = new OBJLoader();

const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

const geometry = new THREE.BoxGeometry( 1, 1, 1 );
const material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
const cube = new THREE.Mesh( geometry, material );
scene.add( cube );

camera.position.z = 5;

function animate() {
	requestAnimationFrame( animate );

	cube.rotation.x += 0.01;
	cube.rotation.y += 0.01;

	renderer.render( scene, camera );
}

animate();

$( document ).ready(function() {
    let but = document.getElementById("but");
    let video = document.getElementById("vid");
    let mediaDevices = navigator.mediaDevices;
    vid.muted = true;

    get_model()


    but.addEventListener("click", () => {

        // Accessing the user camera and video.
        mediaDevices
            .getUserMedia({
                video: true,
                audio: false,
            })
            .then((stream) => {
                // Changing the source of video to current stream.
                video.srcObject = stream;
                video.addEventListener("loadedmetadata", () => {
                    video.play();
                });
            })
            .catch(alert);
    });

    let next = document.getElementById("next");
    next.addEventListener("click", () => {
        let canvas = document.createElement('canvas');
    
        canvas.width = 1920;
        canvas.height = 1080;
    
        let ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height );
    
        let image_url = canvas.toDataURL('image/jpeg');
        let img = document.getElementById("img_bbox");

        img.src = image_url;
        p_detect(img, image_url);
    });

});



async function get_model() {
    model =  await handTrack.load({
        flipHorizontal: false,
        outputStride: 16,
        imageScaleFactor: 1,
        maxNumBoxes: 3,
        iouThreshold: 0.2,
        scoreThreshold: 0.25,
        modelType: "ssd320fpnlite",
        modelSize: "large",
        bboxLineWidth: "2",
        fontSize: 17,
    })
    console.log('model set')
}

async function p_detect(image, url) {
    let predictions =  await model.detect(image)
    let canvas = document.getElementById('myCanvas');
    
    let predictions_noFace = []
    predictions.forEach(function(item, index, object){
        if(item.label != "face") {
            predictions_noFace.push(item)
        }
    });

    if(predictions_noFace.length == 0) { return }

    let max_conf_seen = 0
    let most_conf_pred = null
    if(predictions_noFace.len > 1) {

        predictions.forEach(function(item, index, object){
            if(item.score > max_conf_seen) {
                max_conf_seen = item.score;
                most_conf_pred = item;
            }
        });
    }
    else {
        most_conf_pred = predictions_noFace[0];
    }

    most_conf_pred.bbox[0] = most_conf_pred.bbox[0] - (most_conf_pred.bbox[0] * 0.2)
    most_conf_pred.bbox[1] = most_conf_pred.bbox[1] - (most_conf_pred.bbox[1] * 0.2)
    most_conf_pred.bbox[2] = most_conf_pred.bbox[2] + (most_conf_pred.bbox[2] * 0.2)
    most_conf_pred.bbox[3] = most_conf_pred.bbox[3] + (most_conf_pred.bbox[3] * 0.2)

    model.renderPredictions([most_conf_pred], canvas, canvas.getContext('2d'), image); 

    var formdata = new FormData()
    formdata.append('photo', url);
    formdata.append('xmin', (most_conf_pred.bbox[0] / image.width) * 1920);
    formdata.append('ymin', (most_conf_pred.bbox[1] / image.height) * 1080);
    formdata.append('width', (most_conf_pred.bbox[2] / image.width) * 1920);
    formdata.append('height', (most_conf_pred.bbox[3] / image.height) * 1080);
    $.ajax({
        method : 'POST',
        processData : false,
        contentType : false,
        url : '/process',
        data : formdata,
        success : function(o){

            $.ajax({
                method: 'GET',
                url: '/next', // Assuming this is the correct endpoint
                xhrFields: {
                    responseType: 'blob' // Set the response type to blob
                },
                success: function(data) {
                    // On success, create an object URL from the blob
                    var imageUrl = URL.createObjectURL(data);

                    img = document.getElementById("img_bbox");
                    // Create an image element
                    img.src = imageUrl;
            
                },
                error: function(xhr, status, error) {
                    console.error('Error fetching image:', error);
                }
            });

            $.ajax({
                method: 'GET',
                url: '/nextObj', // Assuming this is the correct endpoint
                xhrFields: {
                    responseType: 'blob' // Set the response type to blob
                },
                success: function(data) {
                    // On success, create an object URL from the blob
                    console.log(data);


                    let obj = URL.createObjectURL(data);
                    console.log(obj)

                    loader.load(
                        // resource URL
                        obj,
                        // called when resource is loaded
                        function ( object ) {
                            

                            scene.add( object );
                            console.log(object)
                            animate();
                    
                        },
                        // called when loading is in progresses
                        function ( xhr ) {
                    
                            console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );
                    
                        },
                        // called when loading has errors
                        function ( error ) {
                    
                            console.log( 'An error happened' , error);
                    
                        }
                    );
            
                },
                error: function(xhr, status, error) {
                    console.error('Error fetching image:', error);
                }
            });
        },
        error : function(e){
            //callback here on error
            console.log('error')
        }
    })

}


   
