# Spotify Party Display

\* Will redo the README at some point \*

An ambient display screen for spotify, with the ability to also non destructively add songs to the communal queue.

![Screenshot](./screenshot.png?raw=true 'Screenshot of the player')

## Like a Spotify Jam?

Yeah pretty much, in fact much worse. But in _some_ ways better. Gives a more 'there is a Spotify instance running by the host, but if you wanna chuck a couple tunes in, go for it' vibe, rather than full control.

It also protects against the DREADED playlist switch.

## Installing and running

So far, you have to just pull the entire project, run `yarn build` and then you can run the project from `node server` which runs the server and the built sveltekit project

## Reasoning

Spotify's API is excellent, but without being approved for the expanded API grant, its limited to really only hobbyist stuff. This means that you can register your own app, and run this locally and have a customised Spotify Jam scenario, because its running through your credentials. Locally served
