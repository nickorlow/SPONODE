using System;
using System.IO;
using System.Net;
using System.Text;
using Newtonsoft.Json.Linq;

namespace SpotifyAPI
{
    public class Playlist
    {
        public string PlaylistID { get; protected set; }
        public string PlaylistURL
        {
            get
            {
                return "https://api.spotify.com/v1/playlists/" + PlaylistID;
            }
        }
        private string RefreshToken = "";

        public Playlist(string playlistLocator, string refreshToken)
        {
            RefreshToken = refreshToken;
            if (playlistLocator.Substring(0, 4) == "http")
                PlaylistID = playlistLocator.Substring(31, (playlistLocator.IndexOf('?') - 31));
            else
                PlaylistID = playlistLocator;

            SetInfo();
        }

        private void SetInfo()
        {
            //TODO: Get Stuff Here
        }


        public void AddSong(Song song)
        {
            string url = PlaylistURL + "/tracks?uris=spotify:track:" + song.SongID;

            var http = (HttpWebRequest)WebRequest.Create(new Uri(url));
            http.Method = "POST";
            http.ContentLength = 0;
            http.Headers.Add("Authorization", "Bearer " + new APIKey(RefreshToken).Key);

            try
            {
                http.GetResponse();
            }
            catch (WebException e)
            {
                throw e;
            }
        }

    }
}
