using System;
using System.Collections.Generic;
using System.IO;
using System.Net;
using System.Text;
using Newtonsoft.Json.Linq;

namespace SpotifyAPI
{
    public class Song
    {
        public string SongID { get; protected set; }
        public string SongName { get; protected set; }
        public bool IsExplicit { get; protected set; }
        public List<string> ArtistNames { get; set; }
        private string RefreshToken = "";
        public string SongURL
        {
            get
            {
                return "https://api.spotify.com/v1/tracks/" + SongID;
            }
        }

        public Song(string songLocator, string refreshToken)
        {
            ArtistNames = new List<string>();
            RefreshToken = refreshToken;
            if (songLocator.Substring(0, 4) == "http")
                SongID = songLocator.Substring(31, (songLocator.IndexOf('?') - 31));
            else
                SongID = songLocator;

            SetInfo();
        }


        private void SetInfo()
        {
            var http = (HttpWebRequest)WebRequest.Create(new Uri(SongURL));
            http.Method = "GET";
            http.Headers.Add("Authorization", "Bearer " + new APIKey(RefreshToken).Key);

            try
            {
                string response = new StreamReader(http.GetResponse().GetResponseStream()).ReadToEnd();
                JObject songInf = JObject.Parse(response);
                JArray artists = (JArray)songInf["artists"];

                SongName = (string)songInf["name"];
                IsExplicit = (bool)songInf["explicit"];

                for (int i = 0; i < artists.Count; i++)
                    ArtistNames.Add(artists[i]["name"].ToString());
            }
            catch (WebException e)
            {
                throw e;
            }
        }


    }
}
