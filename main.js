let streamerList = 
[
    "xqc",
    "dantes",
    "payo",
    "loltyler1",
    "jokerdtv",
    "pokelawls",
    "knut",
    "jessecox",
    "asmongold",
    "akademiks",
    "codemiko",
    "athenelive",
    "watchmeforever",
    "atheneaiheroes",
    "vedal987"

]
let streamerData = [];
let gameList = 
[
    "World of Warcraft",
    "League of Legends",
    "Just Chatting"
]

// settings
let dateRange = 10; // how far back in days to get clips from
const domain = "localhost";

// mechanical
const twitchClientID = "mpu6gc2jcq0iibqrji7exdd69m64qo";
const twitchClientSecret = "acgc75li9422cw4dsssvsx8990ygjw";
let twitchAuthToken;
const currentDate = new Date();
let startDate = new Date(currentDate - (1000 * 60 * 60 * 24 * dateRange));
startDate = startDate.toISOString();
let clips = [];
clipTicker = 0;

const setTwitchAuthToken = async () =>
{
    try 
    {
        const response = await fetch
        (
            "https://id.twitch.tv/oauth2/token", 
            {
                method: "POST",
                body: new URLSearchParams
                ({
                    "client_id": twitchClientID,
                    "client_secret": twitchClientSecret,
                    "grant_type": "client_credentials"
                })
            }
        );
        const responseJSON = await response.json();
        twitchAuthToken = responseJSON.access_token;
    }
    catch (err) 
    {
        console.error(err);
    }

    validateTwitchAuthToken();

}

const validateTwitchAuthToken = async () =>
{
    if (twitchAuthToken.length < 1)
    {
        console.error("tried to validate but no twitch auth token exists!")
        return;
    }
    
    try
    {
            const response = await fetch
            (
                "https://id.twitch.tv/oauth2/validate",
                {
                    headers:
                    {
                        "Authorization": `Bearer ${twitchAuthToken}`
                    }
                }
            );
            const data = await response.json();
            console.log("successfully validated twitch auth token");
    }
    catch (err)
    {
        console.log("twitch auth token failed to validate");
        console.error(`twitch auth token failed to validate!\n ${err}`);
    }
}

const setStreamersInfo = async () =>
{
    try
    {
        let paramStr;
        for (let i=0; i < streamerList.length; i++)
        {
            if (i>0) paramStr += "&";
            paramStr += "login=" + streamerList[i];
        }
        const url = "https://api.twitch.tv/helix/users?" + new URLSearchParams(paramStr);
        const response = await fetch
        (
            url,
            {
                headers:
                {
                    "Authorization": `Bearer ${twitchAuthToken}`,
                    "Client-Id": twitchClientID
                }
            }
        );
        const responseJSON = await response.json();
        streamerData = responseJSON.data;
        console.log(streamerData);
    }
    catch (err)
    {
        console.log("failed getting streamers info");
        console.error(err);
    }

}

const getClipsStreamer = async (id) =>
{
    try
    {
        const url = "https://api.twitch.tv/helix/clips?"
            + new URLSearchParams
            (
                {
                    "broadcaster_id": id.toString(),
                    "started_at": startDate,
                    "first": "20" // amount of clips to get (max is 100)
                }
            )
        const response = await fetch
        (
            url,
            {
                headers:
                {
                    "Authorization": `Bearer ${twitchAuthToken}`,
                    "Client-Id": twitchClientID
                }
            }
        );
        const responseJSON = await response.json();
        return responseJSON.data;
    }
    catch (err)
    {
        console.log("failed to get clips");
        console.error(err);
    }
}

const getClipsStreamers = async () =>
{
    for (var i=0; i < streamerData.length; i++)
    {
        const streamerID = streamerData[i].id;
        const streamerClips = await getClipsStreamer(streamerID);
        console.log(streamerClips);
        clips.push(...streamerClips);
    }
}

const sortClipsViewCount = (clips) => 
{
    clips.sort( function(a,b){ return b.view_count - a.view_count; } );
}

async function getClips()
{
    await setTwitchAuthToken();
    await setStreamersInfo();
    await getClipsStreamers();
    sortClipsViewCount(clips);
    console.log(clips);
}

function getClipSource(clipID)
{
    prefix = "https://clips.twitch.tv/embed?"
    id = "clip=" + clipID;
    parent = "&parent=" + domain;
    autoplay = "&autoplay=true";
    muted = "&muted=false";
    return prefix + id + parent + autoplay + muted;
}

function setClipSource()
{
    document.getElementById('clip-player').src = getClipSource(clips[clipTicker].id)
}

async function initializeClips()
{
    await getClips();
    setClipSource();
}

function nextClip()
{
    clipTicker += 1;
    if (clipTicker > clips.length-1) clipTicker = 0;
    setClipSource();
}
function prevClip()
{
    clipTicker -= 1;
    if (clipTicker < 0) clipTicker = clips.length-1;
    setClipSource();
}


initializeClips();
document.addEventListener
(
    "keydown",
    (event) =>
        {
            const keyName = event.key;
            if (keyName === "ArrowDown") nextClip();
            else if (keyName === "ArrowUp") prevClip();
        }
)

