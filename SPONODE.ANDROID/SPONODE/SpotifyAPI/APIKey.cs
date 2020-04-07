using System;
using System.IO;
using System.Net;
using System.Text;
using Newtonsoft.Json.Linq;

namespace SpotifyAPI
{
    public class APIKey
    {
        private string RefreshToken = "";
        public string ClientKey
        {
            get
            {
                return "Zjg1ZTg1YjYyNzc0NDE5ZGI4YmIyMmMwYTJjYTU5Yzk6N2EwZTQ1NzQxYmViNGUzMmI3ZDE1ZTViNGUzMjNlNTY=";
            }
        }

        public string Key { get; protected set; }

        public APIKey()
        {
            GetKey();
        }


        public APIKey(string refreshToken)
        {
            RefreshToken = refreshToken;
            GetKey();
        }

        private void GetKey()
        {
            string url = "https://accounts.spotify.com/api/token";

            var http = (HttpWebRequest)WebRequest.Create(new Uri(url));
            http.Method = "POST";
            http.Headers.Add("Authorization", "Basic " + ClientKey);
            http.ContentType = "application/x-www-form-urlencoded";

            string load = "grant_type=refresh_token&refresh_token=" + Uri.EscapeDataString(RefreshToken);

            ASCIIEncoding encoding = new ASCIIEncoding();
            Byte[] bytes = encoding.GetBytes(load);

            Stream newStream = http.GetRequestStream();
            newStream.Write(bytes, 0, bytes.Length);
            newStream.Close();


            try
            {
                string response = new StreamReader(http.GetResponse().GetResponseStream()).ReadToEnd();
                Key = JObject.Parse(response)["access_token"].ToString();
            }
            catch (WebException e)
            {
                throw e;
            }
        }
    }
}
