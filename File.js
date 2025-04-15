const chat_id = JSON.parse(document.getElementById("chat_id").textContent);
const user = JSON.parse(document.getElementById("user").textContent);
var stream = null; 
var remote_video = document.createElement('video');
// const video = document.querySelector('#local');
//const remotevideo = document.querySelector('#remote');
var call_start_time = "0:0:0";
var call_end_time = "0:0:0";
var caller = "";
var all_peer_connections=[];// a user : peerconnection dictionnary
var myconnection = null;
var some_one_joined=false;
var call_time=0;
let interval, ensure_video_play;
var store_offer=null;//this will be used as a buffer to store the recieved offer incase the connection is not ready
var store_candidate = null;//this one will store the ice candidates recieved in case the connection is not ready
//creating websocket connection
var candidate_added = false;
const chatsocket = (window.location.host =='127.0.0.1:8000')? 
                    new WebSocket('ws://'
                    +window.location.host
                    +'/ws/Mental_Block/mentor_group_page_chat/'
                    +chat_id
                    +'/'): new WebSocket('wss://'
                        +window.location.host
                        +'/ws/Mental_Block/mentor_group_page_chat/'
                        +chat_id
                        +'/');

//stun and turn config for peer connection
var configuration = {
    // add custom iceServers
    "iceServers": [
        {"urls": "stun:stun.1.google.com:19302"},
        {"urls": "stun:stun.2.google.com:19302"},
        {"urls": "stun:stun.3.google.com:19302"},
        {"urls": "stun:stun.4.google.com:19302"},
        {"urls": "stun:stun.jap.bloggernepal.com:5349"}
    ]  
    };
//creating local peer connection
//var localConnection = new webkitRTCPeerConnection(configuration);


class Connections extends webkitRTCPeerConnection {//creating a class that inherits from webkitRTCPeerConnection
    constructor (config,peer,streams){//peer is the username of the person with whom the connection will be done
        super(config);
        this.peer=peer;
        console.log("this is the peer ", peer);
        streams.getTracks().forEach(track => {this.addTrack(track,streams);});
        console.log("initialisation successful by ",user);
        //super(config)
        console.log("this is callera ", caller);
        console.log("this is usera ", user);
        
        if (user==caller){
            this.send_first_offer(peer);
        }

        // //overwriting this.ontrack
        // this.ontrack = function (e, types){//when the connection recieves tracks
        //     if (types=='video'){
        //         var remote_video = document.createElement('video');
        //         remote_video.srcObject=e.streams[0];
        //         remote_video.classList.add('remotevideo');
        //         var vidcontainer = document.getElementById('videocontainer');
        //         vidcontainer.style.display=`grid`;
        //         vidcontainer.appendChild(remote_video);
        //         console.log("collecting track from local connection by", user);
        //         if (all_peer_connections.length==2){//modifying grid style
        //             vidcontainer.style.gridTemplateColumns=`1fr 1fr`;
        //         }
        //         if (all_peer_connections.length==3){//modifying grid style
        //             vidcontainer.style.gridTemplateColumns=`1fr 1fr 1fr`;
        //         }
        //     }
        // }

        // //overwriting this.onicecandidae

        // this.onicecandidate = function (e){
            
        // }

    }

    async send_first_offer(peer) {
        var offering = await this.createOffer();
        console.log("my offering",offering);
        await this.setLocalDescription(offering);
        chatsocket.send(JSON.stringify({//sends the created offering to the chat room. And it will be stored in a variable for every user using the page
            "type":"offering",
            "sender":user,
            "offer":offering,
            "to":peer
                }
            )
        );
        console.log("offer succesfully sent by ", user);
    }

    // ontrack(e){//when the connection recieves tracks
    //     var remote_video = document.createElement('video');
    //     remote_video.srcObject=e.streams[0];
    //     remote_video.classList.add('remotevideo');
    //     var vidcontainer = document.getElementById('videocontainer');
    //     vidcontainer.style.display=`grid`;
    //     vidcontainer.appendChild(remote_video);
    //     console.log("collecting track from local connection by", user);
    //     if (all_peer_connections.length==2){//modifying grid style
    //         vidcontainer.style.gridTemplateColumns=`1fr 1fr`;
    //     }
    //     if (all_peer_connections.length==3){//modifying grid style
    //         vidcontainer.style.gridTemplateColumns=`1fr 1fr 1fr`;
    //     }
    // }

