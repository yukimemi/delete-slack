const SLACK_ACCESS_TOKEN: string = PropertiesService.getScriptProperties().getProperty(
  "SLACK_ACCESS_TOKEN"
);
const DAYS: number = Number(
  PropertiesService.getScriptProperties().getProperty("DAYS")
);
const TARGET_CHANNELS: string[] = PropertiesService.getScriptProperties()
  .getProperty("CHANNELS")
  .split(",");

const channelNameToId = (name: string): string => {
  const channelsList = doApi("get", "channels.list");
  console.log(channelsList);
  let foundChannelsId = "";
  const isFound = channelsList.channels.some(channels => {
    if (channels.name.match(name)) {
      foundChannelsId = channels.id;
      console.log(`Found ${channels.name} (${foundChannelsId})`);
      return true;
    }
  });
  return foundChannelsId;
};

const elapsedDaysToUnixTime = (days: number): string => {
  const date = new Date();
  const now = Math.floor(date.getTime() / 1000);
  return `${now - 8.64e4 * days}`; // 8.64e4[sec] = 1[day]
};

const doApi = (
  method: "get" | "delete" | "patch" | "post" | "put",
  resource: string,
  payload: object = { token: SLACK_ACCESS_TOKEN }
) => {
  console.log({ payload });
  const options: GoogleAppsScript.URL_Fetch.URLFetchRequestOptions = {
    method,
    payload
  };
  const res = UrlFetchApp.fetch(`https://slack.com/api/${resource}`, options);
  return JSON.parse(res.getContentText());
};

const filesList = (payload: object) => {
  return doApi("get", "files.list", payload);
};
const filesDelete = (payload: object) => {
  return doApi("post", "files.delete", payload);
};

const oldFileExecutioner = () => {
  TARGET_CHANNELS.forEach(deleteOldFile);
};

const deleteOldFile = (channelName: string): number => {
  const channelId = channelNameToId(channelName);
  if (!channelId) {
    console.log(`Not found ${channelName}. Skipping.`);
    return 1;
  }
  console.log(`Found ${channelName} (${channelId})`);
  const payload = {
    channel: channelId,
    count: 1000,
    token: SLACK_ACCESS_TOKEN,
    ts_to: elapsedDaysToUnixTime(DAYS)
  };
  filesList(payload).files.forEach(file => {
    const data = filesDelete({ token: SLACK_ACCESS_TOKEN, file: file.id });
    if (data.error) {
      console.log(`Failed to delete file ${file.name} Error: ${data.error}`);
    } else {
      console.log(`Deleted file ${file.name} (${file.id})`);
    }
  });
  return 0;
};

function main() {
  oldFileExecutioner();
}
