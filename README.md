Finds pro players (with twitch channels) with similar hero pool as yours.

## System Overview
- This is a backend less system (coz am kewl). The `data.json` contains everything important and I will hopefully update it every week.
- The master branch consist of python api (not used) and the code for generating `data.json`. `gh-pages` contains essentially the rest of the system.
- Player list was populated through liquidpedia. Opendota api is used for gathering player related data.
- Players are mapped to points in n-dimensional (n=number of heroes) space based on the number of times they have played each hero in the past 500 games. The recommendation algorithm just computes k nearest neighbors (k=15) using cosine similarity as the distance metric.
- Common heroes in the recommendation results are ordered by the geometric mean between the number of times the hero has been played by the user and the respective player.

## Acknowledgement
- [The amazing Opendota API](https://www.opendota.com/)
- [Handling 404 for single page apps in github pages](https://github.com/rafrex/spa-github-pages)
- [simple sidebar bootstrap theme](https://github.com/blackrockdigital/startbootstrap-simple-sidebar)
- [reference for kewlrouter.js](http://krasimirtsonev.com/blog/article/a-modern-javascript-router-in-100-lines-history-api-pushstate-hash-url)