    async send_answer(offering){//recieves offering created from a different user and sends an answer
        
        console.log(offering);
        console.log("this is connection ",myconnection);
        await this.setRemoteDescription(offering);
        var answer = await myconnection.createAnswer();
        await myconnection.setLocalDescription(this.answer);
        chatsocket.send(JSON.stringify({
            "type":"answer",
            "sender":user,
            "answer":answer,
            "to":this.peer
                }
            )
        );
        console.log("answer sent by ",user);
    }

    // async onicecandidate(event){//when an ice candidate is generated it is sent through the web socket
    //     console.log("new ice candidate ", event.candidate);
    //     chatsocket.send(JSON.stringify({
    //         "type":"icecandidate",
    //         "sender":user,
    //         "icecandidate":event.candidate,
    //         "to":this.peer
    //             }
    //         )
    //     );
    //     console.log("event candidate sent by ",user);
    // }

    
}


function endcall(){
    clearInterval(interval);//stopping the time counting function
    var time_used = (call_time >=60)?`video call ${Math.round(call_time/60)} min`:`video call ${call_time} sec`//taking time in minutes or seconds
    chatsocket.send(JSON.stringify({
                "type":"end_call",
                "sender":user,
                "message":(some_one_joined)?time_used:"VIDEOCALL(noanswer)"
            }
        )
    );
    some_one_joined=false;
    call_time=0;
}


//rejecting call
function rejectcall(){
    document.getElementById('maincaller').remove();
}
                        

function dropdown(){// first drop down div
    try{//this function will act as a toggle. adds the dropdown menu if it is not there and removes it if it is already there
        const drop = document.getElementById("drop1");
        drop.remove();
    }

    catch{
        document.getElementById('info').innerHTML+=`
            <div class="dropdownmenu1" id="drop1">
                <div onclick="show('members')">MEMBERS</div>
                <hr>
                <div onclick="show('description')">DESCRIPTION</div>
                <hr>
                <div onclick="show('mentor')">MENTOR</div>
                <hr>
                <div onclick="show('announcements')">ANNOUNCEMENTS</div>
            </div>
        `;

    }
}                                                        


function show(item){//drop down div that shows diffferent items
    const drop = document.getElementById("drop1");
    drop.remove();
    document.getElementById('info').innerHTML+=`
            <div class="extension" id="extend">
                <button class="close" onclick="document.getElementById('extend').remove()">&times;</button>
                <br><br>
            </div>
        `;
    if (item == "members"){
        console.log(Members.length);
        
        for (let a=0; a<Members.length; a++ ){
            document.getElementById('extend').innerHTML+=`
                <div class="list">
                    <a href="/Mental_Block/my_profile/${JSON.parse(Members[a])['name']}"><img src="${JSON.parse(Members[a])['image']}" class="image2"></a>
                    <span class="name">${JSON.parse(Members[a])['name']}</span>
                </div>
                <hr>
            `;
        }
    }

    if(item == "description"){
        document.getElementById('extend').innerHTML+=`
        <div style="color:white;">
            Mentors Objective:<br> ${JSON.parse(document.getElementById('description').textContent)}
        </div>
        `;
    }
}


//getting local user media for video call
async function addlocalstream() {
    // Define media constraints: audio and video
    const constraints = { audio: true, video: true };
    
    try {
        // Request media stream from the user
        stream = await navigator.mediaDevices.getUserMedia(constraints);
        
        console.log(user);   
        console.log("tis is it , stream : ",stream); 
        // Assign the stream directly to the video element's srcObject
        // video.srcObject = stream;
        var vid=document.createElement('video');
        document.getElementById('videocontainer').appendChild(vid);
        vid.srcObject=stream;
        vid.autoplay=true;
        vid.muted=true;
        vid.classList.add('local');
        vid.play();
        setInterval(()=>{
            if (vid.paused){
                vid.play();
            }
        },500);
        //adding stream to localconnection
        //stream.getTracks().forEach(track => {localConnection.addTrack(track,stream);});

        // Play the video stream
        // video.play();
        
    } 
    catch (error) {
        console.error("Error accessing media devices:", error);
        alert("Error accessing media devices");
    }
}



