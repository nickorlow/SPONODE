using System;
using Android.App;
using Android.Content;
using Android.OS;
using Android.Preferences;
using Android.Service.Notification;
using Android.Support.V4.App;
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
            ISharedPreferences prefs = PreferenceManager.GetDefaultSharedPreferences(this);

            string messageContents = sbn.Notification.Extras.GetCharSequence(Notification.ExtraText);


            if (messageContents == null || messageContents.Length < 31 || messageContents.Substring(0, 31) != "https://open.spotify.com/track/")
                return;

            if (prefs.GetString("playlistID", null) == null)
            {
                SendNotif("Error Occoured Adding Song. Add a Playlist in SPONODE Settings", true);
                return;
            }

            try
            {
                string apiKey = prefs.GetString("userToken", null);

                Console.WriteLine("Created Notif");
                Log.Info("SPONODE", " - " + messageContents);
                Song s = new Song(messageContents, apiKey);
                CancelNotification(sbn.Key);
                if (prefs.GetBoolean("allowExplicit", true) || !s.IsExplicit)
                {
                    SendNotif("Added Song " + s.SongName + " by: " + s.ArtistNames[0]);
                    Log.Info("SPONODE", "Adding " + s.SongName + " By: " + s.ArtistNames[0]);
                    new Playlist(prefs.GetString("playlistID", null), apiKey).AddSong(s);
                }
                else
                {
                    SendNotif("Didn't Add Explicit Song " + s.SongName + " by: " + s.ArtistNames[0]);
                    Log.Info("SPONODE", "Didnt Add Explicit Song", true);
                }
            }
            catch (Exception e)
            {
                SendNotif("Error Occoured Adding Song", true);
                Log.Error("SPONODE", e.Message);
            }
        }

        public void SendNotif(string notif, bool bad = false)
        {
            CreateNotificationChannel();
            // Instantiate the builder and set notification elements:
            NotificationCompat.Builder builder = new NotificationCompat.Builder(this, "SPONODESONGADD")
                .SetContentTitle("SPONODE Song Added")
                .SetContentText(notif)
                .SetSmallIcon(bad ? Resource.Drawable.ic_mtrl_chip_close_circle : Resource.Drawable.ic_mtrl_chip_checked_circle)
                .SetPriority(NotificationCompat.PriorityMax);

            // Build the notification:
            Notification notification = builder.Build();

            // Get the notification manager:
            NotificationManager notificationManager =
                GetSystemService(Context.NotificationService) as NotificationManager;

            // Publish the notification:
            const int notificationId = 0;
            notificationManager.Notify(notificationId, notification);
        }

        void CreateNotificationChannel()
        {
            if (Build.VERSION.SdkInt < BuildVersionCodes.O)
            {
                // Notification channels are new in API 26 (and not a part of the
                // support library). There is no need to create a notification
                // channel on older versions of Android.
                return;
            }

            var channel = new NotificationChannel("SPONODESONGADD", "Song Added", NotificationImportance.Default)
            {
                Description = "Notify you when someone adds a song via SPONODE"
            };

            var notificationManager = (NotificationManager)GetSystemService(NotificationService);
            notificationManager.CreateNotificationChannel(channel);
        }

        public override void OnNotificationRemoved(StatusBarNotification sbn)
        {
            base.OnNotificationRemoved(sbn);
        }
    }
}
