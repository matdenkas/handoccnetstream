document.addEventListener("DOMContentLoaded", () => {
    let but = document.getElementById("but");
    let video = document.getElementById("vid");
    let mediaDevices = navigator.mediaDevices;
    vid.muted = true;




    but.addEventListener("click", () => {

        // Accessing the user camera and video.
        mediaDevices
            .getUserMedia({
                video: true,
                audio: true,
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
        ctx.drawImage( video, 0, 0, canvas.width, canvas.height );
    
        let image = canvas.toDataURL('image/jpeg');

        var formdata = new FormData()
        formdata.append('photo', image)
        $.ajax({
            method : 'POST',
            processData : false,
            contentType : false,
            url : '/imageupload',
            data : formdata,
            success : function(o){
                //callback here on success
                console.log('success')
                console.log(o)
            },
            error : function(e){
                //callback here on error
                console.log('error')
            }
        })
    });


});