function initiatecall(types){//function that starts setting up all necessities for the call the call
    //console.log('sending call');
    
    chatsocket.send(JSON.stringify({
        'type':types,
        'caller':user
    }));
}


function acceptcall(types){
    chatsocket.send(JSON.stringify({
        'type':types,
        'sender':user
    }));
}


async function sendmessage(types){
    const message = document.getElementById('area').value;
    const reader = new FileReader();
    
    function transfer(value=""){//this function will be used to transfer messages over chatsocket the "value" parameter corresponds to the base64 of image recieved
        if (message == "" && value == ""){//ensuring that the data to be sent over websocket contains either a text content or image content
            alert("Type in a message");
            return 0;
        }
        chatsocket.send(JSON.stringify({
            "text_content":message,
            "sender":user,
            "image":value,
            "type":types
        }));
        document.getElementById('sendarea').remove();
    }
    
    reader.onload = function (e){
        transfer(e.target.result);//sending blob equivalent of image as parameter
    }
    
    try {//checking if an image has been selected by user
        const imageinput = document.getElementById("imageinput");
        if (imageinput.files && imageinput.files[0]){
            const my_image = imageinput.files[0]; 
            if (my_image.size > 2*1024*1024){
                alert("image size must be less than 2 mb");
                return 0;
            }
            else{
                reader.readAsDataURL(my_image);//getting base64 equivalent of image
            }
        }
        else{
            console("not sent");
            transfer();//this will send only the text content over the websocket
        }
    }
    catch {
        transfer();
    }
    
}


function addmessagebox(){// this function add textarea to page for messages
    const log = document.getElementById('chat_log');

    //checking if textarea exist already inorder to avoid duplicate
    document.getElementById('area')? console.log("false alarm"): log.innerHTML+=`
                    <div id="sendarea" class="sendarea1">
                        <textarea id="area"></textarea>
                        <button class="send" onclick="sendmessage('chat_message')">Send</button>
                        <button class="send" style="right:40px;">&plus;Image</button>
                        <input type="file" accept="image/*" id="imageinput" class="imageinput1">
                        <button class="send2" onclick="document.getElementById('sendarea').remove()">&times;</button>
                    </div>
                                                                    `;
    document.getElementById('area').focus();
}


function startPeerConnection(types,joiner){
    if (types == 'video'){
        if (caller==user){//checking if it is the same user that initiated the call
            var newconnection = new Connections(configuration, joiner, stream);//initialising a new instance of the Connections class

            // var remote_video = document.createElement('video');
            remote_video.id = 'remote_video';
            var vidcontainer = document.getElementById('videocontainer');
            vidcontainer.style.display=`grid`;
            remote_video.controls=true;
            remote_video.muted=true;
            remote_video.autoplay = true;
            // vidcontainer.append(remote_video);
            remote_video.addEventListener("error", (e) => {
                console.error("Video error:", e);
            });
            remote_video.style.display=`block`;
            newconnection.ontrack = async function (e){//over writing ontrack method
                console.log("Track event triggered:", e.streams.length);

                // Ensure that the stream is ready
                if (e.streams.length > 0) {
                    const streamo = e.streams[0];
                    const videoTrack = streamo.getVideoTracks()[0];
                
                    if (videoTrack) {
                        // Listen for the track being fully active
                        videoTrack.onunmute = () => {
                          console.log("Video track is active, now assigning srcObject.");
                          remote_video.srcObject = e.streams[0];
                  
                          // Using a small delay to allow for metadata loading
                          setTimeout(() => {
                            if (remote_video.readyState >= 1) {
                              console.log("Video is ready, playing...");
                              remote_video.play().catch(err => {
                                console.error('Play failed:', err);
                              });
                            } else {
                              console.warn("Video not ready to play, readyState:", remote_video.readyState);
                            }
                          }, 1000); // Delay before trying to play
                        };
                      } else {
                        console.warn("No video track found in the stream.");
                      }
                    }
                
                // console.log("starting length ", e.streams.length);
                // setTimeout(()=>{
                //     remote_video.onloadedmetadata = () => {
                //         console.log("started=========5");
                //         remote_video.play().catch(err => {
                //         console.error('Play failed:', err);
                //         });
                //         // var ensure_video_play = setInterval(()=>{
                //         //     console.log("starting3", remote_video.srcObject);
                //         //     if (remote_video.paused){
                //         //         console.log("video was paused ",all_peer_connections.length);
                //         //         remote_video.play();
                //         //     }
                //         //     else{
                //         //         console.log("video is playing ",all_peer_connections.length);
                //         //     }
                //         //     
                //         //     },1000);
                //     };
                //     remote_video.srcObject=e.streams[0];
                //     //remote_video.classList.add('remotevideo');
                //     console.log("starting2", remote_video.srcObject);
                //     console.log('Video readyState:', remote_video.readyState);
                //     console.log('Tracks:', remote_video.srcObject.getTracks());
                    
                // },1000);
                // await remote_video.play().catch(error => {
                //     console.error("Error playing video:", error);
                //     console.log("Video error stack trace:",e.stack);
                //     console.trace();
                // });
                // if (playpromise!== undefined){
                //     playpromise.then(_ =>{
                //         console.log("it started now");
                //     })
                //     .catch(error =>{
                //         console.log("error", error);
                //     })
                // }
                //ensuring that the video is always playing
                

                console.log("collecting track from local connection by", user);
                if (all_peer_connections.length==2){//modifying grid style
                    vidcontainer.style.gridTemplateColumns=`1fr 1fr`;
                }
                if (all_peer_connections.length==3){//modifying grid style
                    vidcontainer.style.gridTemplateColumns=`1fr 1fr 1fr`;
                }
            }


            newconnection.onicecandidate = async function (event){//when an ice candidate is generated it is sent through the web socket
                console.log("new ice candidate ", event.candidate);
                chatsocket.send(JSON.stringify({
                    "type":"icecandidate",
                    "sender":user,
                    "icecandidate":event.candidate,
                    "to":this.peer
                        }
                    )
                );
                console.log("event candidate sent by ",user);
            }
            
            all_peer_connections.push(newconnection);
            // all_peer_connections.push(new Connections(configuration, joiner, stream));
            console.log("we have a list of ", all_peer_connections.length);
        }
    }
}


