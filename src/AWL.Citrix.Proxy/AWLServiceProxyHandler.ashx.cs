using System;
using System.IO;
using System.Net;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text.RegularExpressions;
using System.Web;

namespace AWL.Citrix.Reciever.Proxy
{
    public class AWLServiceProxyHandler : IHttpHandler
    {
        public const string EndpointUrl = "https://SERVERNAME/citrix"; //SET YOUR SERVER HERE WHERE SERVICES ARE RUNNING

        public bool IsReusable
        {
            get { return false; }
        }

        public void ProcessRequest(HttpContext context)
        {
            string requestUrl = context.Request.Url.AbsoluteUri;
            string remoteUrl  = Regex.Replace(requestUrl, ".*AWLServiceProxyHandler.ashx", EndpointUrl);

            HttpWebRequest request = (HttpWebRequest)WebRequest.Create(remoteUrl);
            request.AllowAutoRedirect = false;
            request.Method = context.Request.HttpMethod;
            request.Credentials = CredentialCache.DefaultCredentials;
            request.ContentType = context.Request.ContentType;
            request.UserAgent = context.Request.UserAgent;
            request.PreAuthenticate = true;
            foreach (String each in context.Request.Headers)
            {
                if (!WebHeaderCollection.IsRestricted(each) && each != "Remote-User")
                {
                    request.Headers.Add(each, context.Request.Headers.Get(each));
                }
            }
            if (context.Request.HttpMethod == "POST")
            {
                Stream outputStream = request.GetRequestStream();
                CopyStream(context.Request.InputStream, outputStream);
                outputStream.Close();
            }
            HttpWebResponse response;
            try
            {
                response = (HttpWebResponse)request.GetResponse();
            }
            catch (WebException we)
            {
                response = (HttpWebResponse)we.Response;
                if (response == null)
                {
                    context.Response.StatusCode = 13;
                    context.Response.Write("Could not contact back-end site");
                    context.Response.End();
                    return;
                }
            }
            // Copy response from server back to client
            context.Response.StatusCode = (int)response.StatusCode;
            context.Response.StatusDescription = response.StatusDescription;
            context.Response.ContentType = response.ContentType;
            if (response.Headers.Get("Location") != null)
            {
                string urlSuffix = response.Headers.Get("Location");
                if (urlSuffix.ToLower().StartsWith(remoteUrl.ToLower()))
                    urlSuffix = urlSuffix.Substring(remoteUrl.Length);
                context.Response.AddHeader("Location", context.Request.Url.GetLeftPart(UriPartial.Authority) + urlSuffix);
            }
            foreach (String each in response.Headers)
                if (each != "Location" && !WebHeaderCollection.IsRestricted(each))
                    context.Response.AddHeader(each, response.Headers.Get(each));
            CopyStream(response.GetResponseStream(), context.Response.OutputStream);
            response.Close();
            context.Response.End();

            return;
        }

        private void CopyStream(Stream input, Stream output)
        {
            Byte[] buffer = new byte[1024];
            int bytes = 0;
            while ((bytes = input.Read(buffer, 0, 1024)) > 0)
                output.Write(buffer, 0, bytes);
        }

        private string DebugRequest(HttpRequest request)
        {
            string headers = string.Empty;
            foreach (var key in request.Headers.AllKeys)
            {
                headers += key + "=" + request.Headers[key] + Environment.NewLine;
            }
            return headers;
        }
    }
}