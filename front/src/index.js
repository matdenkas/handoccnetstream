// import * as handTrack from 'handtrackjs';
import * as THREE from 'three';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';

let BBOX_MODEL = null;
let loadedHand = null;
let SCENE = null;
let CAMERA = null;
let RENDERER = null;
let LOADER = null;


$( document ).ready(function() {
    let but2 = document.getElementById("but2");
    but2.addEventListener("click", () => { get_processed_result();});


    let but = document.getElementById("but");
    let video = document.getElementById("vid");
    let mediaDevices = navigator.mediaDevices;
    vid.muted = true;

    init_scene()
    init_bbox_detection_model()

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
        let img = document.getElementById("img_drop");
        img.src = image_url;

        p_detect(img, image_url);
    });

});



function init_scene() {
    SCENE = new THREE.Scene();
    CAMERA = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
    LOADER = new OBJLoader();
    RENDERER = new THREE.WebGLRenderer();

    RENDERER.setSize( window.innerWidth, window.innerHeight );
    document.getElementById('resultsContainer').appendChild(RENDERER.domElement);

    CAMERA.position.z = 0.3; // Adjust camera zoom

    // Create Lights
    var directionalLight = new THREE.DirectionalLight(0xffffff, 0.5); // color, intensity
    directionalLight.position.set(0, 1, 0); // position the light
    var ambientLight = new THREE.AmbientLight(0x404040); // soft white light
    SCENE.add(directionalLight);
    SCENE.add(ambientLight);
}

async function init_bbox_detection_model() {
    BBOX_MODEL =  await handTrack.load({
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
    console.log('Hand bbox model loaded!')
}


function load_hand_from_ref(hand_ref){
    LOADER.load(
        hand_ref, // resource URL
        function ( object ) { add_hand_to_scene(object); }, // called when resource is loaded
        function ( xhr ) {  console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' ); }, // called when loading is in progresses
        function ( error ) { console.log( 'An error happened' , error); } // called when loading has errors
    );
}

var isDragging = false;
var previousMousePosition = {
    x: 0,
    y: 0
};

function add_rotation_event_listeners(){

    document.addEventListener('mousedown', function(event) {
        isDragging = true;
        previousMousePosition = {
            x: event.clientX,
            y: event.clientY
        };
    });

    document.addEventListener('mousemove', function(event) {
        if (isDragging) {
            var deltaMove = {
                x: event.clientX - previousMousePosition.x,
                y: event.clientY - previousMousePosition.y
            };

            loadedHand.rotation.y += deltaMove.x * 0.01;
            loadedHand.rotation.x += deltaMove.y * 0.01;

            previousMousePosition = {
                x: event.clientX,
                y: event.clientY
            };
        }
    });

    document.addEventListener('mouseup', function(event) {
        isDragging = false;
    });
}

function add_hand_to_scene(hand_obj){

    if (loadedHand) { // Remove old hand
        SCENE.remove(loadedHand)
    }
    SCENE.add( hand_obj ); // add new hand
    loadedHand = hand_obj; // remember hand loaded

    add_rotation_event_listeners();

    function animate() {
        requestAnimationFrame( animate );
    
        RENDERER.render( SCENE, CAMERA );
    }
    animate();
}

async function p_detect(image, url) {

    // Detecting hand from image
    let predictions =  await BBOX_MODEL.detect(image);
    let most_conf_pred = process_pred_results(predictions);
  
    if (!most_conf_pred) {console.log('BOOOO'); return; }

    // Rendering bbox image
    let canvas = document.getElementById('img_bbox');
    BBOX_MODEL.renderPredictions([most_conf_pred], canvas, canvas.getContext('2d'), image); 

    send_image_for_process(most_conf_pred, url, image);
}


function process_pred_results(predictions) {
    let predictions_noFace = []
    predictions.forEach(function(item, index, object){
        if(item.label != "face") {
            predictions_noFace.push(item)
        }
    });

    if(predictions_noFace.length == 0) { return null; }

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

    most_conf_pred = expand_bbox(most_conf_pred);
    return most_conf_pred
}

function expand_bbox(prediction) {
    prediction.bbox[0] = prediction.bbox[0] - (prediction.bbox[0] * 0.2);
    prediction.bbox[1] = prediction.bbox[1] - (prediction.bbox[1] * 0.2);
    prediction.bbox[2] = prediction.bbox[2] + (prediction.bbox[2] * 0.2);
    prediction.bbox[3] = prediction.bbox[3] + (prediction.bbox[3] * 0.2);
    return prediction;
}


function send_image_for_process(prediction, image_ref, image) {
    console.log("Sending image pkg to server for process...");

    var send_pkg = new FormData()
    send_pkg.append('photo', image_ref);
    send_pkg.append('xmin', (prediction.bbox[0] / image.width) * 1920);
    send_pkg.append('ymin', (prediction.bbox[1] / image.height) * 1080);
    send_pkg.append('width', (prediction.bbox[2] / image.width) * 1920);
    send_pkg.append('height', (prediction.bbox[3] / image.height) * 1080);
    $.ajax({
        method : 'POST',
        processData : false,
        contentType : false,
        url : '/process',
        data : send_pkg,
        success : function(o){ 
            console.log("Server responded: Success!");
            get_processed_result() 
        },
        error : function(e){ console.warn(`Server responded: ${e}`);}
    })


}

function get_processed_result() {
    console.log("Requesting processed result from server...");
    $.ajax({
        method: 'GET',
        url: '/nextObj',
        xhrFields: {
            responseType: 'blob' // Set the response type to blob
        },
        success: function(data) {
            console.log("Server responded: Success!");
            let hand_ref = URL.createObjectURL(data);
            load_hand_from_ref(hand_ref);
        },
        error: function(xhr, status, error) { console.warn('Server responded: ', error); }
    });
}
