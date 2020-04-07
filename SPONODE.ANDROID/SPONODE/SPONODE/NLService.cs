using System;
using Android.App;
using Android.Content;
using Android.OS;
using Android.Preferences;
using Android.Service.Notification;
using Android.Util;
using SpotifyAPI;

namespace SPONODE
{
    [Service(Label = "Listen for Spotify URLs", Permission = "android.permission.BIND_NOTIFICATION_LISTENER_SERVICE")]
    [IntentFilter(new[] { "android.service.notification.NotificationListenerService" })]
    public class NLService : NotificationListenerService
    {
        public override void OnCreate()
        {
            base.OnCreate();
            Log.Info("start running", "Servico Criado");
            Console.WriteLine("Created Service");
        }
        public override void OnDestroy()
        {
            base.OnDestroy();
        }
        public override IBinder OnBind(Intent intent)
        {
            return base.OnBind(intent);
        }
        public override bool OnUnbind(Intent intent)
        {
            return base.OnUnbind(intent);
        }
        public override void OnNotificationPosted(StatusBarNotification sbn)
        {
            try
            {
                ISharedPreferences prefs = PreferenceManager.GetDefaultSharedPreferences(this);

                string apiKey = prefs.GetString("userToken", null);
                base.OnNotificationPosted(sbn);
                Console.WriteLine("Created Notif");
                string messageContents = sbn.Notification.Extras.GetCharSequence(Notification.ExtraText);
                Log.Info("SPONODE", sbn.PackageName + " - " + messageContents);
                Song s = new Song(messageContents, apiKey);

                Log.Info("SPONODE", "Adding " + s.SongName + "By: " + s.ArtistNames[0]);
                new Playlist(prefs.GetString("playlistID", "62GgGB7DJWUHyDc6G6ar5k"), apiKey).AddSong(s);
            }
            catch (Exception e)
            {
                Log.Error("SPONODE", e.Message);
            }
        }
        /*	var xhr = new XMLHttpRequest();
    xhr.open('POST', "https://api.spotify.com/v1/playlists/62GgGB7DJWUHyDc6G6ar5k/tracks?uris=spotify:track:"+url.substring(31, url.indexOf("?")), true);
	xhr.responseType = 'json';
	xhr.setRequestHeader("Authorization", "Bearer "+token);
    xhr.onload = function() {
      var status = xhr.status;
      if (status === 201) {
	   console.log("Song Added to Playlist");
	   console.log();
      } else {
		console.log("Error Adding Song to Playlist    Error Info:"+status+" <> " + xhr.response);
		console.log();
		sendiMessageNew("Error Adding Song :( Debuginf: "+status+" <> " + xhr.response, chatter);
      }
    };*/
        public override void OnNotificationRemoved(StatusBarNotification sbn)
        {
            base.OnNotificationRemoved(sbn);
        }
    }
}
