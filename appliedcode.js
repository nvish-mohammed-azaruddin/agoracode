
import AgoraRTC from "agora-rtc-sdk-ng";
const {RtcTokenBuilder, RtmTokenBuilder, RtcRole, RtmRole} = require('agora-access-token');
const appID = '810fece8c3b947c7b10e05f28ab73467';
const role = RtcRole.PUBLISHER;
let rtc = {
    localAudioTrack: null,
    localVideoTrack: null,
    client: null,
    joined: false,
    published: false,
    localStream: null,
    remoteStreams: [],
    params: {},
    video:false,
    screenTrack:null,
    screenClient: null,
};
let isSharingEnabled = false;
rtc.client = AgoraRTC.createClient({mode: "rtc", codec: "vp8"});
rtc.screenClient = AgoraRTC.createClient({mode: "rtc", codec: "vp8","screenshare":true}); 

let options = {
    appId: appID,
    channel: channelName,
    uid: uidt,
    userid:userid
};

async function joinChannel()
{

  startBasicCall();
  let user_id = user_name;
  let original_user_names = original_user_name;
  let token = RtcTokenBuilder.buildTokenWithAccount(appID, appCertificate, channelName, user_id.toString(), role, privilegeExpiredTs);
  
  await rtc.client.join(options.appId, options.channel, token || null, user_id || null);
  rtc.localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack();
  rtc.localVideoTrack = await AgoraRTC.createCameraVideoTrack();
  if (rtc.client.connectionState === 'CONNECTED') {
    await rtc.client.publish([rtc.localAudioTrack, rtc.localVideoTrack]);
  }  
  $("#join-form #join").attr('style','display: none'); 
  $("#join-form #leave").attr('style','display: block');
  rtc.localVideoTrack.play("local-player");    
  rtc.client.enableAudioVolumeIndicator();
}


async function startBasicCall() {
    let remoteUsers = {};
    $("#join-form #video-btn").prop("disabled", false);
    $("#join-form #mic-btn").prop("disabled", false);
    rtc.client.on("user-published", async (user, mediaType) => {
   
     
        let screenshareval=  $('#screenshareval').val();      
        const uid = user.uid;       
        await rtc.client.subscribe(user, mediaType);

        totalremoteUsers[uid]=uid;
        let remote_player_name=uid.split('_');
        let remote_player_fullname=remote_player_name[0]+' '+remote_player_name[1];

        if (mediaType === "video") {
         
          if ($(`#player-wrapper-${uid}`).length === 0) {
           const player = $(`
               
                    <div id="player-wrapper-${uid}" class="player_box screenshare"> 
                    <div class="onln_lst_wrap">
                  <aside class="onln_lst_box">
                  <figure class="onln_lst_fig">   
                  <div  class="players_main">    
                      <div id="player-${uid}" class="player"></div>
                      <div class="players_main_ct"><div class="players_remote_video"></div><div class="players_remote_audio"></div></div>
                      <p class="player-name">${remote_player_fullname}</p>
                  </div>
                    </figure>
                </aside>
              </div>   
                    </div>
    `);
    $("#remote-playerlist").append(player);
     }
            const remoteVideoTrack = user.videoTrack;
            const remotePlayerContainer = document.createElement("div");
           
            remoteVideoTrack.play(`player-${uid}`);
            
        }

        if (mediaType === "audio") {
            const remoteAudioTrack = user.audioTrack;
            remoteAudioTrack.play();
        }

    });

  rtc.client.on("user-joined",  async (user) => {
     const id = user.uid;
     remoteUsers[id] = user;   
     totalremoteUsers[id]=user.uid;  
     joinedlist();
  });
  rtc.client.on("peer-online",  async (user) => {
    const id = user.uid;
    totalremoteUsers[id]=user.uid; 
  });

   rtc.client.on("user-left",  async (user) => {
    const id = user.uid;
    delete remoteUsers[id];
    delete totalremoteUsers[id];    
    $(`#player-wrapper-${id}`).remove();
    joinedlist();

  });


}


//i have created html button for start screen share when user click on it then it will call handleScreenShareStart .
 async function handleScreenShareStart() {
   
    let user_id = user_name;
 if (rtc.client.connectionState === 'CONNECTED') {
      rtc.localVideoTrack.stop(); 
      rtc.client.unpublish(rtc.localVideoTrack);
  rtc.screenTrack = await AgoraRTC.createScreenVideoTrack({
        encoderConfig: '1080p_1',
        optimizationMode: 'detail',
    }, "auto");
  await rtc.client.publish(rtc.screenTrack);
  }

    rtc.video=true;
    screenShareActive=true;
    rtc.video=true;
    isSharingEnabled=true;
    $('#screenshareval').val(1);
     $("#join-form  #screenvalue_button").click();
    if(rtc.screenTrack)
    {
      if ($(".player_box").hasClass("screenshare")) {
      $(".player_box").addClass("screensharedone");
     }
    }
    
  const localplayer =document.getElementById('local-player'); 
  rtc.screenTrack.play(localplayer);
 
  $("#join-form #fileupload.screenstart").attr('style','display: none');
  $("#join-form #fileupload.screenend").attr('style','display: block');



rtc.screenTrack.on("track-ended", () => {
      rtc.screenTrack && rtc.screenTrack.close();
      rtc.screenClient.leave();
      rtc.client.unpublish(rtc.screenTrack);

      rtc.screenTrack.stop();
      screenShareActive=false; 
      rtc.client.publish(rtc.localVideoTrack);     
      rtc.localVideoTrack.play("local-player");
      $("#join-form #fileupload.screenstart").attr('style','display: block');
      $("#join-form #fileupload.screenend").attr('style','display: none');
  });
  return  rtc.screenTrack;
}