function quitcall(time){
    chatsocket.send(JSON.stringify({
        'type':"quit_call",
        'sender':user,
        'message':`Quit call at ${time}`
    }));
}


function hasRTCPeerConnection() {
    return !!window.RTCPeerConnection;
}


function setting_peerconnection(types,joiner){//joiner is the user name of the user that joined the chat
    //checking if browser supports webrtc
    console.log("checking if browser supports webrtc");
    if (hasRTCPeerConnection()) {
        console.log("about to start", joiner);
        startPeerConnection(types,joiner);
      }
    else{
        alert("Sorry, your browser does not support WebRTC.\n you can use edge, chrome or opera");
    }
}




//when message is recieved in chat room
chatsocket.onmessage = async function(e){
    const content = JSON.parse(e.data);

    //TYPE1
    if (content['type']=="chat_message"){//add recieved message to chat page directly

        var messagecontainer = document.createElement('div');
        if (content['sender']==user){
            messagecontainer.classList.add('cont1');
            if (content['text_content']){
                messagecontainer.innerHTML+=`<div class="message">${content['text_content']}</div>`;
            }
            if (content['image']){
                messagecontainer.innerHTML+=`<div><img src="${content['image']}" alt="not found" class="messageimage"></div>`;
            }
            messagecontainer.innerHTML+=`<span class="date">${content['date']}</span>`;
        }
        else{
            messagecontainer.classList.add('cont2');
            messagecontainer.innerHTML+=`<div><img src="${content['profile_pic']}" class="profileimage"></div>`;
            var subcontainer = document.createElement('div');
            subcontainer.innerHTML+=`<span class="username" onclick="window.location.href='/Mental_Block/my_profile/${content.sender}'">${content.sender}</span>`;
            if (content['text_content']){
                subcontainer.innerHTML+=`<div class="message">${content['text_content']}</div>`;
            }
            if (content['image']){
                subcontainer.innerHTML+=`<div><img src="${content['image']}" alt="not found" class="messageimage"></div>`;
            }
            subcontainer.innerHTML+=`<span class="date">${content['date']}</span>`;
            messagecontainer.append(subcontainer);
        }
        document.getElementById('chat_log').appendChild(messagecontainer);
        
        
    }


    //TYPE2
    if (content['type'] == 'initiate_call'){//create a sort of ringing animation
        caller = content.sender;
        console.log("this is the caller1 ", caller);
        console.log("this is the call sender ", content.sender);
        if (content.sender == user){
            
            document.getElementById('videocontainer').style.display = 'grid';
            addlocalstream();//start collecting localstream media
            document.body.innerHTML+=`
                <div class="maincaller" id="maincaller">
                    Calling <button onclick="endcall()" class="click">End call</button>
                </div>
            `;
            
           
        }
        else{
            document.body.innerHTML+=`
                <div class="maincaller" id="maincaller">
                    Video Call <button onclick="acceptcall('accept_call')" class="click">JOIN</button> <button onclick="rejectcall()" class="click">DECLINE</button>
                </div>
            `;
        }
        
    }

    //TYPE3
    if (content['type'] == "end_call"){//if message is for ending call
        document.getElementById('audiocontainer').style.display = 'none';
        document.getElementById('videocontainer').style.display = 'none';
        document.getElementById('maincaller').remove();
        console.log("removed");
        try{
            clearInterval(ensure_video_play);
        }
        catch{
            console.log("no interval to clear");
        }

        var container2 = document.createElement('div');
        container2.classList.add('special');
        if (content['sender']==user){
            stream.getTracks().forEach(track => track.stop());
            container2.classList.add('cont1');
            container2.innerHTML+=`<div class="message" style="color:red;";>${content['text_content']}</div>`;
            container2.innerHTML+=`<span class="date">${content['date']}</span>`;
        }
        else{
            try{
                stream.getTracks().forEach(track => track.stop());
            }
            catch{
                console.log("no stream to stop");
            }
            container2.classList.add('cont2');
            container2.innerHTML+=`<div><img src="${content['profile_pic']}" class="profileimage"></div>`;
            const subcontainer = document.createElement('div');
            subcontainer.innerHTML+=`<span class="username" onclick="window.location.href='/Mental_Block/my_profile/${content.sender}'">${content.sender}</span>`;
            subcontainer.innerHTML+=`<div class="message" style="color:red;">${content['text_content']}</div>`;
            subcontainer.innerHTML+=`<span class="date">${content['date']}</span>`;
            container2.append(subcontainer);
        }
        document.getElementById('chat_log').appendChild(container2);
        
    }


    //TYPE4
    if (content.type == "accept_call"){//
        some_one_joined=true;
        console.log("call accepted1");
        //setting start time for call
        interval=setInterval(function (){
            call_time+=1;
        },1000);
        call_start_time = content.date.split(" ")[1];

        console.log("call accepted2");
        if (content.sender == user){
            document.getElementById('videocontainer').style.display = 'grid';
            await addlocalstream();
            document.getElementById('maincaller').innerHTML=`<button class="click" onclick="quitcall('${call_start_time}')">Quit call</button>`;
            console.log("this is tream1 : ",stream);
            var wait_for_stream = setInterval(()=>{
                if (stream!=null){
                    myconnection = new Connections(configuration, caller, stream);
                    myconnection.onicecandidate = async function (event){//when an ice candidate is generated it is sent through the web socket
                        console.log("new ice candidate ", event.candidate);
                        console.log("for this peer ", this.peer);
                        chatsocket.send(JSON.stringify({
                            "type":"icecandidate",
                            "sender":user,
                            "icecandidate":event.candidate,
                            "to":this.peer
                                }
                            )
                        );
                        console.log("event candidate sent by ",user);
                    }
        
        
                    myconnection.ontrack = async function (e){//over writing ontrack method
                        console.log("starting");
                        // var remote_video = document.createElement('video');
                        remote_video.autoplay = true;
                        remote_video.srcObject=e.streams[0];
                        //remote_video.classList.add('remotevideo');
                        var vidcontainer = document.getElementById('videocontainer');
                        vidcontainer.style.display=`grid`;
                        vidcontainer.appendChild(remote_video);
                        console.log("starting2");
                        remote_video.onloadedmetadata = () => {
                            remote_video.play().catch(err => {
                              console.error('Play failed:', err);
                            });
                          };
                        console.log("collecting track from local connection by", user);
                        // ensuring that the video is always playing
                        ensure_video_play = setInterval(()=>{
                            if (remote_video.paused){
                                console.log("video was paused");
                                remote_video.play();
                            }
                            else{
                                console.log("video is playing");
                            }
                        },1000);
                        // if (all_peer_connections.length==1){//modifying grid style
                        //     vidcontainer.style.gridTemplateColumns=`1fr 1fr`;
                        // }
                        // if (all_peer_connections.length==2){//modifying grid style
                        //     vidcontainer.style.gridTemplateColumns=`1fr 1fr 1fr`;
                        // }
                    }
                    clearInterval(wait_for_stream);
                }
            },500);

            // while (stream==null){
                
            //     //stream = await navigator.mediaDevices.getUserMedia(constraints);
                
            //     console.log("this is stream in: ", stream);
            // }
            // //console.log("this is stream: ", stream);
            // myconnection = new Connections(configuration, content.sender, stream);//creating new instance of the Connections class. This happens only for users when they join the call
            // //setting_peerconnection('video',content.sender);
        }
        if (user == caller){
            //not necessary to call the addlocalstream function. it has already been called whe event type was "initiate_call"
            //alert(`${content.sender} has joined`);
            setting_peerconnection('video',content.sender);
            
        }
    }

    //TYPE 5
    if (content.type == "quit_call"){
        if (content.sender == user){
            document.getElementById('audiocontainer').style.display = 'none';
            document.getElementById('videocontainer').style.display = 'none';
            document.getElementById('maincaller').remove();
            console.log("removed");

            var container1 = document.createElement('div');
            stream.getTracks().forEach(track => track.stop());
            container1.classList.add('cont1');
            container1.classList.add('special');
            container1.innerHTML+=`<div class="message" style="color:red;";>${content['text_content']}</div>`;
            container1.innerHTML+=`<span class="date">${content['date']}</span>`;
        
            document.getElementById('chat_log').appendChild(container1);
        }
        else{
            alert(`${content.sender} has left the call`);
            //remove_remote_stream();// removes the video stream of the person that left the call . it removes it from the setup peer connection
        }
    }


    //TYPE6
    if (content.type == 'offering'){
        console.log("offer recived at chat socket");
        console.log("this is the user ", user);
        console.log("this is the to ", content.to);
        console.log("this is offer ",content.offer);
        if (content.to == user){
            
            if (myconnection==null){//if myconnection is not yet ready
                console.log(content.offer);
                store_offer=content.offer;//store the offer in stor_offer
                var offerinterval=setInterval(()=>{//create an interval that will check if myconnection is ready
                    console.log(1);
                    if (myconnection!=null){
                        myconnection.send_answer(store_offer);
                        clearInterval(offerinterval);
                    }
                    else{
                        console.log("myconnection not yet initialised");
                    }
                },1000);
            }
            else{//if myconnection is ready
                myconnection.send_answer(content.offer);//This happens only for users who joined the call
            }
        }
    }

    //TYPE7
    if (content.type == 'answer' && user==caller){
        console.log("answer recieved at chatsocket");
        for (let connection=0; connection<all_peer_connections.length; connection++){//moves through all the instances of Connection class stored in the list
                                                                                    //all+peer_connections inorder to select which one corresponds to the user that 
                                                                                    //sent answer
            //var theconnection = all_peer_connections[connection];
            if (all_peer_connections[connection].peer ==content.sender){
                await all_peer_connections[connection].setRemoteDescription(content.answer);
                console.log("local description set");
                break;
            }
        }
    }

    if (content.type=='icecandidate'){
        console.log("icecandidate recieved at chatsocket for ", content.to);
        if (content.to==user && !candidate_added  && content.icecandidate!=null){
            console.log("my call");
            try{
                myconnection.addIceCandidate(new RTCIceCandidate(content.icecandidate));
                candidate_added = true;
                console.log("candidate added ", content.icecandidate);
            }
            catch{
                for (let connection=0; connection<all_peer_connections.length; connection++){
                    //moves through all the instances of Connection class stored in the list
                    //all_peer_connections inorder to select which one corresponds to the user that sent the icecandidate
                    //var theconnection = all_peer_connections[connection];
                    console.log("checking");
                    if (all_peer_connections[connection].peer ==content.sender){
                        all_peer_connections[connection].addIceCandidate(new RTCIceCandidate(content.icecandidate));
                        console.log("candidate added ", content.icecandidate);
                        candidate_added = true;
                        break;
                    }
                }
            }
        }

        else{
            console.log("not my call");
        }
    }
    
}
