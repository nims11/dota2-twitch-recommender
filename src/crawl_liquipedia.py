#!/usr/bin/python
import sys
import requests
from lxml import html as xpathDoc
from tqdm import tqdm

def get_players_from_html(doc):
    return [player_hyperlink for player_hyperlink in doc.xpath('//div[@id="mw-pages"]/div[@class="mw-content-ltr"]//a')]

def get_next_page(doc):
    try:
        link = doc.xpath('//a[text()="next page"]/@href')[0]
        if '#' in link:
            link = link[:link.find('#')]
        return 'http://wiki.teamliquid.net' + link
    except:
        return None

def get_twitch_dotabuff_url(url):
    html = requests.get(url).text
    doc = xpathDoc.fromstring(html)
    twitch_xpath = doc.xpath('//div[contains(@class, "infobox-center")]//a[contains(@href, "twitch.tv")]/@href')
    dotabuff_xpath = doc.xpath('//div[contains(@class, "infobox-center")]//a[contains(@href, "dotabuff.com")]/@href')
    try:
        twitch_url = str(twitch_xpath[0])
    except:
        twitch_url = '-'
    try:
        dotabuff_url = str(dotabuff_xpath[0])
    except:
        dotabuff_url = '-'
    return (twitch_url, dotabuff_url)

def get_players():
    player_docs = []
    start_url = 'http://wiki.teamliquid.net/dota2/Category:Players'
    while True:
        html = requests.get(start_url).text
        doc = xpathDoc.fromstring(html)
        player_docs += get_players_from_html(doc)
        next_page = get_next_page(doc)
        if next_page is None:
            break
        start_url = next_page

    players = []
    for doc in tqdm(player_docs):
        nick, url = str(doc.xpath('.//text()')[0]), 'http://wiki.teamliquid.net' + str(doc.xpath('./@href')[0])
        twitch_url, dotabuff_url  = get_twitch_dotabuff_url(url)
        players.append((nick, url, twitch_url, dotabuff_url))
    return players

if __name__ == '__main__':
    players = get_players()
