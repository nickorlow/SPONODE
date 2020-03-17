# Spotify Queue Manager for iMessage

## Why?
Ever been on a road trip and want to let your friends add to the queue, but don't wanna pass your phone around?
Don't want to go through the complicated process of setting up a shared playlist?
Want to play music in a public venue easily?

This allows anyone to imessage you a link to a spotify song, and it will be automatically added to your queue!


## Why Only iMessage?
This node server is to be hosted on a mac, and the module i am using to read imessages doesn't play nice with sms. Might add support some day

## What about explicit songs?
SPONODE will let you set wether you want to allow explicit songs, and it can even be remotely toggeled with a password!

## How to Build
- Clone this repo.
- Open "app.js" and replace the global var rtoken with a Spotify Refresh token (guide here: https://developer.spotify.com/documentation/general/guides/authorization-guide/)

- Run "node app" in the folder where you cloned this

