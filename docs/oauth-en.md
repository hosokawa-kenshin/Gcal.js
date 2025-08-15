## Google Calendar API Credentials Setup Guide
1. Access [Google Cloud Console](https://console.cloud.google.com/) and create a new project.
1. From the menu in the upper left, select "APIs & Services" -> "Library" and enable the Google Calendar API.
1. Select "APIs & Services" -> "Credentials".
1. Select "Create Credentials" -> "OAuth client ID".
   - You may need to configure the consent screen at this point. If so, enter the information according to the input fields.
2. Select "Desktop application" as the application type, enter any name, and create it.
3. Select "Download JSON" to download the credentials.
4. Rename the downloaded JSON file to `credentials.json`.
