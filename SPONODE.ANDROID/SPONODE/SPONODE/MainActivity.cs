using System;
using System.Collections.Specialized;
using System.IO;
using System.Net;
using System.Text;
using Android.App;
using Android.Content;
using Android.OS;
using Android.Preferences;
using Android.Runtime;
using Android.Support.Design.Widget;
using Android.Support.V7.App;
using Android.Views;
using Android.Widget;
using Newtonsoft.Json.Linq;
using SpotifyAPI;

namespace SPONODE
{
    [Activity(Label = "@string/app_name", Theme = "@style/AppTheme.NoActionBar", MainLauncher = true)]
    [IntentFilter(
    new[] { Intent.ActionView },
    Categories = new[] { Intent.CategoryDefault,
    Intent.CategoryBrowsable },
    DataScheme = "sponode",
    DataHost = "getapikey")]
    public class MainActivity : AppCompatActivity
    {

        protected override void OnCreate(Bundle savedInstanceState)
        {
            ISharedPreferences prefs = PreferenceManager.GetDefaultSharedPreferences(this);

            try
            {


                NameValueCollection qscoll = ParseQuery(Intent.Data.EncodedQuery);


                string url = "https://accounts.spotify.com/api/token";

                var http = (HttpWebRequest)WebRequest.Create(new Uri(url));
                http.Method = "POST";
                http.Headers.Add("Authorization", "Basic Zjg1ZTg1YjYyNzc0NDE5ZGI4YmIyMmMwYTJjYTU5Yzk6N2EwZTQ1NzQxYmViNGUzMmI3ZDE1ZTViNGUzMjNlNTY=");
                http.ContentType = "application/x-www-form-urlencoded";

                string load = "grant_type=authorization_code&redirect_uri=sponode://getapikey&code=" + Uri.EscapeDataString(qscoll["code"]);

                ASCIIEncoding encoding = new ASCIIEncoding();
                Byte[] bytes = encoding.GetBytes(load);

                using (Stream newStream = http.GetRequestStream())
                {
                    newStream.Write(bytes, 0, bytes.Length);
                    newStream.Close();
                }


                try
                {
                    string response = new StreamReader(http.GetResponse().GetResponseStream()).ReadToEnd();

                    ISharedPreferencesEditor editor = prefs.Edit();
                    editor.PutString("userToken", JObject.Parse(response)["refresh_token"].ToString());
                    editor.Apply();
                }
                catch (WebException e)
                {
                    throw e;
                }


            }
            catch (Exception e)
            {
                string s = "";/*App wasn't opened from spotify*/
            }

            if (prefs.GetBoolean("firstLaunch", true))
            {
                ISharedPreferencesEditor editor = prefs.Edit();
                editor.PutBoolean("firstLaunch", false);
                editor.Apply();

                //Show notif settings screen on app's first launch
                Intent intent = new Intent("android.settings.ACTION_NOTIFICATION_LISTENER_SETTINGS");
                StartActivity(intent);
            }

            if (prefs.GetString("userToken", null) == null)
            {
                var uri = Android.Net.Uri.Parse("https://accounts.spotify.com/authorize?client_id=f85e85b62774419db8bb22c0a2ca59c9&response_type=code&redirect_uri=sponode://getapikey&scope=playlist-read-collaborative playlist-modify-public playlist-read-private playlist-modify-private");
                var intent = new Intent(Intent.ActionView, uri);
                StartActivity(intent);
            }

            base.OnCreate(savedInstanceState);
            Xamarin.Essentials.Platform.Init(this, savedInstanceState);
            SetContentView(Resource.Layout.activity_main);
            SetUI();
        }

        public void SetUI()
        {
            ISharedPreferences prefs = PreferenceManager.GetDefaultSharedPreferences(this);

            if (prefs.GetString("playlistID", null) != null && prefs.GetString("userToken", null) != null)
            {
                TextView playlistName = FindViewById<TextView>(Resource.Id.currentPlaylistText);
                playlistName.Text = "Current Playlist: " + new Playlist(prefs.GetString("playlistID", null), prefs.GetString("userToken", null)).PlaylistName;
            }

            Switch explicitSwitch = FindViewById<Switch>(Resource.Id.explicitSwitch);
            explicitSwitch.Checked = prefs.GetBoolean("allowExplicit", true);
            explicitSwitch.CheckedChange += delegate (object sender, CompoundButton.CheckedChangeEventArgs e)
            {
                ISharedPreferences prefs = PreferenceManager.GetDefaultSharedPreferences(this);
                ISharedPreferencesEditor editor = prefs.Edit();
                editor.PutBoolean("allowExplicit", explicitSwitch.Checked);
                editor.Apply();
                var toast = Toast.MakeText(this, "Changed Explicit Preferences", ToastLength.Short);
                toast.Show();

            };
        }

        [Java.Interop.Export("OpenSettings")]
        public void OpenSettings(View v)
        {
            //Show notif settings screen on app's first launch
            Intent intent = new Intent("android.settings.ACTION_NOTIFICATION_LISTENER_SETTINGS");
            StartActivity(intent);
        }

        [Java.Interop.Export("ChangePlaylist")]
        public void ChangePlaylist(View v)
        {
            EditText urlInput = FindViewById<EditText>(Resource.Id.playlistURL);
            ISharedPreferences prefs = PreferenceManager.GetDefaultSharedPreferences(this);
            ISharedPreferencesEditor editor = prefs.Edit();
            editor.PutString("playlistID", urlInput.Text);
            editor.Apply();
            var toast = Toast.MakeText(this, "Playlist Set!", ToastLength.Short);
            toast.Show();

            urlInput.Text = "";
        }

        public NameValueCollection ParseQuery(string queryString)
        {
            NameValueCollection final = new NameValueCollection();

            String[] vars = queryString.Split('&');

            foreach (string s in vars)
                final[s.Split('=')[0]] = s.Split('=')[1];

            return final;
        }

        public override bool OnCreateOptionsMenu(IMenu menu)
        {
            MenuInflater.Inflate(Resource.Menu.menu_main, menu);
            return true;
        }

        public override bool OnOptionsItemSelected(IMenuItem item)
        {
            int id = item.ItemId;
            if (id == Resource.Id.action_settings)
            {
                return true;
            }

            return base.OnOptionsItemSelected(item);
        }

        private void FabOnClick(object sender, EventArgs eventArgs)
        {
            View view = (View)sender;
            Snackbar.Make(view, "Replace with your own action", Snackbar.LengthLong)
                .SetAction("Action", (Android.Views.View.IOnClickListener)null).Show();
        }
        public override void OnRequestPermissionsResult(int requestCode, string[] permissions, [GeneratedEnum] Android.Content.PM.Permission[] grantResults)
        {
            Xamarin.Essentials.Platform.OnRequestPermissionsResult(requestCode, permissions, grantResults);

            base.OnRequestPermissionsResult(requestCode, permissions, grantResults);
        }
    }
}

